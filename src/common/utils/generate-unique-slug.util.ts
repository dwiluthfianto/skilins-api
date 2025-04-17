import { Injectable } from '@nestjs/common';
import slugify from 'slugify';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SlugHelper {
  constructor(private readonly prisma: PrismaService) {}

  async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    let slug = baseSlug;
    let counter = 1;

    // Cek apakah slug sudah ada di database
    let existingContent = await this.prisma.content.findUnique({
      where: { slug },
    });

    // Jika sudah ada, tambahkan angka hingga slug menjadi unik
    while (existingContent) {
      slug = `${baseSlug}-${counter}`;
      existingContent = await this.prisma.content.findUnique({
        where: { slug },
      });
      counter++;
    }

    return slug;
  }
  async generateUniqueSlugCompe(title: string): Promise<string> {
    const baseSlug = slugify(title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
    let slug = baseSlug;
    let counter = 1;

    // Cek apakah slug sudah ada di database
    let existingContent = await this.prisma.competition.findUnique({
      where: { slug },
    });

    // Jika sudah ada, tambahkan angka hingga slug menjadi unik
    while (existingContent) {
      slug = `${baseSlug}-${counter}`;
      existingContent = await this.prisma.competition.findUnique({
        where: { slug },
      });
      counter++;
    }

    return slug;
  }
}
