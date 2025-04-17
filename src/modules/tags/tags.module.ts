import { Module } from '@nestjs/common';
import { TagService } from './tags.service';
import { TagController } from './tags.controller';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [TagController],
  providers: [TagService, FileUploadService],
  imports: [],
})
export class TagModule {}
