import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthStatus } from '../dto/health-status.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Liveness check used by the Docker healthcheck
   */
  @Get()
  check(): HealthStatus {
    return { status: 'ok' };
  }
}
