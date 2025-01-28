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
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { StoryService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { AddStoryEpisodeDto } from './dto/add-episode-story.dto.ts';
import { Request, Response } from 'express';
import { UpdateStoryEpisodeDto } from './dto/update-episode-story.dto.ts';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { FindContentQueryDto } from '../contents/dto/find-content-query.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('Stories')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/stories', version: '1' })
export class StoryController {
  constructor(
    private readonly storyService: StoryService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(FileInterceptor('thumbnail'))
  @Roles('Student')
  @ApiConsumes('multipart/form-data')
  async createStory(
    @UploadedFile()
    thumbnail: Express.Multer.File,
    @Body() createStoryDto: CreateStoryDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user;
    try {
      const file = this.fileUploadService.handleFileUpload(thumbnail);
      createStoryDto.thumbnail = file.filePath;
      const result = await this.storyService.create(
        user['sub'],
        createStoryDto,
      );
      return res.status(HttpStatus.CREATED).json(result);
    } catch (e) {
      console.error('Error during Blog creation:', e.message);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to create story.',
        detail: e.message,
      });
    }
  }

  @Post(':storyUuid/episodes')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
  addEpisodeToStory(
    @Param('storyUuid') storyUuid: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() addStoryEpisodeDto: AddStoryEpisodeDto,
  ) {
    const user = req.user;
    try {
      const authorUuid = user['sub'];
      const result = this.storyService.addEpisode(
        storyUuid,
        authorUuid,
        addStoryEpisodeDto,
      );

      return res.status(HttpStatus.CREATED).json(result);
    } catch (e) {
      console.error('Error during Blog creation:', e.message);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to create story.',
        detail: e.message,
      });
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindContentQueryDto) {
    return this.storyService.findAllStory(query);
  }

  @Get('student')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
  @HttpCode(HttpStatus.OK)
  async findUserStories(
    @Req() req: Request,
    @Query() query: FindContentQueryDto,
  ) {
    const user = req.user;
    return await this.storyService.fetchUserStories(user['sub'], query);
  }

  @Get(':slug')
  getStoryWithEpisodes(@Param('slug') slug: string) {
    return this.storyService.getStoryBySlug(slug);
  }

  @Get('episode/:slug')
  getOneEpisode(@Param('slug') slug: string, @Query('order') order: number) {
    return this.storyService.getOneEpisode(slug, order);
  }

  @Get('episodes/:slug')
  getEpisode(@Param('slug') slug: string, @Query('order') order: number) {
    return this.storyService.getEpisode(slug, order);
  }

  @Patch('episodes/:episodeUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
  updateEpisode(
    @Param('episodeUuid') episodeUuid: string,
    @Req() req: Request,
    @Body() updateStoryEpisodeDto: UpdateStoryEpisodeDto,
  ) {
    const user = req.user;
    const authorUuid = user['sub'];
    return this.storyService.updateEpisode(
      episodeUuid,
      authorUuid,
      updateStoryEpisodeDto,
    );
  }
  @Patch(':contentUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student')
  updateStory(
    @Param('contentUuid') contentUuid: string,
    @Req() req: Request,
    @Body() updateStoryDto: UpdateStoryDto,
  ) {
    const user = req.user;
    const authorUuid = user['sub'];
    return this.storyService.updateStory(
      contentUuid,
      authorUuid,
      updateStoryDto,
    );
  }

  @Delete('episodes/:episodeUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student', 'Staff')
  deleteEpisode(@Param('episodeUuid') episodeUuid: string) {
    return this.storyService.deleteEpisode(episodeUuid);
  }

  @Delete(':storyUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Student', 'Staff')
  deleteStory(@Param('storyUuid') storyUuid: string) {
    return this.storyService.deleteStory(storyUuid);
  }
}
