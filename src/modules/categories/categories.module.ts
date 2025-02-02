import { Logger, Module } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CategoryController } from './categories.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, UuidHelper, FileUploadService, Logger],
  imports: [PrismaModule],
})
export class CategoryModule {}
