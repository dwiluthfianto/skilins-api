import { Test, TestingModule } from '@nestjs/testing';
import { AudioPodcastController } from './audio-podcasts.controller';
import { AudioPodcastService } from './audio-podcasts.service';

describe('AudioPodcastController', () => {
  let controller: AudioPodcastController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AudioPodcastController],
      providers: [AudioPodcastService],
    }).compile();

    controller = module.get<AudioPodcastController>(AudioPodcastController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
