import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UuidHelper {
  constructor(private readonly prisma: PrismaService) {}

  async validateUuidContent(uuid: string) {
    const content = await this.prisma.content.findUnique({
      where: { uuid },
      select: { id: true, uuid: true },
    });

    if (!content) {
      throw new NotFoundException(
        'Content not found, please make sure you input correct content',
      );
    }
    return content;
  }

  async validateUuidCategory(name: string) {
    const category = await this.prisma.category.findUnique({
      where: { name },
      select: { id: true, uuid: true },
    });

    if (!category) {
      throw new NotFoundException(
        'Category not found, please make sure you input correct category',
      );
    }
    return category;
  }

  async validateUuidCreator(uuid: string) {
    const creator = await this.prisma.user.findUnique({
      where: { uuid },
      select: {
        id: true,
        uuid: true,
        student: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!creator) {
      throw new NotFoundException(
        'Creator not found, please make sure you input correct creator',
      );
    }
    return creator;
  }
}
