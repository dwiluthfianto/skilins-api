import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  HttpStatus,
  Query,
  UploadedFiles,
} from '@nestjs/common';
import { StoryService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { AddStoryEpisodeDto } from './dto/add-episode-story.dto.ts';
import { Request } from 'express';
import { UpdateStoryEpisodeDto } from './dto/update-episode-story.dto.ts';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FileUpload } from '@decorators/file-upload.decorator';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';
import { Public } from '@decorators/public.decorator';

@ApiTags('Stories')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/stories', version: '1' })
export class StoryController {
  constructor(
    private readonly storyService: StoryService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @FileUpload()
  @Roles('student')
  @ApiConsumes('multipart/form-data')
  async createStory(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
    },
    @Body() createStoryDto: CreateStoryDto,
    @Req() req: Request,
  ) {
    const user = req.user;
    try {
      const thumbnail = this.fileUploadService.handleFileUpload(
        files.thumbnail[0],
      );

      await this.storyService.create(user['sub'], {
        ...createStoryDto,
        thumbnail: thumbnail.filePath,
      });

      return SuccessResponse.create(
        null,
        'Story successfully created!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Post(':storyUuid/episodes')
  @UseGuards(RolesGuard)
  @FileUpload()
  @Roles('student')
  async addEpisodeToStory(
    @Param('storyUuid') storyUuid: string,
    @Req() req: Request,
    @Body() addStoryEpisodeDto: AddStoryEpisodeDto,
  ) {
    const user = req.user;
    const authorUuid = user['sub'];
    try {
      await this.storyService.addEpisode(
        storyUuid,
        authorUuid,
        addStoryEpisodeDto,
      );

      return SuccessResponse.create(
        null,
        'Episode successfully added to story!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get()
  @Public()
  async getStories(@Query() query: FindContentQueryDto) {
    const { data, pagination } =
      await this.storyService.findAllStoryByUser(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Stories successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('summary-student')
  @UseGuards(RolesGuard)
  @Roles('student')
  summaryStoryStudent(@Req() req: Request) {
    const user = req.user;
    return SuccessResponse.create(
      this.storyService.summaryStoryStudent(user['sub']),
      'Summary story student successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('summary-staff')
  @UseGuards(RolesGuard)
  @Roles('staff')
  summaryStoryStaff() {
    return SuccessResponse.create(
      this.storyService.summaryStoryStaff(),
      'Summary story staff successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('staff')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async getStoriesByStaff(@Query() query: FindContentQueryDto) {
    const { data, pagination } =
      await this.storyService.findAllStoryByStaff(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Stories successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('student')
  @UseGuards(RolesGuard)
  @Roles('student')
  async getUserStories(
    @Req() req: Request,
    @Query() query: FindContentQueryDto,
  ) {
    const user = req.user;
    const { data, pagination } = await this.storyService.fetchUserStories(
      user['sub'],
      query,
    );
    return SuccessResponse.paginate(
      data,
      pagination,
      'Stories successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get(':slug')
  @Public()
  getStoryWithEpisodes(@Param('slug') slug: string) {
    return SuccessResponse.create(
      this.storyService.getStoryBySlug(slug),
      'Story successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('episode/:slug')
  @Public()
  getOneEpisode(@Param('slug') slug: string, @Query('order') order: number) {
    return SuccessResponse.create(
      this.storyService.getOneEpisode(slug, order),
      'Episode successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('episodes/:slug')
  @Public()
  getEpisode(@Param('slug') slug: string, @Query('order') order: number) {
    return SuccessResponse.create(
      this.storyService.getEpisode(slug, order),
      'Episode successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Patch('episodes/:episodeUuid')
  @UseGuards(RolesGuard)
  @Roles('student')
  async updateEpisode(
    @Param('episodeUuid') episodeUuid: string,
    @Req() req: Request,
    @Body() updateStoryEpisodeDto: UpdateStoryEpisodeDto,
  ) {
    const user = req.user;
    const authorUuid = user['sub'];
    try {
      await this.storyService.updateEpisode(
        episodeUuid,
        authorUuid,
        updateStoryEpisodeDto,
      );

      return SuccessResponse.create(
        null,
        'Episode successfully updated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Patch(':contentUuid')
  @UseGuards(RolesGuard)
  @Roles('student')
  @FileUpload()
  async updateStory(
    @Param('contentUuid') contentUuid: string,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
    },
    @Req() req: Request,
    @Body() updateStoryDto: UpdateStoryDto,
  ) {
    const user = req.user;
    const authorUuid = user['sub'];

    try {
      const isExist = await this.storyService.getStoryByUuid(contentUuid);

      const thumbnail = files.thumbnail
        ? this.fileUploadService.updateFile(
            isExist.thumbnail,
            files.thumbnail[0],
          )
        : { filePath: isExist.thumbnail };

      await this.storyService.updateStory(contentUuid, authorUuid, {
        ...updateStoryDto,
        thumbnail: thumbnail.filePath,
      });

      return SuccessResponse.create(
        null,
        'Story successfully updated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete('episodes/:episodeUuid')
  @UseGuards(RolesGuard)
  @Roles('student', 'staff')
  async deleteEpisode(@Param('episodeUuid') episodeUuid: string) {
    try {
      await this.storyService.deleteEpisode(episodeUuid);

      return SuccessResponse.create(
        null,
        'Episode successfully deleted!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':storyUuid')
  @UseGuards(RolesGuard)
  @Roles('student', 'staff')
  async deleteStory(@Param('storyUuid') storyUuid: string) {
    const isExist = await this.storyService.getStoryByUuid(storyUuid);
    try {
      this.fileUploadService.deleteFile(isExist.thumbnail);
      await this.storyService.deleteStory(storyUuid);

      return SuccessResponse.create(
        null,
        'Story successfully deleted!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
