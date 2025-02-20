import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { FindGenreDto } from './dto/find-genre.dto';
@Injectable()
export class GenreService {
  constructor(private readonly prismaService: PrismaService) {}
  async createGenre(createGenreDto: CreateGenreDto) {
    const { avatar, name, description } = createGenreDto;

    await this.prismaService.genre.create({
      data: {
        name,
        avatar,
        description: description || 'No description available.',
      },
    });
  }

  async findAllGenre(query: FindGenreDto) {
    const { page, limit, name } = query;

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
      ...(page && limit ? { skip: (page - 1) * limit, take: limit } : {}),
    });

    const total = await this.prismaService.genre.count({
      where: {
        ...filterName,
      },
    });

    return {
      data: genre,
      pagination: {
        page,
        limit,
        total,
        last_page: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async findGenreByName(name: string) {
    const decodedName = decodeURIComponent(name);
    const genre = await this.prismaService.genre.findFirst({
      where: {
        name: { equals: decodedName, mode: Prisma.QueryMode.insensitive },
      },
    });

    if (!genre) {
      throw new NotFoundException(
        'Genre not found, please make sure you input correct genre',
      );
    }

    return genre;
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

    return genre;
  }

  async updateGenreByUuid(genreUuid: string, updateGenreDto: UpdateGenreDto) {
    const { avatar, name, description } = updateGenreDto;

    await this.findGenreByUuid(genreUuid);

    await this.prismaService.genre.update({
      where: { uuid: genreUuid },
      data: {
        name,
        avatar,
        description: description || 'No description available.',
      },
    });
  }

  async removeGenreByUuid(genreUuid: string) {
    await this.findGenreByUuid(genreUuid);

    await this.prismaService.genre.delete({
      where: { uuid: genreUuid },
    });
  }
}
