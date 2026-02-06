import axios from 'axios';
import * as crypto from 'crypto';
import { envs } from 'src/config';

export const apiStockfish = axios.create({
  baseURL: envs.stockfish.url,
  responseType: 'json',
  headers: {
    origin: 'x-requested-with',
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  },
});

apiStockfish.interceptors.request.use(
  (req) => {
    const payload = `${req.method}:${req.url}:${JSON.stringify(req.data ?? {})}`;

    const signature = crypto
      .createHmac('sha256', envs.stockfish.hmacSecret)
      .update(payload)
      .digest('hex');
    req.headers['x-hub-signature'] = signature;

    return req;
  },
  (error) => Promise.reject(error),
);
