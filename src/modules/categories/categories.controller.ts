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
  Query,
  Res,
  UploadedFiles,
} from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';
import { FileUpload } from '@decorators/file-upload.decorator';
import { SuccessResponse } from '@utils/api-response.util';
import { ApiException } from '@exceptions/api-exception';
import { Public } from '@decorators/public.decorator';

@ApiTags('Category')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'categories', version: '1' })
export class CategoryController {
  constructor(
    private readonly categoriesService: CategoryService,
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
    @Body() createCategoryDto: CreateCategoryDto,
  ) {
    try {
      const file = this.fileUploadService.handleFileUpload(files.avatar[0]);

      await this.categoriesService.createCategory({
        ...createCategoryDto,
        avatar: file.filePath,
      });

      return SuccessResponse.create(
        null,
        'Category successfully created!',
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
  async getAllCategories(@Query('search') search: string) {
    return SuccessResponse.create(
      await this.categoriesService.findAllCategory(search),
      'Categories successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Get(':name')
  @Public()
  async getCategoryByName(@Param('name') name: string) {
    return SuccessResponse.create(
      await this.categoriesService.findCategoryByName(name),
      'Category successfully fetched!',
      HttpStatus.OK,
    );
  }

  @Patch(':name')
  @UseGuards(RolesGuard)
  @Roles('staff')
  @FileUpload()
  async updateCategory(
    @Param('name') name: string,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
    },
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    try {
      const file = this.fileUploadService.handleFileUpload(files.avatar[0]);

      await this.categoriesService.updateCategoryByName(name, {
        ...updateCategoryDto,
        avatar: file.filePath,
      });

      return SuccessResponse.create(
        null,
        'Category successfully updated!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':name')
  @UseGuards(RolesGuard)
  @Roles('staff')
  async removeCategory(@Param('name') name: string) {
    try {
      const isExist = await this.categoriesService.findCategoryByName(name);
      this.fileUploadService.deleteFile(isExist.avatar);

      await this.categoriesService.removeCategoryByName(name);

      return SuccessResponse.create(
        null,
        'Category successfully deleted!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
