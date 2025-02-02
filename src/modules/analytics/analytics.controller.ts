import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';

@ApiTags('Analytics')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'analytics', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('staff')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('user-stats')
  async getUserStats() {
    return this.analyticsService.getUserStats();
  }

  @Get('content-stats')
  async getContentStats() {
    return this.analyticsService.getContentStats();
  }

  @Get('content-type-stats')
  async getVisitStats() {
    return this.analyticsService.getContentTypeStats();
  }

  @Get('/pkl-reports')
  async getPklReportsStats() {
    return this.analyticsService.getPrakerinStats();
  }

  @Get('/feedback-stats')
  async getFeedbackStats() {
    return this.analyticsService.getFeedbackStats();
  }
}
