import { Logger, Module } from '@nestjs/common';
import { TagService } from './tags.service';
import { TagController } from './tags.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [TagController],
  providers: [TagService, UuidHelper, FileUploadService, Logger],
  imports: [PrismaModule],
})
export class TagModule {}
