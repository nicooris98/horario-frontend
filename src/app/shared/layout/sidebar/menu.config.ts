export interface MenuEntry {
  label: string;
  icon: string;
  routerLink?: string;
  permission?: string;
  items?: MenuEntry[];
}

export const MENU_ITEMS: MenuEntry[] = [
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    routerLink: '/dashboard',
  },
  {
    label: 'Administración',
    icon: 'pi pi-cog',
    items: [
      {
        label: 'Gestión de usuarios',
        icon: 'pi pi-users',
        routerLink: '/administracion/usuarios',
        permission: 'users.read',
      },
    ],
  },
];
