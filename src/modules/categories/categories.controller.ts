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
  UploadedFile,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import {
  ApiBearerAuth,
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
import { Response } from 'express';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('Category')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'categories', version: '1' })
export class CategoryController {
  constructor(
    private readonly categoriesService: CategoryService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiCreatedResponse({ type: Category })
  @ApiConsumes('multipart/form-data')
  async create(
    @UploadedFile() avatar: Express.Multer.File,
    @Body() createCategoryDto: CreateCategoryDto,
    @Res() res: Response,
  ) {
    try {
      const file = this.fileUploadService.handleFileUpload(avatar);
      createCategoryDto.avatar = file.filePath;
      const result =
        await this.categoriesService.createCategory(createCategoryDto);

      return res.status(HttpStatus.CREATED).json(result);
    } catch (e) {
      console.error('Error during category creation:', e.message);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to create category.',
        detail: e.message,
      });
    }
  }
  @Get()
  @ApiOkResponse({ type: Category, isArray: true })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'search by name for categories',
  })
  @HttpCode(HttpStatus.OK)
  findAll(@Query('search') search: string) {
    return this.categoriesService.findAllCategory(search);
  }

  @Get(':name')
  @ApiOkResponse({ type: Category })
  @HttpCode(HttpStatus.OK)
  findOne(@Param('name') name: string) {
    return this.categoriesService.findCategoryByName(name);
  }

  @Patch(':name')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOkResponse({ type: Category })
  @ApiConsumes('multipart/form-data')
  async update(
    @Param('name') name: string,
    @UploadedFile() avatar: Express.Multer.File,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Res() res: Response,
  ) {
    try {
      const isExist = await this.categoriesService.findCategoryByName(name);

      const file = this.fileUploadService.updateFile(
        isExist.data.avatar,
        avatar,
      );
      updateCategoryDto.avatar = file.filePath;

      const updatedCategory = await this.categoriesService.updateCategoryByName(
        name,
        updateCategoryDto,
      );

      return res.status(HttpStatus.OK).json(updatedCategory);
    } catch (error) {
      console.error('Error updating category:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to update category',
        detail: error.message,
      });
    }
  }

  @Delete(':name')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @ApiOkResponse({ type: Category })
  async remove(@Param('name') name: string, @Res() res: Response) {
    try {
      const isExist = await this.categoriesService.findCategoryByName(name);
      this.fileUploadService.deleteFile(isExist.data.avatar);

      const category = await this.categoriesService.removeCategoryByName(name);

      return res.status(HttpStatus.OK).json(category);
    } catch (error) {
      console.error('Error deleting category:', error.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'failed',
        message: 'Failed to delete category',
        detail: error.message,
      });
    }
  }
}
