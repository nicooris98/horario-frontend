import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { NotificationService } from '../../../../core/services/notification.service';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';
import { Regime } from '../../interfaces/regime';
import { Regimes } from '../../services/regimes';

const REGIMES_ROUTE = '/configuracion/regimenes';

@Component({
  selector: 'app-regime-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    InputTextModule,
    Message,
  ],
  providers: [ConfirmationService],
  templateUrl: './regime-form.html',
  styleUrl: './regime-form.css',
})
export class RegimeForm implements OnInit {
  private readonly regimesService = inject(Regimes);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;

  readonly regimeId = signal<number | null>(null);
  readonly isEdit = computed(() => this.regimeId() !== null);
  readonly regime = signal<Regime | null>(null);
  readonly allRegimes = signal<Regime[]>([]);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
  });

  readonly breadcrumbItems = computed<MenuItem[]>(() => [
    { label: 'Configuración institucional' },
    { label: 'Regímenes', routerLink: REGIMES_ROUTE },
    { label: this.isEdit() ? 'Editar régimen' : 'Nuevo régimen' },
  ]);

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId !== null) {
      const id = Number(rawId);
      if (!Number.isInteger(id) || id <= 0) {
        this.errorMessage.set('El régimen solicitado no es válido.');
        this.form.disable();
        return;
      }
      this.regimeId.set(id);
    }

    this.form.valueChanges.subscribe(() => this.errorMessage.set(''));

    this.regimesService.getAll().subscribe({
      next: (list) => {
        this.allRegimes.set(list);
        const id = this.regimeId();
        if (id !== null) {
          const found = list.find((item) => item.id === id) ?? null;
          if (!found) {
            this.errorMessage.set('No se encontró el régimen solicitado.');
            return;
          }
          this.regime.set(found);
          this.form.patchValue({ name: found.name }, { emitEvent: false });
          this.form.markAsPristine();
        }
      },
      error: () => this.errorMessage.set('Ocurrió un error al cargar los datos.'),
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.controls.name.value.trim();
    if (!name) {
      this.errorMessage.set('El nombre es obligatorio.');
      return;
    }

    const id = this.regimeId();
    const repeated = this.allRegimes().some(
      (item) => item.name.toLowerCase() === name.toLowerCase() && item.id !== id,
    );
    if (repeated) {
      this.errorMessage.set('Ya existe un régimen con ese nombre.');
      return;
    }

    const request =
      id !== null ? this.regimesService.update(id, name) : this.regimesService.create(name);

    this.saving.set(true);
    this.errorMessage.set('');

    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.notification.success(
          id !== null ? 'Régimen actualizado correctamente' : 'Régimen registrado correctamente',
          `El régimen "${saved.name}" se guardó correctamente.`,
        );
        void this.router.navigate(id !== null ? [REGIMES_ROUTE, saved.id] : [REGIMES_ROUTE]);
      },
      error: () => {
        this.saving.set(false);
        const msg = 'No se pudo guardar el régimen.';
        this.errorMessage.set(msg);
        this.notification.error(
          id !== null ? 'Error al actualizar el régimen' : 'Error al registrar el régimen',
          msg,
        );
      },
    });
  }

  confirmDelete(): void {
    const current = this.regime();
    if (!current || this.deleting()) return;

    const pendingWarning = this.form.dirty
      ? ' Tenés cambios pendientes en el formulario que no serán guardados.'
      : '';

    this.confirmationService.confirm({
      header: 'Eliminar régimen',
      message: `¿Querés eliminar el régimen "${current.name}"?${pendingWarning}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Eliminar', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.deleteRegime(current),
    });
  }

  private deleteRegime(current: Regime): void {
    this.deleting.set(true);
    this.regimesService.delete(current.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.notification.success(
          'Régimen eliminado correctamente',
          `El régimen "${current.name}" fue eliminado.`,
        );
        void this.router.navigate([REGIMES_ROUTE]);
      },
      error: (error: HttpErrorResponse) => {
        this.deleting.set(false);
        const msg =
          error.status === 409
            ? error.error?.message ?? 'No se puede eliminar un régimen en uso.'
            : `No se pudo eliminar el régimen "${current.name}".`;
        this.errorMessage.set(msg);
        this.notification.error('Error al eliminar el régimen', msg);
      },
    });
  }

  cancel(): void {
    const id = this.regimeId();
    void this.router.navigate(id !== null ? [REGIMES_ROUTE, id] : [REGIMES_ROUTE]);
  }
}
