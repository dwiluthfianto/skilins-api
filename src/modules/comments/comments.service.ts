import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
// import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeleteCommentDto } from './dto/delete-comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prismaService: PrismaService) {}
  async createComment(contentUuid: string, createCommentDto: CreateCommentDto) {
    const { commented_by, comment_content } = createCommentDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      const content = await prisma.content.findUnique({
        where: { uuid: contentUuid },
      });

      if (!content) {
        throw new NotFoundException(
          'Content not found, please make sure you input correct content',
        );
      }

      const user = await prisma.user.findUnique({
        where: { uuid: commented_by },
      });

      if (!content) {
        throw new NotFoundException(
          'User not found, please make sure you input correct user',
        );
      }

      await prisma.comment.create({
        data: {
          comment_content,
          content: { connect: { id: content.id } },
          user: { connect: { id: user.id } },
        },
      });
      return {
        status: 'success',
        message: 'Comment successfully added!',
      };
    });

    return res;
  }

  // update(id: number, updateCommentDto: UpdateCommentDto) {
  //   return `This action updates a #${id} comment`;
  // }

  async removeComment(contentUuid: string, deleteCommentDto: DeleteCommentDto) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { uuid: contentUuid },
    });

    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { uuid: deleteCommentDto.commentBy },
    });

    const comment = await this.prismaService.comment.findUniqueOrThrow({
      where: {
        content_id: content.id,
        commented_by: user.id,
        uuid: deleteCommentDto.commentUuid,
      },
      select: {
        uuid: true,
      },
    });

    await this.prismaService.comment.delete({
      where: { uuid: comment.uuid },
    });

    return {
      status: 'success',
      message: 'Comment removed successfully!',
      data: {
        uuid: comment.uuid,
      },
    };
  }
}
