import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UploadedFiles,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { PrakerinService } from './prakerin.service';
import { CreatePrakerinDto } from './dto/create-prakerin.dto';
import { UpdatePrakerinDto } from './dto/update-prakerin.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Prakerin } from './entities/prakerin.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { FindPrakerinQueryDto } from '../contents/dto/find-prakerin-query.dto';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('Prakerin')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/prakerin', version: '1' })
export class PrakerinController {
  constructor(
    private readonly prakerinService: PrakerinService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
  @ApiCreatedResponse({
    type: Prakerin,
  })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'thumbnail' }, { name: 'file' }]),
  )
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFiles()
    files: {
      thumbnail: Express.Multer.File;
      file: Express.Multer.File;
    },
    @Body() createPrakerinDto: CreatePrakerinDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user;
    try {
      const thumbnail = this.fileUploadService.handleFileUpload(
        files.thumbnail,
      );
      createPrakerinDto.thumbnail = thumbnail.filePath;

      const file_prakerin = this.fileUploadService.handleFileUpload(files.file);
      createPrakerinDto.file = file_prakerin.filePath;

      const result = await this.prakerinService.createPrakerin(
        user['sub'],
        createPrakerinDto,
      );
      return res.status(HttpStatus.CREATED).json(result);
    } catch (e) {
      console.error('Error during report podcast creation:', e.message);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to create prakerin.',
        detail: e.message,
      });
    }
  }

  @Get()
  @ApiOkResponse({
    type: Prakerin,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindPrakerinQueryDto) {
    return this.prakerinService.findAllPrakerin(query);
  }

  @Get('student')
  @ApiOkResponse({
    type: Prakerin,
    isArray: true,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
  @HttpCode(HttpStatus.OK)
  async findUserPrakerin(
    @Req() req: Request,
    @Query() query: FindPrakerinQueryDto,
  ) {
    const user = req.user;
    return await this.prakerinService.fetchUserPrakerin(user['sub'], query);
  }

  @Get(':slug')
  @ApiOkResponse({
    type: Prakerin,
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('slug') slug: string) {
    return this.prakerinService.findPrakerinBySlug(slug);
  }

  @Patch(':uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'thumbnail' }, { name: 'file' }]),
  )
  @ApiOkResponse({
    type: Prakerin,
  })
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('uuid') uuid: string,
    @UploadedFiles()
    files: {
      thumbnail: Express.Multer.File;
      file: Express.Multer.File;
    },
    @Body() updatePrakerinDto: UpdatePrakerinDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user;
    try {
      const isExist = await this.prakerinService.findPrakerinByUuid(uuid);

      const thumbnail = this.fileUploadService.updateFile(
        isExist.data.thumbnail,
        files.thumbnail,
      );
      updatePrakerinDto.thumbnail = thumbnail.filePath;

      const file_prakerin = this.fileUploadService.updateFile(
        isExist.data.prakerin.file_attachment.file,
        files.file,
      );
      updatePrakerinDto.file = file_prakerin.filePath;

      const updatedPrakerin = await this.prakerinService.updatePrakerinByUuid(
        uuid,
        user['sub'],
        updatePrakerinDto,
      );

      return res.status(HttpStatus.OK).json(updatedPrakerin);
    } catch (error) {
      console.error('Error updating prakerin:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to update prakerin',
        detail: error.message,
      });
    }
  }

  @Delete(':contentUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOkResponse({
    type: Prakerin,
  })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('contentUuid') contentUuid: string,
    @Res() res: Response,
  ) {
    try {
      const isExist =
        await this.prakerinService.findPrakerinByUuid(contentUuid);
      this.fileUploadService.deleteFile(isExist.data.thumbnail);
      this.fileUploadService.deleteFile(
        isExist.data.prakerin.file_attachment.file,
      );

      const prakerin =
        await this.prakerinService.removePrakerinByUuid(contentUuid);

      return res.status(HttpStatus.OK).json(prakerin);
    } catch (error) {
      console.error('Error updating prakerin:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to remove prakerin!',
        detail: error.message,
      });
    }
  }
}
