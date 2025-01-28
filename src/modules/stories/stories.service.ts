import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SlugHelper } from 'src/common/helpers/generate-unique-slug';
import { AddStoryEpisodeDto } from './dto/add-episode-story.dto.ts';
import { UpdateStoryEpisodeDto } from './dto/update-episode-story.dto.ts';
import { UpdateStoryDto } from './dto/update-story.dto';
import { UuidHelper } from 'src/common/helpers/uuid.helper';
import parseArrayInput from 'src/common/utils/parse-array';
import { ContentStatus, Prisma } from '@prisma/client';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { subMonths } from 'date-fns';

@Injectable()
export class StoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly slugHelper: SlugHelper,
    private readonly uuidHelper: UuidHelper,
  ) {}
  async create(creatorUuid: string, createStoryDto: CreateStoryDto) {
    const { title, thumbnail, description, tags, category_name, genres } =
      createStoryDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      const parsedGenres = parseArrayInput(genres);
      const parsedTags = parseArrayInput(tags);

      const newSlug = await this.slugHelper.generateUniqueSlug(title);
      const userData = await prisma.user.findUnique({
        where: {
          uuid: creatorUuid,
        },
        include: {
          student: true,
        },
      });

      if (!userData) {
        throw new NotFoundException(
          'Student not found, please make sure you input correct student',
        );
      }

      await prisma.content.create({
        data: {
          type: 'Story',
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
          category: { connect: { name: category_name } },
          slug: newSlug,
          story: {
            create: {
              creator: { connect: { uuid: userData.student.uuid } },
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
        message: 'Story successfully uploaded!',
      };
    });

    return res;
  }

  async addEpisode(
    storyUuid: string,
    creatorUuid: string,
    addStoryEpisodeDto: AddStoryEpisodeDto,
  ) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      const content = await this.prismaService.content.findUniqueOrThrow({
        where: { type: 'Story', uuid: storyUuid },
        include: {
          story: true,
        },
      });
      const creator = await this.uuidHelper.validateUuidCreator(creatorUuid);

      if (content.story.creator_id !== creator.student.id) {
        throw new ForbiddenException(
          'You do not have permission to add episode in this story.',
        );
      }

      await prisma.episode.create({
        data: {
          title: addStoryEpisodeDto.title,
          content: addStoryEpisodeDto.content,
          order: addStoryEpisodeDto.order,
          story_id: content.story.id,
        },
      });

      return {
        status: 'success',
        message: `Episode ${content.title} added successfully`,
      };
    });

    return res;
  }

  async findAllStory(findContentQueryDto: FindContentQueryDto) {
    const { page, limit, category, tag, genre, search, status, latest } =
      findContentQueryDto;

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

    const categoryFilter = category
      ? {
          category: {
            name: {
              equals: category,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        }
      : {};

    const genreFilter = genre
      ? {
          genre: {
            some: {
              name: {
                equals: genre,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        }
      : {};

    const tagFilter = tag
      ? {
          tag: {
            some: {
              name: {
                equals: tag,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        }
      : {};

    const filter = {
      ...searchByTitle,
      ...latestFilter,
      ...statusFilter,
      ...categoryFilter,
      ...genreFilter,
      ...tagFilter,
    };

    const story = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'Story',
        ...filter,
      },
      include: {
        category: true,
        tag: true,
        genre: true,
        rating: true,
        story: {
          include: {
            creator: true,
          },
        },
      },
    });

    const total = await this.prismaService.story.count();

    const data = await Promise.all(
      story.map(async (story) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: story.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;

        return {
          ...story,
          tags: story.tag.map((tag) => ({
            id: tag.uuid,
            text: tag.name,
          })),
          genres: story.genre.map((genre) => ({
            id: genre.uuid,
            text: genre.name,
          })),
          category: story.category.name,
          creator: story.story.creator.name || null,
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

  async fetchUserStories(
    userUuid: string,
    findContentQueryDto: FindContentQueryDto,
  ) {
    const { page, limit, category, tag, genre, search, status, latest } =
      findContentQueryDto;

    const user = await this.prismaService.user.findUnique({
      where: { uuid: userUuid },
    });

    if (!user) {
      throw new NotFoundException(404, 'Your account has been deleted');
    }

    const currentDate = new Date();

    const twoMonthsAgo = subMonths(currentDate, 2);

    const filterByUser = {
      story: {
        creator: {
          user: { uuid: user.uuid },
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

    const categoryFilter = category
      ? {
          category: {
            name: {
              equals: category,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        }
      : {};

    const genreFilter = genre
      ? {
          genre: {
            some: {
              name: {
                equals: genre,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        }
      : {};

    const tagFilter = tag
      ? {
          tag: {
            some: {
              name: {
                equals: tag,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        }
      : {};

    const filter = {
      ...filterByUser,
      ...searchByTitle,
      ...latestFilter,
      ...statusFilter,
      ...categoryFilter,
      ...genreFilter,
      ...tagFilter,
    };

    const story = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'Story',
        ...filter,
      },
      include: {
        category: true,
        tag: true,
        genre: true,
        rating: true,
        story: {
          include: {
            creator: true,
          },
        },
      },
    });

    const total = await this.prismaService.story.count();

    const data = await Promise.all(
      story.map(async (story) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: story.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;

        return {
          ...story,
          tags: story.tag.map((tag) => ({
            id: tag.uuid,
            text: tag.name,
          })),
          genres: story.genre.map((genre) => ({
            id: genre.uuid,
            text: genre.name,
          })),
          category: story.category.name,
          creator: story.story.creator.name || null,
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

  async getStoryBySlug(slug: string) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { type: 'Story', slug },
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
        story: {
          include: {
            creator: true,
            episode: {
              orderBy: { order: 'asc' },
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
        uuid: content.uuid,
        thumbnail: content.thumbnail,
        title: content.title,
        description: content.description,
        slug: content.slug,
        status: content.status,
        tags: content.tag.map((tag) => ({
          id: tag.uuid,
          text: tag.name,
        })),
        created_at: content.created_at,
        updated_at: content.updated_at,
        category: content.category.name,
        creator: content.story.creator.name,
        episode: content.story.episode.map((episode) => ({
          uuid: episode.uuid,
          title: episode.title,
          order: episode.order,
          created_at: episode.created_at,
        })),
        genres: content.genre.map((genre) => ({
          id: genre.uuid,
          text: genre.name,
        })),
        comments: content.comment.map((comment) => ({
          ...comment,
          commented_by_uuid: comment.user.uuid,
          commented_by: comment.user.full_name,
          profile: comment.user.profile,
        })),
        avg_rating: avg_rating._avg.rating_value,
      },
    };
  }

  async getOneEpisode(slugStory: string, order: number) {
    const story = await this.prismaService.content.findUnique({
      where: {
        type: 'Story',
        slug: slugStory,
      },
    });

    if (!story) {
      throw new NotFoundException(
        'Audio not found, please make sure you input correct audio',
      );
    }
    const episode = await this.prismaService.episode.findFirst({
      where: {
        story_id: story.id,
        order,
      },
    });

    return {
      status: 'success',
      data: episode,
    };
  }

  async getEpisode(slugStory: string, order: number) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: {
        type: 'Story',
        slug: slugStory,
        story: {
          episode: {
            some: {
              order,
            },
          },
        },
      },
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
        story: {
          include: {
            creator: true,
            episode: true,
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

    const episode = content.story.episode.sort((a, b) => a.order - b.order);
    const currentEpisodeIndex = episode.findIndex((ep) => ep.order === order);

    const nextEpisode =
      currentEpisodeIndex + 1 < episode.length
        ? episode[currentEpisodeIndex + 1]
        : null;

    const prevEpisode =
      currentEpisodeIndex - 1 >= 0 ? episode[currentEpisodeIndex - 1] : null;

    return {
      status: 'success',
      data: {
        uuid: content.uuid,
        thumbnail: content.thumbnail,
        title: content.title,
        description: content.description,
        slug: content.slug,
        tags: content.tag.map((tag) => ({
          id: tag.uuid,
          text: tag.name,
        })),
        created_at: content.created_at,
        updated_at: content.updated_at,
        category: content.category.name,
        creator: content.story.creator.name,
        episode: {
          uuid: content.story.episode[currentEpisodeIndex].uuid,
          title: content.story.episode[currentEpisodeIndex].title,
          content: content.story.episode[currentEpisodeIndex].content,
          order: content.story.episode[currentEpisodeIndex].order,
        },
        nextEpisode: nextEpisode
          ? {
              uuid: nextEpisode.uuid,
              title: nextEpisode.title,
              order: nextEpisode.order,
            }
          : null,
        prevEpisode: prevEpisode
          ? {
              uuid: prevEpisode.uuid,
              title: prevEpisode.title,
              order: prevEpisode.order,
            }
          : null,
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
        avg_rating: avg_rating._avg.rating_value,
      },
    };
  }

  async updateStory(
    contentUuid: string,
    creatorUuid: string,
    updateStoryDto: UpdateStoryDto,
  ) {
    const { title, thumbnail, description, tags, category_name, genres } =
      updateStoryDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      const content = await prisma.content.findUniqueOrThrow({
        where: { type: 'Story', uuid: contentUuid },
        include: {
          story: {
            include: {
              creator: true,
            },
          },
        },
      });
      const category =
        await this.uuidHelper.validateUuidCategory(category_name);

      if (content.story.creator.uuid !== creatorUuid) {
        throw new ForbiddenException(
          'You do not have permission to update this story.',
        );
      }

      const parsedGenres = parseArrayInput(genres);
      const parsedTags = parseArrayInput(tags);

      const newSlug = await this.slugHelper.generateUniqueSlug(title);
      await prisma.content.update({
        where: { uuid: contentUuid, type: 'Story' },
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
          slug: newSlug,
          category: { connect: { uuid: category.uuid } },
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
        message: 'Story succesfully updated.',
      };
    });

    return res;
  }
  async updateEpisode(
    episodeUuid: string,
    creatorUuid: string,
    updateStoryEpisodeDto: UpdateStoryEpisodeDto,
  ) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      const episode = await prisma.episode.findUnique({
        where: { uuid: episodeUuid },
        include: {
          story: {
            select: {
              uuid: true,
              creator_id: true,
            },
          },
        },
      });

      const creator = await this.uuidHelper.validateUuidCreator(creatorUuid);

      if (episode.story.creator_id !== creator.student.id) {
        throw new ForbiddenException(
          'You do not have permission to update this episode.',
        );
      }

      await prisma.episode.update({
        where: { uuid: episode.uuid },
        data: {
          title: updateStoryEpisodeDto.title,
          content: updateStoryEpisodeDto.content,
          order: updateStoryEpisodeDto.order,
        },
      });

      return {
        status: 'success',
        message: 'Episode updated successfully',
      };
    });

    return res;
  }

  async deleteStory(storyUuid: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      await this.uuidHelper.validateUuidContent(storyUuid);

      await prisma.content.delete({
        where: { uuid: storyUuid },
      });
      return {
        status: 'success',
        message: 'Story successfully deleted!',
      };
    });

    return res;
  }
  async deleteEpisode(episodeUuid: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      const episode = await this.prismaService.episode.findUnique({
        where: { uuid: episodeUuid },
      });

      if (!episode) {
        throw new NotFoundException(
          'Episode not found, please make sure you input correct episode',
        );
      }

      await prisma.episode.delete({
        where: { uuid: episodeUuid },
      });
      return {
        status: 'success',
        message: 'Episode successfully deleted!',
      };
    });

    return res;
  }
}
