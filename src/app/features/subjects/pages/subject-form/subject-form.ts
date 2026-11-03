import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
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

interface StudyPlanOption extends StudyPlan {
  label: string;
}

interface YearOption {
  value: number;
  label: string;
}

const ACTIVE_STATUS = 'ACTIVO';

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value?.trim() ? null : { required: true };
}

function getStudyPlanDurationYears(plan: StudyPlan | null | undefined): number | null {
  if (!plan) return null;
  const raw = plan.durationYears ?? plan.degree?.durationYears ?? plan.career?.durationYears;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;
  const duration = Math.trunc(raw);
  return duration >= 1 ? duration : null;
}

function formatStudyPlanLabel(plan: StudyPlan): string {
  const duration = getStudyPlanDurationYears(plan);
  if (duration === null) return plan.name;
  const unit = duration === 1 ? 'año' : 'años';
  return `${plan.name} (${duration} ${unit})`;
}

function extractBackendMessage(error: HttpErrorResponse): string | null {
  const message = error.error?.message;
  if (Array.isArray(message)) {
    const joined = message.filter((item) => typeof item === 'string' && item.trim()).join(' ');
    return joined || null;
  }
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }
  return null;
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
  readonly selectedStudyPlanId = signal<number | null>(null);
  readonly regimes = signal<Regime[]>([]);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly form = new FormGroup<SubjectForm>({
    name: new FormControl('', {
      nonNullable: true,
      validators: [notBlank, Validators.maxLength(255)],
    }),
    studyPlanId: new FormControl<number | null>(null, Validators.required),
    year: new FormControl<number | null>({ value: null, disabled: true }, [
      Validators.required,
      Validators.min(1),
    ]),
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
  readonly studyPlanOptions = computed<StudyPlanOption[]>(() => {
    const currentId = this.subject()?.studyPlan.id;
    return this.studyPlans()
      .filter((plan) => plan.status === ACTIVE_STATUS || plan.id === currentId)
      .map((plan) => ({
        ...plan,
        label: formatStudyPlanLabel(plan),
      }));
  });

  readonly selectedStudyPlan = computed<StudyPlan | null>(() => {
    const id = this.selectedStudyPlanId();
    if (id === null) return null;
    return (
      this.studyPlans().find((plan) => plan.id === id) ??
      (this.subject()?.studyPlan.id === id ? this.subject()!.studyPlan : null)
    );
  });

  readonly selectedPlanDurationYears = computed<number | null>(() =>
    getStudyPlanDurationYears(this.selectedStudyPlan()),
  );

  readonly yearOptions = computed<YearOption[]>(() => {
    const duration = this.selectedPlanDurationYears();
    if (duration === null) return [];
    return Array.from({ length: duration }, (_, index) => {
      const year = index + 1;
      return { value: year, label: `${year}° Año` };
    });
  });

  readonly yearPlaceholder = computed<string>(() =>
    this.selectedStudyPlanId() === null
      ? 'Primero seleccioná un plan de estudio'
      : 'Seleccioná el año de cursado',
  );

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

    this.form.controls.studyPlanId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((studyPlanId) => this.onStudyPlanChange(studyPlanId));

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
        this.errorMessage.set(this.describeLoadError(error));
      },
    });
  }

  private fillForm(subject: Subject): void {
    this.subject.set(subject);
    this.selectedStudyPlanId.set(subject.studyPlan.id);

    this.form.setValue(
      {
        name: subject.name,
        studyPlanId: subject.studyPlan.id,
        year: subject.year,
        regimeId: subject.regime.id,
        weeklyHours: subject.weeklyHours,
        allowsMultipleTeachers: subject.allowsMultipleTeachers,
        maxTeachers: subject.maxTeachers,
      },
      { emitEvent: false },
    );

    this.syncYearControl(subject.studyPlan.id, false);
    this.syncMaxTeachers(subject.allowsMultipleTeachers);
  }

  private onStudyPlanChange(studyPlanId: number | null): void {
    this.selectedStudyPlanId.set(studyPlanId);
    this.syncYearControl(studyPlanId, true);
  }

  private syncYearControl(studyPlanId: number | null, resetYear: boolean): void {
    const yearControl = this.form.controls.year;

    if (resetYear) {
      yearControl.setValue(null, { emitEvent: false });
      yearControl.markAsUntouched();
      yearControl.markAsPristine();
    }

    const duration = this.selectedPlanDurationYears();
    const validators: ValidatorFn[] = [Validators.required, Validators.min(1)];
    if (duration !== null) {
      validators.push(Validators.max(duration));
    }
    yearControl.setValidators(validators);

    if (studyPlanId !== null && duration !== null) {
      yearControl.enable({ emitEvent: false });
    } else {
      yearControl.setValue(null, { emitEvent: false });
      yearControl.disable({ emitEvent: false });
    }

    yearControl.updateValueAndValidity({ emitEvent: false });
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

  private describeLoadError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    if (error.status === 403) {
      return 'No tenés permisos para realizar esta acción.';
    }
    if (error.status === 404) {
      return 'No se encontró la materia solicitada.';
    }
    return 'Ocurrió un error al cargar los datos del formulario.';
  }

  private describeError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    if (error.status === 400) {
      return extractBackendMessage(error) ?? 'Datos inválidos.';
    }
    if (error.status === 403) {
      return 'No tenés permisos para realizar esta acción.';
    }
    if (error.status === 404) {
      return (
        extractBackendMessage(error) ??
        'El plan de estudio, el régimen o la materia ya no existen.'
      );
    }
    if (error.status === 409) {
      return (
        extractBackendMessage(error) ??
        'Ya existe una materia con ese nombre en el plan de estudio seleccionado.'
      );
    }
    return this.isEdit()
      ? 'Ocurrió un error al guardar los cambios.'
      : 'Ocurrió un error al crear la materia.';
  }
}
