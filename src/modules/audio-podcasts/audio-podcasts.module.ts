import { Logger, Module } from '@nestjs/common';
import { AudioPodcastService } from './audio-podcasts.service';
import { AudioPodcastController } from './audio-podcasts.controller';
import { SlugHelper } from '@utils/generate-unique-slug.util';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [AudioPodcastController],
  providers: [AudioPodcastService, SlugHelper, FileUploadService, Logger],
  imports: [],
})
export class AudioPodcastModule {}
