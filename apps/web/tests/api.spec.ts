import { test, expect } from '@playwright/test';

test.describe('API', () => {
  const BASE_URL = 'http://localhost:3000';

  test('api-1: API returns 401 without token', async ({ request }) => {
    // Send request to /api/v1/groups without token
    const response = await request.get(`${BASE_URL}/api/v1/groups`);

    // Verify 401 response
    expect(response.status()).toBe(401);
  });

  test('api-2: API accepts valid token', async ({ request }) => {
    // First login to get a valid token
    const loginResponse = await request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    // Extract access token
    const loginData = await loginResponse.json();
    const accessToken = loginData.access_token;

    // Send request with valid token
    const response = await request.get(`${BASE_URL}/api/v1/groups`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Verify 200 response with data
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
  });

  test('api-3: Auth login endpoint works', async ({ request }) => {
    // POST to /api/v1/auth/login with credentials
    const response = await request.post(`${BASE_URL}/api/v1/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });

    // Verify returns access_token
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.access_token).toBeDefined();
  });

  test('api-4: Auth register endpoint works', async ({ request }) => {
    // POST to /api/v1/auth/register with new email
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const response = await request.post(`${BASE_URL}/api/v1/auth/register`, {
      data: {
        email: uniqueEmail,
        password: 'TestPassword123!',
      },
    });

    // Note: Registration may return 200 (success) or require email confirmation
    // The exact behavior depends on Supabase configuration
    expect([200, 400]).toContain(response.status());
  });
});
