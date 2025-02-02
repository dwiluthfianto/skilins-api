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
import { Roles } from '../roles/roles.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';
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
  @ApiCreatedResponse({
    type: Major,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'avatar', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      avatar?: Express.Multer.File[];
    },
    @Body() createMajorDto: CreateMajorDto,
    @Res() res: Response,
  ) {
    const image = this.fileUploadService.handleFileUpload(files.image[0]);
    createMajorDto.image = image.filePath;

    const avatar = this.fileUploadService.handleFileUpload(files.avatar[0]);
    createMajorDto.avatar = avatar.filePath;
    const result = await this.majorService.create(createMajorDto);
    return res.status(HttpStatus.CREATED).json(result);
  }

  @Get()
  @ApiOkResponse({
    type: Major,
    isArray: true,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'search by name for categories',
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query('search') search: string) {
    return this.majorService.findAllMajor(search);
  }

  @Get(':majorUuid')
  @ApiOkResponse({
    type: Major,
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('majorUuid') majorUuid: string) {
    return this.majorService.removeMajorByUuid(majorUuid);
  }

  @Patch(':majorUuid')
  @ApiOkResponse({
    type: Major,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'avatar', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('majorUuid') majorUuid: string,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      avatar?: Express.Multer.File[];
    },
    @Body() updateMajorDto: UpdateMajorDto,
    @Res() res: Response,
  ) {
    const isExist = await this.majorService.findMajorByUuid(majorUuid);

    if (files.image && files.image.length > 0) {
      const image = this.fileUploadService.updateFile(
        isExist.data.image,
        files.image[0],
      );
      updateMajorDto.image = image.filePath;
    }
    if (files.avatar && files.avatar.length > 0) {
      const avatar = this.fileUploadService.updateFile(
        isExist.data.avatar,
        files.avatar[0],
      );
      updateMajorDto.avatar = avatar.filePath;
    }
    const updatedMajor = await this.majorService.updateMajorByUuid(
      majorUuid,
      updateMajorDto,
    );

    return res.status(HttpStatus.OK).json(updatedMajor);
  }

  @Delete(':majorUuid')
  @ApiOkResponse({
    type: Major,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('majorUuid') majorUuid: string, @Res() res: Response) {
    const isExist = await this.majorService.findMajorByUuid(majorUuid);
    this.fileUploadService.deleteFile(isExist.data.avatar);
    this.fileUploadService.deleteFile(isExist.data.image);

    const major = await this.majorService.removeMajorByUuid(majorUuid);

    return res.status(HttpStatus.OK).json(major);
  }
}
