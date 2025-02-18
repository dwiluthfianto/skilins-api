import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MajorService {
  constructor(private prismaService: PrismaService) {}

  async create(createMajorDto: CreateMajorDto) {
    const { name, avatar, description, image } = createMajorDto;

    await this.prismaService.major.create({
      data: { name, avatar, description, image },
    });
  }

  async findAllMajor(name: string) {
    const filterName = {
      name: {
        contains: name,
        mode: Prisma.QueryMode.insensitive,
      },
    };

    const major = await this.prismaService.major.findMany({
      where: { ...filterName },
    });
    return major;
  }

  async findMajorByUuid(majorUuid: string) {
    const major = await this.prismaService.major.findUnique({
      where: { uuid: majorUuid },
    });

    if (!major) {
      throw new NotFoundException(`Major does not exist.`);
    }
    return major;
  }

  async updateMajorByUuid(majorUuid: string, updateMajorDto: UpdateMajorDto) {
    const { name, avatar, description, image } = updateMajorDto;

    const major = await this.prismaService.major.findUniqueOrThrow({
      where: { uuid: majorUuid },
    });

    if (!major) {
      throw new NotFoundException('Major is not found!');
    }

    await this.prismaService.major.update({
      where: { uuid: majorUuid },
      data: {
        name,
        avatar,
        description,
        image,
      },
    });
  }

  async removeMajorByUuid(majorUuid: string) {
    await this.prismaService.major.findUniqueOrThrow({
      where: { uuid: majorUuid },
    });

    await this.prismaService.major.delete({
      where: { uuid: majorUuid },
    });
  }
}
