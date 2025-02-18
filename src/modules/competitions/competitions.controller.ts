import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  HttpStatus,
  Query,
  Delete,
  UploadedFiles,
} from '@nestjs/common';
import { CompetitionService } from './competitions.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { FindCompetitionDto } from './dto/find-competition.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FileUpload } from '@decorators/file-upload.decorator';
import { Public } from '@decorators/public.decorator';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';

@ApiTags('Competition')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'competitions', version: '1' })
export class CompetitionController {
  constructor(
    private readonly competitionsService: CompetitionService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async create(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
    },
    @Body() createCompetitionDto: CreateCompetitionDto,
  ) {
    try {
      const file = this.fileUploadService.handleFileUpload(files.thumbnail[0]);
      await this.competitionsService.createCompetition({
        ...createCompetitionDto,
        thumbnail: file.filePath,
      });
      return SuccessResponse.create(
        null,
        'Competition successfully created!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get()
  @Public()
  async getCompetitions(@Query() query: FindCompetitionDto) {
    const { data, pagination } =
      await this.competitionsService.findAllCompetition(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Competitions successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get('/detail/:slug')
  @Public()
  async getCompetitionDetail(
    @Param('slug') slug: string,
    @Query('status') status: string,
    @Query('type') type: string,
  ) {
    return SuccessResponse.create(
      await this.competitionsService.getCompetitionDetail(slug, type, status),
      'Competition detail successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get(':slug')
  @Public()
  async getCompetitionBySlug(@Param('slug') slug: string) {
    return SuccessResponse.create(
      await this.competitionsService.getCompetitionBySlug(slug),
      'Competition successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Patch(':competitionUuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async update(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
    },
    @Param('competitionUuid') competitionUuid: string,
    @Body() updateCompetitionDto: UpdateCompetitionDto,
  ) {
    try {
      const isExist =
        await this.competitionsService.findCompetitionByUuid(competitionUuid);

      const thumbnail =
        files.thumbnail && files.thumbnail[0]
          ? this.fileUploadService.handleFileUpload(files.thumbnail[0])
          : { filePath: updateCompetitionDto.thumbnail };

      await this.competitionsService.updateCompetition(competitionUuid, {
        ...updateCompetitionDto,
        thumbnail: thumbnail.filePath,
      });
      return SuccessResponse.create(
        null,
        'Competition successfully updated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':competitionUuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async removeCompetition(@Param('competitionUuid') competitionUuid: string) {
    try {
      const isExist =
        await this.competitionsService.getCompetitionByUuid(competitionUuid);
      this.fileUploadService.deleteFile(isExist.thumbnail);

      await this.competitionsService.removeCompetition(competitionUuid);

      return SuccessResponse.create(
        null,
        'Competition successfully deleted!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get(':uuid/winners')
  @Public()
  async getCompetitionWinners(@Param('uuid') uuid: string) {
    return SuccessResponse.create(
      await this.competitionsService.getWinnersForCompetition(uuid),
      'Competition winners successfully fetched!',
      HttpStatus.OK,
    );
  }
}
