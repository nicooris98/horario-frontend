import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { LoginForm } from '../../interfaces/login-form.interface';
import { CardModule } from 'primeng/card';
import { Auth } from '../../services/auth';
import { Message } from 'primeng/message';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-login',
  imports: [
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ReactiveFormsModule,
    CardModule,
    Message,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');
  readonly adminAccess = signal(false);

  loginForm!: FormGroup<LoginForm>;

  ngOnInit(): void {
    this.loginForm = new FormGroup<LoginForm>({
      email: this.formBuilder.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: this.formBuilder.control('', { nonNullable: true }),
    });

    this.loginForm.controls.email.valueChanges.subscribe(() => {
      this.errorMessage.set('');
    });

    this.loginForm.controls.password.valueChanges.subscribe(() => {
      this.errorMessage.set('');
    });
  }

  showAdminAccess(): void {
    this.adminAccess.set(true);
    this.errorMessage.set('');
    this.loginForm.controls.password.setValidators([Validators.required]);
    this.loginForm.controls.password.updateValueAndValidity();
  }

  showCodeAccess(): void {
    this.adminAccess.set(false);
    this.errorMessage.set('');
    this.loginForm.controls.password.clearValidators();
    this.loginForm.controls.password.setValue('');
    this.loginForm.controls.password.updateValueAndValidity();
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set('');

    if (this.adminAccess()) {
      this.auth.login({ email, password }).subscribe({
        next: () => {
          this.auth.getMe().subscribe({
            next: () => {
              void this.router.navigate(['/dashboard']);
            },
            error: () => {
              this.loading.set(false);
              this.errorMessage.set('No se pudo validar la sesión. Intentá iniciar sesión nuevamente.');
            },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.errorMessage.set(
            error.status === 401
              ? (error.error?.message ?? 'Correo electrónico o contraseña incorrectos.')
              : 'Ocurrió un error al iniciar sesión.',
          );
        },
      });
      return;
    }

    this.auth.resendOtp(email).subscribe({
      next: () => {
        void this.router.navigate(['/verify-code'], { state: { email } });
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        const message = error.error?.message;
        this.errorMessage.set(
          typeof message === 'string' ? message : 'No se pudo enviar el código.',
        );
      },
    });
  }
}
