import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
  }

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
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException(
        'invalid file type',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    let maxSize: number;
    switch (file.mimetype) {
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        maxSize = 2 * 1024 * 1024;
        break;
      case 'application/pdf':
        maxSize = 5 * 1024 * 1024;
        break;
      case 'audio/mpeg':
      case 'audio/mp3':
      case 'audio/wav':
      case 'audio/ogg':
        maxSize = 15 * 1024 * 1024;
        break;
      default:
        throw new HttpException(
          'invalid file type',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
    }

    if (file.size > maxSize) {
      throw new HttpException(
        'File is too large',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const fileUrl = `${process.env.BACKEND_DOMAIN}/public/${file.filename.replace('\\', '/')}`;

    return { filePath: fileUrl };
  }

  deleteFile(filename: string) {
    const filePath = this.extractFilePathFromUrl(filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    fs.unlinkSync(filePath);
    return { message: 'File deleted successfully' };
  }

  updateFile(oldFilename: string, newFile: Express.Multer.File) {
    this.deleteFile(oldFilename);
    return this.handleFileUpload(newFile);
  }
}
