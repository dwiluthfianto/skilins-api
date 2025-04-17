import { Test, TestingModule } from '@nestjs/testing';
import { PrakerinService } from './prakerin.service';

describe('PrakerinService', () => {
  let service: PrakerinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrakerinService],
    }).compile();

    service = module.get<PrakerinService>(PrakerinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
