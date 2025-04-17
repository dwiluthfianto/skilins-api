import { Module } from '@nestjs/common';
import { ContentController } from './contents.controller';
import { ContentService } from './contents.service';

@Module({
  controllers: [ContentController],
  providers: [ContentService],
  imports: [],
})
export class ContentModule {}
