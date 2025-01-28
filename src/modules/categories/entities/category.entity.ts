import { ApiProperty } from '@nestjs/swagger';

export class Category {
  @ApiProperty({
    example: '36e401d8-a949-404a-bd55-d9115bbc319a',
    type: String,
  })
  uuid: string;

  @ApiProperty({ example: 'This is a name', type: String })
  name: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', type: String })
  avatar: string;

  @ApiProperty({ example: 'This is a description', type: String })
  description: string;
}
