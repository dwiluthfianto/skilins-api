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
  UploadedFile,
  Query,
  Req,
  Res,
  UploadedFiles,
} from '@nestjs/common';
import { VideoPodcastService } from './video-podcasts.service';
import { CreateVideoPodcastDto } from './dto/create-video-podcast.dto';
import { UpdateVideoPodcastDto } from './dto/update-video-podcast.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VideoPodcast } from './entities/video-podcast.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { Request, Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FileUpload } from '@decorators/file-upload.decorator';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';
import { Public } from '@decorators/public.decorator';

@ApiTags('Videos')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/videos', version: '1' })
export class VideoPodcastController {
  constructor(
    private readonly videoPodcastService: VideoPodcastService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('staff', 'student')
  @ApiCreatedResponse({
    type: VideoPodcast,
  })
  @FileUpload()
  async create(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
    },
    @Body() createVideoPodcastDto: CreateVideoPodcastDto,
    @Req() req: Request,
  ) {
    const user = req.user;

    try {
      const thumbnail = this.fileUploadService.handleFileUpload(
        files.thumbnail[0],
      );

      await this.videoPodcastService.create(user['sub'], {
        ...createVideoPodcastDto,
        thumbnail: thumbnail.filePath,
      });
      return SuccessResponse.create(
        null,
        'Video created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get()
  @Public()
  async getVideos(@Query() query: FindContentQueryDto) {
    const { data, pagination } =
      await this.videoPodcastService.findAllVideoByUser(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Videos fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('staff')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async getVideosStaff(@Query() query: FindContentQueryDto) {
    const { data, pagination } =
      await this.videoPodcastService.findAllVideoByStaff(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Videos fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('summary-student')
  @UseGuards(RolesGuard)
  @Roles('student')
  async summaryAudioStudent(@Req() req: Request) {
    const user = req.user;
    return SuccessResponse.create(
      this.videoPodcastService.summaryVideoStudent(user['sub']),
      'Video summary fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('summary-staff')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async summaryAudioStaff() {
    return SuccessResponse.create(
      this.videoPodcastService.summaryVideoStaff(),
      'Video summary fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('student')
  @UseGuards(RolesGuard)
  @Roles('student')
  async getUserVideos(
    @Req() req: Request,
    @Query() query: FindContentQueryDto,
  ) {
    const user = req.user;
    const { data, pagination } = await this.videoPodcastService.fetchUserVideos(
      user['sub'],
      query,
    );
    return SuccessResponse.paginate(
      data,
      pagination,
      'Videos fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get(':slug')
  @Public()
  getVideoBySlug(@Param('slug') slug: string) {
    return SuccessResponse.create(
      this.videoPodcastService.findVideoBySlug(slug),
      'Video fetched successfully',
      HttpStatus.OK,
    );
  }

  @Patch(':uuid')
  @UseGuards(RolesGuard)
  @Roles('staff', 'student')
  @FileUpload()
  async update(
    @Param('uuid') uuid: string,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
    },
    @Body() updateVideoPodcastDto: UpdateVideoPodcastDto,
    @Req() req: Request,
  ) {
    const user = req.user;

    try {
      const isExist = await this.videoPodcastService.findVideoByUuid(uuid);

      const file =
        files.thumbnail && files.thumbnail[0]
          ? this.fileUploadService.updateFile(
              isExist.thumbnail,
              files.thumbnail[0],
            )
          : { filePath: isExist.thumbnail };

      await this.videoPodcastService.updateVideoByUuid(uuid, user['sub'], {
        ...updateVideoPodcastDto,
        thumbnail: file.filePath,
      });

      return SuccessResponse.create(
        null,
        'Video updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':uuid')
  @UseGuards(RolesGuard)
  @Roles('staff', 'student')
  async remove(@Param('uuid') uuid: string) {
    try {
      const isExist = await this.videoPodcastService.findVideoByUuid(uuid);
      this.fileUploadService.deleteFile(isExist.thumbnail);

      await this.videoPodcastService.removeVideoByUuid(uuid);

      return SuccessResponse.create(
        null,
        'Video deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
