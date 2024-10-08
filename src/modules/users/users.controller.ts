import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { RoleUserDto } from './dto/role-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller({ path: 'api/v1/users', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':uuid')
  @Roles('admin', 'user', 'superadmin')
  async getUserByUuid(@Param('uuid') uuid: string) {
    return this.usersService.findOne(uuid);
  }

  @Post('assign-role')
  @Roles('superadmin')
  async assignRole(@Body() roleUserDto: RoleUserDto) {
    return this.usersService.assignRoleToUser(roleUserDto);
  }

  @Get()
  @Roles('superadmin')
  async getAllUsers() {
    return this.usersService.findAll();
  }
}
