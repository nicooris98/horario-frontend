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
    label: 'Gestión académica',
    icon: 'pi pi-building-columns',
    items: [
      {
        label: 'Carreras',
        icon: 'pi pi-building',
        routerLink: '/academico/carreras',
      },
      {
        label: 'Planes de estudio',
        icon: 'pi pi-book',
        routerLink: '/academico/planes-estudio',
        permission: 'study-plans.read',
      },
    ],
  },
  {
    label: 'Configuración institucional',
    icon: 'pi pi-sliders-h',
    items: [
      {
        label: 'Turnos',
        icon: 'pi pi-sun',
        routerLink: '/configuracion/turnos',
      },
    ],
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
      {
        label: 'Materias',
        icon: 'pi pi-book',
        routerLink: '/administracion/materias',
      },
    ],
  },
];
