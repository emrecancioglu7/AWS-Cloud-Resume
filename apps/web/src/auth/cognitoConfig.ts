import { CognitoUserPool } from "amazon-cognito-identity-js";

// Public client identifiers (not secrets — meant to be embedded in frontend code, same as any
// SPA OAuth client id). Provisioned by infra/cognito.tf; see infra/README.md for how to (re)apply.
export const COGNITO_REGION = "eu-north-1";
export const COGNITO_USER_POOL_ID = "eu-north-1_qrXfekijM";
export const COGNITO_CLIENT_ID = "okq6503gdfmqqcgv2fgcbdhi9";
export const API_BASE_URL = "https://f9mxya0f8i.execute-api.eu-north-1.amazonaws.com";

export const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID,
});
