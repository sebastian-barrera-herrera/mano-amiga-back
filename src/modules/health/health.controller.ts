import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DatabaseService } from '../../common/database/database.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  /** Usado por Render para el health check y para despertar el servicio gratuito. */
  @Get()
  async check(): Promise<{ status: string; database: string; uptime: number }> {
    const healthy = await this.db.isHealthy();
    return {
      status: healthy ? 'ok' : 'degraded',
      database: healthy ? 'up' : 'down',
      uptime: Math.round(process.uptime()),
    };
  }
}
