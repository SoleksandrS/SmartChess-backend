import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ERoles } from 'src/core/enums';
import { constants } from 'src/config';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService)
    private jwtService: JwtService,
    @Inject(UsersService)
    private usersService: UsersService,
  ) {}

  async validateUser({ email, password }: SignInDto) {
    const user = await this.usersService.findWithWhere({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async signUp(body: SignUpDto) {
    const password = await bcrypt.hash(body.password, constants.hashSalt);
    await this.usersService.create({ ...body, password });
    return { status: 'success' };
  }

  async signIn(body: SignInDto) {
    const user = await this.validateUser(body);
    const payload = { sub: user.id, email: user.email, role: ERoles.USER };
    return { access_token: this.jwtService.sign(payload) };
  }
}
