import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { forkJoin, of } from 'rxjs';
import { CreateSubjectRequest, Regime, StudyPlan, Subject } from '../../interfaces/subject';
import { Subjects } from '../../services/subjects';
import {
  BREADCRUMB_HOME,
  BREADCRUMB_THEME,
  SUBJECTS_ROUTE,
  subjectsBreadcrumb,
} from '../../subject-display';

interface SubjectForm {
  name: FormControl<string>;
  studyPlanId: FormControl<number | null>;
  year: FormControl<number | null>;
  regimeId: FormControl<number | null>;
  weeklyHours: FormControl<number | null>;
  allowsMultipleTeachers: FormControl<boolean>;
  maxTeachers: FormControl<number | null>;
}

// El backend no fija un tope de años; se ofrecen los de una carrera típica
// y se suma el de la materia si estuviera fuera de ese rango.
const DEFAULT_YEARS = [1, 2, 3, 4, 5];
const ACTIVE_STATUS = 'ACTIVO';

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value?.trim() ? null : { required: true };
}

@Component({
  selector: 'app-subject-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    InputNumberModule,
    InputTextModule,
    Message,
    SelectModule,
    ToggleSwitchModule,
  ],
  templateUrl: './subject-form.html',
  styleUrl: './subject-form.css',
})
export class SubjectFormPage implements OnInit {
  private readonly subjectsService = inject(Subjects);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;

  readonly subjectId = signal<number | null>(null);
  readonly isEdit = computed(() => this.subjectId() !== null);
  readonly subject = signal<Subject | null>(null);
  readonly studyPlans = signal<StudyPlan[]>([]);
  readonly regimes = signal<Regime[]>([]);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly form = new FormGroup<SubjectForm>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [notBlank, Validators.maxLength(255)],
    }),
    studyPlanId: new FormControl<number | null>(null, Validators.required),
    year: new FormControl<number | null>(null, Validators.required),
    regimeId: new FormControl<number | null>(null, Validators.required),
    weeklyHours: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    allowsMultipleTeachers: new FormControl(false, { nonNullable: true }),
    maxTeachers: new FormControl<number | null>({ value: null, disabled: true }, Validators.min(2)),
  });

  readonly breadcrumbItems = computed<MenuItem[]>(() => {
    const subject = this.subject();
    if (!this.isEdit()) return subjectsBreadcrumb({ label: 'Nueva materia' });
    return subjectsBreadcrumb(
      {
        label: subject?.name ?? 'Materia',
        routerLink: [SUBJECTS_ROUTE, this.subjectId()],
      },
      { label: 'Editar' },
    );
  });

  // Planes activos, más el plan actual de la materia aunque esté inactivo.
  readonly studyPlanOptions = computed(() => {
    const currentId = this.subject()?.studyPlan.id;
    return this.studyPlans().filter(
      (plan) => plan.status === ACTIVE_STATUS || plan.id === currentId,
    );
  });

  readonly yearOptions = computed(() => {
    const current = this.subject()?.year;
    const years =
      current && !DEFAULT_YEARS.includes(current)
        ? [...DEFAULT_YEARS, current].sort((a, b) => a - b)
        : DEFAULT_YEARS;
    return years.map((year) => ({ value: year, label: `${year}° año` }));
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId !== null) {
      const id = Number(rawId);
      if (!Number.isInteger(id) || id <= 0) {
        this.errorMessage.set('La materia solicitada no es válida.');
        this.form.disable();
        return;
      }
      this.subjectId.set(id);
    }

    // Sin "permite múltiples docentes" no hay máximo que cargar.
    this.form.controls.allowsMultipleTeachers.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((allows) => this.syncMaxTeachers(allows));

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.errorMessage.set(''));

    this.loadData();
  }

  private loadData(): void {
    const id = this.subjectId();

    forkJoin({
      studyPlans: this.subjectsService.getStudyPlans(),
      regimes: this.subjectsService.getRegimes(),
      subject: id !== null ? this.subjectsService.getById(id) : of(null),
    }).subscribe({
      next: ({ studyPlans, regimes, subject }) => {
        this.studyPlans.set(studyPlans);
        this.regimes.set(regimes);
        if (subject) this.fillForm(subject);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.status === 404
            ? 'No se encontró la materia solicitada.'
            : 'Ocurrió un error al cargar los datos del formulario.',
        );
      },
    });
  }

  private fillForm(subject: Subject): void {
    this.subject.set(subject);
    this.form.setValue({
      name: subject.name,
      studyPlanId: subject.studyPlan.id,
      year: subject.year,
      regimeId: subject.regime.id,
      weeklyHours: subject.weeklyHours,
      allowsMultipleTeachers: subject.allowsMultipleTeachers,
      maxTeachers: subject.maxTeachers,
    });
    this.syncMaxTeachers(subject.allowsMultipleTeachers);
  }

  private syncMaxTeachers(allows: boolean): void {
    const control = this.form.controls.maxTeachers;
    if (allows) {
      control.enable({ emitEvent: false });
    } else {
      control.setValue(null, { emitEvent: false });
      control.disable({ emitEvent: false });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: CreateSubjectRequest = {
      name: value.name.trim(),
      studyPlanId: value.studyPlanId!,
      regimeId: value.regimeId!,
      year: value.year!,
      weeklyHours: value.weeklyHours!,
      allowsMultipleTeachers: value.allowsMultipleTeachers,
      maxTeachers: value.allowsMultipleTeachers ? (value.maxTeachers ?? null) : null,
    };

    const id = this.subjectId();
    const request =
      id === null ? this.subjectsService.create(payload) : this.subjectsService.update(id, payload);

    this.saving.set(true);
    this.errorMessage.set('');

    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.router.navigate(id === null ? [SUBJECTS_ROUTE] : [SUBJECTS_ROUTE, saved.id]);
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.errorMessage.set(this.describeError(error));
      },
    });
  }

  cancel(): void {
    const id = this.subjectId();
    this.router.navigate(id === null ? [SUBJECTS_ROUTE] : [SUBJECTS_ROUTE, id]);
  }

  private describeError(error: HttpErrorResponse): string {
    if (error.status === 400) {
      const message = error.error?.message;
      return Array.isArray(message) ? message.join(' ') : (message ?? 'Datos inválidos.');
    }
    if (error.status === 404) {
      return 'El plan de estudio, el régimen o la materia ya no existen.';
    }
    return this.isEdit()
      ? 'Ocurrió un error al guardar los cambios.'
      : 'Ocurrió un error al crear la materia.';
  }
}
