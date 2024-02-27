import { Elysia, t } from "elysia";
import type { Env } from "../lib/env";
import { verifyToken } from "../lib/verify";
import { getIdentity } from "../lib/identity";

export const restApiRoute = new Elysia({ aot: false }).guard(
  {
    async beforeHandle({ store, set, headers: { authorization } }) {
      const env = (store as Record<string, unknown>)["env"] as Env;
      if (env.DISABLE_AUTHENTICATION) {
        return;
      }

      const [type, token] = (authorization ?? "").split(" ");
      if (token && type === "Bearer") {
        const [user, identity] = await Promise.all([
          await verifyToken(token, env),
          await getIdentity(token, env),
        ]);
        if (user && identity) {
          return;
        }
      }

      return (set.status = "Unauthorized");
    },
    headers: t.Object({
      authorization: t.Optional(t.String()),
    }),
    query: t.Object({
      teamId: t.Optional(t.RegExp(/^[\w-]{1,32}$/)),
      slug: t.Optional(t.RegExp(/^[\w-]{1,32}$/)),
    }),
  },
  (app) =>
    app
      .derive(
        async ({
          store,
          headers: { authorization },
          query: { teamId, slug },
        }) => {
          const env = (store as Record<string, unknown>)["env"] as Env;

          async function getUserId() {
            if (env.DISABLE_AUTHENTICATION) {
              return "DISABLE_AUTHENTICATION-test";
            }

            const [, token] = (authorization ?? "").split(" ");
            const user = token ? await verifyToken(token, env) : undefined;
            return user?.sub;
          }
          const userId = await getUserId();

          function getSlug() {
            return teamId
              ? `team-${teamId}`
              : slug
                ? `team-${slug}`
                : `user-${userId}`;
          }

          return { userId, slug: getSlug() };
        },
      )
      .post("/v8/artifacts/events", ({ body }) => {
        console.log("/v8/artifacts/events", body);

        return {
          success: true,
        };
      })
      .get("/v8/artifacts/status", () => ({
        status: "enabled",
      }))
      .put(
        "/v8/artifacts/:hash",
        async ({ store, params, body, slug, headers, request }) => {
          const env = (store as Record<string, unknown>)["env"] as Env;
          const key = `${slug}/${params.hash}`;

          await env.BUCKET.put(key, body as ArrayBuffer, {
            customMetadata: {
              "x-artifact-tag": headers["x-artifact-tag"] ?? "",
              "x-artifact-duration": headers["x-artifact-duration"] ?? "",
              "x-artifact-client-ci": headers["x-artifact-client-ci"] ?? "",
              "x-artifact-client-interactive":
                headers["x-artifact-client-interactive"] ?? "",
            },
          });

          const url = new URL(request.url);
          const artifactUrl = `${url.origin}/v8/artifacts/${params.hash}`;

          return {
            urls: [artifactUrl],
          };
        },
        {
          headers: t.Object({
            "x-artifact-tag": t.Optional(t.String()),
            "x-artifact-duration": t.Optional(t.String()),
            "x-artifact-client-ci": t.Optional(t.String()),
            "x-artifact-client-interactive": t.Optional(t.String()),
          }),
          body: t.Unknown(),
          response: {
            202: t.Object({
              urls: t.Array(t.String()),
            }),
          },
        },
      )
      .get(
        "/v8/artifacts/:hash",
        async ({ params, slug, store, set }) => {
          const env = (store as Record<string, unknown>)["env"] as Env;
          const key = `${slug}/${params.hash}`;

          const object = await env.BUCKET.get(key);
          if (!object) {
            set.status = 404;
            return {
              error: "Not found",
            };
          }

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set("etag", object.httpEtag);
          set.headers["etag"] = object.httpEtag;

          return new Response(object.body, {
            headers,
          });
        },
        {
          headers: t.Object({
            "x-artifact-client-ci": t.Optional(t.String()),
            "x-artifact-client-interactive": t.Optional(t.String()),
          }),
        },
      )
      .head(
        "/v8/artifacts/:hash",
        async ({ params, slug, store, set }) => {
          const env = (store as Record<string, unknown>)["env"] as Env;
          const key = `${slug}/${params.hash}`;

          const object = await env.BUCKET.head(key);
          if (!object) {
            set.status = 404;
            return {
              error: "Not found",
            };
          }

          return {
            success: true,
          };
        },
        {},
      )
      .post(
        "/v8/artifacts",
        async ({ slug, store, body }) => {
          const env = (store as Record<string, unknown>)["env"] as Env;

          console.log(await env.BUCKET.list());

          const options: R2ListOptions = {
            limit: 1000,
            prefix: `${slug}/`,
            // @ts-expect-error: ??
            include: ["customMetadata"] as const,
          };

          const listed = await env.BUCKET.list(options);
          let truncated = listed.truncated;
          let cursor = listed.truncated ? listed.cursor : undefined;

          while (truncated && cursor) {
            const next = await env.BUCKET.list({ ...options, cursor });
            truncated = next.truncated;
            cursor = next.truncated ? next.cursor : undefined;
            listed.objects.push(...next.objects);
          }

          const results: Record<
            string,
            { size: number; taskDurationMs: number; tag: string | null }
          > = {};

          for (const hash of body.hashes) {
            const object = listed.objects.find(
              (object) => object.key === `${slug}/${hash}`,
            );
            if (!object) {
              continue;
            }

            results[hash] = {
              size: object.size,
              taskDurationMs: object.customMetadata
                ? Number(object.customMetadata["x-artifact-duration"]) || 0
                : 0,
              tag: object.customMetadata?.["x-artifact-tag"] ?? null,
            };
          }

          return results;
        },
        {
          body: t.Object({
            hashes: t.Array(t.String()),
          }),
          response: {
            200: t.Record(
              t.String(),
              t.Object({
                size: t.Number(),
                taskDurationMs: t.Number(),
                tag: t.Nullable(t.String()),
              }),
            ),
          },
        },
      ),
);
