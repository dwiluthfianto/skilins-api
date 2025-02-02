import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  constructor(
    @Inject(Logger)
    private readonly logger: Logger,
  ) {
    this.logger = new Logger('File Upload Logger');
  }
  private uploadDir = './uploads';

  private extractFilePathFromUrl(fileUrl: string): string {
    const relativePath = fileUrl.replace(
      `${process.env.BACKEND_DOMAIN}/public/`,
      '',
    );
    const filePath = path.join(
      this.uploadDir,
      relativePath.replace(/\//g, path.sep),
    );
    return filePath;
  }

  handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      this.logger.error('No file uploaded');
      throw new BadRequestException('no file uploaded');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      this.logger.error('Invalid file type');
      throw new HttpException(
        'invalid file type',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.logger.error('File is to large');
      throw new HttpException(
        'File is to large',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const fileUrl = `${process.env.BACKEND_DOMAIN}/public/${file.filename.replace('\\', '/')}`;

    return { filePath: fileUrl };
  }

  deleteFile(filename: string) {
    const filePath = this.extractFilePathFromUrl(filename);
    if (!fs.existsSync(filePath)) {
      this.logger.error('File not found');
      throw new BadRequestException('File not found');
    }
    fs.unlinkSync(filePath);
    return { message: 'File deleted successfully' };
  }

  updateFile(oldFilename: string, newFile: Express.Multer.File) {
    this.deleteFile(oldFilename);
    return this.handleFileUpload(newFile);
  }
}
