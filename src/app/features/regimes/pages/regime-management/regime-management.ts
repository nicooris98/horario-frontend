import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Regime } from '../../interfaces/regime';
import { Regimes } from '../../services/regimes';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';

@Component({
  selector: 'app-regime-management',
  standalone: true,
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    Message,
    TableModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './regime-management.html',
  styleUrl: './regime-management.css',
})
export class RegimeManagement implements OnInit {
  private readonly regimesService = inject(Regimes);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Configuración institucional' },
    { label: 'Regímenes' },
  ];

  readonly regimes = signal<Regime[]>([]);
  readonly errorMessage = signal('');
  readonly search = signal('');

  readonly filteredRegimes = computed(() => {
    const search = this.search().toLowerCase().trim();
    return this.regimes().filter((regime) => regime.name.toLowerCase().includes(search));
  });

  readonly dialogVisible = signal(false);
  readonly editingRegime = signal<Regime | null>(null);
  readonly nameInput = signal('');
  readonly formError = signal('');
  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadRegimes();
  }

  loadRegimes(): void {
    this.errorMessage.set('');
    this.regimesService.getAll().subscribe({
      next: (regimes) => this.regimes.set(regimes),
      error: () => this.errorMessage.set('Ocurrió un error al cargar los regímenes.'),
    });
  }

  openCreate(): void {
    this.editingRegime.set(null);
    this.nameInput.set('');
    this.formError.set('');
    this.dialogVisible.set(true);
  }

  openEdit(regime: Regime): void {
    this.editingRegime.set(regime);
    this.nameInput.set(regime.name);
    this.formError.set('');
    this.dialogVisible.set(true);
  }

  save(): void {
    const name = this.nameInput().trim();
    if (!name) {
      this.formError.set('El nombre es obligatorio.');
      return;
    }

    const repeated = this.regimes().some(
      (regime) =>
        regime.name.toLowerCase() === name.toLowerCase() && regime.id !== this.editingRegime()?.id,
    );
    if (repeated) {
      this.formError.set('Ya existe un régimen con ese nombre.');
      return;
    }

    const editing = this.editingRegime();
    const request = editing
      ? this.regimesService.update(editing.id, name)
      : this.regimesService.create(name);

    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.loadRegimes();
      },
      error: () => {
        this.saving.set(false);
        this.formError.set('No se pudo guardar el régimen.');
      },
    });
  }

  confirmDelete(regime: Regime): void {
    this.confirmationService.confirm({
      header: 'Eliminar régimen',
      message: `¿Querés eliminar el régimen "${regime.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Eliminar', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.delete(regime),
    });
  }

  private delete(regime: Regime): void {
    this.errorMessage.set('');
    this.regimesService.delete(regime.id).subscribe({
      next: () => this.loadRegimes(),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(
          error.status === 409
            ? error.error.message
            : `No se pudo eliminar el régimen "${regime.name}".`,
        ),
    });
  }
}
