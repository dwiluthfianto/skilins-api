import { Module } from '@nestjs/common';
import { GenreService } from './genres.service';
import { GenreController } from './genres.controller';

import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  controllers: [GenreController],
  providers: [GenreService, FileUploadService],
  imports: [],
})
export class GenreModule {}
