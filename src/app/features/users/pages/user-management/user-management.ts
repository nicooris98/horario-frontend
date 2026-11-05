import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuItem } from 'primeng/api';
import { TableModule } from 'primeng/table';
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
  selector: 'app-user-management',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    Message,
    AvatarModule,
    SkeletonModule,
    Breadcrumb,
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
  private readonly usersService = inject(Users);
  private readonly router = inject(Router);

  users = signal<User[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  readonly breadcrumbHome: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/dashboard',
  };

  readonly breadcrumbItems: MenuItem[] = [
    { label: 'Administración' },
    { label: 'Gestión de usuarios' },
  ];

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
          error.status === 403
            ? 'No tenés permisos para ver los usuarios.'
            : 'Ocurrió un error al cargar los usuarios.',
        );
      },
    });
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
}