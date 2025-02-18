import { Module } from '@nestjs/common';
import { BlogService } from './blogs.service';
import { BlogController } from './blogs.controller';

import { FileUploadService } from '../file-upload/file-upload.service';
import { SlugHelper } from '@utils/generate-unique-slug.util';

@Module({
  controllers: [BlogController],
  providers: [BlogService, FileUploadService, SlugHelper],
  imports: [],
})
export class BlogModule {}
