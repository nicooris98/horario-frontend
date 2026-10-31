import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { StudyPlans } from '../../services/study-plan';
import { Degrees } from '../../services/degrees';
import { Degree } from '../../interfaces/degree';

interface EditStudyPlanForm {
  name: FormControl<string>;
  degreeId: FormControl<number | null>;
  durationYears: FormControl<number | null>;
  validityYear: FormControl<number | null>;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
}

@Component({
  selector: 'app-edit-study-plan',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CardModule, Message, Select, TagModule],
  templateUrl: './edit-study-plan.html',
  styleUrl: './edit-study-plan.css',
})
export class EditStudyPlan implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly studyPlansService = inject(StudyPlans);
  private readonly degreesService = inject(Degrees);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  planId!: number;

  degrees = signal<Degree[]>([]);
  loading = signal(false);
  loadingPlan = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  status = signal('');
  archiving = signal(false);
  archiveError = signal('');
  statusLoading = signal(false);
  statusError = signal('');

  studyPlanForm!: FormGroup<EditStudyPlanForm>;

  ngOnInit(): void {
    this.planId = Number(this.route.snapshot.paramMap.get('id'));

    this.studyPlanForm = new FormGroup<EditStudyPlanForm>({
      name: this.formBuilder.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(150)],
      }),
      degreeId: this.formBuilder.control<number | null>(null, [Validators.required]),
      durationYears: this.formBuilder.control<number | null>(null, [
        Validators.required,
        Validators.min(1),
      ]),
      validityYear: this.formBuilder.control<number | null>(null, [
        Validators.required,
        Validators.min(2000),
        Validators.pattern(/^\d{4}$/),
      ]),
      startDate: this.formBuilder.control('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      endDate: this.formBuilder.control('', { nonNullable: true }),
    });

    this.studyPlanForm.valueChanges.subscribe(() => this.errorMessage.set(''));

    this.loadDegrees();
    this.loadPlan();
  }

  loadDegrees(): void {
    this.degreesService.getAll().subscribe({
      next: (degrees) => this.degrees.set(degrees),
      error: () => this.errorMessage.set('No se pudieron cargar las carreras.'),
    });
  }

  loadPlan(): void {
    this.studyPlansService.getById(this.planId).subscribe({
      next: (plan) => {
        this.studyPlanForm.patchValue({
          name: plan.name,
          degreeId: plan.degree.id,
          durationYears: plan.durationYears,
          validityYear: plan.validityYear,
          startDate: plan.startDate,
          endDate: plan.endDate ?? '',
        });
        this.studyPlanForm.markAsPristine();
        this.status.set(plan.status);
        this.loadingPlan.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loadingPlan.set(false);
        this.errorMessage.set(
          error.status === 404
            ? 'El plan de estudio no existe.'
            : error.status === 403
              ? 'No tenés permisos para ver este plan de estudio.'
              : 'Ocurrió un error al cargar el plan de estudio.',
        );
      },
    });
  }

  save(): void {
    if (this.studyPlanForm.invalid) {
      this.studyPlanForm.markAllAsTouched();
      return;
    }

    const value = this.studyPlanForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set('');

    this.studyPlansService
      .update(this.planId, {
        name: value.name.trim(),
        degreeId: value.degreeId!,
        durationYears: value.durationYears!,
        validityYear: value.validityYear!,
        startDate: value.startDate,
        endDate: value.endDate || null,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Plan de estudio actualizado correctamente.');
          setTimeout(() => this.router.navigate(['/academico/planes-estudio']), 1500);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          const msg = error.error?.message;
          const text = Array.isArray(msg) ? msg.join(' ') : msg;

          if (typeof text === 'string' && text.length > 0) {
            this.errorMessage.set(text);
          } else if (error.status === 403) {
            this.errorMessage.set('No tenés permisos para editar planes de estudio.');
          } else {
            this.errorMessage.set('Ocurrió un error al actualizar el plan de estudio.');
          }
        },
      });
  }

  archivePlan(): void {
    if (
      !confirm(
        '¿Archivar este plan de estudio? No se elimina: queda como no vigente y conserva su historial.',
      )
    ) {
      return;
    }

    this.archiving.set(true);
    this.archiveError.set('');

    this.studyPlansService.delete(this.planId).subscribe({
      next: (plan) => {
        this.archiving.set(false);
        this.status.set(plan.status);
        this.successMessage.set('Plan de estudio archivado correctamente.');
        setTimeout(() => this.router.navigate(['/academico/planes-estudio']), 1500);
      },
      error: (error: HttpErrorResponse) => {
        this.archiving.set(false);
        const msg = error.error?.message;
        const text = Array.isArray(msg) ? msg.join(' ') : msg;

        if (typeof text === 'string' && text.length > 0) {
          this.archiveError.set(text);
        } else if (error.status === 403) {
          this.archiveError.set('No tenés permisos para archivar planes de estudio.');
        } else {
          this.archiveError.set('No se pudo archivar el plan de estudio.');
        }
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/academico/planes-estudio']);
  }
      changeStatus(newStatus: 'VIGENTE' | 'NO_VIGENTE', replaceCurrentVigente = false): void {
    this.statusLoading.set(true);
    this.statusError.set('');

    this.studyPlansService
      .update(this.planId, { status: newStatus, replaceCurrentVigente })
      .subscribe({
        next: (plan) => {
          this.statusLoading.set(false);
          this.status.set(plan.status);
        },
        error: (error: HttpErrorResponse) => {
          this.statusLoading.set(false);

          if (error.status === 409 && error.error?.code === 'VIGENTE_EXISTENTE') {
            const currentName = error.error?.currentPlan?.name;
            const accepted = confirm(
              `La carrera ya tiene un plan vigente: ${currentName}.\n\n` +
                `¿Querés que este plan pase a ser el vigente? "${currentName}" quedará como no vigente.`,
            );
            if (accepted) {
              this.changeStatus('VIGENTE', true);
            }
            return;
          }

          const msg = error.error?.message;
          const text = Array.isArray(msg) ? msg.join(' ') : msg;

          if (typeof text === 'string' && text.length > 0) {
            this.statusError.set(text);
          } else if (error.status === 403) {
            this.statusError.set('No tenés permisos para cambiar el estado del plan.');
          } else {
            this.statusError.set('No se pudo cambiar el estado del plan.');
          }
        },
      });
  }
  
}
