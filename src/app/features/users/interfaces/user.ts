import { Role } from '../../roles/interfaces/role';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  isDisabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  roles?: Role[];
}
export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  role_ids?: number[];
}