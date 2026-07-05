import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { Mock } from "vitest";

// The real DynamoDBDocumentClient#send is a large overloaded union across every possible
// Command type, which makes `vi.mocked(ddb.send)` infer an unusable type for mock setup/assertions
// in tests. Route handler tests cast `ddb.send` to this simpler shape instead.
export type DdbSendMock = Mock<(command: { input: Record<string, any> }) => Promise<Record<string, any>>>;

export function makeEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: "2.0",
    routeKey: "GET /health",
    rawPath: "/health",
    rawQueryString: "",
    headers: {},
    requestContext: {} as APIGatewayProxyEventV2["requestContext"],
    isBase64Encoded: false,
    ...overrides,
  };
}
