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
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { StudentService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  ApiBasicAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { student } from './entities/student.entity';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { FindStudentDto } from './dto/find-student.dto';
import { Response } from 'express';

@ApiTags('student')
@ApiBasicAuth('JWT-auth')
@Controller({ path: 'students', version: '1' })
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @ApiCreatedResponse({
    type: student,
  })
  @Roles('user')
  @ApiConsumes('multipart/form-data')
  async create(
    @Body() createStudentDto: CreateStudentDto,
    @Res() res: Response,
  ) {
    const result = await this.studentService.create(createStudentDto);
    return res.status(HttpStatus.CREATED).json(result);
  }

  @Get()
  @ApiOkResponse({
    type: student,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  @Roles('staff')
  findAll(@Query() query: FindStudentDto) {
    return this.studentService.findAllStudent(query);
  }

  @Get(':uuid')
  @ApiOkResponse({
    type: student,
  })
  @HttpCode(HttpStatus.OK)
  @Roles('staff', 'student')
  findOne(@Param('uuid') uuid: string) {
    return this.studentService.findOne(uuid);
  }

  @Patch(':uuid')
  @ApiOkResponse({
    type: student,
  })
  @HttpCode(HttpStatus.OK)
  @Roles('staff', 'student')
  async update(
    @Param('uuid') uuid: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Res() res: Response,
  ) {
    const result = await this.studentService.update(uuid, updateStudentDto);
    return res.status(HttpStatus.OK).json(result);
  }

  @Patch(':uuid/verify-student')
  @ApiOkResponse({
    type: student,
  })
  @HttpCode(HttpStatus.OK)
  @Roles('staff')
  async verifyStudent(@Param('uuid') uuid: string) {
    return await this.studentService.verifiedStudent(uuid);
  }

  @Delete(':uuid')
  @ApiOkResponse({
    type: student,
  })
  @HttpCode(HttpStatus.OK)
  @Roles('staff')
  async remove(@Param('uuid') uuid: string) {
    return await this.studentService.remove(uuid);
  }
}
