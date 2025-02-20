import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { TagService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Tag } from './entities/tag.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FindTagDto } from './dto/find-tag.dto';
import { FileUpload } from '@decorators/file-upload.decorator';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';
import { Public } from '@decorators/public.decorator';
@ApiTags('Tag')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'tags', version: '1' })
export class TagController {
  constructor(
    private readonly tagService: TagService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async create(
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
    },
    @Body() createTagDto: CreateTagDto,
  ) {
    try {
      const file = this.fileUploadService.handleFileUpload(files.avatar[0]);
      await this.tagService.create({
        ...createTagDto,
        avatar: file.filePath,
      });

      return SuccessResponse.create(
        null,
        'Tag created successfully',
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
  async getTags(@Query() query: FindTagDto) {
    const { data, pagination } = await this.tagService.findAll(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Tags fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get(':name')
  @Public()
  async getTagByName(@Param('name') name: string) {
    return SuccessResponse.create(
      await this.tagService.findOneByName(name),
      'Tag fetched successfully',
      HttpStatus.OK,
    );
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async update(
    @Param('uuid') uuid: string,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
    },
    @Body() updateTagDto: UpdateTagDto,
  ) {
    try {
      const isExist = await this.tagService.findOneByUuid(uuid);
      const file = this.fileUploadService.updateFile(
        isExist.avatar,
        files.avatar[0],
      );
      await this.tagService.updateTag(uuid, {
        ...updateTagDto,
        avatar: file.filePath,
      });

      return SuccessResponse.create(
        null,
        'Tag updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async remove(@Param('uuid') uuid: string) {
    try {
      const isExist = await this.tagService.findOneByUuid(uuid);
      this.fileUploadService.deleteFile(isExist.avatar);
      await this.tagService.removeTag(uuid);
      return SuccessResponse.create(
        null,
        'Tag deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
