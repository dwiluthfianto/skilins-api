import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { SlugHelper } from 'src/common/helpers/generate-unique-slug';
import { ContentStatus, Prisma } from '@prisma/client';
import parseArrayInput from 'src/common/utils/parse-array';
import { subMonths } from 'date-fns';
import { FindBlogQueryDto } from '../contents/dto/find-blog-query.dto';

@Injectable()
export class BlogService {
  constructor(
    private prismaService: PrismaService,
    private readonly uuidHelper: UuidHelper,
    private readonly slugHelper: SlugHelper,
  ) {}

  async createBlog(creatorUuid: string, createBlogDto: CreateBlogDto) {
    const { title, thumbnail, description, tags, category_name } =
      createBlogDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      const parsedTags = parseArrayInput(tags);

      const newSlug = await this.slugHelper.generateUniqueSlug(title);
      const userData = await prisma.user.findUnique({
        where: {
          uuid: creatorUuid,
        },
      });

      if (!userData) {
        throw new NotFoundException(
          'User not found, please make sure you input correct user',
        );
      }
      await prisma.content.create({
        data: {
          type: 'blog',
          title,
          thumbnail,
          description,
          status: ContentStatus.approved,
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
          category: {
            connect: {
              name: category_name,
            },
          },
          blog: {
            create: {
              creator: { connect: { uuid: creatorUuid } },
            },
          },
        },
      });

      return {
        status: 'success',
        message: 'Blog successfully uploaded!',
      };
    });

    return res;
  }

  async findAllBlog(findBlogQueryDto: FindBlogQueryDto) {
    const { page, limit, tag, search, status, latest } = findBlogQueryDto;

    const currentDate = new Date();

    const twoMonthsAgo = subMonths(currentDate, 2);

    const latestFilter = latest
      ? {
          status: ContentStatus.approved,
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
      ...tagFilter,
    };

    const blogs = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'blog',
        ...filter,
      },
      include: {
        rating: true,
      },
    });

    const total = await this.prismaService.content.count({
      where: { type: 'blog', ...filter },
    });

    const data = await Promise.all(
      blogs.map(async (blog) => {
        const avgRatingResult = await this.prismaService.rating.aggregate({
          where: { content_id: blog.id },
          _avg: {
            rating_value: true,
          },
        });
        const avg_rating = avgRatingResult._avg.rating_value || 0;

        return {
          ...blog,
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

  async findBlogByUuid(contentUuid: string) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { type: 'blog', uuid: contentUuid },
      include: {
        blog: {
          include: {
            creator: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException(
        'Blog not found, please make sure you input correct blog',
      );
    }

    return {
      status: 'success',
      data: content,
    };
  }

  async findBlogBySlug(slug: string) {
    const content = await this.prismaService.content.findUniqueOrThrow({
      where: { type: 'blog', slug },
      include: {
        tag: true,
        category: true,
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
        rating: true,
        blog: {
          include: {
            creator: true,
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
        creator: content.blog.creator.full_name,
        ratings: content.rating.map((rating) => ({
          ...rating,
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

  async updateBlogByUuid(
    creatorUuid: string,
    contentUuid: string,
    updateBlogDto: UpdateBlogDto,
  ) {
    const { title, thumbnail, description, tags, category_name } =
      updateBlogDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      const content = await this.uuidHelper.validateUuidContent(contentUuid);

      const parsedTags = parseArrayInput(tags);
      const newSlug = await this.slugHelper.generateUniqueSlug(title);

      await prisma.content.update({
        where: {
          uuid: content.uuid,
          type: 'blog',
        },
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
          category: {
            connect: {
              name: category_name,
            },
          },
          blog: {
            update: {
              where: { content_id: content.id },
              data: {
                creator: { connect: { uuid: creatorUuid } },
              },
            },
          },
        },
      });

      return {
        status: 'success',
        message: 'Blog updated successfully',
      };
    });
    return res;
  }

  async removeBlogByUuid(contentUuid: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      await this.uuidHelper.validateUuidContent(contentUuid);

      await prisma.content.delete({
        where: { uuid: contentUuid },
      });
      return {
        status: 'success',
        message: 'Audio successfully deleted!',
      };
    });

    return res;
  }
}
