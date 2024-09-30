import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createTagDto: CreateTagDto) {
    const { avatar_url, name, description } = createTagDto;
    const tag = await this.prisma.tags.create({
      data: { avatar_url, name, description },
    });

    return {
      status: 'success',
      message: 'tags successfully added!',
      data: {
        uuid: tag.uuid,
      },
    };
  }

  async findAll() {
    const tags = await this.prisma.tags.findMany();
    return {
      status: 'success',
      data: tags.map((tag) => ({
        uuid: tag.uuid,
        avatar: tag.avatar_url,
        name: tag.name,
        description: tag.description,
      })),
    };
  }

  async findOne(uuid: string) {
    const tag = await this.prisma.tags.findUnique({ where: { uuid } });
    return {
      status: 'success',
      data: {
        uuid: tag.uuid,
        avatar: tag.avatar_url,
        name: tag.name,
        description: tag.description,
      },
    };
  }

  async update(uuid: string, updateTagDto: UpdateTagDto) {
    const { avatar_url, name, description } = updateTagDto;

    const isExist = await this.prisma.tags.findUnique({ where: { uuid } });

    if (!isExist) {
      throw new NotFoundException(`Tag with uuid ${uuid} does not exist`);
    }

    const tag = await this.prisma.tags.update({
      where: { uuid },
      data: { avatar_url, name, description },
    });

    return {
      status: 'success',
      message: 'tags successfully updated!',
      data: {
        uuid: tag.uuid,
      },
    };
  }

  async remove(uuid: string) {
    const isExist = await this.prisma.tags.findUnique({ where: { uuid } });

    if (!isExist) {
      throw new NotFoundException(`Tag with uuid ${uuid} does not exist`);
    }

    const tag = await this.prisma.tags.delete({ where: { uuid } });

    return {
      status: 'success',
      message: 'tag successfully deleted!',
      data: {
        uuid: tag.uuid,
      },
    };
  }
}