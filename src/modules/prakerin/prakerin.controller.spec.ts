import { Test, TestingModule } from '@nestjs/testing';
import { PrakerinController } from './prakerin.controller';
import { PrakerinService } from './prakerin.service';

describe('PrakerinController', () => {
  let controller: PrakerinController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrakerinController],
      providers: [PrakerinService],
    }).compile();

    controller = module.get<PrakerinController>(PrakerinController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
