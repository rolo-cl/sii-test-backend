import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthStatus } from '../dto/health-status.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Verifica que el servicio está vivo (lo usa el healthcheck de Docker)
   */
  @Get()
  check(): HealthStatus {
    return { status: 'ok' };
  }
}
