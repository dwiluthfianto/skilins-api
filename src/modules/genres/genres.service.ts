import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GenreService {
  constructor(private readonly prismaService: PrismaService) {}
  async createGenre(createGenreDto: CreateGenreDto) {
    const { avatar, name, description } = createGenreDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      await prisma.genre.create({
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
        message: 'Genre successfully added!',
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

    const genre = await this.prismaService.genre.findMany({
      where: {
        ...filterName,
      },
    });

    return {
      status: 'success',
      data: genre,
    };
  }

  async findGenreByName(name: string) {
    const genre = await this.prismaService.genre.findUnique({
      where: { name },
    });

    if (!genre) {
      throw new NotFoundException(
        'Genre not found, please make sure you input correct genre',
      );
    }

    return {
      status: 'success',
      data: genre,
    };
  }
  async findGenreByUuid(genreUuid: string) {
    const genre = await this.prismaService.genre.findUniqueOrThrow({
      where: { uuid: genreUuid },
    });

    if (!genre) {
      throw new NotFoundException(
        'Genre not found, please make sure you input correct genre',
      );
    }

    return {
      status: 'success',
      data: genre,
    };
  }

  async updateGenreByUuid(genreUuid: string, updateGenreDto: UpdateGenreDto) {
    const { avatar, name, description } = updateGenreDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      await this.findGenreByUuid(genreUuid);

      await prisma.genre.update({
        where: { uuid: genreUuid },
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
        message: 'Genre successfully updated!',
      };
    });

    return res;
  }

  async removeGenreByUuid(genreUuid: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      await this.findGenreByUuid(genreUuid);

      await prisma.genre.delete({
        where: { uuid: genreUuid },
      });

      return {
        status: 'success',
        message: 'Genre successfully deleted!',
      };
    });

    return res;
  }
}
