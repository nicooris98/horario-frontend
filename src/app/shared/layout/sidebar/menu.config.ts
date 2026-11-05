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
  label: 'Docentes',
  icon: 'pi pi-users',
  routerLink: '/docentes',
  },
  {

    label: 'Materias',
    icon: 'pi pi-book',
    routerLink: '/administracion/materias',
    permission: 'subjects.read',

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
      {
        label: 'Gestión de roles',
        icon: 'pi pi-shield',
        routerLink: '/administracion/roles',
        permission: 'roles.read',
      },
    ],
  },
  {
  label: 'Planes de estudio',
  icon: 'pi pi-book',
  routerLink: '/academico/planes-estudio',
}
];
