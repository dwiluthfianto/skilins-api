import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuccessResponse } from '@utils/api-response.util';

@ApiTags('Analytics')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'analytics', version: '1' })
@UseGuards(RolesGuard)
@Roles('staff')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('user-stats')
  async getUserStats() {
    return SuccessResponse.create(
      await this.analyticsService.getUserStats(),
      'User stats fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('content-stats')
  async getContentStats() {
    return SuccessResponse.create(
      await this.analyticsService.getContentStats(),
      'Content stats fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('content-type-stats')
  async getVisitStats() {
    return SuccessResponse.create(
      await this.analyticsService.getContentTypeStats(),
      'Content type stats fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('/pkl-reports')
  async getPklReportsStats() {
    return SuccessResponse.create(
      await this.analyticsService.getPrakerinStats(),
      'Pkl reports stats fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('/feedback-stats')
  async getFeedbackStats() {
    return SuccessResponse.create(
      await this.analyticsService.getFeedbackStats(),
      'Feedback stats fetched successfully',
      HttpStatus.OK,
    );
  }
}
