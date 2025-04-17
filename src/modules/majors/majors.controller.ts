import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
  Res,
} from '@nestjs/common';
import { MajorService } from './majors.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';
import {
  ApiBasicAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Major } from './entities/major.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FileUpload } from '@decorators/file-upload.decorator';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';
import { Public } from '@decorators/public.decorator';
@ApiTags('Major')
@Controller({ path: 'majors', version: '1' })
@ApiBasicAuth('JWT-auth')
@Roles('staff')
export class MajorController {
  constructor(
    private readonly majorService: MajorService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async createMajor(
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      avatar?: Express.Multer.File[];
    },
    @Body() createMajorDto: CreateMajorDto,
  ) {
    try {
      const image = this.fileUploadService.handleFileUpload(files.image[0]);

      const avatar = this.fileUploadService.handleFileUpload(files.avatar[0]);
      await this.majorService.create({
        ...createMajorDto,
        image: image.filePath,
        avatar: avatar.filePath,
      });
      return SuccessResponse.create(
        null,
        'Major successfully created!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get()
  @Public()
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'search by name for categories',
  })
  @HttpCode(HttpStatus.OK)
  async getMajors(@Query('search') search: string) {
    return SuccessResponse.create(
      await this.majorService.findAllMajor(search),
      'Major successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get(':majorUuid')
  @Public()
  async getMajorByUuid(@Param('majorUuid') majorUuid: string) {
    return SuccessResponse.create(
      await this.majorService.findMajorByUuid(majorUuid),
      'Major successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Patch(':majorUuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async updateMajor(
    @Param('majorUuid') majorUuid: string,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      avatar?: Express.Multer.File[];
    },
    @Body() updateMajorDto: UpdateMajorDto,
  ) {
    try {
      const isExist = await this.majorService.findMajorByUuid(majorUuid);

      const image =
        files.image && files.image[0]
          ? this.fileUploadService.updateFile(isExist.image, files.image[0])
          : { filePath: isExist.image };
      const avatar =
        files.avatar && files.avatar[0]
          ? this.fileUploadService.updateFile(isExist.avatar, files.avatar[0])
          : { filePath: isExist.avatar };

      await this.majorService.updateMajorByUuid(majorUuid, {
        ...updateMajorDto,
        image: image.filePath,
        avatar: avatar.filePath,
      });

      return SuccessResponse.create(
        null,
        'Major successfully updated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':majorUuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async removeMajor(@Param('majorUuid') majorUuid: string) {
    try {
      const isExist = await this.majorService.findMajorByUuid(majorUuid);
      this.fileUploadService.deleteFile(isExist.avatar);
      this.fileUploadService.deleteFile(isExist.image);

      await this.majorService.removeMajorByUuid(majorUuid);

      return SuccessResponse.create(
        null,
        'Major successfully deleted!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
