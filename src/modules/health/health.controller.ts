import { Controller, Get } from '@nestjs/common';
import { ApiBasicAuth } from '@nestjs/swagger';

@Controller('healthz')
@ApiBasicAuth('JWT-auth')
export class HealthController {
  @Get()
  checkHealth() {
    return { status: 'success' };
  }
}
