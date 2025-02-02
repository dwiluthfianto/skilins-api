import { Logger, Module } from '@nestjs/common';
import { EbookService } from './ebooks.service';
import { EbookController } from './ebooks.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { SlugHelper } from 'src/common/helpers/generate-unique-slug';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [EbookController],
  providers: [EbookService, UuidHelper, SlugHelper, FileUploadService, Logger],
  imports: [PrismaModule],
})
export class EbookModule {}
