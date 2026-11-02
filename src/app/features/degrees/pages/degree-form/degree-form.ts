import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Degree, DegreeRequest, DegreeStatus } from '../../models/degree.model';
import { DegreeService } from '../../services/degree.service';
import { uniqueDegreeNameValidator } from '../../validators/degree.validators';

@Component({
  selector: 'app-degree-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
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

  readonly isEditMode = signal(false);
  readonly degreeId = signal<number | null>(null);
  readonly hasRelatedPlans = signal(false);
  readonly isSubmitting = this.degreeService.loading;
  readonly error = this.degreeService.error;

  readonly statusOptions: Array<{ label: string; value: DegreeStatus }> = [
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' },
  ];

  private originalDegree: Degree | null = null;

  readonly form = this.fb.nonNullable.group({
    name: [
      '',
      {
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
        asyncValidators: [uniqueDegreeNameValidator(() => this.degreeService.degrees(), () => this.degreeId())],
      },
    ],
    durationYears: [1, [Validators.required, Validators.min(0.5)]],
    status: ['ACTIVE' as DegreeStatus, Validators.required],
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
        acceptLabel: 'Guardar cambios',
        rejectLabel: 'Cancelar',
        accept: () => this.submit(request),
      });
      return;
    }

    this.submit(request);
  }

  private loadDegree(id: number): void {
    this.degreeService.getDegreeById(id).subscribe({
      next: (degree) => {
        if (!degree || degree.id === 0) {
          return;
        }

        this.originalDegree = degree;
        this.hasRelatedPlans.set((degree.studyPlans ?? []).length > 0);
        this.form.patchValue({
          name: degree.name,
          durationYears: degree.durationYears,
          status: degree.status,
        });
      },
    });
  }

  private submit(request: DegreeRequest): void {
    const operation = this.isEditMode() && this.degreeId() !== null
      ? this.degreeService.updateDegree(this.degreeId()!, request)
      : this.degreeService.createDegree(request);

    operation.subscribe({
      next: () => {
        void this.router.navigate(['/administracion/carreras']);
      },
    });
  }

  private buildRequest(): DegreeRequest {
    const values = this.form.getRawValue();

    return {
      name: values.name.trim(),
      durationYears: Number(values.durationYears),
      status: values.status,
      updatedBy: 'administrativo',
      updatedAt: new Date().toISOString(),
      changedFields: this.originalDegree ? this.collectChangedFields(values) : ['name', 'durationYears', 'status'],
    };
  }

  private collectChangedFields(values: { name: string; durationYears: number; status: DegreeStatus }): string[] {
    const changes: string[] = [];

    if (this.originalDegree?.name !== values.name.trim()) {
      changes.push('name');
    }

    if (this.originalDegree?.durationYears !== Number(values.durationYears)) {
      changes.push('durationYears');
    }

    if (this.originalDegree?.status !== values.status) {
      changes.push('status');
    }

    return changes;
  }

  private hasChanges(request: DegreeRequest): boolean {
    if (!this.originalDegree) {
      return false;
    }

    return (
      this.originalDegree.name !== request.name ||
      this.originalDegree.durationYears !== request.durationYears ||
      this.originalDegree.status !== request.status
    );
  }

  cancel(): void {
    void this.router.navigate(['/administracion/carreras']);
  }
}
