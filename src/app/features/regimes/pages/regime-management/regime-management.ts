import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule, TablePageEvent } from 'primeng/table';
import { NotificationService } from '../../../../core/services/notification.service';
import { createIsMobileSignal } from '../../../../shared/utils/viewport';
import { RowActionsComponent } from '../../../../shared/components/row-actions/row-actions';
import { Regime } from '../../interfaces/regime';
import { Regimes } from '../../services/regimes';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';

const REGIMES_ROUTE = '/configuracion/regimenes';
const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-regime-management',
  standalone: true,
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    Message,
    PaginatorModule,
    TableModule,
    RowActionsComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './regime-management.html',
  styleUrl: './regime-management.css',
})
export class RegimeManagement implements OnInit {
  private readonly regimesService = inject(Regimes);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Configuración institucional' },
    { label: 'Regímenes' },
  ];
  protected readonly rowsPerPageOptions = [5, 10, 20];

  readonly regimes = signal<Regime[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly search = signal('');
  readonly first = signal(0);
  readonly rows = signal(DEFAULT_PAGE_SIZE);
  readonly isMobile = createIsMobileSignal(this.destroyRef);

  readonly filtersDisabled = computed(
    () => !this.loading() && !this.errorMessage() && this.regimes().length === 0,
  );

  readonly filteredRegimes = computed(() => {
    const search = this.search().toLowerCase().trim();
    return this.regimes().filter((regime) => regime.name.toLowerCase().includes(search));
  });

  readonly paginatedRegimes = computed(() => {
    const start = this.first();
    return this.filteredRegimes().slice(start, start + this.rows());
  });

  readonly rowActionsMap = computed(() => {
    const map = new Map<number, MenuItem[]>();
    for (const regime of this.filteredRegimes()) {
      map.set(regime.id, [
        {
          label: 'Editar',
          icon: 'pi pi-pencil',
          command: () => this.goToEdit(regime.id),
        },
        {
          label: 'Eliminar',
          icon: 'pi pi-trash',
          command: () => this.confirmDelete(regime),
        },
      ]);
    }
    return map;
  });

  ngOnInit(): void {
    this.loadRegimes();
  }

  loadRegimes(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.regimesService.getAll().subscribe({
      next: (regimes) => {
        this.regimes.set(regimes);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Ocurrió un error al cargar los regímenes.');
      },
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value ?? '');
    this.first.set(0);
  }

  onPageChange(event: TablePageEvent | PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? DEFAULT_PAGE_SIZE);
  }

  goToCreate(): void {
    void this.router.navigate([REGIMES_ROUTE, 'nuevo']);
  }

  goToDetail(id: number): void {
    void this.router.navigate([REGIMES_ROUTE, id]);
  }

  goToEdit(id: number): void {
    void this.router.navigate([REGIMES_ROUTE, id, 'editar']);
  }

  confirmDelete(regime: Regime): void {
    this.confirmationService.confirm({
      header: 'Eliminar régimen',
      message: `¿Querés eliminar el régimen "${regime.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Eliminar', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.deleteRegime(regime),
    });
  }

  private deleteRegime(regime: Regime): void {
    this.errorMessage.set('');
    this.regimesService.delete(regime.id).subscribe({
      next: () => {
        this.notification.success(
          'Régimen eliminado correctamente',
          `El régimen "${regime.name}" fue eliminado.`,
        );
        this.loadRegimes();
      },
      error: (error: HttpErrorResponse) => {
        const msg =
          error.status === 409
            ? error.error?.message ?? 'No se puede eliminar un régimen en uso.'
            : `No se pudo eliminar el régimen "${regime.name}".`;
        this.errorMessage.set(msg);
        this.notification.error('Error al eliminar el régimen', msg);
      },
    });
  }
}
