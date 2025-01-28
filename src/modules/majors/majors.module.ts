import { Module } from '@nestjs/common';
import { MajorService } from './majors.service';
import { MajorController } from './majors.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [MajorController],
  providers: [MajorService, UuidHelper, FileUploadService],
  imports: [PrismaModule],
})
export class MajorModule {}
