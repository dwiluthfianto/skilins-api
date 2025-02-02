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
  UploadedFiles,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { PrakerinService } from './prakerin.service';
import { CreatePrakerinDto } from './dto/create-prakerin.dto';
import { UpdatePrakerinDto } from './dto/update-prakerin.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Prakerin } from './entities/prakerin.entity';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { FindPrakerinQueryDto } from '../contents/dto/find-prakerin-query.dto';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('Prakerin')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'contents/prakerin', version: '1' })
export class PrakerinController {
  constructor(
    private readonly prakerinService: PrakerinService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('student')
  @ApiCreatedResponse({
    type: Prakerin,
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'file', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body() createPrakerinDto: CreatePrakerinDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user;
    const thumbnail = this.fileUploadService.handleFileUpload(
      files.thumbnail[0],
    );
    createPrakerinDto.thumbnail = thumbnail.filePath;

    const file_prakerin = this.fileUploadService.handleFileUpload(
      files.file[0],
    );
    createPrakerinDto.file = file_prakerin.filePath;

    const result = await this.prakerinService.createPrakerin(
      user['sub'],
      createPrakerinDto,
    );
    return res.status(HttpStatus.CREATED).json(result);
  }

  @Get()
  @ApiOkResponse({
    type: Prakerin,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: FindPrakerinQueryDto) {
    return this.prakerinService.findAllPrakerin(query);
  }

  @Get('student')
  @ApiOkResponse({
    type: Prakerin,
    isArray: true,
  })
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('student')
  @HttpCode(HttpStatus.OK)
  async findUserPrakerin(
    @Req() req: Request,
    @Query() query: FindPrakerinQueryDto,
  ) {
    const user = req.user;
    return await this.prakerinService.fetchUserPrakerin(user['sub'], query);
  }

  @Get(':slug')
  @ApiOkResponse({
    type: Prakerin,
  })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('slug') slug: string) {
    return this.prakerinService.findPrakerinBySlug(slug);
  }

  @Patch(':uuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('student')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'file', maxCount: 1 },
    ]),
  )
  @ApiOkResponse({
    type: Prakerin,
  })
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('uuid') uuid: string,
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      file?: Express.Multer.File[];
    },
    @Body() updatePrakerinDto: UpdatePrakerinDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = req.user;
    const isExist = await this.prakerinService.findPrakerinByUuid(uuid);

    if (files.thumbnail && files.thumbnail.length > 0) {
      const thumbnail = this.fileUploadService.updateFile(
        isExist.data.thumbnail,
        files.thumbnail[0],
      );
      updatePrakerinDto.thumbnail = thumbnail.filePath;
    }

    if (files.file && files.file.length > 0) {
      const file_prakerin = this.fileUploadService.updateFile(
        isExist.data.prakerin.file_attachment.file,
        files.file[0],
      );
      updatePrakerinDto.file = file_prakerin.filePath;
    }

    const updatedPrakerin = await this.prakerinService.updatePrakerinByUuid(
      uuid,
      user['sub'],
      updatePrakerinDto,
    );

    return res.status(HttpStatus.OK).json(updatedPrakerin);
  }

  @Delete(':contentUuid')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOkResponse({
    type: Prakerin,
  })
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('contentUuid') contentUuid: string,
    @Res() res: Response,
  ) {
    const isExist = await this.prakerinService.findPrakerinByUuid(contentUuid);
    this.fileUploadService.deleteFile(isExist.data.thumbnail);
    this.fileUploadService.deleteFile(
      isExist.data.prakerin.file_attachment.file,
    );

    const prakerin =
      await this.prakerinService.removePrakerinByUuid(contentUuid);

    return res.status(HttpStatus.OK).json(prakerin);
  }

  @Get('summary-staff')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('staff')
  summaryPrakerinStaff() {
    return this.prakerinService.summaryPrakerinStaff();
  }
}
