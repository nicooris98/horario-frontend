import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [CardModule, ButtonModule, Message],
  templateUrl: './activate-account.html',
  styleUrls: ['../login/login.css', './activate-account.css'],
})
export class ActivateAccount implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);

  readonly loading = signal(true);
  readonly success = signal(false);
  readonly message = signal('');

  ngOnInit(): void {
    const email = (this.route.snapshot.queryParamMap.get('email') ?? '').trim().toLowerCase();
    const code = (this.route.snapshot.queryParamMap.get('code') ?? '').trim();

    if (!email || !code) {
      this.loading.set(false);
      this.success.set(false);
      this.message.set('El enlace de activación no es válido.');
      return;
    }

    this.auth.verifyOtp(email, code).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.message.set('¡Se activó tu cuenta!');
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.success.set(false);
        const msg = error.error?.message;
        this.message.set(
          typeof msg === 'string' ? msg : 'No se pudo activar la cuenta. El enlace es inválido o ya fue usado.',
        );
      },
    });
  }

  goToLogin(): void {
    void this.router.navigate(['/login']);
  }
}