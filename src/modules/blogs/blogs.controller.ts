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
  Query,
  Req,
  UploadedFiles,
} from '@nestjs/common';
import { BlogService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Request } from 'express';
import { FindBlogQueryDto } from '../contents/dto/find-blog-query.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FileUpload } from '@decorators/file-upload.decorator';
import { ApiException } from '@exceptions/api-exception';
import { SuccessResponse } from '@utils/api-response.util';
import { Public } from '@decorators/public.decorator';

@ApiTags('Blogs')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/blogs', version: '1' })
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async createBlog(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
    },
    @Req() req: Request,
    @Body() createBlogDto: CreateBlogDto,
  ) {
    const user = req.user;

    try {
      const thumbnail = this.fileUploadService.handleFileUpload(
        files.thumbnail[0],
      );
      await this.blogService.createBlog(user['sub'], {
        ...createBlogDto,
        thumbnail: thumbnail.filePath,
      });

      return SuccessResponse.create(
        null,
        'Blog successfully created!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  async getAllBlog(@Query() query: FindBlogQueryDto) {
    const { data, pagination } =
      await this.blogService.findAllBlogByUser(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Blogs successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get(':slug')
  @Public()
  async getBlogBySlug(@Param('slug') slug: string) {
    return SuccessResponse.create(
      await this.blogService.findBlogBySlug(slug),
      'Blog successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Patch(':contentUuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async updateBlog(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
    },
    @Req() req: Request,
    @Param('contentUuid') contentUuid: string,
    @Body() updateBlogDto: UpdateBlogDto,
  ) {
    const user = req.user;

    try {
      const thumbnail =
        files.thumbnail && files.thumbnail[0]
          ? this.fileUploadService.handleFileUpload(files.thumbnail[0])
          : { filePath: updateBlogDto.thumbnail };

      await this.blogService.updateBlogByUuid(user['sub'], contentUuid, {
        ...updateBlogDto,
        thumbnail: thumbnail.filePath,
      });

      return SuccessResponse.create(
        null,
        'Blog successfully updated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':contentUuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async removeBlog(@Param('contentUuid') contentUuid: string) {
    try {
      const isExist = await this.blogService.findBlogByUuid(contentUuid);
      this.fileUploadService.deleteFile(isExist.thumbnail);
      

      await this.blogService.removeBlogByUuid(contentUuid);

      return SuccessResponse.create(
        null,
        'Blog successfully deleted!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
