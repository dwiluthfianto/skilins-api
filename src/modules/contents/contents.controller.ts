import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
  Get,
  Query,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { ContentService } from './contents.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

import { ContentStatus } from '@prisma/client';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';

@ApiTags('Contents')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'contents', version: '1' })
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Patch(':contentUuid/approve')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async approveContent(@Param('contentUuid') contentUuid: string) {
    try {
      return SuccessResponse.create(
        await this.contentService.updateContentStatus(
          contentUuid,
          ContentStatus.approved,
        ),
        'Content approved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Patch(':contentUuid/reject')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async rejectContent(@Param('contentUuid') contentUuid: string) {
    try {
      return SuccessResponse.create(
        await this.contentService.updateContentStatus(
          contentUuid,
          ContentStatus.rejected,
        ),
        'Content rejected successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get('search')
  async searchContents(@Query('query') query: string) {
    return this.contentService.searchContents(query);
  }
}
