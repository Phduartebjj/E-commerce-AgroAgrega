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
      const storage = localStorage.getItem(this.getStorageKey(userId));

      return storage ? (JSON.parse(storage) as AddressModel[]) : [];
    }

    saveAddresses(userId: string, addresses: AddressModel[]): void {
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(addresses));
    }
  }
