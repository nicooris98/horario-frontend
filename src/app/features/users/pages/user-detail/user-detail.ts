import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Message } from 'primeng/message';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Users } from '../../services/users';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [ButtonModule, CardModule, TagModule, Message, AvatarModule, SkeletonModule, Breadcrumb],
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css',
})
export class UserDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersService = inject(Users);

  user = signal<User | null>(null);
  loading = signal(false);
  toggling = signal(false);
  errorMessage = signal('');

  readonly breadcrumbHome: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/dashboard',
  };

  readonly breadcrumbItems: MenuItem[] = [
    { label: 'Administración' },
    { label: 'Gestión de usuarios', routerLink: '/administracion/usuarios' },
    { label: 'Detalle de usuario' },
  ];

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
    this.router.navigate(['/administracion/usuarios']);
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

  getInitials(user: User): string {
    const first = user.firstName?.trim().charAt(0) ?? '';
    const last = user.lastName?.trim().charAt(0) ?? '';
    return `${first}${last}`.toUpperCase() || '?';
  }
}