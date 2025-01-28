import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TagService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createTagDto: CreateTagDto) {
    const { avatar, name, description } = createTagDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      await prisma.tag.create({
        data: {
          name,
          avatar:
            avatar ||
            'https://images.unsplash.com/photo-1494537176433-7a3c4ef2046f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          description: description || 'No description available.',
        },
      });

      return {
        status: 'success',
        message: 'tag successfully added!',
      };
    });

    return res;
  }

  async findAll(name: string) {
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
    });
    return {
      status: 'success',
      data: tag,
    };
  }

  async findOneByName(name: string) {
    const tag = await this.prismaService.tag.findUniqueOrThrow({
      where: { name },
    });
    if (!tag) {
      throw new NotFoundException('Tag not found!');
    }
    return {
      status: 'success',
      data: tag,
    };
  }
  async findOneByUuid(uuid: string) {
    const tag = await this.prismaService.tag.findUniqueOrThrow({
      where: { uuid },
    });
    if (!tag) {
      throw new NotFoundException('Tag is not found!');
    }
    return {
      status: 'success',
      data: tag,
    };
  }

  async update(uuid: string, updateTagDto: UpdateTagDto) {
    const { avatar, name, description } = updateTagDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      await prisma.tag.findUniqueOrThrow({ where: { uuid } });

      await prisma.tag.update({
        where: { uuid },
        data: {
          name,
          avatar:
            avatar ||
            'https://images.unsplash.com/photo-1494537176433-7a3c4ef2046f?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
          description: description || 'No description available.',
        },
      });

      return {
        status: 'success',
        message: 'tag successfully updated!',
      };
    });
    return res;
  }

  async remove(uuid: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      await prisma.tag.findUniqueOrThrow({ where: { uuid } });

      await prisma.tag.delete({ where: { uuid } });

      return {
        status: 'success',
        message: 'tag successfully deleted!',
      };
    });

    return res;
  }
}
