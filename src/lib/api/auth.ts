import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client for API routes (without cookies)
 */
export function createApiClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Verify a JWT token from the Authorization header
 * Returns the user object if valid, null otherwise
 */
export async function verifyToken(
  authHeader: string | null
): Promise<{ id: string; email: string } | null> {
  if (!authHeader) {
    return null;
  }

  // Extract Bearer token
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  const token = parts[1];
  if (!token) {
    return null;
  }

  try {
    const supabase = createApiClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
    };
  } catch {
    return null;
  }
}

/**
 * Extract user ID from a verified token
 * Convenience function for API routes
 */
export async function getUserIdFromToken(
  authHeader: string | null
): Promise<string | null> {
  const user = await verifyToken(authHeader);
  return user?.id || null;
}
