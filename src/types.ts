export interface FrameColorOption {
  id: string;
  name: string;
  hex: string;
  roughness: number;
  metalness: number;
  transmission: number; // For translucent acetate
  opacity: number;
}

export interface LensColorOption {
  id: string;
  name: string;
  hex: string;
  roughness: number;
  metalness: number;
  transmission: number;
  opacity: number;
  reflective: boolean;
}

export interface FrameStyleOption {
  id: 'round' | 'rectangular' | 'aviator';
  name: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  style: 'round' | 'rectangular' | 'aviator';
  frameColor: string; // ID of FrameColorOption
  lensColor: string; // ID of LensColorOption
  price: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  customization?: {
    frameColorName: string;
    lensColorName: string;
    styleName: string;
    engravingText?: string;
  };
}

export interface CustomizationState {
  style: 'round' | 'rectangular' | 'aviator';
  frameColor: string; // color ID
  lensColor: string; // color ID
  transmissionType: 'matte' | 'glossy' | 'translucent';
  engraving: string;
  hingeGold: boolean;
}
