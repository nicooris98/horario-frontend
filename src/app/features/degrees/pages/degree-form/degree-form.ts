import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../../core/services/notification.service';
import { Degree, DegreeRequest, DegreeStatus } from '../../models/degree.model';
import { DegreeService } from '../../services/degree.service';
import { uniqueDegreeNameValidator } from '../../validators/degree.validators';

const DEGREES_ROUTE = '/administracion/carreras';

@Component({
  selector: 'app-degree-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    InputTextModule,
    Message,
    TagModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './degree-form.html',
  styleUrl: './degree-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DegreeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly degreeService = inject(DegreeService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);

  readonly isEditMode = signal(false);
  readonly degreeId = signal<number | null>(null);
  readonly degreeName = signal<string>('');
  readonly currentStatus = signal<DegreeStatus>('ACTIVO');
  readonly hasRelatedPlans = signal(false);
  readonly isSubmitting = this.degreeService.loading;
  readonly error = this.degreeService.error;

  protected readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  protected readonly breadcrumbTheme = { root: { background: 'transparent', padding: '0' } };
  protected readonly breadcrumbItems = computed<MenuItem[]>(() => [
    { label: 'Administración' },
    { label: 'Carreras', routerLink: DEGREES_ROUTE },
    { label: this.isEditMode() ? 'Editar carrera' : 'Nueva carrera' },
  ]);

  private originalDegree: Degree | null = null;

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      {
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
        asyncValidators: [uniqueDegreeNameValidator(() => this.degreeService.degrees(), () => this.degreeId())],
      },
    ],
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (Number.isInteger(id) && id > 0) {
      this.isEditMode.set(true);
      this.degreeId.set(id);
      this.form.controls.name.setAsyncValidators(
        uniqueDegreeNameValidator(() => this.degreeService.degrees(), () => this.degreeId()),
      );
      this.loadDegree(id);
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.buildRequest();
    const changedValues = this.hasChanges(request);

    if (this.isEditMode() && this.hasRelatedPlans() && changedValues) {
      this.confirmationService.confirm({
        header: 'Confirmar impacto',
        message:
          'Esta carrera ya tiene planes de estudio vinculados. Guardar cambios puede afectar la estructura académica asociada.',
        icon: 'pi pi-exclamation-triangle',
        acceptButtonProps: { label: 'Guardar cambios', severity: 'primary' },
        rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
        accept: () => this.submit(request),
      });
      return;
    }

    this.submit(request);
  }

  confirmStatusChange(): void {
    const id = this.degreeId();
    if (!id) return;

    const isCurrentlyActive = this.currentStatus() === 'ACTIVO';
    const nextStatus: DegreeStatus = isCurrentlyActive ? 'INACTIVO' : 'ACTIVO';
    const actionLabel = isCurrentlyActive ? 'desactivar' : 'activar';
    const degreeName = this.originalDegree?.name ?? this.form.controls.name.value;
    const pendingWarning = this.form.dirty
      ? ' Tenés cambios pendientes en el formulario que no serán guardados.'
      : '';

    this.confirmationService.confirm({
      header: isCurrentlyActive ? 'Desactivar carrera' : 'Activar carrera',
      message: `¿Querés ${actionLabel} la carrera "${degreeName}"?${pendingWarning}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: isCurrentlyActive ? 'Desactivar' : 'Activar',
        severity: isCurrentlyActive ? 'danger' : 'success',
      },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.updateStatus(id, nextStatus),
    });
  }

  cancel(): void {
    const id = this.degreeId();
    if (this.isEditMode() && id) {
      void this.router.navigate([DEGREES_ROUTE, id]);
    } else {
      void this.router.navigate([DEGREES_ROUTE]);
    }
  }

  statusLabel(value: DegreeStatus): string {
    return value === 'ACTIVO' ? 'Activo' : 'Inactivo';
  }

  statusSeverity(value: DegreeStatus): 'success' | 'danger' {
    return value === 'ACTIVO' ? 'success' : 'danger';
  }

  private loadDegree(id: number): void {
    this.degreeService.getDegreeById(id).subscribe({
      next: (degree) => {
        if (!degree || degree.id === 0) {
          return;
        }

        this.originalDegree = degree;
        this.degreeName.set(degree.name);
        this.currentStatus.set(degree.status);
        this.hasRelatedPlans.set((degree.studyPlans ?? []).length > 0);
        this.form.patchValue({
          name: degree.name,
        });
      },
    });
  }

  private updateStatus(id: number, nextStatus: DegreeStatus): void {
    const isActivating = nextStatus === 'ACTIVO';
    this.degreeService.updateStatus(id, nextStatus).subscribe({
      next: (degree) => {
        if (!degree || degree.id === 0) {
          this.notification.error(
            isActivating ? 'Error al activar la carrera' : 'Error al desactivar la carrera',
            this.error() ?? 'No se pudo cambiar el estado de la carrera.',
          );
          return;
        }

        this.currentStatus.set(degree.status);
        if (this.originalDegree) {
          this.originalDegree = { ...this.originalDegree, status: degree.status };
        }

        this.notification.success(
          isActivating ? 'Carrera activada correctamente' : 'Carrera desactivada correctamente',
          `La carrera "${degree.name}" ahora está ${isActivating ? 'activa' : 'inactiva'}.`,
        );
      },
    });
  }

  private submit(request: DegreeRequest): void {
    const isEdit = this.isEditMode() && this.degreeId() !== null;
    const operation = isEdit
      ? this.degreeService.updateDegree(this.degreeId()!, request)
      : this.degreeService.createDegree(request);

    operation.subscribe({
      next: (degree) => {
        if (!degree || degree.id === 0) {
          this.notification.error(
            isEdit ? 'Error al actualizar la carrera' : 'Error al registrar la carrera',
            this.error() ?? 'No se pudo guardar la carrera.',
          );
          return;
        }

        this.notification.success(
          isEdit ? 'Carrera actualizada correctamente' : 'Carrera registrada correctamente',
          `La carrera "${degree.name}" se guardó correctamente.`,
        );

        void this.router.navigate([DEGREES_ROUTE]);
      },
    });
  }

  private buildRequest(): DegreeRequest {
    const values = this.form.getRawValue();

    return {
      name: values.name.trim(),
    };
  }

  private hasChanges(request: DegreeRequest): boolean {
    if (!this.originalDegree) {
      return false;
    }

    return this.originalDegree.name !== request.name;
  }
}
