import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SlugHelper } from '@utils/generate-unique-slug.util';
import { ContentStatus } from '@prisma/client';
import parseArrayInput from '@utils/parse-array.util';
import { FindBlogQueryDto } from '../contents/dto/find-blog-query.dto';
import { contentFilterByUser } from '@utils/content-filter.util';

@Injectable()
export class BlogService {
  constructor(
    private prismaService: PrismaService,
    private readonly slugHelper: SlugHelper,
  ) {}

  async createBlog(creatorUuid: string, createBlogDto: CreateBlogDto) {
    const { title, thumbnail, description, tags, category_name } =
      createBlogDto;

    await this.prismaService.$transaction(async (prisma) => {
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
    });
  }

  async findAllBlogByUser(findBlogQueryDto: FindBlogQueryDto) {
    const { page, limit, tag, search, latest } = findBlogQueryDto;

    const filter = contentFilterByUser({ tag, search, latest });

    const blogs = await this.prismaService.content.findMany({
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
      where: {
        type: 'blog',
        ...filter,
      },
      include: {
        blog: {
          include: {
            creator: {
              select: {
                full_name: true,
              },
            },
          },
        },
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

    return content;
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

    const contentLatest = await this.prismaService.content.findMany({
      skip: 1,
      take: 5,
      where: {
        type: 'blog',
        created_at: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
      },
      include: {
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
      ...content,
      tag: content.tag.map((tag) => ({
        id: tag.uuid,
        text: tag.name,
      })),
      creator: content.blog.creator.full_name,
      avg_rating,
      latest_blogs: contentLatest,
    };
  }

  async updateBlogByUuid(
    creatorUuid: string,
    contentUuid: string,
    updateBlogDto: UpdateBlogDto,
  ) {
    const { title, thumbnail, description, tags, category_name } =
      updateBlogDto;

    await this.prismaService.$transaction(async (prisma) => {
      const content = await this.prismaService.content.findUnique({
        where: { uuid: contentUuid },
      });

      if (!content) {
        throw new NotFoundException('Content not found');
      }

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
    });
  }

  async removeBlogByUuid(contentUuid: string) {
    await this.prismaService.content.delete({
      where: { uuid: contentUuid },
    });
  }
}
