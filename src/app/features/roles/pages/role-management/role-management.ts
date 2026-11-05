import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuItem } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Message } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { AutoComplete } from 'primeng/autocomplete';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Roles } from '../../services/roles';
import { Role, RolePermission } from '../../interfaces/role';

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    CardModule,
    TagModule,
    Message,
    SkeletonModule,
    AutoComplete,
    Breadcrumb,
  ],
  templateUrl: './role-management.html',
  styleUrl: './role-management.css',
})
export class RoleManagement implements OnInit {
  private readonly rolesService = inject(Roles);

  roles = signal<Role[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  expandedRoleId = signal<number | null>(null);

  readonly breadcrumbHome: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/dashboard',
  };

  readonly breadcrumbItems: MenuItem[] = [
    { label: 'Administración' },
    { label: 'Gestión de roles' },
  ];

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.rolesService.getAll().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.expandedRoleId.set(null);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.status === 403
            ? 'No tenés permisos para ver los roles.'
            : 'Ocurrió un error al cargar los roles.',
        );
      },
    });
  }

  permissionsLabel(role: Role): string {
    return `Ver permisos (${role.permissions?.length || 0})`;
  }

  permissionNames(role: Role): string[] {
    return (role.permissions ?? []).map((permission: RolePermission) => permission.name);
  }

  noopComplete(): void {}

  togglePermissionsPanel(role: Role): void {
    this.expandedRoleId.set(this.expandedRoleId() === role.id ? null : role.id);
  }
}