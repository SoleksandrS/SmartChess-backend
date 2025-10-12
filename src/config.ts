export const constants = {
  cors: {
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  },
};

export const envs = {
  port: parseInt(process.env.PORT, 10) || 3000,
};
