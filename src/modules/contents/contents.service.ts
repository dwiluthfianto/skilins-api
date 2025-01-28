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
}
