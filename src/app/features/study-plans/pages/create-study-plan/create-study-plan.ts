import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { StudyPlans } from '../../services/study-plan';

import { Degree } from '../../interfaces/degree';
import { Degrees } from '../../services/degrees';

interface CreateStudyPlanForm {
  name: FormControl<string>;
  degreeId: FormControl<number | null>;
  durationYears: FormControl<number | null>;
  validityYear: FormControl<number | null>;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
}

@Component({
  selector: 'app-create-study-plan',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CardModule, Message, Select],
  templateUrl: './create-study-plan.html',
  styleUrl: './create-study-plan.css',
})
export class CreateStudyPlan implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly studyPlansService = inject(StudyPlans);
  private readonly degreesService = inject(Degrees);
  private readonly router = inject(Router);

  degrees = signal<Degree[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  studyPlanForm!: FormGroup<CreateStudyPlanForm>;

  ngOnInit(): void {
    this.studyPlanForm = new FormGroup<CreateStudyPlanForm>({
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
  }

  loadDegrees(): void {
    this.degreesService.getAll().subscribe({
      next: (degrees) => this.degrees.set(degrees),
      error: () => this.errorMessage.set('No se pudieron cargar las carreras.'),
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
      .create({
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
          this.successMessage.set('Plan de estudio creado correctamente.');
          setTimeout(() => this.router.navigate(['/academico/planes-estudio']), 1500);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          const msg = error.error?.message;
          const text = Array.isArray(msg) ? msg.join(' ') : msg;

          if (typeof text === 'string' && text.length > 0) {
            this.errorMessage.set(text);
          } else if (error.status === 403) {
            this.errorMessage.set('No tenés permisos para crear planes de estudio.');
          } else {
            this.errorMessage.set('Ocurrió un error al crear el plan de estudio.');
          }
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/academico/planes-estudio']);
  }
}