export interface ProductModel {
  id: string;
  title: string;
  price: number;
  description: string;
  category: ProductCategory;
  images: string[];
  rating?: number;
}

export type ProductCategory =
  'Agricultura de Precisão' | 'Irrigação' | 'Pecuária' | 'Ferramentas' | 'Insumos';

export type SortOption = 'relevant' | 'price-asc' | 'price-desc';
