import { PartialType } from '@nestjs/swagger';
import { CreatePrakerinDto } from './create-prakerin.dto';

export class UpdatePrakerinDto extends PartialType(CreatePrakerinDto) {}
