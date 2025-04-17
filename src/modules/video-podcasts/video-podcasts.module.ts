import { Module } from '@nestjs/common';
import { VideoPodcastService } from './video-podcasts.service';
import { VideoPodcastController } from './video-podcasts.controller';
import { SlugHelper } from '@utils/generate-unique-slug.util';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [VideoPodcastController],
  providers: [VideoPodcastService, SlugHelper, FileUploadService],
  imports: [],
})
export class VideoPodcastModule {}
