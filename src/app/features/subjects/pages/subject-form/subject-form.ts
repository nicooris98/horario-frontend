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
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { forkJoin, of } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { CreateSubjectRequest, Regime, SUBJECT_STATUS, StudyPlan, Subject } from '../../interfaces/subject';
import { Subjects } from '../../services/subjects';
import {
  BREADCRUMB_HOME,
  BREADCRUMB_THEME,
  SUBJECTS_ROUTE,
  isActive,
  statusLabel,
  statusSeverity,
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

const ARCHIVED_STUDY_PLAN_STATUS = 'ARCHIVADO';

function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value?.trim() ? null : { required: true };
}

function getStudyPlanDurationYears(plan: StudyPlan | null | undefined): number | null {
  if (!plan) return null;
  const raw = plan.durationYears ?? plan.degree?.durationYears ?? plan.career?.durationYears;
  const parsed = typeof raw === 'string' ? Number(raw) : raw;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function getMaxAvailableYear(durationYears: number | null): number | null {
  if (durationYears === null) return null;
  const maxYear = Math.ceil(durationYears);
  return maxYear >= 1 ? maxYear : null;
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
    ConfirmDialogModule,
    InputNumberModule,
    InputTextModule,
    Message,
    SelectModule,
    TagModule,
    ToggleSwitchModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './subject-form.html',
  styleUrl: './subject-form.css',
})
export class SubjectFormPage implements OnInit {
  private readonly subjectsService = inject(Subjects);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly statusLabel = statusLabel;
  protected readonly statusSeverity = statusSeverity;

  readonly subjectId = signal<number | null>(null);
  readonly isEdit = computed(() => this.subjectId() !== null);
  readonly subject = signal<Subject | null>(null);
  readonly studyPlans = signal<StudyPlan[]>([]);
  readonly selectedStudyPlanId = signal<number | null>(null);
  readonly regimes = signal<Regime[]>([]);
  readonly saving = signal(false);
  readonly deactivating = signal(false);
  readonly isSubjectActive = computed(() => { const s = this.subject(); return s !== null && isActive(s); });
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
      .filter((plan) => plan.status !== ARCHIVED_STUDY_PLAN_STATUS || plan.id === currentId)
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

  readonly selectedPlanMaxYear = computed<number | null>(() =>
    getMaxAvailableYear(this.selectedPlanDurationYears()),
  );

  readonly yearOptions = computed<YearOption[]>(() => {
    const maxYear = this.selectedPlanMaxYear();
    if (maxYear === null) return [];
    return Array.from({ length: maxYear }, (_, index) => {
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

    this.syncYearControl(subject.studyPlan.id, true);
    this.syncMaxTeachers(subject.allowsMultipleTeachers);
  }

  private onStudyPlanChange(studyPlanId: number | null): void {
    this.selectedStudyPlanId.set(studyPlanId);
    this.syncYearControl(studyPlanId, true);
  }

  private syncYearControl(studyPlanId: number | null, validatePreviousYear: boolean): void {
    const yearControl = this.form.controls.year;
    const maxYear = this.selectedPlanMaxYear();

    const validators: ValidatorFn[] = [Validators.required, Validators.min(1)];
    if (maxYear !== null) {
      validators.push(Validators.max(maxYear));
    }
    yearControl.setValidators(validators);

    if (studyPlanId !== null && maxYear !== null) {
      yearControl.enable({ emitEvent: false });

      if (validatePreviousYear) {
        const currentYear = yearControl.value;
        if (currentYear !== null && (currentYear < 1 || currentYear > maxYear)) {
          yearControl.setValue(null, { emitEvent: false });
          yearControl.markAsTouched();
        }
      }
    } else {
      yearControl.setValue(null, { emitEvent: false });
      yearControl.markAsUntouched();
      yearControl.markAsPristine();
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
        this.notification.success(
          id === null ? 'Materia registrada correctamente' : 'Materia actualizada correctamente',
          `La materia "${saved.name}" se guardó correctamente.`,
        );
        this.router.navigate(id === null ? [SUBJECTS_ROUTE] : [SUBJECTS_ROUTE, saved.id]);
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        const errorText = this.describeError(error);
        this.errorMessage.set(errorText);
        this.notification.error(
          id === null ? 'Error al registrar la materia' : 'Error al actualizar la materia',
          errorText,
        );
      },
    });
  }

  confirmStatusChange(): void {
    const current = this.subject();
    if (!current || this.deactivating()) {
      return;
    }

    const deactivating = isActive(current);
    const pendingWarning = this.form.dirty
      ? ' Tenés cambios pendientes en el formulario que no serán guardados.'
      : '';

    this.confirmationService.confirm({
      header: deactivating ? 'Desactivar materia' : 'Activar materia',
      message: deactivating
        ? `¿Querés desactivar la materia "${current.name}"? Dejará de estar activa en el sistema.${pendingWarning}`
        : `¿Querés activar la materia "${current.name}"?${pendingWarning}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: deactivating ? 'Desactivar' : 'Activar',
        severity: deactivating ? 'danger' : 'success',
      },
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      accept: () => this.executeStatusChange(current, deactivating),
    });
  }

  private executeStatusChange(current: Subject, deactivating: boolean): void {
    this.deactivating.set(true);
    this.errorMessage.set('');
    const nextStatus = deactivating ? SUBJECT_STATUS.INACTIVE : SUBJECT_STATUS.ACTIVE;

    this.subjectsService.updateStatus(current.id, nextStatus).subscribe({
      next: (updated) => {
        this.deactivating.set(false);
        this.subject.set(updated);
        this.notification.success(
          deactivating ? 'Materia desactivada correctamente' : 'Materia activada correctamente',
          `La materia "${updated.name}" ahora está ${deactivating ? 'inactiva' : 'activa'}.`,
        );
      },
      error: (error: HttpErrorResponse) => {
        this.deactivating.set(false);
        const errorText = this.describeDeactivateError(error, current);
        this.notification.error(
          deactivating ? 'Error al desactivar la materia' : 'Error al activar la materia',
          errorText,
        );
      },
    });
  }

  private describeDeactivateError(error: HttpErrorResponse, subject: Subject): string {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    if (error.status === 400) {
      return (
        extractBackendMessage(error) ??
        `El servidor rechazó la desactivación de "${subject.name}".`
      );
    }
    if (error.status === 403) {
      return 'No tenés permisos para desactivar la materia.';
    }
    if (error.status === 404) {
      return extractBackendMessage(error) ?? `La materia "${subject.name}" ya no existe.`;
    }
    if (error.status === 409) {
      return (
        extractBackendMessage(error) ??
        `No se pudo desactivar la materia "${subject.name}" por un conflicto de estado.`
      );
    }
    return `No se pudo desactivar la materia "${subject.name}".`;
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
