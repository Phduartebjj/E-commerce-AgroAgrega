import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ProductService } from './product';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return paginated catalog results', async () => {
    const result = await firstValueFrom(service.getCatalog({ page: 1, pageSize: 6 }));

    expect(result.items.length).toBe(6);
    expect(result.totalItems).toBeGreaterThan(6);
    expect(result.page).toBe(1);
  });

  it('should filter products by category', async () => {
    const result = await firstValueFrom(service.getCatalog({ category: 'Frutas', pageSize: 12 }));

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((item) => item.category === 'Frutas')).toBe(true);
  });
});
