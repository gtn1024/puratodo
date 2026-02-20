import { corsPreflightResponse } from "@/lib/api/response";

/**
 * Handle CORS preflight requests for /api/v1/auth
 */
export async function OPTIONS() {
  return corsPreflightResponse();
}
