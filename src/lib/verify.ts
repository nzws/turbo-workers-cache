import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Env } from "./env";

// https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/application-token/#payload
export interface TokenPayload {
  aud: string[];
  email: string | undefined;
  exp: number;
  iat: number;
  nbf: number;
  iss: string;
  type: string;
  identity_nonce: string;
  sub: string; // User ID (service token does not have)
  country: string;
}

let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | undefined;

export const verifyToken = async (token: string, env: Env) => {
  try {
    const AUDIENCE = env.ACCESS_POLICY_AUD;
    const ISSUER = `https://${env.ACCESS_TEAM_SLUG}.cloudflareaccess.com`;

    if (!cachedJWKS) {
      const CERTS_URL = `${ISSUER}/cdn-cgi/access/certs`;

      cachedJWKS = createRemoteJWKSet(new URL(CERTS_URL));
    }

    const { payload } = await jwtVerify<TokenPayload>(token, cachedJWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    return payload;
  } catch {
    return;
  }
};
