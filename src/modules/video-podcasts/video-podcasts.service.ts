import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateVideoPodcastDto } from './dto/create-video-podcast.dto';
import { UpdateVideoPodcastDto } from './dto/update-video-podcast.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { SlugHelper } from 'src/common/helpers/generate-unique-slug';
import parseArrayInput from 'src/common/utils/parse-array';
import { ContentStatus, Prisma } from '@prisma/client';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { subMonths } from 'date-fns';
import {
  contentFilter,
  contentFilterByUser,
} from 'src/common/utils/filter/content-filter';

@Injectable()
export class VideoPodcastService {
  constructor(
    private prismaService: PrismaService,
    private readonly uuidHelper: UuidHelper,
    private readonly slugHelper: SlugHelper,
  ) {}
  async create(
    creatorUuid: string,
    createVideoPodcastDto: CreateVideoPodcastDto,
  ) {
    const { title, thumbnail, description, tags, category_name, genres, link } =
      createVideoPodcastDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      const parsedGenres = parseArrayInput(genres);
      const parsedTags = parseArrayInput(tags);

      const newSlug = await this.slugHelper.generateUniqueSlug(title);
      const userData = await prisma.user.findUniqueOrThrow({
        where: {
          uuid: creatorUuid,
        },
        include: {
          student: true,
        },
      });

      if (!userData) {
        throw new NotFoundException(
          'student not found, please make sure you input correct student',
        );
      }

      await prisma.content.create({
        data: {
          type: 'video',
          title,
          thumbnail,
          description,
          tag: {
            connectOrCreate: parsedTags?.map((tag) => ({
              where: {
                name: tag.text,
              },
              create: {
                name: tag.text,
              },
            })),
          },
          slug: newSlug,
          category: { connect: { name: category_name } },
          video_podcast: {
            create: {
              creator_id: userData.student.id,
              link: link,
            },
          },
          genre: {
            connectOrCreate: parsedGenres?.map((genre) => ({
              where: {
                name: genre.text,
              },
              create: {
                name: genre.text,
              },
            })),
          },
        },
      });
      return {
        status: 'success',
        message: 'Video successfully uploaded!',
      };
    });

    return res;
  }

  async findAllVideoByUser(findContentQueryDto: FindContentQueryDto) {
    const { page, limit, category, tag, genre, search, latest } =
      findContentQueryDto;

    const filter = contentFilterByUser({
      search,
      latest,
      tag,
      genre,
      category,
    });

    const videos = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'video',
        ...filter,
      },
    });

    const total = await this.prismaService.content.count({
      where: { type: 'video', ...filter },
    });

    const data = await Promise.all(
      videos.map(async (video) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: video.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;

        return {
          ...video,
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

  async findAllVideoByStaff(findContentQueryDto: FindContentQueryDto) {
    const { page, limit, category, tag, genre, search, status, latest } =
      findContentQueryDto;

    const filter = contentFilter({
      search,
      latest,
      tag,
      genre,
      category,
      status,
    });
    const videos = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'video',
        ...filter,
      },
    });

    const total = await this.prismaService.content.count({
      where: { type: 'video', ...filter },
    });

    const data = await Promise.all(
      videos.map(async (video) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: video.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;

        return {
          ...video,
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

  async fetchUserVideos(
    userUuid: string,
    findContentQueryDto: FindContentQueryDto,
  ) {
    const { page, limit, category, tag, genre, search, status, latest } =
      findContentQueryDto;

    const user = await this.prismaService.user.findUnique({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundException(
        'student not found, please make sure you input correct student',
      );
    }

    const filterByUser = {
      video_podcast: {
        creator: {
          user_id: user.id,
        },
      },
    };

    const filter = contentFilter({
      search,
      latest,
      tag,
      genre,
      category,
      status,
    });

    const videos = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'video',
        ...filterByUser,
        ...filter,
      },
    });

    const total = await this.prismaService.content.count({
      where: {
        type: 'video',
        ...filter,
      },
    });

    const data = await Promise.all(
      videos.map(async (video) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: video.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;

        return {
          ...video,
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

  async findVideoByUuid(uuid: string) {
    const video = await this.prismaService.content.findUnique({
      where: { uuid },
    });

    if (!video) {
      throw new NotFoundException(
        'Video not found, please make sure you input correct video',
      );
    }

    return {
      status: 'success',
      data: video,
    };
  }

  async findVideoBySlug(slug: string) {
    const video = await this.prismaService.content.findUnique({
      where: { slug },
      include: {
        category: true,
        genre: true,
        rating: true,
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
        tag: true,
        video_podcast: {
          include: {
            creator: true,
          },
        },
        submission: {
          include: {
            competition: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException(
        'Video not found, please make sure you input correct video',
      );
    }

    const avg_rating = await this.prismaService.rating.aggregate({
      where: { content_id: video.id },
      _avg: {
        rating_value: true,
      },
    });

    return {
      status: 'success',
      data: {
        ...video,
        tag: video.tag.map((tag) => ({
          id: tag.uuid,
          text: tag.name,
        })),
        genre: video.genre.map((genre) => ({
          id: genre.uuid,
          text: genre.name,
        })),
        comment: video.comment.map((comment) => ({
          ...comment,
          commented_by_uuid: comment.user.uuid,
          commented_by: comment.user.full_name,
          profile: comment.user.profile,
        })),
        avg_rating: avg_rating._avg.rating_value,
      },
    };
  }

  async updateVideoByUuid(
    uuid: string,
    creatorUuid: string,
    updateVideoPodcastDto: UpdateVideoPodcastDto,
  ) {
    const { title, thumbnail, description, tags, category_name, genres, link } =
      updateVideoPodcastDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      const content = await prisma.content.findUnique({
        where: {
          uuid,
        },
        select: {
          id: true,
          uuid: true,
          video_podcast: {
            select: {
              uuid: true,
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

      if (creator.student.id !== content.video_podcast.creator_id) {
        throw new UnauthorizedException(
          `You don't have any permission to update this audio`,
        );
      }

      const category =
        await this.uuidHelper.validateUuidCategory(category_name);

      const parsedGenres = parseArrayInput(genres);
      const parsedTags = parseArrayInput(tags);

      const newSlug = await this.slugHelper.generateUniqueSlug(title);

      await prisma.content.update({
        where: { uuid, type: 'video' },
        data: {
          title,
          thumbnail,
          description,
          tag: {
            connectOrCreate: parsedTags?.map((tag) => ({
              where: {
                name: tag.text,
              },
              create: {
                name: tag.text,
              },
            })),
          },
          category: { connect: { uuid: category.uuid } },
          slug: newSlug,
          video_podcast: {
            update: {
              where: {
                content_id: content.id,
                creator_id: creator.student.id,
              },
              data: {
                link,
              },
            },
          },
          genre: {
            connectOrCreate: parsedGenres?.map((genre) => ({
              where: {
                name: genre.text,
              },
              create: {
                name: genre.text,
              },
            })),
          },
        },
      });
      return {
        status: 'success',
        message: 'video successfully updated!',
      };
    });

    return res;
  }

  async removeVideoByUuid(contentUuid: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      await this.uuidHelper.validateUuidContent(contentUuid);

      await prisma.content.delete({
        where: { uuid: contentUuid },
      });
      return {
        status: 'success',
        message: 'Video successfully deleted!',
      };
    });

    return res;
  }

  async summaryVideoStudent(userUuid: string) {
    const user = await this.prismaService.user.findUnique({
      where: { uuid: userUuid },
      include: {
        student: true,
      },
    });

    const student = await this.prismaService.student.findUnique({
      where: {
        uuid: user.student.uuid,
      },
    });

    if (!student) {
      throw new ForbiddenException(
        "You don't have access to see this summary!",
      );
    }

    const res = await this.prismaService.audioPodcast.findMany({
      where: {
        creator_id: student.id,
      },
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

    return {
      counter,
    };
  }

  async summaryVideoStaff() {
    const res = await this.prismaService.audioPodcast.findMany({
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

    return {
      counter,
    };
  }
}
