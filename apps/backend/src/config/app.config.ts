import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.BACKEND_PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  riotApiKey: process.env.RIOT_API_KEY || '',
  riotApiBaseUrl:
    process.env.RIOT_API_BASE_URL || 'https://europe.api.riotgames.com',
}));
