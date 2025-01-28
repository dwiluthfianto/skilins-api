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
import { Roles } from '../roles/roles.decorator';
import { Tag } from './entities/tag.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('Tag')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'tags', version: '1' })
export class TagController {
  constructor(
    private readonly tagService: TagService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiCreatedResponse({ type: Tag })
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFile()
    avatar: Express.Multer.File,
    @Body() createTagDto: CreateTagDto,
    @Res() res: Response,
  ) {
    try {
      const file = this.fileUploadService.handleFileUpload(avatar);
      createTagDto.avatar = file.filePath;
      const result = await this.tagService.create(createTagDto);

      return res.status(HttpStatus.CREATED).json(result);
    } catch (e) {
      console.error('Error during tag creation:', e.message);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to create tag.',
        detail: e.message,
      });
    }
  }

  @Get()
  @ApiOkResponse({ type: Tag })
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'search by name for categories',
  })
  findAll(@Query('search') search: string) {
    return this.tagService.findAll(search);
  }

  @Get(':name')
  @ApiOkResponse({ type: Tag })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('name') name: string) {
    return this.tagService.findOneByName(name);
  }

  @Patch(':uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOkResponse({ type: Tag })
  async update(
    @Param('uuid') uuid: string,
    @UploadedFile()
    avatar: Express.Multer.File,
    @Body() updateTagDto: UpdateTagDto,
    @Res() res: Response,
  ) {
    try {
      const isExist = await this.tagService.findOneByUuid(uuid);
      const file = this.fileUploadService.updateFile(
        isExist.data.avatar,
        avatar,
      );
      updateTagDto.avatar = file.filePath;
      const tag = await this.tagService.update(uuid, updateTagDto);

      return res.status(HttpStatus.OK).json(tag);
    } catch (error) {
      console.error('Error updating genre:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to update genre',
        detail: error.message,
      });
    }
  }

  @Delete(':uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @ApiOkResponse({ type: Tag })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('uuid') uuid: string, @Res() res: Response) {
    try {
      const isExist = await this.tagService.findOneByUuid(uuid);
      this.fileUploadService.deleteFile(isExist.data.avatar);

      const result = await this.tagService.remove(uuid);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Error updating tag:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to remove tag!',
        detail: error.message,
      });
    }
  }
}
