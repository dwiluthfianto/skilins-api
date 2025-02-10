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
import { FindTagDto } from './dto/find-tag.dto';
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
  @Roles('staff')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiCreatedResponse({ type: Tag })
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFile()
    avatar: Express.Multer.File,
    @Body() createTagDto: CreateTagDto,
    @Res() res: Response,
  ) {
    const file = this.fileUploadService.handleFileUpload(avatar);
    createTagDto.avatar = file.filePath;
    const result = await this.tagService.create(createTagDto);

    return res.status(HttpStatus.CREATED).json(result);
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
  findAll(@Query() query: FindTagDto) {
    return this.tagService.findAll(query);
  }


  @Get(':name')
  @ApiOkResponse({ type: Tag })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('name') name: string) {
    return this.tagService.findOneByName(name);
  }

  @Patch(':uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOkResponse({ type: Tag })
  async update(
    @Param('uuid') uuid: string,
    @UploadedFile()
    avatar: Express.Multer.File,
    @Body() updateTagDto: UpdateTagDto,
    @Res() res: Response,
  ) {
    const isExist = await this.tagService.findOneByUuid(uuid);

    if (avatar && avatar.size > 0) {
      const file = this.fileUploadService.updateFile(
        isExist.data.avatar,
        avatar,
      );
      updateTagDto.avatar = file.filePath;
    }
    const tag = await this.tagService.update(uuid, updateTagDto);

    return res.status(HttpStatus.OK).json(tag);
  }

  @Delete(':uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @ApiOkResponse({ type: Tag })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('uuid') uuid: string, @Res() res: Response) {
    const isExist = await this.tagService.findOneByUuid(uuid);
    this.fileUploadService.deleteFile(isExist.data.avatar);

    const result = await this.tagService.remove(uuid);
    return res.status(HttpStatus.OK).json(result);
  }
}
