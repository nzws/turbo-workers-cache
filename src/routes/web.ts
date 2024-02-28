import { Elysia, t } from "elysia";
import type { Env } from "../lib/env";
import { verifyToken } from "../lib/verify";
import { getIdentity } from "../lib/identity";

export const webRoute = new Elysia({ aot: false }).guard(
  {
    async beforeHandle({ store, set, cookie: { CF_Authorization } }) {
      const env = (store as Record<string, unknown>)["env"] as Env;
      if (env.DISABLE_AUTHENTICATION) {
        return;
      }

      const token = CF_Authorization.value;
      if (token) {
        const [user, identity] = await Promise.all([
          await verifyToken(token, env),
          await getIdentity(token, env),
        ]);
        if (user && user.email && identity) {
          // personal account
          return;
        }
        if (user && !user.email) {
          // service token: do not access to identity api (??)
          return;
        }
      }

      return (set.status = "Unauthorized");
    },
    cookie: t.Object({
      CF_Authorization: t.Optional(t.String()),
    }),
  },
  (app) =>
    app.get("/login", ({ cookie: { CF_Authorization }, request, headers }) => {
      const url = new URL(request.url);
      const links = {
        logout: `${url.origin}/cdn-cgi/access/logout`,
        revoke: "https://one.dash.cloudflare.com/?to=/:account/team/users",
      };

      if (!CF_Authorization.value) {
        return JSON.stringify(
          {
            TURBO_TOKEN: "DISABLE_AUTHENTICATION",
            TURBO_API: url.origin,
            links,
          },
          null,
          2,
        );
      }

      if (headers["content-type"] === "text/plain") {
        return CF_Authorization.value;
      }

      return JSON.stringify(
        {
          TURBO_TOKEN: CF_Authorization.value,
          TURBO_API: url.origin,
          links,
        },
        null,
        2,
      );
    }),
);
