// src/common/decorators/file-upload.decorator.ts
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

export function FileUpload() {
  return applyDecorators(
    UseInterceptors(
      FileFieldsInterceptor([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'file', maxCount: 1 },
        { name: 'avatar', maxCount: 1 },
        { name: 'cover', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
        { name: 'background', maxCount: 1 },
        { name: 'profile', maxCount: 1 },
        { name: 'image', maxCount: 1 },
      ]),
    ),
    ApiConsumes('multipart/form-data'),
  );
}
