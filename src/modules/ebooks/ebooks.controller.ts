import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { EbookService } from './ebooks.service';
import { CreateEbookDto } from './dto/create-ebook.dto';
import { UpdateEbookDto } from './dto/update-ebook.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@decorators/roles.decorator';
import { RolesGuard } from '@guards/roles.guard';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FileUpload } from '@decorators/file-upload.decorator';
import { ApiException } from '@exceptions/api-exception';
import { Public } from '@decorators/public.decorator';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiResponse } from '@interfaces/api-response.interface';

@ApiTags('Ebooks')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/ebooks', version: '1' })
export class EbookController {
  constructor(
    private readonly ebookService: EbookService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async create(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body() createEbookDto: CreateEbookDto,
  ) {
    try {
      const thumbnail = this.fileUploadService.handleFileUpload(
        files.thumbnail[0],
      );
      const file = this.fileUploadService.handleFileUpload(files.file[0]);

      await this.ebookService.createEbook({
        ...createEbookDto,
        thumbnail: thumbnail.filePath,
        file: file.filePath,
      });

      return SuccessResponse.create(
        null,
        'Ebook successfully created!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get()
  @Public()
  async getEbooks(
    @Query() query: FindContentQueryDto,
  ): Promise<ApiResponse<any>> {
    const { data, pagination } =
      await this.ebookService.findAllEbookByUser(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Ebooks successfully fetched!',
    );
  }

  @Get(':slug')
  @Public()
  async getEbookBySlug(@Param('slug') slug: string) {
    const data = await this.ebookService.findEbookBySlug(slug);
    return SuccessResponse.create(
      data,
      'Ebook successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Patch(':contentUuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async update(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Param('contentUuid') contentUuid: string,
    @Body() updateEbookDto: UpdateEbookDto,
  ): Promise<ApiResponse<any>> {
    try {
      const currentEbook = await this.ebookService.findEbookByUuid(contentUuid);

      const thumbnail =
        files.thumbnail && files.thumbnail[0]
          ? this.fileUploadService.updateFile(
              currentEbook.thumbnail,
              files.thumbnail[0],
            )
          : { filePath: currentEbook.thumbnail };

      const file =
        files.file && files.file[0]
          ? this.fileUploadService.updateFile(
              currentEbook.ebook.file_attachment.file,
              files.file[0],
            )
          : { filePath: currentEbook.ebook.file_attachment.file };

      await this.ebookService.updateEbookByUuid(contentUuid, {
        ...updateEbookDto,
        thumbnail: thumbnail.filePath,
        file: file.filePath,
      });

      return SuccessResponse.create(
        null,
        'Ebook successfully updated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':contentUuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async remove(
    @Param('contentUuid') contentUuid: string,
  ): Promise<ApiResponse<any>> {
    try {
      const isExist = await this.ebookService.findEbookByUuid(contentUuid);
      this.fileUploadService.deleteFile(isExist.thumbnail);
      this.fileUploadService.deleteFile(isExist.ebook.file_attachment.file);

      await this.ebookService.removeEbookByUuid(contentUuid);

      return SuccessResponse.create(
        null,
        'Ebook successfully deleted!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
