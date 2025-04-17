import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectSubmissionDto {
  @ApiProperty({ example: 'Reason of rejection', type: String })
  @IsNotEmpty()
  @IsString()
  reason: string;
}
