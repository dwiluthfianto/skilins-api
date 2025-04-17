import { Test, TestingModule } from '@nestjs/testing';
import { VideoPodcastService } from './video-podcasts.service';

describe('VideoPodcastService', () => {
  let service: VideoPodcastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VideoPodcastService],
    }).compile();

    service = module.get<VideoPodcastService>(VideoPodcastService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
