import { Module } from '@nestjs/common';
import { StudentService } from './students.service';
import { StudentController } from './students.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UuidHelper } from 'src/common/helpers/uuid.helper';

@Module({
  controllers: [StudentController],
  providers: [StudentService, UuidHelper],
  imports: [PrismaModule],
})
export class StudentModule {}
