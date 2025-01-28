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
  UploadedFiles,
  UseInterceptors,
  Query,
  Res,
} from '@nestjs/common';
import { EbookService } from './ebooks.service';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Ebook } from './entities/ebook.entity';
import { Roles } from '../roles/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('Ebooks')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/ebooks', version: '1' })
export class EbookController {
  constructor(
    private readonly ebookService: EbookService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @ApiCreatedResponse({
    type: Ebook,
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'file', maxCount: 1 },
    ]),
  )
  async create(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body() createEbookDto: CreateEbookDto,
    @Res() res: Response,
  ) {
    try {
      const thumbnail = this.fileUploadService.handleFileUpload(
        files.thumbnail[0],
      );
      createEbookDto.thumbnail = thumbnail.filePath;

      const file = this.fileUploadService.handleFileUpload(files.file[0]);
      createEbookDto.file = file.filePath;

      const result = await this.ebookService.create(createEbookDto);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (e) {
      console.error('Error during ebook creation:', e.message);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to create ebook.',
        detail: e.message,
      });
    }
  }

  @Get()
  @ApiOkResponse({
    type: Ebook,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindContentQueryDto) {
    return this.ebookService.findAllEbook(query);
  }

  @Get(':slug')
  @ApiOkResponse({
    type: Ebook,
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('slug') slug: string) {
    return this.ebookService.findEbookBySlug(slug);
  }

  @Patch(':contentUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @ApiOkResponse({
    type: Ebook,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'file', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  async update(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Param('contentUuid') contentUuid: string,
    @Body() updateEbookDto: UpdateEbookDto,
    @Res() res: Response,
  ) {
    try {
      const currentEbook = await this.ebookService.findEbookByUuid(contentUuid);

      const thumbnail = this.fileUploadService.updateFile(
        currentEbook.data.thumbnail,
        files.thumbnail[0],
      );
      updateEbookDto.thumbnail = thumbnail.filePath;

      const file = this.fileUploadService.updateFile(
        currentEbook.data.ebook.file_attachment.file,
        files.file[0],
      );
      updateEbookDto.file = file.filePath;

      const updatedEbook = await this.ebookService.updateEbookByUuid(
        contentUuid,
        updateEbookDto,
      );

      return res.status(HttpStatus.OK).json(updatedEbook);
    } catch (error) {
      console.error('Error updating ebook:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to update ebook',
        detail: error.message,
      });
    }
  }

  @Delete(':contentUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @ApiOkResponse({
    type: Ebook,
  })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('contentUuid') contentUuid: string,
    @Res() res: Response,
  ) {
    try {
      const isExist = await this.ebookService.findEbookByUuid(contentUuid);
      this.fileUploadService.deleteFile(isExist.data.thumbnail);
      this.fileUploadService.deleteFile(
        isExist.data.ebook.file_attachment.file,
      );

      const audio = await this.ebookService.removeEbookByUuid(contentUuid);

      return res.status(HttpStatus.OK).json(audio);
    } catch (error) {
      console.error('Error updating audio:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to remove audio!',
        detail: error.message,
      });
    }
  }
}
