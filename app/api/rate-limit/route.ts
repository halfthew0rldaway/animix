import { getRateLimitSnapshot } from "../../libs/api";

export const runtime = "nodejs";

export async function GET() {
  const snapshot = getRateLimitSnapshot();
  return Response.json(snapshot);
}
