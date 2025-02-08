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
  UseInterceptors,
  UseGuards,
  UploadedFiles,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { AudioPodcastService } from './audio-podcasts.service';
import { CreateAudioPodcastDto } from './dto/create-audio-podcast.dto';
import { UpdateAudioPodcastDto } from './dto/update-audio-podcast.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AudioPodcast } from './entities/audio-podcast.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { Request, Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('Audios')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/audios', version: '1' })
export class AudioPodcastController {
  constructor(
    private readonly audioPodcastService: AudioPodcastService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff', 'student')
  @ApiCreatedResponse({
    type: AudioPodcast,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'file', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  async createAudioPodcast(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body() createAudioPodcastDto: CreateAudioPodcastDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user;
    const thumbnail = this.fileUploadService.handleFileUpload(
      files.thumbnail[0],
    );
    createAudioPodcastDto.thumbnail = thumbnail.filePath;

    const file = this.fileUploadService.handleFileUpload(files.file[0]);
    createAudioPodcastDto.file = file.filePath;

    const result = await this.audioPodcastService.createAudioPodcast(
      user['sub'],
      createAudioPodcastDto,
    );
    return res.status(HttpStatus.CREATED).json(result);
  }

  @Get()
  @ApiOkResponse({
    type: AudioPodcast,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  getAllAudioByUser(@Query() query: FindContentQueryDto) {
    return this.audioPodcastService.findAllAudioByUser(query);
  }

  @Get('summary-student')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('student')
  summaryAudioStudent(@Req() req: Request) {
    const user = req.user;

    return this.audioPodcastService.summaryAudioStudent(user['sub']);
  }

  @Get('summary-staff')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  summaryAudioStaff() {
    return this.audioPodcastService.summaryAudioStaff();
  }

  @Get('staff')
  @ApiOkResponse({
    type: AudioPodcast,
    isArray: true,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @HttpCode(HttpStatus.OK)
  getAllAudioByStaff(@Query() query: FindContentQueryDto) {
    return this.audioPodcastService.findAllAudioByStaff(query);
  }

  @Get('student')
  @ApiOkResponse({
    type: AudioPodcast,
    isArray: true,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('student')
  @HttpCode(HttpStatus.OK)
  findUserAudio(@Req() req: Request, @Query() query: FindContentQueryDto) {
    const user = req.user;
    return this.audioPodcastService.fetchUserAudios(user['sub'], query);
  }

  @Get(':slug')
  @ApiOkResponse({
    type: AudioPodcast,
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('slug') slug: string) {
    return this.audioPodcastService.findAudioBySlug(slug);
  }

  @Patch(':contentUuid')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'file', maxCount: 1 },
    ]),
  )
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff', 'student')
  @ApiOkResponse({
    type: AudioPodcast,
  })
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('contentUuid') contentUuid: string,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body() updateAudioPodcastDto: UpdateAudioPodcastDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user;
    const currentAudio =
      await this.audioPodcastService.findAudioByUuid(contentUuid);

    if (files.thumbnail && files.thumbnail.length > 0) {
      const thumbnail = this.fileUploadService.updateFile(
        currentAudio.data.thumbnail,
        files.thumbnail[0],
      );
      updateAudioPodcastDto.thumbnail = thumbnail.filePath;
    }

    if (files.file && files.file.length > 0) {
      const file = this.fileUploadService.updateFile(
        currentAudio.data.audio_podcast.file_attachment.file,
        files.file[0],
      );
      updateAudioPodcastDto.file = file.filePath;
    }

    const updatedAudio = await this.audioPodcastService.updateAudioByUuid(
      contentUuid,
      user['sub'],
      updateAudioPodcastDto,
    );

    return res.status(HttpStatus.OK).json(updatedAudio);
  }

  @Delete(':contentUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff', 'student')
  @ApiOkResponse({
    type: AudioPodcast,
  })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('contentUuid') contentUuid: string,
    @Res() res: Response,
  ) {
    const isExist = await this.audioPodcastService.findAudioByUuid(contentUuid);
    this.fileUploadService.deleteFile(isExist.data.thumbnail);
    this.fileUploadService.deleteFile(
      isExist.data.audio_podcast.file_attachment.file,
    );

    const audio = await this.audioPodcastService.removeAudioByUuid(contentUuid);

    return res.status(HttpStatus.OK).json(audio);
  }
}
