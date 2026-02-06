export const constants = {
  cors: {
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  },
  hashSalt: 88,
  chess: {
    initFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  },
};

export const envs = {
  port: parseInt(process.env.PORT, 10) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key',
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
  stockfish: {
    url: process.env.STOCKFISH_URL || 'http://localhost',
  },
  genai: {
    apiKey: process.env.GOOGLE_GENAI_API_KEY || 'api-key',
  },
};
