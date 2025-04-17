import { Module } from '@nestjs/common';
import { MajorService } from './majors.service';
import { MajorController } from './majors.controller';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [MajorController],
  providers: [MajorService, FileUploadService],
  imports: [],
})
export class MajorModule {}
