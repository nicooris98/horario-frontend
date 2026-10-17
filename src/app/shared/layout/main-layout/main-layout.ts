import { Component, signal, inject, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule, Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { Auth } from '../../../features/auth/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [Sidebar, RouterOutlet, ToolbarModule, ButtonModule, AvatarModule, MenuModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements AfterViewInit {
  @ViewChild('profileMenu') profileMenu!: Menu;

  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly sidebarOpen = signal(false);
  protected readonly currentSectionTitle = signal('Dashboard');

  profileMenuItems: MenuItem[] = [
    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      command: () => {
        this.onConfigurar();
      },
    },
    {
      separator: true,
    },
    {
      label: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      command: () => {
        this.onCerrarSesion();
      },
    },
  ];

  ngAfterViewInit(): void {
    // El componente Menu de PrimeNG necesita estar inicializado antes de usarse.
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((value) => !value);
  }

  protected toggleProfileMenu(event: Event): void {
    this.profileMenu.toggle(event);
  }

  protected onConfigurar(): void {
    // Opción preparada para futuras preferencias del sistema y configuración del usuario.
  }

  protected onCerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err: unknown) => {
        console.error('Error al cerrar sesión:', err);
      },
    });
  }
}
