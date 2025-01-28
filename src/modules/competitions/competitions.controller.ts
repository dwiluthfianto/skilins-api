import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
  Query,
  Delete,
  Res,
} from '@nestjs/common';
import { CompetitionService } from './competitions.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import {
  ApiBasicAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { Competition } from './entities/competition.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { FindCompetitionDto } from './dto/find-competition.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { Response } from 'express';

@ApiTags('Competition')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'competitions', version: '1' })
export class CompetitionController {
  constructor(
    private readonly competitionsService: CompetitionService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @ApiCreatedResponse({
    type: Competition,
  })
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiResponse({
    status: 201,
    description: 'The record has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(
    @UploadedFile()
    thumbnail: Express.Multer.File,
    @Body() createCompetitionDto: CreateCompetitionDto,
    @Res() res: Response,
  ) {
    try {
      const file = this.fileUploadService.handleFileUpload(thumbnail);
      createCompetitionDto.thumbnail = file.filePath;
      const result =
        await this.competitionsService.createCompetition(createCompetitionDto);
      return res.status(HttpStatus.CREATED).json(result);
    } catch (e) {
      console.error('Error during competition creation:', e.message);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to create competition.',
        detail: e.message,
      });
    }
  }

  @Get()
  findAll(@Query() query: FindCompetitionDto) {
    return this.competitionsService.findAllCompetition(query);
  }

  @Get('/detail/:slug')
  findOne(
    @Param('slug') slug: string,
    @Query('status') status: string,
    @Query('type') type: string,
  ) {
    return this.competitionsService.getCompetitionDetail(slug, type, status);
  }

  @Get(':slug')
  findOneBySlug(@Param('slug') slug: string) {
    return this.competitionsService.getCompetitionBySlug(slug);
  }

  @Patch(':competitionUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @ApiCreatedResponse({
    type: Competition,
  })
  @UseInterceptors(FileInterceptor('thumbnail'))
  @HttpCode(HttpStatus.OK)
  async update(
    @UploadedFile()
    thumbnail: Express.Multer.File,
    @Param('competitionUuid') competitionUuid: string,
    @Body() updateCompetitionDto: UpdateCompetitionDto,
    @Res() res: Response,
  ) {
    try {
      const isExist =
        await this.competitionsService.findCompetitionByUuid(competitionUuid);
      const file = this.fileUploadService.updateFile(
        isExist.data.thumbnail,
        thumbnail,
      );
      updateCompetitionDto.thumbnail = file.filePath;
      const competition = await this.competitionsService.updateCompetition(
        competitionUuid,
        updateCompetitionDto,
      );

      return res.status(HttpStatus.OK).json(competition);
    } catch (error) {
      console.error('Error updating category:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to update competition',
        detail: error.message,
      });
    }
  }

  @Delete(':competitionUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Staff')
  @ApiOkResponse({ type: Competition })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('competitionUuid') competitionUuid: string,
    @Res() res: Response,
  ) {
    try {
      const isExist =
        await this.competitionsService.getCompetitionByUuid(competitionUuid);
      this.fileUploadService.deleteFile(isExist.data.thumbnail);

      const result =
        await this.competitionsService.removeCompetition(competitionUuid);

      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      console.error('Error deleting category:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to delete category',
        detail: error.message,
      });
    }
  }

  @Get(':uuid/winners')
  async getCompetitionWinners(@Param('uuid') uuid: string) {
    return this.competitionsService.getWinnersForCompetition(uuid);
  }
}
