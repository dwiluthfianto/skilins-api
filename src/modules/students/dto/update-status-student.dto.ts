import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class StatusStudentDto {
  @ApiProperty({ example: 'true', type: Boolean })
  @Transform(({ value }) => Boolean(value))
  @IsBoolean()
  @IsNotEmpty()
  status: boolean;
}
