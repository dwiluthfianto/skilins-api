import { Module } from '@nestjs/common';
import { BlogService } from './blogs.service';
import { BlogController } from './blogs.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UuidHelper } from 'src/common/helpers/uuid.helper';

import { SlugHelper } from 'src/common/helpers/generate-unique-slug';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [BlogController],
  providers: [BlogService, UuidHelper, SlugHelper, FileUploadService],
  imports: [PrismaModule],
})
export class BlogModule {}
