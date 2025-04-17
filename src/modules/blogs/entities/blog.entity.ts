import { ApiProperty } from '@nestjs/swagger';
import { Comment, Rating, Genre } from '@prisma/client';
import { Contents } from 'src/modules/contents/content.interface';

export class Blog implements Contents {
  @ApiProperty({
    example: '36e401d8-a949-404a-bd55-d9115bbc319a',
    type: String,
  })
  uuid: string;

  @ApiProperty({
    example: 'This is a title',
    type: String,
  })
  title: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    type: String,
  })
  thumbnail: string;

  @ApiProperty({
    example: 'This is a description',
    type: String,
  })
  description: string;

  @ApiProperty({
    example: ['Fiction', 'War'],
    type: String,
  })
  subjects: string[];

  @ApiProperty({
    example: '2024-04-30T04:00:00.000Z',
    type: Date,
  })
  created_at: Date;

  @ApiProperty({
    example: '2024-04-30T04:00:00.000Z',
    type: Date,
  })
  updated_at: Date;

  @ApiProperty({
    example: 1,
    type: String,
  })
  category_uuid: string;

  @ApiProperty({
    example: '36e401d8-a949-404a-bd55-d9115bbc319a',
    type: String,
  })
  author_uuid: string;

  @ApiProperty({ example: '[]', type: String })
  genres: Genre[];

  @ApiProperty({ example: '[]', type: String })
  comments: Comment[];

  @ApiProperty({ example: '[]', type: String })
  ratings: Rating[];
}
