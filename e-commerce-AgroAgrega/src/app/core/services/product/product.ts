import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';

import { Product as ProductModel } from '../../../models/product';

export type ProductSortBy = 'title' | 'price' | 'category';
export type SortDirection = 'asc' | 'desc';

export interface ProductCatalogQuery {
  search: string;
  category: string;
  sortBy: ProductSortBy;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}

export interface ProductCatalogResult {
  items: ProductModel[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

const CATALOG_PRODUCTS: ProductModel[] = [
  {
    id: 'prod-001',
    title: 'Tomate Orgânico',
    price: 8.9,
    description: 'Tomate fresco produzido sem agrotóxicos.',
    category: 'Hortaliças',
    images: ['https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-002',
    title: 'Alface Crespa',
    price: 4.5,
    description: 'Alface colhida no mesmo dia da entrega.',
    category: 'Hortaliças',
    images: ['https://images.unsplash.com/photo-1622205313162-be1d571f6c84?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-003',
    title: 'Banana Prata',
    price: 6.2,
    description: 'Banana doce e rica em potássio.',
    category: 'Frutas',
    images: ['https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-004',
    title: 'Maçã Fuji',
    price: 11.9,
    description: 'Maçã crocante com sabor equilibrado.',
    category: 'Frutas',
    images: ['https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-005',
    title: 'Arroz Integral',
    price: 18,
    description: 'Arroz integral de grãos selecionados.',
    category: 'Grãos',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-006',
    title: 'Feijão Carioca',
    price: 9.7,
    description: 'Feijão de safra recente para refeições do dia a dia.',
    category: 'Grãos',
    images: ['https://images.unsplash.com/photo-1515543904379-3d757afe72e1?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-007',
    title: 'Leite Integral',
    price: 6.8,
    description: 'Leite integral pasteurizado de produção local.',
    category: 'Laticínios',
    images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-008',
    title: 'Queijo Minas',
    price: 29.9,
    description: 'Queijo minas artesanal com textura macia.',
    category: 'Laticínios',
    images: ['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-009',
    title: 'Cenoura',
    price: 5.9,
    description: 'Cenoura fresca com alto teor de vitamina A.',
    category: 'Hortaliças',
    images: ['https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-010',
    title: 'Manga Palmer',
    price: 7.4,
    description: 'Manga madura e suculenta.',
    category: 'Frutas',
    images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-011',
    title: 'Iogurte Natural',
    price: 4.9,
    description: 'Iogurte sem adição de açúcar.',
    category: 'Laticínios',
    images: ['https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80'],
  },
  {
    id: 'prod-012',
    title: 'Milho Verde',
    price: 8.3,
    description: 'Espigas de milho verde recém-colhidas.',
    category: 'Grãos',
    images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=600&q=80'],
  },
];

const DEFAULT_QUERY: ProductCatalogQuery = {
  search: '',
  category: 'all',
  sortBy: 'title',
  sortDirection: 'asc',
  page: 1,
  pageSize: 6,
};

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  getCategories(): string[] {
    return [...new Set(CATALOG_PRODUCTS.map((product) => product.category))].sort((first, second) =>
      first.localeCompare(second)
    );
  }

  getCatalog(overrides: Partial<ProductCatalogQuery> = {}): Observable<ProductCatalogResult> {
    const query = { ...DEFAULT_QUERY, ...overrides };

    if (query.page < 1 || query.pageSize < 1) {
      return throwError(() => new Error('Parâmetros de paginação inválidos.'));
    }

    const normalizedSearch = query.search.trim().toLowerCase();

    const filteredItems = CATALOG_PRODUCTS.filter((product) => {
      const matchesCategory = query.category === 'all' || product.category === query.category;
      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
      return searchableText.includes(normalizedSearch);
    });

    const sortedItems = [...filteredItems].sort((first, second) => {
      let comparison = 0;

      if (query.sortBy === 'price') {
        comparison = first.price - second.price;
      } else {
        comparison = first[query.sortBy].localeCompare(second[query.sortBy]);
      }

      return query.sortDirection === 'asc' ? comparison : comparison * -1;
    });

    const totalItems = sortedItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
    const currentPage = Math.min(query.page, totalPages);
    const startIndex = (currentPage - 1) * query.pageSize;
    const items = sortedItems.slice(startIndex, startIndex + query.pageSize);

    return of({
      items,
      totalItems,
      totalPages,
      page: currentPage,
      pageSize: query.pageSize,
    }).pipe(delay(200));
  }

  getProductById(id: string): Observable<ProductModel | undefined> {
    return of(CATALOG_PRODUCTS.find((product) => product.id === id)).pipe(delay(150));
  }
}
