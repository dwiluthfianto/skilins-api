import { Module } from '@nestjs/common';
import { RatingService } from './ratings.service';
import { RatingController } from './ratings.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [RatingController],
  providers: [RatingService],
  imports: [PrismaModule],
})
export class RatingModule {}
