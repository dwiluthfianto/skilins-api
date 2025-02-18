import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePrakerinDto } from './dto/create-prakerin.dto';
import { UpdatePrakerinDto } from './dto/update-prakerin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SlugHelper } from '@utils/generate-unique-slug.util';
import { ContentStatus, Prisma } from '@prisma/client';
import { FindPrakerinQueryDto } from '../contents/dto/find-prakerin-query.dto';
import { contentFilter, contentFilterByUser } from '@utils/content-filter.util';

@Injectable()
export class PrakerinService {
  constructor(
    private prismaService: PrismaService,
    private readonly slugHelper: SlugHelper,
  ) {}
  async createPrakerin(
    creatorUuid: string,
    createPrakerinDto: CreatePrakerinDto,
  ) {
    const { title, thumbnail, description, pages, file } = createPrakerinDto;

    await this.prismaService.$transaction(async (prisma) => {
      const newSlug = await this.slugHelper.generateUniqueSlug(title);
      const userData = await prisma.user.findUniqueOrThrow({
        where: {
          uuid: creatorUuid,
        },
        include: {
          student: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!userData) {
        throw new NotFoundException(
          'User not found, please make sure you input correct user',
        );
      }

      const fileAttachment = await prisma.fileAttachment.create({
        data: {
          file: file,
          type: 'ebook',
        },
      });

      const newContent = await prisma.content.create({
        data: {
          type: 'prakerin',
          title,
          thumbnail,
          description,
          slug: newSlug,
          category: { connect: { name: 'Non-fiction' } },
          prakerin: {
            create: {
              creator_id: userData.student.id,
              pages,
              file_id: fileAttachment.id,
              published_at: new Date(),
            },
          },
        },
      });
    });
  }

  async findAllPrakerinByUser(findPrakerinQueryDto: FindPrakerinQueryDto) {
    const { page, limit, search, latest } = findPrakerinQueryDto;

    const filter = contentFilterByUser({ latest, search });

    const prakerin = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'prakerin',
        ...filter,
      },
      include: {
        rating: true,
        prakerin: {
          include: {
            file_attachment: true,
            creator: {
              include: {
                major: true,
              },
            },
          },
        },
      },
    });

    const total = await this.prismaService.content.count({
      where: { type: 'prakerin', ...filter },
    });

    const data = await Promise.all(
      prakerin.map(async (content) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: content.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;
        return {
          ...content,
          avg_rating,
        };
      }),
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        last_page: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async findAllPrakerinByStaff(findPrakerinQueryDto: FindPrakerinQueryDto) {
    const { page, limit, search, status, latest } = findPrakerinQueryDto;

    const filter = contentFilter({ latest, search, status });

    const prakerin = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'prakerin',
        ...filter,
      },
      include: {
        prakerin: {
          include: {
            file_attachment: {
              select: {
                file: true,
              },
            },
            creator: {
              select: {
                name: true,
                major: true,
              },
            },
          },
        },
      },
    });

    const total = await this.prismaService.content.count({
      where: { type: 'prakerin', ...filter },
    });

    const data = await Promise.all(
      prakerin.map(async (content) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: content.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;
        return {
          ...content,
          avg_rating,
        };
      }),
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        last_page: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async fetchUserPrakerin(userUuid: string) {
    const user = await this.prismaService.user.findUnique({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found, please make sure you input correct user',
      );
    }

    const filterByUser = {
      prakerin: {
        creator: {
          user: { uuid: userUuid },
        },
      },
    };

    const prakerin = await this.prismaService.content.findFirst({
      where: {
        type: 'prakerin',
        ...filterByUser,
      },
      include: {
        prakerin: true,
      },
    });

    return prakerin;
  }

  async findPrakerinByUuid(contentUuid: string) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { uuid: contentUuid, type: 'prakerin' },
      include: {
        prakerin: {
          include: {
            file_attachment: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(
        'Content not found, please make sure you input correct content',
      );
    }

    return content;
  }

  async findPrakerinBySlug(slug: string) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { slug, type: 'prakerin' },
      include: {
        category: true,
        rating: true,
        tag: true,
        comment: {
          include: {
            user: {
              select: {
                uuid: true,
                full_name: true,
                profile: true,
              },
            },
          },
        },
        prakerin: {
          include: {
            file_attachment: true,
            creator: {
              include: {
                major: true,
              },
            },
          },
        },
      },
    });

    const avg_rating = await this.prismaService.rating.aggregate({
      where: { content_id: content.id },
      _avg: {
        rating_value: true,
      },
    });

    return {
      ...content,
      tag: content.tag.map((tag) => ({
        id: tag.uuid,
        text: tag.name,
      })),
      avg_rating: avg_rating._avg.rating_value,
    };
  }

  async updatePrakerinByUuid(
    contentUuid: string,
    creatorUuid: string,
    updatePrakerinDto: UpdatePrakerinDto,
  ) {
    const { title, thumbnail, description, pages, file } = updatePrakerinDto;

    await this.prismaService.$transaction(async (prisma) => {
      const content = await prisma.content.findUnique({
        where: {
          uuid: contentUuid,
        },
        select: {
          id: true,
          uuid: true,
          prakerin: {
            select: {
              uuid: true,
              file_id: true,
              creator_id: true,
            },
          },
        },
      });

      if (!content) {
        throw new NotFoundException(
          'Content not found, please make sure you input correct content',
        );
      }
      const creator = await prisma.user.findUniqueOrThrow({
        where: { uuid: creatorUuid },
        select: {
          student: {
            select: { id: true },
          },
        },
      });

      if (creator.student.id !== content.prakerin.creator_id) {
        throw new UnauthorizedException(
          `You don't have any permission to update this prakerin`,
        );
      }

      const newSlug = await this.slugHelper.generateUniqueSlug(title);

      await prisma.fileAttachment.update({
        where: {
          id: content.prakerin.file_id,
        },
        data: {
          file: file,
          type: 'prakerin',
        },
      });

      await prisma.content.update({
        where: { uuid: contentUuid, type: 'prakerin' },
        data: {
          title,
          thumbnail,
          description,
          slug: newSlug,
          prakerin: {
            update: {
              where: {
                content_id: content.id,
              },
              data: {
                pages,
              },
            },
          },
        },
      });
    });
  }

  async removePrakerinByUuid(contentUuid: string) {
    const content = await this.prismaService.content.findUnique({
      where: { uuid: contentUuid },
    });

    if (content.status === ContentStatus.approved) {
      throw new BadRequestException(
        'Prakerin is already approved, you cannot delete it',
      );
    }

    await this.prismaService.content.delete({
      where: { uuid: contentUuid },
    });
  }

  async summaryPrakerinStaff() {
    const res = await this.prismaService.prakerin.findMany({
      include: {
        content: true,
      },
    });

    const counter = res.reduce(
      (acc, item) => {
        acc[item.content.status] = (acc[item.content.status] || 0) + 1;
        return acc;
      },
      { pending: 0, approved: 0, rejected: 0 },
    );

    return counter;
  }
}
