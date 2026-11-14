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
        routerLink: '/administracion/carreras',
        permission: 'degrees.read',
      },
      {
        label: 'Planes de estudio',
        icon: 'pi pi-book',
        routerLink: '/academico/planes-estudio',
        permission: 'study-plans.read',
      },
      {
        label: 'Materias',
        icon: 'pi pi-book',
        routerLink: '/administracion/materias',
        permission: 'subjects.read',
      },
    ],
  },
  {
    label: 'Configuración institucional',
    icon: 'pi pi-sliders-h',
    items: [
      {
        label: 'Calendario académico',
        icon: 'pi pi-calendar',
        routerLink: '/configuracion/calendario-academico',
      },
      {
        label: 'Turnos',
        icon: 'pi pi-sun',
        routerLink: '/configuracion/turnos',
      },
      {
        label: 'Estructura horaria',
        icon: 'pi pi-clock',
        routerLink: '/configuracion/estructura-horaria',
      },
      {
        label: 'Regímenes',
        icon: 'pi pi-list',
        routerLink: '/configuracion/regimenes',
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
    ],
  },
];
