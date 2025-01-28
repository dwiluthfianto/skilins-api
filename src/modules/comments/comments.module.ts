import { Module } from '@nestjs/common';
import { CommentService } from './comments.service';
import { CommentController } from './comments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  imports: [PrismaModule],
})
export class CommentModule {}
