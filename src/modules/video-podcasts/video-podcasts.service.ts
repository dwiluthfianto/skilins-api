import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateVideoPodcastDto } from './dto/create-video-podcast.dto';
import { UpdateVideoPodcastDto } from './dto/update-video-podcast.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SlugHelper } from '@utils/generate-unique-slug.util';
import parseArrayInput from '@utils/parse-array.util';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { contentFilter, contentFilterByUser } from '@utils/content-filter.util';
import { UserService } from '@modules/users/users.service';
import { CategoryService } from '@modules/categories/categories.service';
import { processImage, getRandomImage } from '@utils/process-image.util';
@Injectable()
export class VideoPodcastService {
  constructor(
    private prismaService: PrismaService,
    private readonly slugHelper: SlugHelper,
    private readonly userService: UserService,
    private readonly categoryService: CategoryService,
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

      const imageUrl = await processImage(getRandomImage(), 'video');

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

      const newContent = await prisma.content.create({
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
                avatar: imageUrl,
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
                avatar: imageUrl,
                name: genre.text,
              },
            })),
          },
        },
      });
      return newContent;
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
      include: {
        category: {
          select: {
            name: true,
          },
        },
        video_podcast: {
          include: {
            creator: {
              select: {
                name: true,
              },
            },
          },
        },
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

    return video;
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
            competition: {
              select: {
                uuid: true,
              },
            },
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
      ...video,
      tag: video.tag.map((tag) => ({
        id: tag.uuid,
        text: tag.name,
      })),
      genre: video.genre.map((genre) => ({
        id: genre.uuid,
        text: genre.name,
      })),
      avg_rating: avg_rating._avg.rating_value,
    };
  }

  async updateVideoByUuid(
    uuid: string,
    creatorUuid: string,
    updateVideoPodcastDto: UpdateVideoPodcastDto,
  ) {
    const { title, thumbnail, description, tags, category_name, genres, link } =
      updateVideoPodcastDto;

    await this.prismaService.$transaction(async (prisma) => {
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
      const creator = await this.userService.findOne(creatorUuid);

      if (creator.student.id !== content.video_podcast.creator_id) {
        throw new UnauthorizedException(
          `You don't have any permission to update this audio`,
        );
      }

      const category =
        await this.categoryService.findCategoryByName(category_name);

      const parsedGenres = parseArrayInput(genres);
      const parsedTags = parseArrayInput(tags);

      const newSlug = await this.slugHelper.generateUniqueSlug(title);
      const imageUrl = await processImage(getRandomImage(), 'video');

      await prisma.content.update({
        where: { uuid, type: 'video' },
        data: {
          title,
          thumbnail,
          description,
          status: 'pending',
          tag: {
            connectOrCreate: parsedTags?.map((tag) => ({
              where: {
                name: tag.text,
              },
              create: {
                avatar: imageUrl,
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
                avatar: imageUrl,
                name: genre.text,
              },
            })),
          },
        },
      });
    });
  }

  async removeVideoByUuid(contentUuid: string) {
    await this.findVideoByUuid(contentUuid);

    await this.prismaService.content.delete({
      where: { uuid: contentUuid },
    });
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

    const res = await this.prismaService.videoPodcast.findMany({
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

    return counter;
  }

  async summaryVideoStaff() {
    const res = await this.prismaService.videoPodcast.findMany({
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
