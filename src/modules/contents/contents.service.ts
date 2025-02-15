import { Injectable } from '@nestjs/common';
import { UuidHelper } from 'src/common/helpers/uuid.helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly uuidHelper: UuidHelper,
  ) {}

  async updateContentStatus(uuid: string, status: ContentStatus) {
    const res = await this.prismaService.$transaction(async (prisma) => {
      const content = await this.uuidHelper.validateUuidContent(uuid);

      await prisma.content.update({
        where: { id: content.id },
        data: {
          status: status,
        },
      });

      return {
        status: 'success',
        message: `Content status updated to ${status}`,
        data: {
          uuid,
          status: status,
        },
      };
    });

    return res;
  }

  async searchContents(query: string) {
    const contents = await this.prismaService.content.findMany({
      where: {
        status: ContentStatus.approved,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { tag: { some: { name: { contains: query, mode: 'insensitive' } } } },
          {
            genre: { some: { name: { contains: query, mode: 'insensitive' } } },
          },
          {
            audio_podcast: {
              creator: { name: { contains: query, mode: 'insensitive' } },
            },
          },
          {
            video_podcast: {
              creator: { name: { contains: query, mode: 'insensitive' } },
            },
          },
          {
            prakerin: {
              creator: { name: { contains: query, mode: 'insensitive' } },
            },
          },
          { ebook: { author: { contains: query, mode: 'insensitive' } } },
          {
            story: {
              creator: { name: { contains: query, mode: 'insensitive' } },
            },
          },
        ],
      },
    });

    const tags = await this.prismaService.tag.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
    });

    const genres = await this.prismaService.genre.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
    });

    const majors = await this.prismaService.major.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
    });

    return {
      contents,
      tags,
      genres,
      majors,
    };
  }
}
