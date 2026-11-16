import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuItem } from 'primeng/api';
import { TableModule, TablePageEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Message } from 'primeng/message';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { Breadcrumb } from 'primeng/breadcrumb';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { createIsMobileSignal } from '../../../../shared/utils/viewport';
import { Users } from '../../services/users';
import { User } from '../../interfaces/user';

type UserStatusFilter = 'ACTIVE' | 'PENDING' | 'DISABLED';

const DEFAULT_PAGE_SIZE = 10;

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim();
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    Message,
    AvatarModule,
    SkeletonModule,
    Breadcrumb,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    PaginatorModule,
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
  private readonly usersService = inject(Users);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly search = signal('');
  readonly statusFilter = signal<UserStatusFilter | null>(null);
  readonly first = signal(0);
  readonly rows = signal(DEFAULT_PAGE_SIZE);
  readonly rowsPerPageOptions = [5, 10, 20];
  readonly isMobile = createIsMobileSignal(this.destroyRef);

  readonly breadcrumbHome: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/dashboard',
  };

  readonly breadcrumbItems: MenuItem[] = [
    { label: 'Administración' },
    { label: 'Gestión de usuarios' },
  ];

  readonly statusOptions: { label: string; value: UserStatusFilter | null }[] = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Pendiente de activación', value: 'PENDING' },
    { label: 'Desactivado', value: 'DISABLED' },
  ];

  readonly filtersDisabled = computed(
    () => !this.loading() && !this.errorMessage() && this.users().length === 0,
  );

  readonly filteredUsers = computed(() => {
    const query = normalize(this.search());
    const status = this.statusFilter();

    return this.users().filter((user) => {
      const fullName = normalize(`${user.firstName ?? ''} ${user.lastName ?? ''}`);
      const reverseName = normalize(`${user.lastName ?? ''} ${user.firstName ?? ''}`);
      const email = normalize(user.email ?? '');
      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        reverseName.includes(query) ||
        email.includes(query);

      const userStatus = this.getUserStatusKey(user);
      const matchesStatus = status === null || userStatus === status;

      return matchesSearch && matchesStatus;
    });
  });

  readonly paginatedUsers = computed(() => {
    const start = this.first();
    return this.filteredUsers().slice(start, start + this.rows());
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.status === 0
            ? 'No se pudo conectar con el servidor.'
            : error.status === 403
              ? 'No tenés permisos para ver los usuarios.'
              : 'Ocurrió un error al cargar los usuarios.',
        );
      },
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value ?? '');
    this.first.set(0);
  }

  onStatusFilterChange(value: UserStatusFilter | null): void {
    this.statusFilter.set(value ?? null);
    this.first.set(0);
  }

  onPageChange(event: TablePageEvent | PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? DEFAULT_PAGE_SIZE);
  }

  goToCreate(): void {
    this.router.navigate(['/administracion/usuarios/nuevo']);
  }

  goToDetail(id: number): void {
    this.router.navigate(['/administracion/usuarios', id]);
  }

  getInitials(user: User): string {
    const first = user.firstName?.trim().charAt(0) ?? '';
    const last = user.lastName?.trim().charAt(0) ?? '';
    return `${first}${last}`.toUpperCase() || '?';
  }

  statusLabel(user: User): string {
    if (user.isDisabled) return 'Desactivado';
    if (user.isActive) return 'Activo';
    return 'Pendiente de activación';
  }

  statusSeverity(user: User): 'danger' | 'success' | 'warn' {
    if (user.isDisabled) return 'danger';
    if (user.isActive) return 'success';
    return 'warn';
  }

  private getUserStatusKey(user: User): UserStatusFilter {
    if (user.isDisabled) return 'DISABLED';
    if (user.isActive) return 'ACTIVE';
    return 'PENDING';
  }
}