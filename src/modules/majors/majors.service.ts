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

    const res = await this.prismaService.$transaction(async (prisma) => {
      await prisma.major.create({
        data: { name, avatar, description, image },
      });

      return {
        status: 'success',
        message: 'Majors succesfully added!',
      };
    });

    return res;
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
    return {
      status: 'success',
      data: major,
    };
  }

  async findMajorByUuid(majorUuid: string) {
    const major = await this.prismaService.major.findUnique({
      where: { uuid: majorUuid },
    });

    if (!major) {
      throw new NotFoundException(`Major does not exist.`);
    }
    return {
      status: 'success',
      data: major,
    };
  }

  async updateMajorByUuid(majorUuid: string, updateMajorDto: UpdateMajorDto) {
    const { name, avatar, description, image } = updateMajorDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      const major = await prisma.major.findUniqueOrThrow({
        where: { uuid: majorUuid },
      });

      if (!major) {
        throw new NotFoundException('Major is not found!');
      }

      await prisma.major.update({
        where: { uuid: majorUuid },
        data: {
          name,
          avatar,
          description,
          image,
        },
      });

      return {
        status: 'success',
        message: 'Major succesfully updated!',
      };
    });

    return res;
  }

  async removeMajorByUuid(majorUuid: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      await prisma.major.findUniqueOrThrow({
        where: { uuid: majorUuid },
      });

      await prisma.major.delete({
        where: { uuid: majorUuid },
      });
      return {
        status: 'success',
        message: 'Major successfully deleted!',
      };
    });
    return res;
  }
}
