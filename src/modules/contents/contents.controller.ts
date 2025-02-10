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
import { Roles } from '../roles/roles.decorator';

import { ContentStatus } from '@prisma/client';

@ApiTags('Contents')
@ApiBasicAuth('JWT-auth')

@Controller({ path: 'contents', version: '1' })
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Patch(':contentUuid/approve')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  async approveContent(@Param('contentUuid') contentUuid: string) {
    return this.contentService.updateContentStatus(
      contentUuid,
      ContentStatus.approved,
    );
  }

  @Patch(':contentUuid/reject')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  async rejectContent(@Param('contentUuid') contentUuid: string) {
    return this.contentService.updateContentStatus(
      contentUuid,
      ContentStatus.rejected,
    );
  }

  @Get('search')
  async searchContents(@Query('query') query: string) {
    return this.contentService.searchContents(query);
  }
}

