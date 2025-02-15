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
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { Request, Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('Videos')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/videos', version: '1' })
export class VideoPodcastController {
  constructor(
    private readonly videoPodcastService: VideoPodcastService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff', 'student')
  @ApiCreatedResponse({
    type: VideoPodcast,
  })
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFile()
    thumbnail: Express.Multer.File,
    @Body() createVideoPodcastDto: CreateVideoPodcastDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user;

    const file = this.fileUploadService.handleFileUpload(thumbnail);
    createVideoPodcastDto.thumbnail = file.filePath;

    const result = await this.videoPodcastService.create(
      user['sub'],
      createVideoPodcastDto,
    );
    return res.status(HttpStatus.CREATED).json(result);
  }

  @Get()
  @ApiOkResponse({
    type: VideoPodcast,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  findAllVideoByUser(@Query() query: FindContentQueryDto) {
    return this.videoPodcastService.findAllVideoByUser(query);
  }

  @Get('staff')
  @ApiOkResponse({
    type: VideoPodcast,
    isArray: true,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @HttpCode(HttpStatus.OK)
  findAllVideoByStaff(@Query() query: FindContentQueryDto) {
    return this.videoPodcastService.findAllVideoByStaff(query);
  }

  @Get('summary-student')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('student')
  async summaryAudioStudent(@Req() req: Request) {
    const user = req.user;
    return this.videoPodcastService.summaryVideoStudent(user['sub']);
  }

  @Get('summary-staff')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  async summaryAudioStaff() {
    return this.videoPodcastService.summaryVideoStaff();
  }

  @Get('student')
  @ApiOkResponse({
    type: VideoPodcast,
    isArray: true,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('student')
  @HttpCode(HttpStatus.OK)
  async findUserVideo(
    @Req() req: Request,
    @Query() query: FindContentQueryDto,
  ) {
    const user = req.user;
    return await this.videoPodcastService.fetchUserVideos(user['sub'], query);
  }

  @Get(':slug')
  @ApiOkResponse({
    type: VideoPodcast,
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('slug') slug: string) {
    return this.videoPodcastService.findVideoBySlug(slug);
  }

  @Patch(':uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff', 'student')
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiOkResponse({
    type: VideoPodcast,
  })
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('uuid') uuid: string,
    @UploadedFile()
    thumbnail: Express.Multer.File,
    @Body() updateVideoPodcastDto: UpdateVideoPodcastDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user;
    const isExist = await this.videoPodcastService.findVideoByUuid(uuid);

    if (thumbnail && thumbnail.size > 0) {
      const file = this.fileUploadService.updateFile(
        isExist.data.thumbnail,
        thumbnail,
      );
      updateVideoPodcastDto.thumbnail = file.filePath;
    }

    const updatedVideo = await this.videoPodcastService.updateVideoByUuid(
      uuid,
      user['sub'],
      updateVideoPodcastDto,
    );

    return res.status(HttpStatus.OK).json(updatedVideo);
  }

  @Delete(':uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff', 'student')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('uuid') uuid: string, @Res() res: Response) {
    const isExist = await this.videoPodcastService.findVideoByUuid(uuid);
    this.fileUploadService.deleteFile(isExist.data.thumbnail);

    const audio = await this.videoPodcastService.removeVideoByUuid(uuid);

    return res.status(HttpStatus.OK).json(audio);
  }
}
