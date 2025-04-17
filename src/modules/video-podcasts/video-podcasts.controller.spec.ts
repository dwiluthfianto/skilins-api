import { Test, TestingModule } from '@nestjs/testing';
import { VideoPodcastController } from './video-podcasts.controller';
import { VideoPodcastService } from './video-podcasts.service';

describe('VideoPodcastController', () => {
  let controller: VideoPodcastController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoPodcastController],
      providers: [VideoPodcastService],
    }).compile();

    controller = module.get<VideoPodcastController>(VideoPodcastController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
