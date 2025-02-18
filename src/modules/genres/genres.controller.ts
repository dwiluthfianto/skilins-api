import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { GenreService } from './genres.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import {
  ApiBasicAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from '@guards/roles.guard';
import { Roles } from '@decorators/roles.decorator';
import { FileUploadService } from '@modules/file-upload/file-upload.service';
import { FindGenreDto } from './dto/find-genre.dto';
import { FileUpload } from '@decorators/file-upload.decorator';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';
import { Public } from '@decorators/public.decorator';
@ApiTags('Genre')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'genres', version: '1' })
export class GenreController {
  constructor(
    private readonly genreService: GenreService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async create(
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
    },
    @Body() createGenreDto: CreateGenreDto,
  ) {
    try {
      const file = this.fileUploadService.handleFileUpload(files.avatar[0]);

      await this.genreService.createGenre({
        ...createGenreDto,
        avatar: file.filePath,
      });
      return SuccessResponse.create(
        null,
        'Genre successfully created!',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get()
  @Public()
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'search by name for categories',
  })
  @HttpCode(HttpStatus.OK)
  async getGenres(@Query() query: FindGenreDto) {
    const { data, pagination } = await this.genreService.findAllGenre(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Genre successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get(':name')
  @Public()
  async getGenreByName(@Param('name') name: string) {
    return SuccessResponse.create(
      await this.genreService.findGenreByName(name),
      'Genre successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Patch(':genreUuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async updateGenre(
    @Param('genreUuid') genreUuid: string,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
    },
    @Body() updateGenreDto: UpdateGenreDto,
  ) {
    try {
      const avatar = this.fileUploadService.handleFileUpload(files.avatar[0]);
      await this.genreService.updateGenreByUuid(genreUuid, {
        ...updateGenreDto,
        avatar: avatar.filePath,
      });
      return SuccessResponse.create(
        null,
        'Genre successfully updated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':genreUuid')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async removeGenre(@Param('genreUuid') genreUuid: string) {
    try {
      await this.genreService.removeGenreByUuid(genreUuid);
      return SuccessResponse.create(
        null,
        'Genre successfully deleted!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
