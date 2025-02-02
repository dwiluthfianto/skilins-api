import { Logger, Module } from '@nestjs/common';
import { PrakerinService } from './prakerin.service';
import { PrakerinController } from './prakerin.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { SlugHelper } from 'src/common/helpers/generate-unique-slug';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [PrakerinController],
  providers: [
    PrakerinService,
    UuidHelper,
    SlugHelper,
    FileUploadService,
    Logger,
  ],
  imports: [PrismaModule],
})
export class PrakerinModule {}
