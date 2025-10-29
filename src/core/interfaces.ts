import { ERoles } from './enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: ERoles;
}

export interface IRequest {
  user: JwtPayload;
  body: any;
}
