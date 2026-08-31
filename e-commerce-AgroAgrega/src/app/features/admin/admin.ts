import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductService } from '@core/services/product/product.service';
import { ProductModel } from '@models/product';
import { AuthAdminService } from '@core/services/auth/auth-admin.service';

export type AdminTab = 'dashboard' | 'products' | 'orders' | 'clients' | 'settings';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface AdminOrder {
  id: string;
  customerName: string;
  date: Date;
  total: number;
  status: OrderStatus;
  itemsCount: number;
}

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: Date;
  totalOrders: number;
  totalSpent: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponent implements OnInit {
  // Signals
  activeTab = signal<AdminTab>('dashboard');
  orders = signal<AdminOrder[]>([]);
  clients = signal<AdminClient[]>([]);
  searchTerm = signal<string>('');
  selectedStatus = signal<'all' | OrderStatus>('all');

  // Product form
  productName = signal<string>('');
  productPrice = signal<number>(0);
  productCategory = signal<string>('Agricultura de Precisão');
  productDescription = signal<string>('');
  editingProductId = signal<string | null>(null);

  // Store profile
  storeName = signal<string>('AgroAgrega');
  storeEmail = signal<string>('contato@agroagrega.com.br');
  storePhone = signal<string>('(11) 99999-9999');
  storeCity = signal<string>('São Paulo, SP');
  
  // Profile edit modal
  showProfileModal = signal<boolean>(false);
  editStoreName = signal<string>('');
  editStoreEmail = signal<string>('');
  editStorePhone = signal<string>('');
  editStoreCity = signal<string>('');

  // Computed values
  filteredOrders = computed(() => {
    const orders = this.orders();
    const status = this.selectedStatus();
    const term = this.searchTerm().toLowerCase();

    let filtered = orders;
    if (status !== 'all') {
      filtered = filtered.filter(o => o.status === status);
    }
    if (term) {
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(term) || 
        o.customerName.toLowerCase().includes(term)
      );
    }
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  filteredClients = computed(() => {
    const clients = this.clients();
    const term = this.searchTerm().toLowerCase();
    if (!term) return clients;
    return clients.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.email.toLowerCase().includes(term)
    );
  });

  metrics = computed(() => {
    const orders = this.orders();
    const products = this.productService.getProducts()();
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalClients = this.clients().length;
    
    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      totalClients,
      totalProducts: products.length,
    };
  });

  readonly statusOptions: OrderStatus[] = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  constructor(
    public productService: ProductService,
    private authAdminService: AuthAdminService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.orders.set(this.getMockOrders());
    this.clients.set(this.getMockClients());
  }

  // Tab navigation
  selectTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    this.searchTerm.set('');
    this.selectedStatus.set('all');
  }

  // Orders
  onStatusFilterChange(status: 'all' | OrderStatus): void {
    this.selectedStatus.set(status);
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  updateOrderStatus(order: AdminOrder, newStatus: OrderStatus): void {
    order.status = newStatus;
  }

  statusBadgeClass(status: OrderStatus): string {
    return `badge badge--${status}`;
  }

  // Products
  addProduct(): void {
    if (!this.productName() || this.productPrice() <= 0) {
      alert('Nome e preço obrigatórios!');
      return;
    }
    // Mock add - would call productService in real app
    this.clearProductForm();
  }

  editProduct(product: ProductModel): void {
    this.editingProductId.set(product.id);
    this.productName.set(product.title);
    this.productPrice.set(product.price);
    this.productCategory.set(product.category);
    this.productDescription.set(product.description || '');
  }

  saveProduct(): void {
    if (!this.productName() || this.productPrice() <= 0) {
      alert('Nome e preço obrigatórios!');
      return;
    }
    // Mock save - would call productService in real app
    this.clearProductForm();
  }

  deleteProduct(productId: string): void {
    if (confirm('Tem certeza que deseja deletar este produto?')) {
      // Mock delete - would call productService in real app
    }
  }

  clearProductForm(): void {
    this.productName.set('');
    this.productPrice.set(0);
    this.productCategory.set('Agricultura de Precisão');
    this.productDescription.set('');
    this.editingProductId.set(null);
  }

  // Profile Management
  openProfileModal(): void {
    this.editStoreName.set(this.storeName());
    this.editStoreEmail.set(this.storeEmail());
    this.editStorePhone.set(this.storePhone());
    this.editStoreCity.set(this.storeCity());
    this.showProfileModal.set(true);
  }

  closeProfileModal(): void {
    this.showProfileModal.set(false);
  }

  saveProfile(): void {
    if (!this.editStoreName().trim() || !this.editStoreEmail().trim()) {
      alert('Nome e email são obrigatórios!');
      return;
    }
    this.storeName.set(this.editStoreName());
    this.storeEmail.set(this.editStoreEmail());
    this.storePhone.set(this.editStorePhone());
    this.storeCity.set(this.editStoreCity());
    this.showProfileModal.set(false);
    alert('✅ Perfil atualizado com sucesso!');
  }

  // Auth
  logout(): void {
    this.authAdminService.isLoggedIn = false;
    this.router.navigate(['/admin/login']);
  }

  private getMockOrders(): AdminOrder[] {
    return [
      {
        id: 'ORD-1001',
        customerName: 'João Pereira',
        date: new Date('2026-08-25'),
        total: 249.9,
        status: 'pending',
        itemsCount: 3,
      },
      {
        id: 'ORD-1002',
        customerName: 'Marina Souza',
        date: new Date('2026-08-27'),
        total: 89.5,
        status: 'processing',
        itemsCount: 1,
      },
      {
        id: 'ORD-1003',
        customerName: 'Carlos Lima',
        date: new Date('2026-08-28'),
        total: 512.0,
        status: 'shipped',
        itemsCount: 5,
      },
      {
        id: 'ORD-1004',
        customerName: 'Fernanda Costa',
        date: new Date('2026-08-29'),
        total: 135.75,
        status: 'delivered',
        itemsCount: 2,
      },
      {
        id: 'ORD-1005',
        customerName: 'Rafael Nunes',
        date: new Date('2026-08-30'),
        total: 320.4,
        status: 'cancelled',
        itemsCount: 4,
      },
    ];
  }

  private getMockClients(): AdminClient[] {
    return [
      {
        id: 'CLI-001',
        name: 'João Pereira',
        email: 'joao@example.com',
        phone: '(11) 98765-4321',
        joinDate: new Date('2026-06-15'),
        totalOrders: 5,
        totalSpent: 1245.50,
      },
      {
        id: 'CLI-002',
        name: 'Marina Souza',
        email: 'marina@example.com',
        phone: '(21) 99876-5432',
        joinDate: new Date('2026-07-10'),
        totalOrders: 3,
        totalSpent: 456.75,
      },
      {
        id: 'CLI-003',
        name: 'Carlos Lima',
        email: 'carlos@example.com',
        phone: '(31) 97654-3210',
        joinDate: new Date('2026-05-20'),
        totalOrders: 8,
        totalSpent: 2150.00,
      },
    ];
  }
}
