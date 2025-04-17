import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAudioPodcastDto } from './dto/create-audio-podcast.dto';
import { UpdateAudioPodcastDto } from './dto/update-audio-podcast.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SlugHelper } from '@utils/generate-unique-slug.util';
import parseArrayInput from '@utils/parse-array.util';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { contentFilter, contentFilterByUser } from '@utils/content-filter.util';
import { processImage, getRandomImage } from '@utils/process-image.util';
@Injectable()
export class AudioPodcastService {
  constructor(
    private prismaService: PrismaService,
    private readonly slugHelper: SlugHelper,
  ) {}

  async createAudioPodcast(creatorUuid: string, data: CreateAudioPodcastDto) {
    const {
      title,
      thumbnail,
      description,
      tags,
      category_name,
      duration,
      file,
      genres,
    } = data;

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
          'student not found, please make sure you input correct student',
        );
      }

      const fileAttachment = await prisma.fileAttachment.create({
        data: {
          file: file,
          type: 'audio',
        },
      });

      if (!fileAttachment && !thumbnail) {
        throw new BadRequestException(
          'Please provide the thumbnail and file audio!',
        );
      }

      const imageUrl = await processImage(getRandomImage(), 'audio');

      const newContent = await prisma.content.create({
        data: {
          type: 'audio',
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
          audio_podcast: {
            create: {
              creator_id: userData.student.id,
              duration,
              file_id: fileAttachment.id,
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

  async findAllAudioByUser(findContentQueryDto: FindContentQueryDto) {
    const { page, limit, category, tag, genre, search, latest } =
      findContentQueryDto;

    const filter = contentFilterByUser({
      search,
      latest,
      tag,
      genre,
      category,
    });

    const audios = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'audio',
        ...filter,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        rating: true,
      },
    });

    const total = await this.prismaService.content.count({
      where: { type: 'audio', ...filter },
    });

    const data = await Promise.all(
      audios.map(async (audio) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: audio.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;

        return {
          ...audio,
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

  async findAllAudioByStaff(findContentQueryDto: FindContentQueryDto) {
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

    const audios = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'audio',
        ...filter,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        audio_podcast: {
          include: {
            file_attachment: {
              select: {
                file: true,
              },
            },
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
      where: { type: 'audio', ...filter },
    });

    const data = await Promise.all(
      audios.map(async (audio) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: audio.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;

        return {
          ...audio,
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

  async fetchUserAudios(
    userUuid: string,
    findContentQueryDto: FindContentQueryDto,
  ) {
    const { page, limit, category, tag, genre, search, status, latest } =
      findContentQueryDto;

    const user = await this.prismaService.user.findUnique({
      where: { uuid: userUuid },
      include: {
        student: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'student not found, please make sure you input correct student',
      );
    }

    const filterByUser = {
      audio_podcast: {
        creator_id: user.student.id,
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

    const audios = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'audio',
        ...filterByUser,
        ...filter,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        rating: true,
      },
    });

    const total = await this.prismaService.content.count({
      where: {
        type: 'audio',
        ...filter,
      },
    });

    const data = await Promise.all(
      audios.map(async (audio) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: audio.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;

        return {
          ...audio,
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

  async findAudioByUuid(contentUuid: string) {
    const audio = await this.prismaService.content.findUnique({
      where: { uuid: contentUuid },
      include: {
        audio_podcast: {
          include: {
            file_attachment: true,
          },
        },
      },
    });

    if (!audio) {
      throw new NotFoundException(
        'Audio not found, please make sure you input correct audio',
      );
    }

    return audio;
  }

  async findAudioBySlug(slug: string) {
    const audio = await this.prismaService.content.findUnique({
      where: { slug },
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
        audio_podcast: {
          include: {
            creator: true,
            file_attachment: true,
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

    if (!audio) {
      throw new NotFoundException(
        'Audio not found, please make sure you input correct audio',
      );
    }

    const avg_rating = await this.prismaService.rating.aggregate({
      where: { content_id: audio.id },
      _avg: {
        rating_value: true,
      },
    });

    return {
      ...audio,
      tag: audio.tag.map((tag) => ({
        id: tag.uuid,
        text: tag.name,
      })),
      genre: audio.genre?.map((genre) => ({
        id: genre.uuid,
        text: genre.name,
      })),
      avg_rating: avg_rating._avg.rating_value,
    };
  }

  async updateAudioByUuid(
    contentUuid: string,
    creatorUuid: string,
    updateAudioPodcastDto: UpdateAudioPodcastDto,
  ) {
    const {
      title,
      thumbnail,
      description,
      tags,
      category_name,
      duration,
      genres,
      file,
    } = updateAudioPodcastDto;

    const imageUrl = await processImage(getRandomImage(), 'audio');

    await this.prismaService.$transaction(async (prisma) => {
      const content = await prisma.content.findUnique({
        where: {
          uuid: contentUuid,
        },
        select: {
          id: true,
          uuid: true,
          audio_podcast: {
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
          'Audio not found, please make sure you input correct audio',
        );
      }
      const category = await this.prismaService.category.findUnique({
        where: { uuid: category_name },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      const creator = await this.prismaService.user.findUnique({
        where: { uuid: creatorUuid },
        include: {
          student: true,
        },
      });

      if (creator.student.id !== content.audio_podcast.creator_id) {
        throw new UnauthorizedException(
          `You don't have any permission to update this audio`,
        );
      }

      const parsedGenres = parseArrayInput(genres);
      const parsedTags = parseArrayInput(tags);

      const slug = await this.slugHelper.generateUniqueSlug(title);

      await prisma.fileAttachment.update({
        where: {
          id: content.audio_podcast.file_id,
        },
        data: {
          file: file,
          type: 'audio',
        },
      });

      await prisma.content.update({
        where: { uuid: content.uuid, type: 'audio' },
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
          slug,
          category: { connect: { uuid: category.uuid } },
          audio_podcast: {
            update: {
              where: {
                content_id: content.id,
                creator_id: creator.student.id,
              },
              data: {
                duration: duration,
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

  async removeAudioByUuid(contentUuid: string) {
    await this.prismaService.content.delete({
      where: { uuid: contentUuid },
    });
  }

  async summaryAudioStudent(userUuid: string) {
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
        creator_id: user.student.id,
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

  async summaryAudioStaff() {
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
    return counter;
  }
}
