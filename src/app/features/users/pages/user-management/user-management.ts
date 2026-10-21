import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Message } from 'primeng/message';
import { Users } from '../../services/users';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [TableModule, ButtonModule, CardModule, TagModule, Message],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css',
})
export class UserManagement implements OnInit {
  private readonly usersService = inject(Users);
  private readonly router = inject(Router);

  users = signal<User[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.usersService.getAll().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.status === 403
            ? 'No tenés permisos para ver los usuarios.'
            : 'Ocurrió un error al cargar los usuarios.',
        );
      },
    });
  }

  goToCreate(): void {
    this.router.navigate(['/administracion/usuarios/nuevo']);
  }
}