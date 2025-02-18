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
} from '@nestjs/common';
import { StudentService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { FindStudentDto } from './dto/find-student.dto';
import { ApiException } from '@exceptions/api-exception';
import { SuccessResponse } from '@utils/api-response.util';

@ApiTags('student')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'students', version: '1' })
@UseGuards(RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @Roles('user')
  async create(@Body() createStudentDto: CreateStudentDto) {
    try {
      await this.studentService.create(createStudentDto);
      return SuccessResponse.create(
        null,
        'Student created successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Get()
  @Roles('staff')
  async getStudents(@Query() query: FindStudentDto) {
    const { data, pagination } =
      await this.studentService.findAllStudent(query);
    return SuccessResponse.paginate(
      data,
      pagination,
      'Students fetched successfully',
      HttpStatus.OK,
    );
  }

  @Get(':uuid')
  @Roles('staff', 'student')
  async getStudent(@Param('uuid') uuid: string) {
    return SuccessResponse.create(
      await this.studentService.findOne(uuid),
      'Student fetched successfully',
      HttpStatus.OK,
    );
  }

  @Patch(':uuid')
  @Roles('staff', 'student')
  async update(
    @Param('uuid') uuid: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    try {
      await this.studentService.update(uuid, updateStudentDto);
      return SuccessResponse.create(
        null,
        'Student updated successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Patch(':uuid/verify-student')
  @Roles('staff')
  async verifiedStudent(@Param('uuid') uuid: string) {
    try {
      await this.studentService.verifiedStudent(uuid);
      return SuccessResponse.create(
        null,
        'Student verified successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }

  @Delete(':uuid')
  @Roles('staff')
  async remove(@Param('uuid') uuid: string) {
    try {
      await this.studentService.remove(uuid);
      return SuccessResponse.create(
        null,
        'Student deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new ApiException(error.message, error.status);
    }
  }
}
