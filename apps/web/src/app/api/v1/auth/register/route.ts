import { createClient } from "@supabase/supabase-js";
import { successResponse, errorResponse, corsPreflightResponse } from "@/lib/api/response";

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Registration successful
 *       400:
 *         description: Invalid request
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters", 400);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return errorResponse(error.message, 400);
    }

    // Check if email confirmation is required
    if (!data.session) {
      return successResponse({
        message: "Registration successful. Please check your email to confirm your account.",
        user: {
          id: data.user!.id,
          email: data.user!.email,
          created_at: data.user!.created_at,
        },
      });
    }

    return successResponse({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: {
        id: data.user!.id,
        email: data.user!.email,
        created_at: data.user!.created_at,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return errorResponse("An unexpected error occurred", 500);
  }
}

export async function OPTIONS() {
  return corsPreflightResponse();
}
