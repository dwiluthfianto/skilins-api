import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class UuidInBodyValidationPipe implements PipeTransform {
  transform(value: any) {
    // Misalnya, validasi creator_uuid di dalam body
    if (value.creator_uuid && !isUUID(value.creator_uuid)) {
      throw new BadRequestException(
        `Invalid UUID for creator_uuid: ${value.creator_uuid}`,
      );
    }

    if (value.category_uuid && !isUUID(value.category_uuid)) {
      throw new BadRequestException(
        `Invalid UUID for category_id: ${value.category_id}`,
      );
    }

    return value;
  }
}
