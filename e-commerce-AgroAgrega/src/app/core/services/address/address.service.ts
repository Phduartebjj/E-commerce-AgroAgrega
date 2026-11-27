  import { Injectable } from '@angular/core';

  import { AddressModel } from '@models/address.model';

  @Injectable({
    providedIn: 'root',
  })
  export class AddressService {
    private readonly addressStorageKey = 'user-addresses';

    private getStorageKey(userId: string): string {
      return `${this.addressStorageKey}-${userId}`;
    }

    getAddresses(userId: string): AddressModel[] {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return [];
      }

      try {
        const storage = localStorage.getItem(this.getStorageKey(userId));
        return storage ? (JSON.parse(storage) as AddressModel[]) : [];
      } catch {
        return [];
      }
    }

    saveAddresses(userId: string, addresses: AddressModel[]): void {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }

      try {
        localStorage.setItem(this.getStorageKey(userId), JSON.stringify(addresses));
      } catch {}
    }
  }
