import axios from 'axios';
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
