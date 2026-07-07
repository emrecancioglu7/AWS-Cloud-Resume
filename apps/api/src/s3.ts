import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({});

// Not a secret — same convention as TABLE_NAME in dynamo.ts (hardcoded constant, no Lambda
// environment variables; see infra/lambda_api.tf's KMS note). Bucket name includes the account
// id for S3's global-uniqueness requirement.
export const STATEMENTS_BUCKET = "emrecancioglu-personal-site-statements-761018862186";
