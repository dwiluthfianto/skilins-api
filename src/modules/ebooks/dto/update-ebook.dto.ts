import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateEbookDto } from './create-ebook.dto';
import { IsDate, IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateEbookDto extends PartialType(CreateEbookDto) {}
