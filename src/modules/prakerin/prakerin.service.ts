import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePrakerinDto } from './dto/create-prakerin.dto';
import { UpdatePrakerinDto } from './dto/update-prakerin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { SlugHelper } from 'src/common/helpers/generate-unique-slug';
import { ContentStatus, Prisma } from '@prisma/client';
import { subMonths } from 'date-fns';
import { FindPrakerinQueryDto } from '../contents/dto/find-prakerin-query.dto';

@Injectable()
export class PrakerinService {
  constructor(
    private prismaService: PrismaService,
    private readonly uuidHelper: UuidHelper,
    private readonly slugHelper: SlugHelper,
  ) {}
  async createPrakerin(
    creatorUuid: string,
    createPrakerinDto: CreatePrakerinDto,
  ) {
    const { title, thumbnail, description, pages, file } = createPrakerinDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
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
          type: 'Ebook',
        },
      });

      await prisma.content.create({
        data: {
          type: 'Prakerin',
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
            },
          },
        },
      });

      return {
        status: 'success',
        message: 'Prakerin successfully added!',
      };
    });

    return res;
  }

  async findAllPrakerin(findPrakerinQueryDto: FindPrakerinQueryDto) {
    const { page, limit, search, status, latest } = findPrakerinQueryDto;

    const currentDate = new Date();

    const twoMonthsAgo = subMonths(currentDate, 2);

    const latestFilter = latest
      ? {
          status: ContentStatus.Approved,
          created_at: {
            gte: twoMonthsAgo,
            lte: currentDate,
          },
        }
      : {};

    const searchByTitle = {
      title: {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      },
    };

    const statusFilter = status
      ? {
          status: {
            equals: status,
          },
        }
      : {};

    const filter = {
      ...searchByTitle,
      ...latestFilter,
      ...statusFilter,
    };

    const prakerin = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'Prakerin',
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
      where: { type: 'Prakerin', ...filter },
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
          author: content.prakerin.creator.name,
          major: content.prakerin.creator.major.name,
          pages: content.prakerin.pages,
          file_attachment: content.prakerin.file_attachment.file,
          avg_rating,
        };
      }),
    );

    return {
      status: 'success',
      data,
      pagination: {
        page,
        limit,
        total,
        last_page: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async fetchUserPrakerin(
    userUuid: string,
    findPrakerinQueryDto: FindPrakerinQueryDto,
  ) {
    const { page, limit, search, status, latest } = findPrakerinQueryDto;

    const user = await this.prismaService.user.findUnique({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found, please make sure you input correct user',
      );
    }

    const currentDate = new Date();

    const twoMonthsAgo = subMonths(currentDate, 2);

    const filterByUser = {
      prakerin: {
        creator: {
          user: { uuid: userUuid },
        },
      },
    };

    const latestFilter = latest
      ? {
          status: ContentStatus.Approved,
          created_at: {
            gte: twoMonthsAgo,
            lte: currentDate,
          },
        }
      : {};

    const searchByTitle = {
      title: {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      },
    };

    const statusFilter = status
      ? {
          status: {
            equals: status,
          },
        }
      : {};

    const filter = {
      ...filterByUser,
      ...searchByTitle,
      ...latestFilter,
      ...statusFilter,
    };

    const prakerin = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'Prakerin',
        ...filter,
      },
      include: {
        category: true,
        tag: true,
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

    const total = await this.prismaService.prakerin.count();
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
          tags: content.tag.map((tag) => ({
            id: tag.uuid,
            text: tag.name,
          })),
          category: content.category.name,
          author: content.prakerin.creator.name,
          major: content.prakerin.creator.major.name,
          pages: content.prakerin.pages,
          file_attachment: content.prakerin.file_attachment.file,
          avg_rating,
        };
      }),
    );

    return {
      status: 'success',
      data,
      pagination: {
        page,
        limit,
        total,
        last_page: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async findPrakerinByUuid(contentUuid: string) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { uuid: contentUuid, type: 'Prakerin' },
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

    return {
      status: 'success',
      data: content,
    };
  }

  async findPrakerinBySlug(slug: string) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { slug, type: 'Prakerin' },
      include: {
        category: true,
        genre: true,
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
      status: 'success',
      data: {
        ...content,
        tags: content.tag.map((tag) => ({
          id: tag.uuid,
          text: tag.name,
        })),
        category: content.category.name,
        author: content.prakerin.creator.name,
        major: content.prakerin.creator.major.name,
        pages: content.prakerin.pages,
        file_attachment: content.prakerin.file_attachment.file,
        genres: content.genre?.map((genre) => ({
          id: genre.uuid,
          text: genre.name,
        })),
        comments: content.comment.map((comment) => ({
          ...comment,
          commented_by_uuid: comment.user.uuid,
          commented_by: comment.user.full_name,
          profile: comment.user.profile,
        })),
        avg_rating,
      },
    };
  }

  async updatePrakerinByUuid(
    contentUuid: string,
    creatorUuid: string,
    updatePrakerinDto: UpdatePrakerinDto,
  ) {
    const { title, thumbnail, description, pages, file } = updatePrakerinDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
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
      const creator = await this.uuidHelper.validateUuidCreator(creatorUuid);

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
          type: 'Prakerin',
        },
      });

      await prisma.content.update({
        where: { uuid: contentUuid, type: 'Prakerin' },
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

      return {
        status: 'success',
        message: 'prakerin updated successfully!',
      };
    });

    return res;
  }

  async removePrakerinByUuid(contentUuid: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      await this.uuidHelper.validateUuidContent(contentUuid);

      await prisma.content.delete({
        where: { uuid: contentUuid },
      });
      return {
        status: 'success',
        message: 'Prakerin successfully deleted!',
      };
    });

    return res;
  }
}
