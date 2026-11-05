import { Component, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Users } from '../../services/users';
import { Roles } from '../../../roles/services/roles';
import { Role } from '../../../roles/interfaces/role';

interface CreateUserForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  roleId: FormControl<number | null>;
}

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CardModule, Message, Select],
  templateUrl: './create-user.html',
  styleUrl: './create-user.css',
  encapsulation: ViewEncapsulation.None,
})
export class CreateUser implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usersService = inject(Users);
  private readonly rolesService = inject(Roles);
  private readonly router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  roles = signal<Role[]>([]);

  userForm!: FormGroup<CreateUserForm>;

  ngOnInit(): void {
    const nameValidators = [Validators.required, Validators.minLength(2), Validators.maxLength(100)];

    this.userForm = new FormGroup<CreateUserForm>({
      firstName: this.formBuilder.control('', { nonNullable: true, validators: nameValidators }),
      lastName: this.formBuilder.control('', { nonNullable: true, validators: nameValidators }),
      email: this.formBuilder.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      roleId: this.formBuilder.control<number | null>(null, {
        validators: [Validators.required],
      }),
    });

    this.userForm.valueChanges.subscribe(() => this.errorMessage.set(''));

    this.rolesService.getAll().subscribe({
      next: (roles) => this.roles.set(roles.filter((r) => r.isActive)),
      error: () => this.errorMessage.set('No se pudieron cargar los roles.'),
    });
  }

  save(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, roleId } = this.userForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set('');

    this.usersService
      .create({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        role_ids: roleId != null ? [roleId] : [],
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set(
            `Usuario creado. Se envió un correo de activación a ${email}.`,
          );
          this.userForm.reset();
          setTimeout(() => this.router.navigate(['/administracion/usuarios']), 2000);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          const msg = error.error?.message;
          const text = Array.isArray(msg) ? msg.join(' ') : msg;

          if (error.status === 409) {
            this.errorMessage.set('Ya existe un usuario con ese correo electrónico.');
          } else if (typeof text === 'string' && text.length > 0) {
            this.errorMessage.set(text);
          } else if (error.status === 403) {
            this.errorMessage.set('No tenés permisos para crear usuarios.');
          } else {
            this.errorMessage.set('Ocurrió un error al crear el usuario.');
          }
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/administracion/usuarios']);
  }
}
