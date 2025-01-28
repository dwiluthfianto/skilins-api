import { ApiProperty } from '@nestjs/swagger';
import { Comment, Rating, Genre } from '@prisma/client';
import { Contents } from 'src/modules/contents/content.interface';

export class Ebook implements Contents {
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
    example: 'Fiction',
    type: String,
  })
  category: string;

  @ApiProperty({ example: 'J.K Rowling', type: String })
  author: string;

  @ApiProperty({ example: 0, type: Number })
  pages: number;

  @ApiProperty({ example: 'This is a Publication', type: String })
  publication: string;

  @ApiProperty({ example: 'https://example.com/test.pdf', type: String })
  file_url: string;

  @ApiProperty({ example: 'This is an ISBN', type: String })
  isbn: string;

  @ApiProperty({ example: '2024-04-30T04:00:00.000Z', type: Date })
  release_date: Date;

  @ApiProperty({ example: '[]', type: String })
  genres: Genre[];

  @ApiProperty({ example: '[]', type: String })
  comments: Comment[];

  @ApiProperty({ example: '[]', type: String })
  ratings: Rating[];
}
