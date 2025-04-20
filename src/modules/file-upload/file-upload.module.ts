import { Global, Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';

@Global()
@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: path.join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const extension = path.extname(file.originalname);
          const filename = `${timestamp}-${randomString}${extension}`;
          cb(null, filename);
        },
      }),
    }),
  ],
  providers: [FileUploadService],
  exports: [MulterModule, FileUploadService],
})
export class FileUploadModule {}
