import type { S3Handler } from "aws-lambda";
import { processStatement } from "./processor";

export const handler: S3Handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    await processStatement(bucket, key);
  }
};
