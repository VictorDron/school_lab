const defaults: Record<string, string> = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/risys_test',
  REDIS_URL: 'redis://localhost:6379',
  OPENAI_API_KEY: 'test-openai-key',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_KEY: 'test-supabase-key',
  SUPABASE_SERVICE_KEY: 'test-supabase-service-key',
  SUPABASE_BUCKET: 'risys-test',
  RESEND_API_KEY: 'test-resend-key',
  JWT_SECRET: 'test-jwt-secret',
  JWT_EXPIRES_IN: '7d',
  FRONTEND_URL: 'http://localhost:5173',
  SOCKET_CORS_ORIGIN: 'http://localhost:5173',
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] ??= value;
}
