import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UploadedFiles,
} from '@nestjs/common';
import { UserService } from './users.service';
import { RoleUserDto } from './dto/role-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FileUpload } from '@decorators/file-upload.decorator';
import { ApiException } from '@exceptions/api-exception';
import { SuccessResponse } from '@utils/api-response.util';
@ApiTags('User')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'users', version: '1' })
@UseGuards(RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get(':uuid')
  @Roles('admin', 'user', 'staff', 'judge', 'student')
  async getUserByUuid(@Param('uuid') uuid: string) {
    return this.userService.findOne(uuid);
  }

  @Post('assign-role')
  @Roles('admin')
  async assignRole(@Body() roleUserDto: RoleUserDto) {
    return this.userService.assignRoleToUser(roleUserDto);
  }

  @Post('remove-account')
  @Roles('user')
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
  @Roles('admin', 'user', 'student', 'staff')
  @FileUpload()
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Param('uuid') uuid: string,
    @UploadedFiles()
    files: {
      profile?: Express.Multer.File[];
    },
  ) {
    console.log(files);

    try {
      const file = this.fileUploadService.handleFileUpload(
        files.profile[0],
      );

      const result = await this.userService.updateProfile(uuid, file.filePath);
      return SuccessResponse.create(
        result,
        'Profile updated successfully',
        HttpStatus.OK,
      );
    } catch (e) {
      throw new ApiException(e.message, e.status);
    }
  }

  @Get()
  @Roles('admin')
  async getAllUsers() {
    return this.userService.findAll();
  }
}
