import { Elysia } from "elysia";
import type { Env } from "./lib/env";
import { webRoute } from "./routes/web";
import { restApiRoute } from "./routes/rest-api";

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
  .use(restApiRoute);

export default {
  fetch: (request: Request, env: Env) => {
    return app.state("env", env).fetch(request);
  },
};
