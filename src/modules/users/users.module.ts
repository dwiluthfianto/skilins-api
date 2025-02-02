import { Logger, Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

import { FileUploadService } from '../file-upload/file-upload.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, FileUploadService, Logger],
  exports: [UserService], // Export UserService to be used in AuthModule and other modules
})
export class UserModule {}
