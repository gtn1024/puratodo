import { successResponse, errorResponse, corsPreflightResponse } from "@/lib/api/response";
import { verifyToken } from "@/lib/api/auth";

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User info
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const user = await verifyToken(authHeader);

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  return successResponse({
    id: user.id,
    email: user.email,
  });
}

export async function OPTIONS() {
  return corsPreflightResponse();
}
