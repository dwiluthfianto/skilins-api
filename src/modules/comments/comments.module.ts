import { Module } from '@nestjs/common';
import { CommentService } from './comments.service';
import { CommentController } from './comments.controller';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  imports: [],
})
export class CommentModule {}
