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
  @Roles('Staff', 'Student')
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
    try {
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
    } catch (e) {
      console.error('Error during audio podcast creation:', e.message);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to create audio podcast.',
        detail: e.message,
      });
    }
  }

  @Get()
  @ApiOkResponse({
    type: AudioPodcast,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindContentQueryDto) {
    return this.audioPodcastService.findAllAudio(query);
  }

  @Get('student')
  @ApiOkResponse({
    type: AudioPodcast,
    isArray: true,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
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
  @Roles('Staff', 'Student')
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
    try {
      const currentAudio =
        await this.audioPodcastService.findAudioByUuid(contentUuid);

      const thumbnail = this.fileUploadService.updateFile(
        currentAudio.data.thumbnail,
        files.thumbnail[0],
      );
      updateAudioPodcastDto.thumbnail = thumbnail.filePath;

      const file = this.fileUploadService.updateFile(
        currentAudio.data.audio_podcast.file_attachment.file,
        files.file[0],
      );
      updateAudioPodcastDto.file = file.filePath;

      const updatedAudio = await this.audioPodcastService.updateAudioByUuid(
        contentUuid,
        user['sub'],
        updateAudioPodcastDto,
      );

      return res.status(HttpStatus.OK).json(updatedAudio);
    } catch (error) {
      console.error('Error updating audio:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to update audio!',
        detail: error.message,
      });
    }
  }

  @Delete(':contentUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff', 'Student')
  @ApiOkResponse({
    type: AudioPodcast,
  })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('contentUuid') contentUuid: string,
    @Res() res: Response,
  ) {
    try {
      const isExist =
        await this.audioPodcastService.findAudioByUuid(contentUuid);
      this.fileUploadService.deleteFile(isExist.data.thumbnail);
      this.fileUploadService.deleteFile(
        isExist.data.audio_podcast.file_attachment.file,
      );

      const audio =
        await this.audioPodcastService.removeAudioByUuid(contentUuid);

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
