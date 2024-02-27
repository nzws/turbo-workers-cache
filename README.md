# turbo-workers-cache

[Turborepo](https://turbo.build/repo) custom cache server using Cloudflare [Workers](https://developers.cloudflare.com/workers/)/[R2](https://developers.cloudflare.com/r2/)/[Access (Zero Trust)](https://developers.cloudflare.com/cloudflare-one/), built with [ElysiaJS](https://elysiajs.com/).

## Implement status

ref: https://turbo.build/repo/docs/core-concepts/remote-caching#remote-caching-api

- ✅ `POST /v8/artifacts/events` - do nothing
- ✅ `GET /v8/artifacts/status` - always return `enabled` *(If there are billing problems, Workers is probably not working 🤷)*
- ✅ `PUT /v8/artifacts/:hash`
- ✅ `GET /v8/artifacts/:hash`
- ✅ `HEAD /v8/artifacts/:hash`
- ✅ `POST /v8/artifacts`

## Usage

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/nzws/turbo-workers-cache)

## Recipes

### Restrict who can access the cache server

You can flexibly restrict access by setting [Access policies](https://developers.cloudflare.com/cloudflare-one/policies/access/).

### Authenticate within the system such as CI/CD

You can use a [service token](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/) that is independent of the personal account.

## Related cool projects

- https://github.com/AdiRishi/turborepo-remote-cache-cloudflare
- https://github.com/ducktors/turborepo-remote-cache

## License

MIT
