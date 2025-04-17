import { Module } from '@nestjs/common';
import { RatingService } from './ratings.service';
import { RatingController } from './ratings.controller';

@Module({
  controllers: [RatingController],
  providers: [RatingService],
  imports: [],
})
export class RatingModule {}
