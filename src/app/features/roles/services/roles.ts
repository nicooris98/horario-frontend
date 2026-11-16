import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { Api } from '../../../core/services/api';
import { Role, RolePermission } from '../interfaces/role';

interface RawPermissionEntry {
  id?: number;
  name?: string;
  code?: string;
  isActive?: boolean;
  is_active?: boolean;
  permission?: RawPermissionEntry;
}

interface RawRoleEntry {
  id: number;
  name: string;
  description?: string | null;
  isActive?: boolean;
  is_active?: boolean;
  permissions?: (RawPermissionEntry | string)[];
  rolePermissions?: RawPermissionEntry[];
  role_permissions?: RawPermissionEntry[];
}

function normalizePermission(entry: RawPermissionEntry | string, index: number): RolePermission {
  if (typeof entry === 'string') {
    return {
      id: index + 1,
      name: entry,
      code: entry,
      isActive: true,
    };
  }

  const source = entry.permission ?? entry;
  const code = (source.code ?? '').trim();
  const name = (source.name ?? '').trim() || code;

  return {
    id: source.id ?? entry.id ?? index + 1,
    name,
    code,
    isActive: source.isActive ?? source.is_active ?? entry.isActive ?? entry.is_active ?? true,
  };
}

function normalizeRole(raw: RawRoleEntry): Role {
  const rawPermissions = raw.permissions ?? raw.rolePermissions ?? raw.role_permissions ?? [];
  const permissions = Array.isArray(rawPermissions)
    ? rawPermissions.map((item, idx) => normalizePermission(item, idx))
    : [];

  return {
    id: raw.id,
    name: raw.name ?? '',
    description: raw.description ?? null,
    isActive: raw.isActive ?? raw.is_active ?? true,
    permissions,
  };
}

@Injectable({ providedIn: 'root' })
export class Roles {
  private readonly api = inject(Api);

  getAll() {
    return this.api
      .get<RawRoleEntry[] | { data?: RawRoleEntry[]; roles?: RawRoleEntry[] }>('roles')
      .pipe(
        map((response) => {
          const list = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.roles)
                ? response.roles
                : [];
          return list.map(normalizeRole);
        }),
      );
  }

  getById(id: number) {
    return this.api.get<RawRoleEntry>(`roles/${id}`).pipe(map(normalizeRole));
  }

  getPermissions(id: number) {
    return this.api
      .get<RawRoleEntry | RawPermissionEntry[] | { permissions?: RawPermissionEntry[] }>(
        `roles/${id}/permissions`,
      )
      .pipe(
        map((response) => {
          if (Array.isArray(response)) {
            return {
              id,
              name: '',
              description: null,
              isActive: true,
              permissions: response.map((item, idx) => normalizePermission(item, idx)),
            } satisfies Role;
          }
          return normalizeRole(response as RawRoleEntry);
        }),
      );
  }
}