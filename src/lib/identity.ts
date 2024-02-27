import type { Env } from "./env";

// ref: https://github.com/cloudflare/pages-plugins/blob/main/packages/cloudflare-access/index.d.ts
interface CfIdentity {
  id: string;
  name: string;
  email: string;
  groups: string[];
  amr: string[];
  idp: { id: string; type: string };
  geo: { country: string };
  user_uuid: string;
  account_id: string;
  ip: string;
  auth_status: string;
  common_name: string;
  service_token_id: string;
  service_token_status: boolean;
  is_warp: boolean;
  is_gateway: boolean;
  version: number;
  device_sessions: Record<string, { last_authenticated: number }>;
  iat: number;
}

export const getIdentity = async (
  token: string,
  env: Env,
): Promise<undefined | CfIdentity> => {
  const url = `https://${env.ACCESS_TEAM_SLUG}.cloudflareaccess.com/cdn-cgi/access/get-identity`;
  const response = await fetch(url, {
    headers: { Cookie: `CF_Authorization=${token}` },
  });

  if (response.ok) {
    return await response.json();
  }

  return;
};
