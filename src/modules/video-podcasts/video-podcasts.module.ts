import { Module } from '@nestjs/common';
import { VideoPodcastService } from './video-podcasts.service';
import { VideoPodcastController } from './video-podcasts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UuidHelper } from 'src/common/helpers/uuid.helper';

import { SlugHelper } from 'src/common/helpers/generate-unique-slug';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [VideoPodcastController],
  providers: [VideoPodcastService, UuidHelper, SlugHelper, FileUploadService],
  imports: [PrismaModule],
})
export class VideoPodcastModule {}
