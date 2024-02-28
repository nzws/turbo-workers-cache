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
    3. Set `<custom domain>/login` as the application domain. *Do not forget to specify the path (`login`).*
    4. Fill in the other items.
    5. In the policy setting, you should set the session duration as `1 month`.
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

1. Login to the custom cache server via the browser: `https://<custom domain>/login`
2. Once logged in, copy the displayed `TURBO_TOKEN` and `TURBO_API`.
3. Set the copied values as environment variables when using Turbo cli.
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

> Please remember to create different policies and set the `session duration` to a relatively short period of about 30 minutes when allow service tokens on the application. This is because JWT created by service tokens cannot be manually revoked. It's safer and more useful to generate JWT from the client id/secret of service tokens on CI/CD every time, as you can set a relatively long period (more than 1 year) for the `Service Token Duration` and can delete it at any time.

For example, for GitHub Actions, you can add this step to generate a JWT.

```yaml
      - name: Create Turbo token
        run: |
          export TURBO_TOKEN=$(curl -H 'CF-Access-Client-Id: ${{ secrets.TURBO_CACHE_CLIENT_ID }}' \
            -H 'CF-Access-Client-Secret: ${{ secrets.TURBO_CACHE_CLIENT_SECRET }}' \
            -H 'Content-Type: text/plain' \
            https://<custom domain>/login) && \
          echo "TURBO_TOKEN=$TURBO_TOKEN" >> $GITHUB_ENV
```

<!--
### There is a cache file, but cache hit rate is low

This is a guess from the behavior because there is no mention of this, but it seems that Turbo CLI queues cache downloads and skips them when the response from the API is slow.
It is thought that if you perform a dry-run once, the queuing will be done first and the chance of a cache hit will increase.
Run command like `yarn turbo lint --dry && yarn turbo lint` may cause dry-run overhead, but there is a possibility that the cache can be hit more appropriately.
-->

## Related cool projects

- https://github.com/AdiRishi/turborepo-remote-cache-cloudflare
- https://github.com/ducktors/turborepo-remote-cache

## License

MIT
