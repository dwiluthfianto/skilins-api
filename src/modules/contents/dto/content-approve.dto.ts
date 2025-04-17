import { ApiProperty } from '@nestjs/swagger';
import { ContentStatus } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';

export class ContentApproveDto {
  @ApiProperty({
    example: 'PENDING',
    enum: ContentStatus,
  })
  @IsNotEmpty()
  status: ContentStatus;
}
