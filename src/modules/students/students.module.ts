import { Module } from '@nestjs/common';
import { StudentService } from './students.service';
import { StudentController } from './students.controller';

@Module({
  controllers: [StudentController],
  providers: [StudentService],
  imports: [],
})
export class StudentModule {}
