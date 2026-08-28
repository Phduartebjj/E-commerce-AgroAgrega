export interface ReviewModel {
  id?: string;
  author?: string;
  stars: number;
  text: string;
  createdAt?: string;
}

export interface ProductModel {
  id: string;
  title: string;
  price: number;
  description: string;
  category: ProductCategory;
  images: string[];
  rating: number;
  reviews?: ReviewModel[];
  weeklySales?: number;
  brand?: BrandOption;
}

export type ProductCategory =
  'Agricultura de Precisão' | 'Irrigação' | 'Pecuária' | 'Ferramentas' | 'Insumos';

export type SortOption = 'relevant' | 'price-asc' | 'price-desc';

export type BrandOption = 'Biomatrix' | 'AgroSense' | 'MultiGrão' | 'SafraMax';
