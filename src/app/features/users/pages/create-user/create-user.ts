import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { Users } from '../../services/users';

interface CreateUserForm {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
}

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CardModule, Message],
  templateUrl: './create-user.html',
  styleUrl: './create-user.css',
})
export class CreateUser implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly usersService = inject(Users);
  private readonly router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

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
    });

    this.userForm.valueChanges.subscribe(() => this.errorMessage.set(''));
  }

  save(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email } = this.userForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set('');

    this.usersService
      .create({ first_name: firstName.trim(), last_name: lastName.trim(), email: email.trim() })
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

          if (error.status === 409) {
            this.errorMessage.set('Ya existe un usuario con ese correo electrónico.');
          } else if (error.status === 400) {
            const msg = error.error?.message;
            this.errorMessage.set(Array.isArray(msg) ? msg.join(' ') : msg ?? 'Datos inválidos.');
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