import { Global, Module } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CategoryController } from './categories.controller';

import { FileUploadService } from '../file-upload/file-upload.service';

@Global()
@Module({
  controllers: [CategoryController],
  providers: [CategoryService, FileUploadService],
  imports: [],
  exports: [CategoryService],
})
export class CategoryModule {}
