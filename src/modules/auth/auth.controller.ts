import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('sign-up')
  signUp(@Body() body: SignUpDto) {
    return this.service.signUp(body);
  }

  @Post('sign-in')
  signIn(@Body() body: SignInDto) {
    return this.service.signIn(body);
  }
}
