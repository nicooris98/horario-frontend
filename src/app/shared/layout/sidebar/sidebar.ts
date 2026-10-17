import { Component, input, Output, EventEmitter, inject } from '@angular/core';
import { MenuItem,ConfirmationService } from 'primeng/api';
import { PanelMenuModule } from 'primeng/panelmenu';
import { Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [PanelMenuModule, Card, ButtonModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  readonly sidebarOpen = input(false);
  private readonly confirmationService = inject(ConfirmationService);
  @Output() configurar = new EventEmitter<void>();
  @Output() cerrarSesion = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
    },
    {
      label: 'Gestión',
      icon: 'pi pi-users',
      items: [
        {
          label: 'Usuarios',
          icon: 'pi pi-user',
          routerLink: '/usuarios',
        },
        {
          label: 'Roles',
          icon: 'pi pi-shield',
          routerLink: '/roles',
        },
        {
          label: 'Permisos',
          icon: 'pi pi-lock',
          routerLink: '/permisos',
        },
      ],
    },
    {
      label: 'Académico',
      icon: 'pi pi-calendar',
      items: [
        {
          label: 'Asignaturas',
          icon: 'pi pi-book',
          routerLink: '/asignaturas',
        },
        {
          label: 'Horarios',
          icon: 'pi pi-clock',
          routerLink: '/horarios',
        },
      ],
    },
  ];

  onConfigurar(): void {
    this.configurar.emit();
  }

  onCerrarSesion(): void {
    this.cerrarSesion.emit();
  }


confirmarCerrarSesion(): void {
  this.confirmationService.confirm({
    header: 'Confirmación',
    message: '¿Está seguro de que desea cerrar sesión?',
    icon: 'pi pi-exclamation-triangle',

    acceptButtonProps: {
      label: 'Aceptar',
      severity: 'primary',
      outlined: false,
    },

    rejectButtonProps: {
      label: 'Cancelar',
      severity: 'secondary',
      outlined: true,
    },

    accept: () => this.onCerrarSesion(),
  });
}

}
