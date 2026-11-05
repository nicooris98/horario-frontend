import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputOtp } from 'primeng/inputotp';
import { Message } from 'primeng/message';
import { Subject, switchMap, take, tap, timer } from 'rxjs';
import { Auth } from '../../services/auth';
import { VerifyCodeForm } from '../../interfaces/verify-code-form.interface';

interface VerifyCodeNavigationState {
  email?: string;
}

@Component({
  selector: 'app-verify-code',
  imports: [ReactiveFormsModule, CardModule, ButtonModule, InputOtp, Message],
  templateUrl: './verify-code.html',
  styleUrls: ['../login/login.css', './verify-code.css'],
})
export class VerifyCode implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly restartCountdown$ = new Subject<void>();

  readonly userEmail = signal('');
  readonly loading = signal(false);
  readonly resending = signal(false);
  readonly countdown = signal(0);
  readonly errorMessage = signal('');

  verifyCodeForm!: FormGroup<VerifyCodeForm>;

  ngOnInit(): void {
    const email = this.readEmailFromNavigation();

    if (!email) {
      void this.router.navigate(['/login']);
      return;
    }

    this.userEmail.set(email);
    this.verifyCodeForm = new FormGroup<VerifyCodeForm>({
      code: this.formBuilder.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
      }),
    });

    this.verifyCodeForm.controls.code.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.errorMessage.set('');
      });

    this.restartCountdown$
      .pipe(
        switchMap(() =>
          timer(0, 1000).pipe(
            take(61),
            tap((elapsed) => this.countdown.set(60 - elapsed)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.restartCountdown$.next();
  }

  private readEmailFromNavigation(): string {
    const navigationState = this.router.lastSuccessfulNavigation()?.extras.state as
      | VerifyCodeNavigationState
      | undefined;
    const historyState = history.state as VerifyCodeNavigationState | null;
    const email = navigationState?.email ?? historyState?.email ?? '';

    return email.trim().toLowerCase();
  }

  verifyCode(): void {
    if (this.verifyCodeForm.invalid) {
      this.verifyCodeForm.markAllAsTouched();
      return;
    }

    const { code } = this.verifyCodeForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.verifyOtp(this.userEmail(), code).subscribe({
      next: () => {
        this.auth.getMe().subscribe({
          next: () => {
            void this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.loading.set(false);
            this.errorMessage.set(
              'No se pudo validar la sesión. Intentá iniciar sesión nuevamente.',
            );
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        const message = error.error?.message;
        this.errorMessage.set(
          typeof message === 'string' ? message : 'El código es incorrecto o expiró.',
        );
      },
    });
  }

  resendLabel(): string {
    if (this.countdown() > 0) {
      return `¿No recibiste el código? Reenviar (Espera ${this.countdown()} segundos)`;
    }

    return '¿No recibiste el código? Reenviar';
  }

  backToLogin(): void {
    void this.router.navigate(['/login']);
  }

  resendCode(): void {
    if (this.countdown() > 0 || this.resending()) {
      return;
    }

    this.resending.set(true);
    this.errorMessage.set('');

    this.auth.login(this.userEmail()).subscribe({
      next: (response) => {
        if (!response.verificationRequired) {
          this.auth.getMe().subscribe({
            next: () => {
              void this.router.navigate(['/dashboard']);
            },
            error: () => {
              this.resending.set(false);
              this.errorMessage.set('No se pudo validar la sesión. Intentá iniciar sesión nuevamente.');
            },
          });
          return;
        }

        this.resending.set(false);
        this.restartCountdown$.next();
      },
      error: (error: HttpErrorResponse) => {
        this.resending.set(false);
        const message = error.error?.message;
        this.errorMessage.set(
          typeof message === 'string' ? message : 'No se pudo reenviar el código.',
        );
      },
    });
  }
}
