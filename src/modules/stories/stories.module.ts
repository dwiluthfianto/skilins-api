import { Module } from '@nestjs/common';
import { StoryService } from './stories.service';
import { StoryController } from './stories.controller';
import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { SlugHelper } from 'src/common/helpers/generate-unique-slug';

import { PrismaModule } from 'src/prisma/prisma.module';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [StoryController],
  providers: [StoryService, UuidHelper, SlugHelper, FileUploadService],
  imports: [PrismaModule],
})
export class StoryModule {}
