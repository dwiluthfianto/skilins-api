import { Test, TestingModule } from '@nestjs/testing';
import { AudioPodcastService } from './audio-podcasts.service';

describe('AudioPodcastService', () => {
  let service: AudioPodcastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AudioPodcastService],
    }).compile();

    service = module.get<AudioPodcastService>(AudioPodcastService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
