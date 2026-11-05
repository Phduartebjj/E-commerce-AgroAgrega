import { Injectable } from '@angular/core';
import type { ProductModel } from '../../../models/product';
import type { AssistantCatalogRequest } from './assistant-catalog';

export type ProductAction = 'add' | 'remove' | 'increase' | 'decrease' | 'setQuantity';
export type ProductQuestion = 'payment' | 'shipping' | 'details' | 'explain';
export type CartUndo = ({ type: 'item'; product: ProductModel; quantity: number; selected: boolean }
  | { type: 'selection'; items: { product: ProductModel; quantity: number; selected: boolean }[]; messageId: number }
  | { type: 'coupon'; code?: string }) & { expectedState: string };

export interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  typing?: boolean;
  products?: ProductModel[];
  productAction?: ProductAction;
  quantity?: number;
  showCart?: boolean;
  showCoupons?: boolean;
  comparison?: boolean;
  shoppingPlan?: { productIds: string[]; total: number; budget?: number; applied?: boolean };
  preserveResultContext?: boolean;
  optionNumbers?: number[];
  replyOptions?: { label: string; prompt: string }[];
  link?: { label: string; path: string; queryParams?: Record<string, string> };
}

export interface AssistantSessionSnapshot {
  messages: ChatMessage[];
  nextMessageId: number;
  lastResults: ProductModel[];
  lastFocusedProductId?: string;
  lastCatalogRequest?: AssistantCatalogRequest;
  pendingProductAction?: { action: ProductAction; quantity: number };
  pendingQuestion?: { type: ProductQuestion; query: string };
  shownProductIds: string[];
  cartUndo?: CartUndo;
}

/** Conversation memory lasts only while the site is open and belongs to one account. */
@Injectable({ providedIn: 'root' })
export class AssistantSession {
  private owner: string | null | undefined;
  private snapshot?: AssistantSessionSnapshot;

  read(owner: string | null): AssistantSessionSnapshot | undefined {
    if (owner !== this.owner) {
      this.owner = owner;
      this.snapshot = undefined;
    }
    return this.snapshot;
  }

  save(owner: string | null, snapshot: AssistantSessionSnapshot): void {
    this.read(owner);
    this.snapshot = snapshot;
  }
}
