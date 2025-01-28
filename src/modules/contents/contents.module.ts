import { Module } from '@nestjs/common';
import { ContentController } from './contents.controller';
import { ContentService } from './contents.service';
import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ContentController],
  providers: [ContentService, UuidHelper],
  imports: [PrismaModule],
})
export class ContentModule {}
