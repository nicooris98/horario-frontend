import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Message } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { Breadcrumb } from 'primeng/breadcrumb';
import { DetailHeaderComponent } from '../../../../shared/components/detail-header/detail-header';
import { Users } from '../../services/users';
import { User } from '../../interfaces/user';

const USERS_ROUTE = '/administracion/usuarios';

interface DetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    TagModule,
    Message,
    SkeletonModule,
    Breadcrumb,
    DetailHeaderComponent,
  ],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css',
})
export class UserDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersService = inject(Users);

  readonly user = signal<User | null>(null);
  readonly loading = signal(false);
  readonly toggling = signal(false);
  readonly errorMessage = signal('');

  readonly breadcrumbHome: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/dashboard',
  };

  readonly fullName = computed(() => {
    const current = this.user();
    if (!current) {
      return this.loading() ? 'Cargando...' : 'Usuario';
    }
    return `${current.firstName} ${current.lastName}`.trim();
  });

  readonly breadcrumbItems = computed<MenuItem[]>(() => [
    { label: 'Administración' },
    { label: 'Gestión de usuarios', routerLink: USERS_ROUTE },
    { label: this.user() ? `${this.user()!.firstName} ${this.user()!.lastName}`.trim() : 'Detalle de usuario' },
  ]);

  readonly highlights = computed(() => {
    const current = this.user();
    if (!current) return [];
    const rolesCount = current.roles?.length ?? 0;
    return [
      { icon: 'pi pi-envelope', value: current.email, label: 'Correo electrónico' },
      {
        icon: 'pi pi-shield',
        value: `${rolesCount} ${rolesCount === 1 ? 'rol' : 'roles'}`,
        label: 'Roles asignados',
      },
      {
        icon: 'pi pi-calendar-plus',
        value: this.formatShortDate(current.createdAt),
        label: 'Fecha de creación',
      },
      {
        icon: 'pi pi-clock',
        value: this.formatShortDate(current.updatedAt),
        label: 'Última actualización',
      },
    ];
  });

  readonly rows = computed<DetailRow[]>(() => {
    const current = this.user();
    if (!current) return [];
    return [
      { label: 'Nombre', value: current.firstName },
      { label: 'Apellido', value: current.lastName },
      { label: 'Correo electrónico', value: current.email },
      { label: 'Fecha de creación', value: this.formatDate(current.createdAt) },
      { label: 'Última actualización', value: this.formatDate(current.updatedAt) },
    ];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Usuario no válido.');
      return;
    }
    this.loadUser(id);
  }

  loadUser(id: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.usersService.getById(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.status === 404
            ? 'No se encontró el usuario.'
            : error.status === 403
              ? 'No tenés permisos para ver este usuario.'
              : 'Ocurrió un error al cargar el usuario.',
        );
      },
    });
  }

  goBack(): void {
    this.router.navigate([USERS_ROUTE]);
  }

  toggleDisabled(): void {
    const current = this.user();
    if (!current || this.toggling()) return;

    this.toggling.set(true);
    this.errorMessage.set('');

    this.usersService
      .update(current.id, { isDisabled: !current.isDisabled })
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.toggling.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.toggling.set(false);
          const backendMessage = error.error?.message;
          this.errorMessage.set(
            typeof backendMessage === 'string'
              ? backendMessage
              : Array.isArray(backendMessage)
                ? backendMessage.join(', ')
                : 'No se pudo actualizar el estado de la cuenta.',
          );
        },
      });
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatShortDate(value?: string): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  statusLabel(user: User): string {
    if (user.isDisabled) return 'Desactivada';
    if (user.isActive) return 'Activo';
    return 'Pendiente de activación';
  }

  statusSeverity(user: User): 'danger' | 'success' | 'warn' {
    if (user.isDisabled) return 'danger';
    if (user.isActive) return 'success';
    return 'warn';
  }
}