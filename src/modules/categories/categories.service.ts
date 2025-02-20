import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const { name, avatar, description } = createCategoryDto;

    await this.prismaService.category.create({
      data: {
        name,
        avatar: avatar,
        description: description,
      },
    });
  }

  async findAllCategory(name: string) {
    const filterByName = name
      ? {
          name: {
            contains: name,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    const category = await this.prismaService.category.findMany({
      where: {
        ...filterByName,
      },
    });
    return category;
  }

  async findCategoryByName(name: string) {
    const category = await this.prismaService.category.findFirst({
      where: { name: { equals: name, mode: Prisma.QueryMode.insensitive } },
    });

    if (!category) {
      throw new NotFoundException(
        'Category not found, please make sure you input correct category',
      );
    }
    return category;
  }

  async findCategoryByUuid(categoryUuid: string) {
    const category = await this.prismaService.category.findUnique({
      where: { uuid: categoryUuid },
    });
    if (!category) {
      throw new NotFoundException(
        'Category not found, please make sure you input correct category',
      );
    }
    return category;
  }

  async updateCategoryByName(
    nameCategory: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const { name, avatar, description } = updateCategoryDto;

    await this.prismaService.category.update({
      where: {
        name: nameCategory,
      },
      data: {
        name,
        avatar,
        description,
      },
    });
  }

  async removeCategoryByName(nameCategory: string) {
    await this.prismaService.category.delete({
      where: { name: nameCategory },
    });
  }
}
