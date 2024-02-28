import { Elysia } from "elysia";
import type { Env } from "./lib/env";
import { webRoute } from "./routes/web";
import { turboRoute } from "./routes/turbo";

const app = new Elysia({ aot: false })
  /*
  .onError(({ code, error }) => {
    console.error(code, error);
    return new Response(error.toString());
  })
  */
  .get("/", ({ set }) => {
    set.redirect = "/login";
  })
  .use(webRoute)
  .use(turboRoute);

export default {
  fetch: (request: Request, env: Env) => {
    return app.state("env", env).fetch(request);
  },
};
