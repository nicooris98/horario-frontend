import { Component, EventEmitter, Output, input, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PanelMenuModule } from 'primeng/panelmenu';
import { filter } from 'rxjs';
import { Auth } from '../../../features/auth/services/auth';
import { MENU_ITEMS } from './menu.config';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [PanelMenuModule, ButtonModule, ConfirmDialogModule],
  providers: [ConfirmationService],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  readonly sidebarOpen = input(false);

  private readonly confirmationService = inject(ConfirmationService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private currentUrl = this.router.url;

  @Output() cerrarSesion = new EventEmitter<void>();

  navigationItems: MenuItem[] = [];
  administrationItems: MenuItem[] = [];

  readonly panelMenuTheme = {
    root: { gap: '0.375rem' },
    panel: {
      background: 'transparent',
      borderColor: 'transparent',
      borderWidth: '0',
      color: 'var(--p-primary-contrast-color)',
      padding: '0',
      borderRadius: '0.625rem',
      first: { borderWidth: '0', topBorderRadius: '0.625rem' },
      last: { borderWidth: '0', bottomBorderRadius: '0.625rem' },
    },
    item: {
      focusBackground: 'var(--p-primary-color)',
      color: 'rgba(255, 255, 255, 0.88)',
      focusColor: '#FFFFFF',
      gap: '0.75rem',
      padding: '0.75rem 0.875rem',
      borderRadius: '0.625rem',
      icon: { color: 'currentColor', focusColor: 'currentColor', size: '1rem' },
      label: { fontWeight: '500', fontSize: '0.875rem' },
    },
    submenu: { indent: '0.75rem' },
    submenuIcon: { color: 'rgba(255, 255, 255, 0.72)', focusColor: '#FFFFFF' },
  };

  readonly sidebarButtonTheme = {
    text: {
      secondary: {
        color: 'rgba(255, 255, 255, 0.88)',
        hoverBackground: 'rgba(255, 255, 255, 0.12)',
        activeBackground: 'rgba(255, 255, 255, 0.18)',
      },
    },
  };

  constructor() {
    this.updateMenuItems();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.currentUrl = event.urlAfterRedirects;
        this.updateMenuItems();
      });
  }

  private updateMenuItems(): void {
    const items = this.filterMenuItems(MENU_ITEMS);
    this.navigationItems = items.filter((item) => !!item.routerLink);
    this.administrationItems = items.filter((item) => !item.routerLink);
  }

  private filterMenuItems(items: typeof MENU_ITEMS): MenuItem[] {
    return items.flatMap((item) => {
      const children = item.items ? this.filterMenuItems(item.items) : undefined;
      const hasPermission = !item.permission || this.auth.hasPermission(item.permission);

      if (!hasPermission || (item.items && !children?.length)) {
        return [];
      }

      const { permission: _permission, items: _items, ...menuItem } = item;
      const isActive = menuItem.routerLink ? this.isMenuItemActive(menuItem.routerLink) : false;

      return [
        {
          ...menuItem,
          ...(children ? { items: children } : {}),
          ...(menuItem.routerLink
            ? {
                routerLinkActiveOptions: { exact: true },
                ...(isActive
                  ? {
                      linkStyle: {
                        backgroundColor: 'var(--p-primary-color)',
                        color: 'var(--p-primary-contrast-color)',
                        borderRadius: 'var(--p-content-border-radius)',
                        fontWeight: '600',
                      },
                    }
                  : {}),
              }
            : {}),
        },
      ];
    });
  }

  private isMenuItemActive(routerLink: string): boolean {
    const currentPath = this.currentUrl.split(/[?#]/, 1)[0];
    const targetPath = this.router.serializeUrl(this.router.createUrlTree([routerLink]));

    // También queda marcado en las subpáginas (detalle, nueva, editar).
    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
  }

  confirmarCerrarSesion(): void {
    this.confirmationService.confirm({
      header: 'Confirmar cierre de sesión',
      message: '¿Querés cerrar la sesión actual?',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: 'Cerrar sesión',
        severity: 'primary',
      },
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      accept: () => this.cerrarSesion.emit(),
    });
  }
}
