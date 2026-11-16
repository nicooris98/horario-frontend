import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { DetailHeaderComponent } from '../../../../shared/components/detail-header/detail-header';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';
import { Regime } from '../../interfaces/regime';
import { Regimes } from '../../services/regimes';

const REGIMES_ROUTE = '/configuracion/regimenes';

@Component({
  selector: 'app-regime-detail',
  standalone: true,
  imports: [BreadcrumbModule, CardModule, Message, SkeletonModule, DetailHeaderComponent],
  templateUrl: './regime-detail.html',
  styleUrl: './regime-detail.css',
})
export class RegimeDetail implements OnInit {
  private readonly regimesService = inject(Regimes);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;

  readonly regime = signal<Regime | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly breadcrumbItems = computed<MenuItem[]>(() => [
    { label: 'Configuración institucional' },
    { label: 'Regímenes', routerLink: REGIMES_ROUTE },
    { label: this.regime()?.name ?? 'Detalle' },
  ]);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('El régimen solicitado no es válido.');
      this.loading.set(false);
      return;
    }

    this.regimesService.getAll().subscribe({
      next: (list) => {
        const found = list.find((item) => item.id === id) ?? null;
        if (!found) {
          this.errorMessage.set('No se encontró el régimen solicitado.');
        }
        this.regime.set(found);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Ocurrió un error al cargar el régimen.');
      },
    });
  }

  goBack(): void {
    void this.router.navigate([REGIMES_ROUTE]);
  }

  goToEdit(): void {
    const current = this.regime();
    if (current) {
      void this.router.navigate([REGIMES_ROUTE, current.id, 'editar']);
    }
  }
}
