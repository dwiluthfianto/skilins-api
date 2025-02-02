import { Logger, Module } from '@nestjs/common';
import { GenreService } from './genres.service';
import { GenreController } from './genres.controller';
import { UuidHelper } from 'src/common/helpers/uuid.helper';

import { PrismaModule } from 'src/prisma/prisma.module';
import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [GenreController],
  providers: [GenreService, UuidHelper, FileUploadService, Logger],
  imports: [PrismaModule],
})
export class GenreModule {}
