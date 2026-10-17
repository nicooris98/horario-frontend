export interface LoginResponse {
    accessToken: string;
    user:        User;
}

export interface User {
    createdAt: Date;
    updatedAt: Date;
    id:        number;
    firstName: string;
    lastName:  string;
    email:     string;
    isActive:  boolean;
    roles:     any[];
}
