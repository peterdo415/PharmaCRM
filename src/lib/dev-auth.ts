// Development authentication helper
// This file provides test authentication data for development purposes

export const DEV_TEST_USER = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated'
};

export const DEV_TEST_PROFILE = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  first_name: '太郎',
  last_name: 'テスト',
  email: 'test@example.com',
  phone_number: '090-1234-5678',
  pharmacy_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  role: 'pharmacist',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  pharmacist: {
    id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    pharmacy_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    first_name: '太郎',
    last_name: 'テスト',
    license_number: 'TEST-12345',
    hired_date: '2024-01-01',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }
};

export const DEV_TEST_SESSION = {
  access_token: 'fake-access-token',
  refresh_token: 'fake-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: DEV_TEST_USER
};

// Function to inject test authentication data (development only)
export function injectDevAuth() {
  if (import.meta.env.DEV) {
    console.log('🔧 Development mode: Injecting test authentication data');
    
    // You can use this to set test data in your auth store
    return {
      user: DEV_TEST_USER,
      session: DEV_TEST_SESSION,
      profile: DEV_TEST_PROFILE
    };
  }
  
  return null;
}