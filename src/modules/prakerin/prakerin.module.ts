import { Module } from '@nestjs/common';
import { PrakerinService } from './prakerin.service';
import { PrakerinController } from './prakerin.controller';
import { SlugHelper } from '@utils/generate-unique-slug.util';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [PrakerinController],
  providers: [PrakerinService, SlugHelper, FileUploadService],
  imports: [],
})
export class PrakerinModule {}
