import { Module } from '@nestjs/common';
import { AudioPodcastService } from './audio-podcasts.service';
import { AudioPodcastController } from './audio-podcasts.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { SlugHelper } from 'src/common/helpers/generate-unique-slug';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [AudioPodcastController],
  providers: [AudioPodcastService, UuidHelper, SlugHelper, FileUploadService],
  imports: [PrismaModule],
})
export class AudioPodcastModule {}
