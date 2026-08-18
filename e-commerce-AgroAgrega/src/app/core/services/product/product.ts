import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { Product } from '../../../models/product';

const STORAGE_KEY = 'agroagrega-products';

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    title: 'Tomate Orgânico (1kg)',
    price: 9.9,
    description: 'Tomate fresco produzido sem agrotóxicos.',
    category: 'Hortifruti',
    stock: 75,
    images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'],
  },
  {
    id: 'prod-2',
    title: 'Cenoura Agroecológica (1kg)',
    price: 8.5,
    description: 'Cenouras selecionadas e colhidas no ponto ideal.',
    category: 'Hortifruti',
    stock: 60,
    images: ['https://images.unsplash.com/photo-1447175008436-054170c2e979?w=800'],
  },
  {
    id: 'prod-3',
    title: 'Mel Puro da Serra (500g)',
    price: 24.9,
    description: 'Mel artesanal com origem certificada.',
    category: 'Mercearia',
    stock: 40,
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800'],
  },
  {
    id: 'prod-4',
    title: 'Queijo Minas Artesanal (700g)',
    price: 34.9,
    description: 'Queijo maturado de produção local.',
    category: 'Laticínios',
    stock: 20,
    images: ['https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=800'],
  },
  {
    id: 'prod-5',
    title: 'Alface Hidropônica (unidade)',
    price: 4.5,
    description: 'Alface crespa cultivada em sistema hidropônico.',
    category: 'Hortifruti',
    stock: 95,
    images: ['https://images.unsplash.com/photo-1515356951445-ab2c01b9ccce?w=800'],
  },
  {
    id: 'prod-6',
    title: 'Café Especial Torrado (500g)',
    price: 32.0,
    description: 'Café premium com torra média e notas achocolatadas.',
    category: 'Bebidas',
    stock: 35,
    images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'],
  },
];

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly isBrowser: boolean;

  readonly products = signal<Product[]>([]);

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.products.set(this.loadProducts());
  }

  getProductById(id: string): Product | undefined {
    return this.products().find((product) => product.id === id);
  }

  createProduct(product: Omit<Product, 'id'>): void {
    this.products.update((products) => [...products, { ...product, id: this.generateId() }]);
    this.persistProducts();
  }

  updateProduct(id: string, product: Omit<Product, 'id'>): void {
    this.products.update((products) =>
      products.map((currentProduct) =>
        currentProduct.id === id ? { ...currentProduct, ...product } : currentProduct,
      ),
    );
    this.persistProducts();
  }

  deleteProduct(id: string): void {
    this.products.update((products) => products.filter((product) => product.id !== id));
    this.persistProducts();
  }

  private loadProducts(): Product[] {
    if (!this.isBrowser) {
      return DEFAULT_PRODUCTS;
    }

    const rawProducts = localStorage.getItem(STORAGE_KEY);
    if (!rawProducts) {
      return DEFAULT_PRODUCTS;
    }

    try {
      const parsedProducts = JSON.parse(rawProducts);
      if (!Array.isArray(parsedProducts)) {
        return DEFAULT_PRODUCTS;
      }

      return parsedProducts
        .map((product) => this.normalizeProduct(product))
        .filter((product): product is Product => product !== null);
    } catch {
      return DEFAULT_PRODUCTS;
    }
  }

  private persistProducts(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.products()));
  }

  private normalizeProduct(product: unknown): Product | null {
    if (!product || typeof product !== 'object') {
      return null;
    }

    const record = product as Partial<Product>;
    const id = typeof record.id === 'string' ? record.id : '';
    const title = typeof record.title === 'string' ? record.title : '';
    const description = typeof record.description === 'string' ? record.description : '';
    const category = typeof record.category === 'string' ? record.category : '';
    const price = typeof record.price === 'number' ? record.price : Number.NaN;
    const stock = typeof record.stock === 'number' ? record.stock : Number.NaN;

    if (!id || !title || !description || !category || !Number.isFinite(price) || !Number.isFinite(stock)) {
      return null;
    }

    const images = Array.isArray(record.images)
      ? record.images.filter((image): image is string => typeof image === 'string' && image.length > 0)
      : [];

    return {
      id,
      title,
      description,
      category,
      price,
      stock,
      images,
    };
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `prod-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
