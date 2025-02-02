import { ApiProperty } from '@nestjs/swagger';
import { SexType } from '@prisma/client';

export class student {
  @ApiProperty({ example: '123456', type: String })
  nis: string;

  @ApiProperty({ example: 'Jane Doe', type: String })
  name: string;

  @ApiProperty({
    example: 'RPL',
    type: String,
  })
  major: string;

  @ApiProperty({ example: 'Bogor', type: String })
  birthplace: string;

  @ApiProperty({ example: '2024-04-30T04:00:00.000Z', type: Date })
  birthdate: Date;

  @ApiProperty({ example: 'male', enum: SexType })
  sex: SexType;

  @ApiProperty({ example: 'true', type: Boolean })
  status: boolean = true;
}
