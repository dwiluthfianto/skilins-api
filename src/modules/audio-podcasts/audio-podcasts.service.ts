import { Injectable } from '@nestjs/common';
import { CreateAudioPodcastDto } from './dto/create-audio-podcast.dto';
import { UpdateAudioPodcastDto } from './dto/update-audio-podcast.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { SlugHelper } from 'src/common/helpers/generate-unique-slug';

@Injectable()
export class AudioPodcastsService {
  constructor(
    private prisma: PrismaService,
    private readonly uuidHelper: UuidHelper,
    private readonly slugHelper: SlugHelper,
  ) {}

  async create(createAudioPodcastDto: CreateAudioPodcastDto) {
    const {
      title,
      thumbnail,
      description,
      tags,
      category_name,
      duration,
      file_url,
      creator_uuid,
      genres,
    } = createAudioPodcastDto;

    let parsedGenres;

    if (Array.isArray(genres)) {
      parsedGenres = genres;
    } else if (typeof genres === 'string') {
      try {
        parsedGenres = JSON.parse(genres);
      } catch (error) {
        console.error('Failed to parse genres:', error);
        throw new Error('Invalid JSON format for genres');
      }
    } else {
      parsedGenres = [];
    }

    let parsedTags;
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        console.error('Failed to parse tags:', error);
        throw new Error('Invalid JSON format for tags');
      }
    } else {
      parsedTags = [];
    }
    const newSlug = await this.slugHelper.generateUniqueSlug(title);
    const userData = await this.prisma.users.findUniqueOrThrow({
      where: {
        uuid: creator_uuid,
      },
      include: {
        Students: {
          select: {
            uuid: true,
          },
        },
      },
    });
    const audio = await this.prisma.contents.create({
      data: {
        type: 'AUDIO',
        title,
        thumbnail,
        description,
        Tags: {
          connect: parsedTags?.map((tag) => ({
            name: tag.text,
          })),
        },
        category: { connect: { name: category_name } },
        slug: newSlug,
        AudioPodcasts: {
          create: {
            creator: { connect: { uuid: userData.Students[0].uuid } },
            duration,
            file_url,
          },
        },
        Genres: {
          connect: parsedGenres?.map((genre) => ({
            name: genre.text,
          })),
        },
      },
    });
    return {
      status: 'success',
      message: 'audio successfully uploaded!',
      data: {
        uuid: audio.uuid,
        type: audio.type,
      },
    };
  }

  async findAll(page: number, limit: number) {
    const audios = await this.prisma.contents.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: { type: 'AUDIO' },
      include: {
        category: true,
        Ratings: true,
        Tags: true,
        AudioPodcasts: {
          include: {
            creator: true,
          },
        },
      },
    });

    const total = await this.prisma.audioPodcasts.count();

    const data = await Promise.all(
      audios.map(async (audio) => {
        const avgRatingResult = await this.prisma.ratings.aggregate({
          where: { content_id: audio.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;
        return {
          uuid: audio.uuid,
          thumbnail: audio.thumbnail,
          title: audio.title,
          description: audio.description,
          slug: audio.slug,
          tags: audio.Tags.map((tag) => ({
            id: tag.uuid,
            text: tag.name,
          })),
          created_at: audio.created_at,
          updated_at: audio.updated_at,
          category: audio.category.name,
          creator: audio.AudioPodcasts[0].creator.name,
          duration: audio.AudioPodcasts[0].duration,
          file_url: audio.AudioPodcasts[0].file_url,
          avg_rating,
        };
      }),
    );
    return {
      status: 'success',
      data,
      totalPages: total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
  async findByCategory(page: number, limit: number, category: string) {
    const audios = await this.prisma.contents.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        type: 'AUDIO',
        category: {
          name: {
            equals: category,
            mode: 'insensitive',
          },
        },
      },
      include: {
        category: true,
        Ratings: true,
        Tags: true,
        AudioPodcasts: {
          include: {
            creator: true,
          },
        },
      },
    });

    const total = await this.prisma.audioPodcasts.count();

    const data = await Promise.all(
      audios.map(async (audio) => {
        const avgRatingResult = await this.prisma.ratings.aggregate({
          where: { content_id: audio.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;
        return {
          uuid: audio.uuid,
          thumbnail: audio.thumbnail,
          title: audio.title,
          description: audio.description,
          slug: audio.slug,
          tags: audio.Tags.map((tag) => ({
            id: tag.uuid,
            text: tag.name,
          })),
          created_at: audio.created_at,
          updated_at: audio.updated_at,
          category: audio.category.name,
          creator: audio.AudioPodcasts[0].creator.name,
          duration: audio.AudioPodcasts[0].duration,
          file_url: audio.AudioPodcasts[0].file_url,
          avg_rating,
        };
      }),
    );
    return {
      status: 'success',
      data,
      totalPages: total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
  async findByTag(page: number, limit: number, genre: string) {
    const audios = await this.prisma.contents.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        type: 'AUDIO',
        Genres: {
          some: {
            name: {
              equals: genre,
              mode: 'insensitive',
            },
          },
        },
      },
      include: {
        category: true,
        Ratings: true,
        Tags: true,
        AudioPodcasts: {
          include: {
            creator: true,
          },
        },
      },
    });

    const total = await this.prisma.audioPodcasts.count();

    const data = await Promise.all(
      audios.map(async (audio) => {
        const avgRatingResult = await this.prisma.ratings.aggregate({
          where: { content_id: audio.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;
        return {
          uuid: audio.uuid,
          thumbnail: audio.thumbnail,
          title: audio.title,
          description: audio.description,
          slug: audio.slug,
          tags: audio.Tags.map((tag) => ({
            id: tag.uuid,
            text: tag.name,
          })),
          created_at: audio.created_at,
          updated_at: audio.updated_at,
          category: audio.category.name,
          creator: audio.AudioPodcasts[0].creator.name,
          duration: audio.AudioPodcasts[0].duration,
          file_url: audio.AudioPodcasts[0].file_url,
          avg_rating,
        };
      }),
    );
    return {
      status: 'success',
      data,
      totalPages: total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
  async findLatest(page: number, limit: number, week: number) {
    const currentDate = new Date();
    const oneWeekAgo = new Date();
    const weeks = week * 7;

    oneWeekAgo.setDate(currentDate.getDate() - weeks);
    const audios = await this.prisma.contents.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        type: 'AUDIO',
        created_at: {
          gte: oneWeekAgo,
          lte: currentDate,
        },
      },
      include: {
        category: true,
        Tags: true,
        Ratings: true,
        AudioPodcasts: {
          include: {
            creator: true,
          },
        },
      },
    });

    const total = await this.prisma.audioPodcasts.count();

    const data = await Promise.all(
      audios.map(async (audio) => {
        const avgRatingResult = await this.prisma.ratings.aggregate({
          where: { content_id: audio.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;
        return {
          uuid: audio.uuid,
          thumbnail: audio.thumbnail,
          title: audio.title,
          description: audio.description,
          slug: audio.slug,
          tags: audio.Tags.map((tag) => ({
            id: tag.uuid,
            text: tag.name,
          })),
          created_at: audio.created_at,
          updated_at: audio.updated_at,
          category: audio.category.name,
          creator: audio.AudioPodcasts[0].creator.name,
          duration: audio.AudioPodcasts[0].duration,
          file_url: audio.AudioPodcasts[0].file_url,
          avg_rating,
        };
      }),
    );
    return {
      status: 'success',
      data,
      totalPages: total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(uuid: string) {
    const audio = await this.prisma.contents.findUniqueOrThrow({
      where: { uuid },
      include: {
        category: true,
        Genres: true,
        Ratings: true,
        Tags: true,
        Comments: {
          include: {
            user: {
              select: {
                uuid: true,
                full_name: true,
                profile_url: true,
              },
            },
          },
        },
        AudioPodcasts: {
          include: {
            creator: true,
          },
        },
      },
    });

    const avg_rating = await this.prisma.ratings.aggregate({
      where: { content_id: audio.id },
      _avg: {
        rating_value: true,
      },
    });

    return {
      status: 'success',
      data: {
        uuid: audio.uuid,
        thumbnail: audio.thumbnail,
        title: audio.title,
        description: audio.description,
        slug: audio.slug,
        tags: audio.Tags.map((tag) => ({
          id: tag.uuid,
          text: tag.name,
        })),
        created_at: audio.created_at,
        updated_at: audio.updated_at,
        category: audio.category.name,
        creator: audio.AudioPodcasts[0].creator.name,
        duration: audio.AudioPodcasts[0].duration,
        file_url: audio.AudioPodcasts[0].file_url,
        genres: audio.Genres?.map((genre) => ({
          id: genre.uuid,
          text: genre.name,
        })),
        comments: audio.Comments.map((comment) => ({
          uuid: comment.uuid,
          subject: comment.comment_content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          commented_by_uuid: comment.user.uuid,
          commented_by: comment.user.full_name,
          profile: comment.user.profile_url,
        })),
        avg_rating,
      },
    };
  }

  async findOneBySlug(slug: string) {
    const audio = await this.prisma.contents.findUniqueOrThrow({
      where: { slug },
      include: {
        category: true,
        Genres: true,
        Ratings: true,
        Tags: true,
        Comments: {
          include: {
            user: {
              select: {
                uuid: true,
                full_name: true,
                profile_url: true,
              },
            },
          },
        },
        AudioPodcasts: {
          include: {
            creator: true,
          },
        },
      },
    });

    const avg_rating = await this.prisma.ratings.aggregate({
      where: { content_id: audio.id },
      _avg: {
        rating_value: true,
      },
    });

    return {
      status: 'success',
      data: {
        uuid: audio.uuid,
        thumbnail: audio.thumbnail,
        title: audio.title,
        description: audio.description,
        slug: audio.slug,
        tags: audio.Tags.map((tag) => ({
          id: tag.uuid,
          text: tag.name,
        })),
        created_at: audio.created_at,
        updated_at: audio.updated_at,
        category: audio.category.name,
        creator: audio.AudioPodcasts[0].creator.name,
        duration: audio.AudioPodcasts[0].duration,
        file_url: audio.AudioPodcasts[0].file_url,
        genres: audio.Genres?.map((genre) => ({
          id: genre.uuid,
          text: genre.name,
        })),
        comments: audio.Comments.map((comment) => ({
          uuid: comment.uuid,
          subject: comment.comment_content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          commented_by_uuid: comment.user.uuid,
          commented_by: comment.user.full_name,
          profile: comment.user.profile_url,
        })),
        avg_rating,
      },
    };
  }

  async update(uuid: string, updateAudioPodcastDto: UpdateAudioPodcastDto) {
    const {
      title,
      thumbnail,
      description,
      tags,
      category_name,
      duration,
      file_url,
      genres,
    } = updateAudioPodcastDto;

    const content = await this.uuidHelper.validateUuidContent(uuid);
    const category = await this.uuidHelper.validateUuidCategory(category_name);

    let parsedGenres;

    if (Array.isArray(genres)) {
      parsedGenres = genres;
    } else if (typeof genres === 'string') {
      try {
        parsedGenres = JSON.parse(genres);
      } catch (error) {
        console.error('Failed to parse genres:', error);
        throw new Error('Invalid JSON format for genres');
      }
    } else {
      parsedGenres = [];
    }

    let parsedTags;
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch (error) {
        console.error('Failed to parse tags:', error);
        throw new Error('Invalid JSON format for tags');
      }
    } else {
      parsedTags = [];
    }

    const slug = await this.slugHelper.generateUniqueSlug(title);

    const audio = await this.prisma.contents.update({
      where: { uuid: uuid, type: 'AUDIO' },
      data: {
        title,
        thumbnail,
        description,
        Tags: {
          connect: parsedTags?.map((tag) => ({
            name: tag.text,
          })),
        },
        slug,
        category: { connect: { uuid: category.uuid } },
        AudioPodcasts: {
          update: {
            where: { content_id: content.id },
            data: {
              duration: duration || 0,
              file_url,
            },
          },
        },
        Genres: {
          connect: parsedGenres?.map((genre) => ({
            name: genre.text,
          })),
        },
      },
    });
    return {
      status: 'success',
      message: 'audio successfully updated!',
      data: {
        uuid: audio.uuid,
      },
    };
  }

  async remove(uuid: string) {
    await this.uuidHelper.validateUuidContent(uuid);

    const audio = await this.prisma.contents.delete({
      where: { uuid: uuid },
    });
    return {
      status: 'success',
      message: 'audio successfully deleted!',
      data: {
        uuid: audio.uuid,
      },
    };
  }
}
