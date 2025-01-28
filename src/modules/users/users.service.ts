import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleUserDto } from './dto/role-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async findOne(uuid: string) {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { uuid },
      include: { role: true },
    });

    return {
      status: 'success',
      data: {
        uuid: user.uuid,
        profile: user.profile,
        email: user.email,
        full_name: user.full_name,
        email_verified: user.email_verified,
        role: user.role.name,
      },
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
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prismaService.user.update({
      where: { uuid },
      data: {
        refresh_token: hashedRefreshToken,
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
