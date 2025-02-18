import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(private readonly prismaService: PrismaService) {}

  async updateContentStatus(uuid: string, status: ContentStatus) {
    const content = await this.prismaService.content.findUnique({
      where: { uuid },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    await this.prismaService.content.update({
      where: { id: content.id },
      data: {
        status: status,
      },
    });
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
