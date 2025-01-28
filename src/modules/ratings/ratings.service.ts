import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RatingService {
  constructor(private readonly prismaService: PrismaService) {}
  async ratingContent(
    userUuid: string,
    contentUuid: string,
    createRatingDto: CreateRatingDto,
  ) {
    if (createRatingDto.rating_value < 1 || createRatingDto.rating_value > 5) {
      throw new Error('Rating value must be between 1 and 5.');
    }

    const res = await this.prismaService.$transaction(async (prisma) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { uuid: userUuid },
        select: {
          id: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User is not found!');
      }

      const content = await prisma.content.findUniqueOrThrow({
        where: { uuid: contentUuid },
        select: {
          id: true,
        },
      });

      if (!content) {
        throw new NotFoundException('Content is not found!');
      }

      await prisma.rating.upsert({
        where: {
          rating_content: {
            content_id: content.id,
            rating_by: user.id,
          },
        },
        update: {
          rating_value: createRatingDto.rating_value,
        },
        create: {
          content_id: content.id,
          rating_by: user.id,
          rating_value: createRatingDto.rating_value,
        },
      });

      return {
        status: 'success',
        message: 'Successfully give a rating',
      };
    });

    return res;
  }

  async getUserRating(contentUuid: string, userUuid: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { uuid: userUuid },
      select: {
        id: true,
      },
    });

    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { uuid: contentUuid },
      select: {
        id: true,
      },
    });
    return this.prismaService.rating.findUnique({
      where: {
        rating_content: { content_id: content.id, rating_by: user.id },
      },
    });
  }
}
