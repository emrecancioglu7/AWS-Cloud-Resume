import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(client);

// Sabit (env var değil): bu hesaptaki varsayılan Lambda KMS anahtarı ortam değişkenlerini
// decrypt ederken execution role'e rağmen erişim reddediyor, ücretli bir customer-managed
// key kurmak yerine fonksiyonu hiç ortam değişkeni kullanmayacak şekilde tasarladık
// (bkz. infra/lambda_api.tf). Tablo adı infra/variables.tf'teki project_name'den türüyor.
export const TABLE_NAME = "emrecancioglu-personal-site-portfolio";
