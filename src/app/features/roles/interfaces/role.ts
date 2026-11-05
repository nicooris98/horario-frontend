export interface RolePermission {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  permissions: RolePermission[];
}
