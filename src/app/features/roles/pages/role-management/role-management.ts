import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuItem } from 'primeng/api';
import { TableModule, TablePageEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Message } from 'primeng/message';
import { Breadcrumb } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { createIsMobileSignal } from '../../../../shared/utils/viewport';
import { Roles } from '../../services/roles';
import { Role, RolePermission } from '../../interfaces/role';

interface PermissionGroup {
  key: string;
  label: string;
  icon: string;
  permissions: RolePermission[];
}

const DEFAULT_PAGE_SIZE = 10;

const MODULE_METADATA: Record<string, { label: string; icon: string }> = {
  users: { label: 'Usuarios', icon: 'pi pi-users' },
  roles: { label: 'Roles y permisos', icon: 'pi pi-shield' },
  permissions: { label: 'Roles y permisos', icon: 'pi pi-shield' },
  degrees: { label: 'Carreras', icon: 'pi pi-building' },
  'study-plans': { label: 'Planes de estudio', icon: 'pi pi-sitemap' },
  study_plans: { label: 'Planes de estudio', icon: 'pi pi-sitemap' },
  subjects: { label: 'Materias', icon: 'pi pi-book' },
  teachers: { label: 'Docentes', icon: 'pi pi-id-card' },
  regimes: { label: 'Regímenes', icon: 'pi pi-list' },
  shifts: { label: 'Turnos', icon: 'pi pi-sun' },
  'class-hours': { label: 'Estructura horaria', icon: 'pi pi-clock' },
  class_hours: { label: 'Estructura horaria', icon: 'pi pi-clock' },
  'academic-calendar': { label: 'Calendario académico', icon: 'pi pi-calendar' },
  academic_calendar: { label: 'Calendario académico', icon: 'pi pi-calendar' },
  'academic-offer': { label: 'Oferta académica', icon: 'pi pi-briefcase' },
  academic_offer: { label: 'Oferta académica', icon: 'pi pi-briefcase' },
  schedules: { label: 'Horarios', icon: 'pi pi-calendar-clock' },
};

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim();
}

function resolveModuleMeta(permission: RolePermission): { key: string; label: string; icon: string } {
  const rawCode = (permission.code ?? '').trim();
  const prefix = rawCode.split(/[.:/]/)[0]?.toLowerCase() || '';

  if (prefix && MODULE_METADATA[prefix]) {
    return {
      key: prefix,
      label: MODULE_METADATA[prefix].label,
      icon: MODULE_METADATA[prefix].icon,
    };
  }

  return {
    key: 'general',
    label: 'Permisos generales',
    icon: 'pi pi-shield',
  };
}

@Component({
  selector: 'app-role-management',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    Message,
    Breadcrumb,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    PaginatorModule,
  ],
  templateUrl: './role-management.html',
  styleUrl: './role-management.css',
})
export class RoleManagement implements OnInit {
  private readonly rolesService = inject(Roles);
  private readonly destroyRef = inject(DestroyRef);

  readonly roles = signal<Role[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly search = signal('');
  readonly statusFilter = signal<boolean | null>(null);

  readonly first = signal(0);
  readonly rows = signal(DEFAULT_PAGE_SIZE);
  readonly rowsPerPageOptions = [5, 10, 20];
  readonly isMobile = createIsMobileSignal(this.destroyRef);

  readonly selectedRole = signal<Role | null>(null);
  readonly permissionsDialogVisible = signal(false);

  readonly statusOptions = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false },
  ];

  readonly filtersDisabled = computed(
    () => !this.loading() && !this.errorMessage() && this.roles().length === 0,
  );

  readonly filteredRoles = computed(() => {
    const query = normalize(this.search());
    const status = this.statusFilter();

    return this.roles().filter((role) => {
      const matchesSearch =
        !query ||
        normalize(role.name ?? '').includes(query) ||
        normalize(role.description ?? '').includes(query);
      const matchesStatus = status === null || role.isActive === status;
      return matchesSearch && matchesStatus;
    });
  });

  readonly paginatedRoles = computed(() => {
    const start = this.first();
    return this.filteredRoles().slice(start, start + this.rows());
  });

  readonly groupedPermissions = computed<PermissionGroup[]>(() => {
    const role = this.selectedRole();
    const permissions = role?.permissions ?? [];
    if (!permissions.length) return [];

    const groupsMap = new Map<string, PermissionGroup>();

    for (const perm of permissions) {
      const meta = resolveModuleMeta(perm);
      let group = groupsMap.get(meta.key);
      if (!group) {
        group = {
          key: meta.key,
          label: meta.label,
          icon: meta.icon,
          permissions: [],
        };
        groupsMap.set(meta.key, group);
      }
      group.permissions.push(perm);
    }

    return [...groupsMap.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

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

    this.rolesService
      .getAll()
      .pipe(
        switchMap((roles) => {
          if (!roles.length) {
            return of(roles);
          }

          const hasAnyPermissionsLoaded = roles.some(
            (role) => Array.isArray(role.permissions) && role.permissions.length > 0,
          );
          if (hasAnyPermissionsLoaded) {
            return of(roles);
          }

          return forkJoin(
            roles.map((role) =>
              this.rolesService.getPermissions(role.id).pipe(
                map((detailed) => ({
                  ...role,
                  name: detailed.name || role.name,
                  description: detailed.description ?? role.description,
                  isActive: detailed.isActive ?? role.isActive,
                  permissions: detailed.permissions ?? role.permissions ?? [],
                })),
                catchError(() => of(role)),
              ),
            ),
          );
        }),
      )
      .subscribe({
        next: (roles) => {
          this.roles.set(roles);
          this.loading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.errorMessage.set(
            error.status === 0
              ? 'No se pudo conectar con el servidor.'
              : error.status === 403
                ? 'No tenés permisos para ver los roles.'
                : 'Ocurrió un error al cargar los roles.',
          );
        },
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value ?? '');
    this.first.set(0);
  }

  onStatusFilterChange(value: boolean | null): void {
    this.statusFilter.set(value ?? null);
    this.first.set(0);
  }

  onPageChange(event: TablePageEvent | PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? DEFAULT_PAGE_SIZE);
  }

  permissionsCount(role: Role): number {
    return role.permissions?.length ?? 0;
  }

  permissionsCountLabel(role: Role): string {
    const count = this.permissionsCount(role);
    return `${count} ${count === 1 ? 'permiso' : 'permisos'}`;
  }

  openPermissionsDialog(role: Role): void {
    this.selectedRole.set(role);
    this.permissionsDialogVisible.set(true);
  }

  closePermissionsDialog(): void {
    this.permissionsDialogVisible.set(false);
  }
}