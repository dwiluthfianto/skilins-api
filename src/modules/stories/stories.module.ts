import { Module } from '@nestjs/common';
import { StoryService } from './stories.service';
import { StoryController } from './stories.controller';
import { SlugHelper } from '@utils/generate-unique-slug.util';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [StoryController],
  providers: [StoryService, SlugHelper, FileUploadService],
  imports: [],
})
export class StoryModule {}
