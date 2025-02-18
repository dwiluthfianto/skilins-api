import { Module } from '@nestjs/common';
import { EbookService } from './ebooks.service';
import { EbookController } from './ebooks.controller';

import { SlugHelper } from '@utils/generate-unique-slug.util';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [EbookController],
  providers: [EbookService, SlugHelper, FileUploadService],
  imports: [],
})
export class EbookModule {}
