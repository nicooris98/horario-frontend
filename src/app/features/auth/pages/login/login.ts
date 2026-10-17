import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
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
@Component({
  selector: 'app-login',
  imports: [
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ReactiveFormsModule,
    CardModule,
    Message,
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

  loginForm!: FormGroup<LoginForm>;

  ngOnInit(): void {
    this.loginForm = new FormGroup<LoginForm>({
      email: this.formBuilder.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: this.formBuilder.control('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });

    this.loginForm.controls.email.valueChanges.subscribe(() => {
      this.errorMessage.set('');
    });

    this.loginForm.controls.password.valueChanges.subscribe(() => {
      this.errorMessage.set('');
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const requestData = this.loginForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.login(requestData).subscribe({
      next: () => {
        this.auth.getMe().subscribe({
          next: (user) => {
            console.log('Usuario autenticado:', user);

            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            console.error('Error al consultar /auth/me:', err);
          },
        });
      },

      error: (error: HttpErrorResponse) => {
        this.loading.set(false);

        if (error.status === 401) {
          this.errorMessage.set(
            error.error?.message ?? 'Correo electrónico o contraseña incorrectos.',
          );
        } else {
          this.errorMessage.set('Ocurrió un error al iniciar sesión.');
        }
      },
    });
  }
}
