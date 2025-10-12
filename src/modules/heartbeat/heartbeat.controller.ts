import { Controller, Get } from '@nestjs/common';

@Controller('heartbeat')
export class HeartbeatController {
  constructor() {}

  @Get()
  async check1() {
    return 'App is working';
  }
}
