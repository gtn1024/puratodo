import { NextResponse } from "next/server";

/**
 * Standard API response format
 */
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  error: string;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a success JSON response
 */
export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Create an error JSON response
 */
export function errorResponse(error: string, status = 400): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * Create an unauthorized response (401)
 */
export function unauthorizedResponse(
  message = "Unauthorized"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401);
}

/**
 * Create a not found response (404)
 */
export function notFoundResponse(
  message = "Not found"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 404);
}

/**
 * Create a server error response (500)
 */
export function serverErrorResponse(
  message = "Internal server error"
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 500);
}

/**
 * CORS headers for API responses
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Add CORS headers to a response
 */
export function withCors<T>(response: NextResponse<T>): NextResponse<T> {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a CORS preflight response
 */
export function corsPreflightResponse(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
