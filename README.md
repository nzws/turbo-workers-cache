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

### Setup workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/nzws/turbo-workers-cache)

1. Click the "Deploy with Workers" button above. This will create a `turbo-workers-cache` R2 bucket and deploy Workers initially.
2. Set a custom domain to the worker.
    1. Open [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages).
    2. Click the worker name.
    3. Open the `Triggers` tab.
    4. Set a custom domain in `Custom Domains` field.
3. Create the Access policy - you have to setup Zero Trust in advance.
    1. Open [Add an application](https://one.dash.cloudflare.com/?to=/:account/access/apps/add) in ZT dashboard.
    2. Click `Self-hosted`.
    3. Set the session duration to a maximum of `1 month`.
    4. Set `<custom domain>/login` as the application domain. *Do not forget to specify the path (`login`).*
    5. Fill in the other items.
    6. Once the policy is created, copy the `Application Audience (AUD) Tag` in the Overview tab.
4. Set environment variables.
    1. Once again, open [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages).
    2. Click the worker name.
    3. Go to Settings > Variables page.
    4. Click `Edit variables` in Environment Variables field.
    5. Add the following environment variables. *Both should be marked as encrypt.*
        1. `ACCESS_POLICY_AUD`: Application Audience (AUD) Tag
        2. `ACCESS_TEAM_SLUG`: The slug of team domain of zero trust (ex: `example.cloudflareaccess.com` -> `example`)

### Setup turborepo client

1. Login to the custom cache server: `https://<custom domain>/login`
2. Once logged in, copy the displayed `TURBO_TOKEN` and `TURBO_API`.
3. When using Turborepo, the copied values are set as environment variables.
4. Also, if you are sharing the cache with other users, set the team ID in the `TURBO_TEAM` environment variable. The team ID can be freely chosen, but it must start with `team_`.

## Tips

### Automatically deleting the caches

By setting an [object lifecycle policy](https://developers.cloudflare.com/r2/buckets/object-lifecycles/) in the R2 bucket, you can configure it to be automatically deleted after a specified number of days.

### Revoke token immediately

Revoking a user's session from the [ZT Dashboard](https://one.dash.cloudflare.com/?to=/:account/team/users) will make it unavailable within minutes.

### Restrict who can access the cache server

You can flexibly restrict access by setting [Access policies](https://developers.cloudflare.com/cloudflare-one/policies/access/).

### Authenticate within the system such as CI/CD

You can use a [service token](https://developers.cloudflare.com/cloudflare-one/identity/service-tokens/) that is independent of the personal account.

## Related cool projects

- https://github.com/AdiRishi/turborepo-remote-cache-cloudflare
- https://github.com/ducktors/turborepo-remote-cache

## License

MIT
