import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Auth } from '../../../features/auth/services/auth';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  const currentUser = signal<{ permissions: string[] } | null>(null);
  const hasPermission = vi.fn((permission: string) =>
    currentUser()?.permissions.includes(permission) ?? false,
  );

  beforeEach(async () => {
    currentUser.set(null);
    hasPermission.mockClear();
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideRouter([]),
        {
          provide: Auth,
          useValue: {
            currentUser,
            hasPermission,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hides permission-protected menu sections when the user lacks access', () => {
    expect(component.menuItems().map((item) => item.label)).toEqual(['Dashboard']);
  });

  it('shows the administration submenu when the user has users.read', () => {
    currentUser.set({ permissions: ['users.read'] });

    const administration = component.menuItems().find((item) => item.label === 'Administración');

    expect(administration?.items?.map((item) => item.label)).toEqual(['Gestión de usuarios']);
    expect(administration?.items?.[0].routerLink).toBe('/administracion/usuarios');
  });
});
