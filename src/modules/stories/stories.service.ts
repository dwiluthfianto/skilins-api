import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoryDto } from './dto/create-story.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SlugHelper } from '@utils/generate-unique-slug.util';
import { AddStoryEpisodeDto } from './dto/add-episode-story.dto.ts';
import { UpdateStoryEpisodeDto } from './dto/update-episode-story.dto.ts';
import { UpdateStoryDto } from './dto/update-story.dto';
import parseArrayInput from '@utils/parse-array.util';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { contentFilter, contentFilterByUser } from '@utils/content-filter.util';
import { UserService } from '@modules/users/users.service';
import { CategoryService } from '@modules/categories/categories.service';
import { getRandomImage } from '@utils/process-image.util';
import { processImage } from '@utils/process-image.util';

@Injectable()
export class StoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly slugHelper: SlugHelper,
    private readonly userService: UserService,
    private readonly categoryService: CategoryService,
  ) {}
  async create(creatorUuid: string, createStoryDto: CreateStoryDto) {
    const { title, thumbnail, description, tags, category_name, genres } =
      createStoryDto;

    const parsedGenres = parseArrayInput(genres);
    const parsedTags = parseArrayInput(tags);

    const newSlug = await this.slugHelper.generateUniqueSlug(title);
    const userData = await this.prismaService.user.findUnique({
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

    const imageUrl = await processImage(getRandomImage(), 'story');

    await this.prismaService.content.create({
      data: {
        type: 'story',
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
              avatar: imageUrl,
              name: genre.text,
            },
          })),
        },
      },
    });
  }

  async addEpisode(
    storyUuid: string,
    creatorUuid: string,
    addStoryEpisodeDto: AddStoryEpisodeDto,
  ) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { type: 'story', uuid: storyUuid },
      include: {
        story: true,
      },
    });
    const creator = await this.prismaService.user.findUniqueOrThrow({
      where: { uuid: creatorUuid },
      select: {
        student: true,
      },
    });

    if (content.story.creator_id !== creator.student.id) {
      throw new ForbiddenException(
        'You do not have permission to add episode in this story.',
      );
    }

    await this.prismaService.episode.create({
      data: {
        title: addStoryEpisodeDto.title,
        content: addStoryEpisodeDto.content,
        order: addStoryEpisodeDto.order,
        story_id: content.story.id,
      },
    });
  }

  async findAllStoryByUser(findContentQueryDto: FindContentQueryDto) {
    const { page, limit, category, tag, genre, search, latest } =
      findContentQueryDto;

    const filter = contentFilterByUser({
      category,
      tag,
      genre,
      search,
      latest,
    });

    const story = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'story',
        ...filter,
      },
    });

    const total = await this.prismaService.content.count({
      where: { type: 'story', ...filter },
    });

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

  async findAllStoryByStaff(findContentQueryDto: FindContentQueryDto) {
    const { page, limit, category, tag, genre, search, latest, status } =
      findContentQueryDto;

    const filter = contentFilter({
      category,
      tag,
      genre,
      search,
      latest,
      status,
    });

    const story = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'story',
        ...filter,
      },
      include: {
        category: true,
        story: {
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
      where: { type: 'story', ...filter },
    });

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

    const filterByUser = {
      story: {
        creator: {
          user: { uuid: user.uuid },
        },
      },
    };

    const filter = contentFilter({
      category,
      tag,
      genre,
      search,
      latest,
      status,
    });

    const story = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'story',
        ...filterByUser,
        ...filter,
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

  async getStoryByUuid(contentUuid: string) {
    const content = await this.prismaService.content.findUnique({
      where: { type: 'story', uuid: contentUuid },
    });

    if (!content) {
      throw new NotFoundException(
        'Story not found, please make sure you input correct story',
      );
    }

    return content;
  }

  async getStoryBySlug(slug: string) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { type: 'story', slug },
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
      ...content,
      tag: content.tag.map((tag) => ({
        id: tag.uuid,
        text: tag.name,
      })),
      genre: content.genre.map((genre) => ({
        id: genre.uuid,
        text: genre.name,
      })),
      avg_rating: avg_rating._avg.rating_value,
    };
  }

  async getOneEpisode(slugStory: string, order: number) {
    const content = await this.prismaService.content.findUnique({
      where: {
        type: 'story',
        slug: slugStory,
      },
      include: {
        story: {
          include: {
            episode: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(
        'Story not found, please make sure you input correct story',
      );
    }
    const episode = await this.prismaService.episode.findFirst({
      where: {
        story_id: content.story.id,
        order,
      },
    });

    return episode;
  }

  async getEpisode(slugStory: string, order: number) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: {
        type: 'story',
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
      ...content,
      tag: content.tag.map((tag) => ({
        id: tag.uuid,
        text: tag.name,
      })),
      episode: {
        uuid: content.story.episode[currentEpisodeIndex].uuid,
        title: content.story.episode[currentEpisodeIndex].title,
        content: content.story.episode[currentEpisodeIndex].content,
        order: content.story.episode[currentEpisodeIndex].order,
      },
      next_episode: nextEpisode
        ? {
            uuid: nextEpisode.uuid,
            title: nextEpisode.title,
            order: nextEpisode.order,
          }
        : null,
      prev_episode: prevEpisode
        ? {
            uuid: prevEpisode.uuid,
            title: prevEpisode.title,
            order: prevEpisode.order,
          }
        : null,
      genre: content.genre?.map((genre) => ({
        id: genre.uuid,
        text: genre.name,
      })),
      avg_rating: avg_rating._avg.rating_value,
    };
  }

  async updateStory(
    contentUuid: string,
    creatorUuid: string,
    updateStoryDto: UpdateStoryDto,
  ) {
    const { title, thumbnail, description, tags, category_name, genres } =
      updateStoryDto;

    const content = await this.prismaService.content.findUnique({
      where: { type: 'story', uuid: contentUuid },
      include: {
        story: {
          include: {
            creator: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(
        'Story not found, please make sure you input correct story',
      );
    }
    const category =
      await this.categoryService.findCategoryByName(category_name);

    const creator = await this.userService.findOne(creatorUuid);

    if (content.story.creator.id !== creator.student.id) {
      throw new ForbiddenException(
        'You do not have permission to update this story.',
      );
    }

    const parsedGenres = parseArrayInput(genres);
    const parsedTags = parseArrayInput(tags);

    const imageUrl = await processImage(getRandomImage(), 'story');

    const newSlug = await this.slugHelper.generateUniqueSlug(title);
    await this.prismaService.content.update({
      where: { uuid: contentUuid, type: 'story' },
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
        slug: newSlug,
        category: { connect: { uuid: category.uuid } },
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
  }
  async updateEpisode(
    episodeUuid: string,
    creatorUuid: string,
    updateStoryEpisodeDto: UpdateStoryEpisodeDto,
  ) {
    const episode = await this.prismaService.episode.findUnique({
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

    const creator = await this.userService.findOne(creatorUuid);

    if (episode.story.creator_id !== creator.student.id) {
      throw new ForbiddenException(
        'You do not have permission to update this episode.',
      );
    }

    await this.prismaService.episode.update({
      where: { uuid: episode.uuid },
      data: {
        title: updateStoryEpisodeDto.title,
        content: updateStoryEpisodeDto.content,
        order: updateStoryEpisodeDto.order,
      },
    });
  }

  async deleteStory(storyUuid: string) {
    await this.prismaService.content.delete({
      where: { uuid: storyUuid },
    });
  }

  async deleteEpisode(episodeUuid: string) {
    await this.prismaService.episode.delete({
      where: { uuid: episodeUuid },
    });
  }

  async summaryStoryStudent(userUuid: string) {
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

    const res = await this.prismaService.story.findMany({
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

  async summaryStoryStaff() {
    const res = await this.prismaService.story.findMany({
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
