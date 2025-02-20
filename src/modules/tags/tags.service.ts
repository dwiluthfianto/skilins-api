import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { FindTagDto } from './dto/find-tag.dto';
@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createTagDto: CreateTagDto) {
    const { avatar, name, description } = createTagDto;

    await this.prismaService.tag.create({
      data: {
        name,
        avatar,
        description: description || 'No description available.',
      },
    });
  }

  async findAll(query: FindTagDto) {
    const { page, limit, name } = query;

    const filterName = {
      name: {
        contains: name,

        mode: Prisma.QueryMode.insensitive,
      },
    };

    const tag = await this.prismaService.tag.findMany({
      where: {
        ...filterName,
      },
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    const total = await this.prismaService.tag.count({
      where: {
        ...filterName,
      },
    });

    return {
      data: tag,
      pagination: {
        page,
        limit,
        total,
        last_page: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async findOneByName(name: string) {
    const decodedName = decodeURIComponent(name);
    const tag = await this.prismaService.tag.findFirst({
      where: {
        name: { equals: decodedName, mode: Prisma.QueryMode.insensitive },
      },
    });
    if (!tag) {
      throw new NotFoundException('Tag not found!');
    }
    return tag;
  }
  async findOneByUuid(uuid: string) {
    const tag = await this.prismaService.tag.findUniqueOrThrow({
      where: { uuid },
    });
    if (!tag) {
      throw new NotFoundException('Tag is not found!');
    }
    return tag;
  }

  async updateTag(uuid: string, updateTagDto: UpdateTagDto) {
    const { avatar, name, description } = updateTagDto;

    const tag = await this.prismaService.tag.findUnique({ where: { uuid } });

    if (!tag) {
      throw new NotFoundException('Tag is not found!');
    }

    await this.prismaService.tag.update({
      where: { uuid },
      data: {
        name,
        avatar,
        description: description || 'No description available.',
      },
    });
  }

  async removeTag(uuid: string) {
    const tag = await this.prismaService.tag.findUnique({ where: { uuid } });

    if (!tag) {
      throw new NotFoundException('Tag is not found!');
    }

    await this.prismaService.tag.delete({ where: { uuid } });
  }
}
