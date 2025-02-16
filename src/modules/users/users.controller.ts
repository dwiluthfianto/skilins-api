import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Res,
  Req,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UploadedFile,
} from '@nestjs/common';
import { UserService } from './users.service';
import { RoleUserDto } from './dto/role-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('User')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'users', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get(':uuid')
  @Roles('admin', 'User', 'staff', 'judge', 'student')
  async getUserByUuid(@Param('uuid') uuid: string) {
    return this.userService.findOne(uuid);
  }

  @Post('assign-role')
  @Roles('admin')
  async assignRole(@Body() roleUserDto: RoleUserDto) {
    return this.userService.assignRoleToUser(roleUserDto);
  }

  @Post('remove-account')
  @Roles('admin', 'User', 'student')
  async removeUser(@Req() req: Request, @Res() res: Response) {
    const user = req.user;
    await this.userService.removeUser(user['sub']);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false,
    });

    return res.json({ status: 'success', message: 'Logged out successfully!' });
  }

  @Post('update-profile/:uuid')
  @Roles('admin', 'User', 'student', 'staff')
  @UseInterceptors(FileInterceptor('profile'))
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Param('uuid') uuid: string,
    @UploadedFile('profile') profile: Express.Multer.File,
    @Res() res: Response,
  ) {
    try {
      const file = this.fileUploadService.handleFileUpload(profile);

      const result = await this.userService.updateProfile(uuid, file.filePath);
      return res.status(HttpStatus.OK).json(result);
    } catch (e) {
      console.error('Error during profile update:', e.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to update profile.',
        detail: e.message,
      });
    }
  }

  @Get()
  @Roles('admin')
  async getAllUsers() {
    return this.userService.findAll();
  }
}
