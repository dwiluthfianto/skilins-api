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
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
} from '@nestjs/common';
import { BlogService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Blog } from './entities/blog.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { FindBlogQueryDto } from '../contents/dto/find-blog-query.dto';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('Blogs')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/blogs', version: '1' })
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @ApiCreatedResponse({
    type: Blog,
  })
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFile()
    thumbnail: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
    @Body() createBlogDto: CreateBlogDto,
  ) {
    const user = req.user;
    try {
      const file = this.fileUploadService.handleFileUpload(thumbnail);
      createBlogDto.thumbnail = file.filePath;
      const result = await this.blogService.createBlog(
        user['sub'],
        createBlogDto,
      );
      return res.status(HttpStatus.CREATED).json(result);
    } catch (e) {
      console.error('Error during Blog creation:', e.message);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to create blog.',
        detail: e.message,
      });
    }
  }

  @Get()
  @ApiOkResponse({
    type: Blog,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindBlogQueryDto) {
    return this.blogService.findAllBlog(query);
  }

  @Get(':slug')
  @ApiOkResponse({
    type: Blog,
  })
  @HttpCode(HttpStatus.OK)
  findBlog(@Param('slug') slug: string) {
    return this.blogService.findBlogBySlug(slug);
  }

  @Patch(':contentUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @ApiOkResponse({
    type: Blog,
  })
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  async update(
    @UploadedFile()
    thumbnail: Express.Multer.File,
    @Req() req: Request,
    @Param('contentUuid') contentUuid: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @Res() res: Response,
  ) {
    const user = req.user;

    try {
      const isExist = await this.blogService.findBlogByUuid(contentUuid);
      const file = this.fileUploadService.updateFile(
        isExist.data.thumbnail,
        thumbnail,
      );
      updateBlogDto.thumbnail = file.filePath;

      const blog = await this.blogService.updateBlogByUuid(
        user['sub'],
        contentUuid,
        updateBlogDto,
      );

      return res.status(HttpStatus.OK).json(blog);
    } catch (error) {
      console.error('Error updating blog:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to update blog',
        detail: error.message,
      });
    }
  }

  @Delete(':contentUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @ApiOkResponse({
    type: Blog,
  })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('contentUuid') contentUuid: string,
    @Res() res: Response,
  ) {
    try {
      const isExist = await this.blogService.findBlogByUuid(contentUuid);
      this.fileUploadService.deleteFile(isExist.data.thumbnail);

      const blog = await this.blogService.removeBlogByUuid(contentUuid);

      return res.status(HttpStatus.OK).json(blog);
    } catch (error) {
      console.error('Error updating blog:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to remove blog!',
        detail: error.message,
      });
    }
  }
}
