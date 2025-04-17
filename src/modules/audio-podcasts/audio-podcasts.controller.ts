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
  Req,
  Res,
} from '@nestjs/common';
import { AudioPodcastService } from './audio-podcasts.service';
import { CreateAudioPodcastDto } from './dto/create-audio-podcast.dto';
import { UpdateAudioPodcastDto } from './dto/update-audio-podcast.dto';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { Request, Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FileUpload } from '@decorators/file-upload.decorator';
import { ApiException } from '@exceptions/api-exception';
import { SuccessResponse } from '@utils/api-response.util';
import { Public } from '@decorators/public.decorator';

@ApiTags('Audios')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/audios', version: '1' })
export class AudioPodcastController {
  constructor(
    private readonly audioPodcastService: AudioPodcastService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('staff', 'student')
  @FileUpload()
  async createAudioPodcast(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body() createAudioPodcastDto: CreateAudioPodcastDto,
    @Req() req: Request,
  ) {
    const user = req.user;
    try {
      const thumbnail = this.fileUploadService.handleFileUpload(
        files.thumbnail[0],
      );

      const file = this.fileUploadService.handleFileUpload(files.file[0]);

      await this.audioPodcastService.createAudioPodcast(user['sub'], {
        ...createAudioPodcastDto,
        thumbnail: thumbnail?.filePath,
        file: file?.filePath,
      });
      return SuccessResponse.create(
        null,
        'Audio created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get()
  @Public()
  async getAllAudioByUser(@Query() query: FindContentQueryDto) {
    const { data, pagination } =
      await this.audioPodcastService.findAllAudioByUser(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Audio fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('summary-student')
  @UseGuards(RolesGuard)
  @Roles('student')
  async summaryAudioStudent(@Req() req: Request) {
    const user = req.user;

    return SuccessResponse.create(
      await this.audioPodcastService.summaryAudioStudent(user['sub']),
      'Audio summary fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('summary-staff')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async summaryAudioStaff() {
    return SuccessResponse.create(
      await this.audioPodcastService.summaryAudioStaff(),
      'Audio summary fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('staff')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async getAllAudioByStaff(@Query() query: FindContentQueryDto) {
    const { data, pagination } =
      await this.audioPodcastService.findAllAudioByStaff(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Audio fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get('student')
  @UseGuards(RolesGuard)
  @Roles('student')
  async findUserAudio(
    @Req() req: Request,
    @Query() query: FindContentQueryDto,
  ) {
    const user = req.user;
    const { data, pagination } = await this.audioPodcastService.fetchUserAudios(
      user['sub'],
      query,
    );
    return SuccessResponse.paginate(
      data,
      pagination,
      'Audio fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get(':slug')
  @Public()
  async getAudioBySlug(@Param('slug') slug: string) {
    return SuccessResponse.create(
      await this.audioPodcastService.findAudioBySlug(slug),
      'Audio fetched successfully',
      HttpStatus.OK,
    );
  }

  @Patch(':contentUuid')
  @UseGuards(RolesGuard)
  @Roles('staff', 'student')
  @FileUpload()
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

      const thumbnail =
        files.thumbnail && files.thumbnail[0]
          ? this.fileUploadService.updateFile(
              currentAudio.thumbnail,
              files.thumbnail[0],
            )
          : { filePath: currentAudio.thumbnail };

      const file =
        files.file && files.file[0]
          ? this.fileUploadService.updateFile(
              currentAudio.audio_podcast.file_attachment.file,
              files.file[0],
            )
          : { filePath: currentAudio.audio_podcast.file_attachment.file };

      await this.audioPodcastService.updateAudioByUuid(
        contentUuid,
        user['sub'],
        {
          ...updateAudioPodcastDto,
          thumbnail: thumbnail.filePath,
          file: file.filePath,
        },
      );

      return SuccessResponse.create(
        null,
        'Audio updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':contentUuid')
  @UseGuards(RolesGuard)
  @Roles('staff', 'student')
  async remove(@Param('contentUuid') contentUuid: string) {
    const isExist = await this.audioPodcastService.findAudioByUuid(contentUuid);
    this.fileUploadService.deleteFile(isExist.thumbnail);
    this.fileUploadService.deleteFile(
      isExist.audio_podcast.file_attachment.file,
    );

    await this.audioPodcastService.removeAudioByUuid(contentUuid);

    return SuccessResponse.create(
      null,
      'Audio deleted successfully',
      HttpStatus.OK,
    );
  }
}
