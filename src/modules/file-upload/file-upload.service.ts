import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
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
      throw new BadRequestException('no file uploaded');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException(
        'invalid file type',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
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
