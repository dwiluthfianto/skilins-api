import { ApiProperty } from '@nestjs/swagger';

export class Major {
  @ApiProperty({
    example: '36e401d8-a949-404a-bd55-d9115bbc319a',
    type: String,
  })
  uuid: string;

  @ApiProperty({
    example: 'this is a name',
    type: String,
  })
  name: string;

  @ApiProperty({
    example: 'this is an image',
    type: String,
  })
  image: string;

  @ApiProperty({
    example: 'this is a description',
    type: String,
  })
  description: string;

  @ApiProperty({
    example: 'this is an avatar',
    type: String,
  })
  avatar: string;
}
