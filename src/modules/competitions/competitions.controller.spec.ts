import { Test, TestingModule } from '@nestjs/testing';
import { CompetitionController } from './competitions.controller';
import { CompetitionService } from './competitions.service';

describe('CompetitionController', () => {
  let controller: CompetitionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompetitionController],
      providers: [CompetitionService],
    }).compile();

    controller = module.get<CompetitionController>(CompetitionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
