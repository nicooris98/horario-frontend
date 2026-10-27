export interface UserRole {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: UserRole[];
  permissions: string[];
}
