import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { filter } from 'rxjs';
import { Auth } from '../../../features/auth/services/auth';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [Sidebar, RouterOutlet, ToolbarModule, ButtonModule, AvatarModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements OnInit {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sidebarOpen = signal(false);
  protected readonly sidebarCollapsed = signal(false);

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.closeSidebar());
  }

  protected toggleSidebar(): void {
    if (this.isDesktopViewport()) {
      this.sidebarCollapsed.update((collapsed) => !collapsed);
      return;
    }

    this.sidebarOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected sidebarExpanded(): boolean {
    return this.isDesktopViewport() ? !this.sidebarCollapsed() : this.sidebarOpen();
  }

  protected profileName(): string {
    const user = this.auth.currentUser();
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Usuario';
  }

  protected profileInitials(): string {
    const user = this.auth.currentUser();
    const firstName = user?.firstName?.trim() ?? '';
    const lastName = user?.lastName?.trim() ?? '';
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;

    return (initials || firstName.slice(0, 2) || 'US').toLocaleUpperCase('es');
  }

  protected onCerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: (error: unknown) => {
        console.error('No se pudo cerrar la sesión:', error);
      },
    });
  }

  private isDesktopViewport(): boolean {
    return this.document.defaultView?.matchMedia?.('(min-width: 992px)').matches ?? false;
  }
}
