import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryService {
  constructor(
    private prismaService: PrismaService,
    private readonly uuidHelper: UuidHelper,
  ) {}

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const { name, avatar, description } = createCategoryDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      await prisma.category.create({
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
        message: 'Category successfully added!',
      };
    });

    return res;
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
    return {
      status: 'success',
      data: category,
    };
  }

  async findCategoryByName(name: string) {
    const category = await this.prismaService.category.findUnique({
      where: { name },
    });

    if (!category) {
      throw new NotFoundException(
        'Category not found, please make sure you input correct category',
      );
    }
    return {
      status: 'success',
      data: category,
    };
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
    return {
      status: 'success',
      data: category,
    };
  }

  async updateCategoryByName(
    nameCategory: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const { name, avatar, description } = updateCategoryDto;

    const res = await this.prismaService.$transaction(async (prisma) => {
      await this.findCategoryByName(nameCategory);
      await prisma.category.update({
        where: {
          name: nameCategory,
        },
        data: {
          name,
          avatar,
          description,
        },
      });

      return {
        status: 'success',
        message: 'Category successfully updated!',
      };
    });

    return res;
  }

  async removeCategoryByName(nameCategory: string) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      await this.findCategoryByName(nameCategory);
      await prisma.category.delete({
        where: { name: nameCategory },
      });

      return {
        status: 'success',
        message: 'Category successfully deleted!',
      };
    });

    return res;
  }
}
