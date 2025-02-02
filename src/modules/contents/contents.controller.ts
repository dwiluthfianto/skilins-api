import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { ContentService } from './contents.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { ContentStatus } from '@prisma/client';

@ApiTags('Contents')
@ApiBasicAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('staff')
@Controller({ path: 'contents', version: '1' })
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Patch(':contentUuid/approve')
  @HttpCode(HttpStatus.OK)
  async approveContent(@Param('contentUuid') contentUuid: string) {
    return this.contentService.updateContentStatus(
      contentUuid,
      ContentStatus.approved,
    );
  }

  @Patch(':contentUuid/reject')
  @HttpCode(HttpStatus.OK)
  async rejectContent(@Param('contentUuid') contentUuid: string) {
    return this.contentService.updateContentStatus(
      contentUuid,
      ContentStatus.rejected,
    );
  }
}
