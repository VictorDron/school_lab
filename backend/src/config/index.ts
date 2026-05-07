import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Redis
  redisUrl: process.env.REDIS_URL!,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET ?? (() => { throw new Error('JWT_SECRET environment variable is required'); })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
    bucket: process.env.SUPABASE_BUCKET || 'school-lab',
  },

  // Resend
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
  },

  // Socket.io
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
};
