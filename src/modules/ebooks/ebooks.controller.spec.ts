import { Test, TestingModule } from '@nestjs/testing';
import { EbookController } from './ebooks.controller';
import { EbookService } from './ebooks.service';

describe('EbookController', () => {
  let controller: EbookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EbookController],
      providers: [EbookService],
    }).compile();

    controller = module.get<EbookController>(EbookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
