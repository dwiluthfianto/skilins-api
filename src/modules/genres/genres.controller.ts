import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UploadedFile,
  Query,
  Res,
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
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Genre } from './entities/genre.entity';
import { Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FindGenreDto } from './dto/find-genre.dto';
@ApiTags('Genre')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'genres', version: '1' })
export class GenreController {
  constructor(
    private readonly genreService: GenreService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiCreatedResponse({ type: Genre })
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFile()
    avatar: Express.Multer.File,
    @Body() createGenreDto: CreateGenreDto,
    @Res() res: Response,
  ) {
    const file = this.fileUploadService.handleFileUpload(avatar);
    createGenreDto.avatar = file.filePath;
    const result = await this.genreService.createGenre(createGenreDto);
    return res.status(HttpStatus.CREATED).json(result);
  }

  @Get()
  @ApiOkResponse({ type: Genre })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'search by name for categories',
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindGenreDto) {
    return this.genreService.findAll(query);
  }

  @Get(':name')
  @ApiOkResponse({ type: Genre })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('name') name: string) {
    return this.genreService.findGenreByName(name);
  }

  @Patch(':genreUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOkResponse({ type: Genre })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('genreUuid') genreUuid: string,
    @UploadedFile() avatar: Express.Multer.File,
    @Body() updateGenreDto: UpdateGenreDto,
    @Res() res: Response,
  ) {
    const file = this.fileUploadService.handleFileUpload(avatar);
    updateGenreDto.avatar = file.filePath;
    const genre = await this.genreService.updateGenreByUuid(
      genreUuid,
      updateGenreDto,
    );

    return res.status(HttpStatus.OK).json(genre);
  }

  @Delete(':genreUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  @ApiOkResponse({ type: Genre })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('genreUuid') genreUuid: string, @Res() res: Response) {
    const result = await this.genreService.removeGenreByUuid(genreUuid);
    return res.status(HttpStatus.OK).json(result);
  }
}
