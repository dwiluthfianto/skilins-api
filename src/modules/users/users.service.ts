import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleUserDto } from './dto/role-user.dto';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findOne(uuid: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { uuid },
      include: { role: true, student: true, judge: true },
    });

    return {
      uuid: user.uuid,
      profile: user.profile,
      email: user.email,
      full_name: user.full_name,
      email_verified: user.email_verified,
      role: user.role.name,
      student: user.student,
      judge: user.judge,
    };
  }
  async removeUser(uuid: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { uuid },
    });

    await this.prismaService.user.delete({
      where: { uuid: user.uuid },
    });

    return {
      status: 'success',
      message: 'Account removed successfully!',
    };
  }

  async assignRoleToUser(roleUser: RoleUserDto) {
    return await this.prismaService.user.update({
      where: { uuid: roleUser.uuid },
      data: { role: { connect: { name: roleUser.role } } },
    });
  }

  async findAll() {
    return await this.prismaService.user.findMany({
      include: { role: true },
    });
  }

  async updateRefreshToken(uuid: string, refreshToken: string) {
    const hashedToken = crypto
      .createHmac('sha256', process.env.AUTH_REFRESH_SECRET)
      .update(refreshToken)
      .digest('hex');

    await this.prismaService.user.update({
      where: { uuid },
      data: {
        refresh_token: hashedToken,
      },
    });
  }

  async clearRefreshToken(uuid: string): Promise<void> {
    await this.prismaService.user.update({
      where: { uuid },
      data: {
        refresh_token: null,
      },
    });
  }

  async updateProfile(uuid: string, profile: string): Promise<void> {
    await this.prismaService.user.update({
      where: { uuid },
      data: {
        profile: profile,
      },
    });
  }
}
