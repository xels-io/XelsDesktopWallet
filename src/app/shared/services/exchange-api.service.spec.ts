import { TestBed } from '@angular/core/testing';

import { ExchangeApiService } from './exchange-api.service';

describe('ExchangeApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ExchangeApiService = TestBed.get(ExchangeApiService);
    expect(service).toBeTruthy();
  });
});
