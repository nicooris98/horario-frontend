import { environment } from "../environments/environment.development";

export const API_CONFIG = {
     baseUrl: environment.apiUrl
} as const;