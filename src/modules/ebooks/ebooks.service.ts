import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { SlugHelper } from 'src/common/helpers/generate-unique-slug';
import { ContentStatus, Prisma } from '@prisma/client';
import parseArrayInput from 'src/common/utils/parse-array';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import {
  contentFilter,
  contentFilterByUser,
} from 'src/common/utils/filter/content-filter';

@Injectable()
export class EbookService {
  constructor(
    private readonly logger: Logger,
    private prismaService: PrismaService,
    private readonly uuidHelper: UuidHelper,
    private readonly slugHelper: SlugHelper,
  ) {
    this.logger = new Logger('Ebook Logger');
  }

  async create(createContentDto: CreateEbookDto) {
    const {
      title,
      thumbnail,
      description,
      tags,
      category_name,
      author,
      pages,
      publication,
      file,
      isbn,
      release_date,
      genres,
    } = createContentDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      const parsedGenres = parseArrayInput(genres);
      const parsedTags = parseArrayInput(tags);
      const newSlug = await this.slugHelper.generateUniqueSlug(title);

      const fileAttachment = await prisma.fileAttachment.create({
        data: {
          file: file,
          type: 'ebook',
        },
      });

      if (!fileAttachment && !thumbnail) {
        this.logger.error('Please provide the thumbnail and file ebook!');
        throw new BadRequestException(
          'Please provide the thumbnail and file ebook!',
        );
      }

      const category = await prisma.category.findFirst({
        where: {
          name: {
            equals: category_name,
            mode: 'insensitive',
          },
        },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }

      await prisma.content.create({
        data: {
          type: 'ebook',
          title,
          thumbnail,
          description,
          status: ContentStatus.approved,
          slug: newSlug,
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
          ebook: {
            create: {
              author: author,
              pages: pages,
              publication: publication,
              file_id: fileAttachment.id,
              isbn: isbn,
              release_date: release_date,
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
        message: 'Ebook successfully uploaded!',
      };
    });

    return res;
  }

  async findAllEbookByUser(findContentQueryDto: FindContentQueryDto) {
    const { page, limit, category, tag, genre, search, latest } =
      findContentQueryDto;

    const filter = contentFilterByUser({
      category,
      tag,
      genre,
      search,
      latest,
    });

    const content = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'ebook',
        status: {
          equals: ContentStatus.approved,
        },
        ...filter,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        ebook: {
          include: {
            file_attachment: {
              select: {
                file: true,
              },
            },
          },
        },
      },
    });

    const total = await this.prismaService.content.count({
      where: { type: 'ebook', ...filter },
    });

    const data = await Promise.all(
      content.map(async (content) => {
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

  async findEbookByUuid(contentUuid: string) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { type: 'ebook', uuid: contentUuid },
      include: {
        ebook: {
          include: {
            file_attachment: true,
          },
        },
      },
    });

    return {
      status: 'success',
      data: content,
    };
  }
  async findEbookBySlug(slug: string) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { type: 'ebook', slug },
      include: {
        category: true,
        genre: true,
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
        rating: true,
        ebook: {
          include: {
            file_attachment: true,
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
        author: content.ebook.author,
        pages: content.ebook.pages,
        publication: content.ebook.publication,
        file: content.ebook.file_attachment.file,
        isbn: content.ebook.isbn,
        release_date: content.ebook.release_date,
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

  async updateEbookByUuid(
    contentUuid: string,
    updateContentDto: UpdateEbookDto,
  ) {
    const {
      title,
      thumbnail,
      description,
      tags,
      category_name,
      author,
      pages,
      publication,
      file,
      isbn,
      release_date,
      genres,
    } = updateContentDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      const content = await prisma.content.findUnique({
        where: {
          uuid: contentUuid,
        },
        select: {
          id: true,
          uuid: true,
          ebook: {
            select: {
              uuid: true,
              file_id: true,
            },
          },
        },
      });

      if (!content) {
        throw new NotFoundException(
          'Content not found, please make sure you input correct content',
        );
      }
      const category =
        await this.uuidHelper.validateUuidCategory(category_name);

      const parsedGenres = parseArrayInput(genres);
      const parsedTags = parseArrayInput(tags);

      const newSlug = await this.slugHelper.generateUniqueSlug(title);

      await prisma.fileAttachment.update({
        where: {
          id: content.ebook.file_id,
        },
        data: {
          file: file,
          type: 'ebook',
        },
      });

      await prisma.content.update({
        where: { uuid: contentUuid, type: 'ebook' },
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
          ebook: {
            update: {
              where: { content_id: content.id },
              data: {
                author,
                pages,
                publication,
                isbn,
                release_date,
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
        message: 'Ebook successfully updated!',
      };
    });

    return res;
  }

  async removeEbookByUuid(contentUuid: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      await this.uuidHelper.validateUuidContent(contentUuid);

      await prisma.content.delete({
        where: { uuid: contentUuid },
      });
      return {
        status: 'success',
        message: 'Ebook successfully deleted!',
      };
    });

    return res;
  }
}
