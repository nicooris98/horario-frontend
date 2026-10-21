export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}
export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
}