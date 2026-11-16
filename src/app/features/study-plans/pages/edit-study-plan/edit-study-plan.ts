import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../../core/services/notification.service';
import { StudyPlans } from '../../services/study-plan';
import { Degrees } from '../../services/degrees';
import { Degree } from '../../interfaces/degree';

const STUDY_PLANS_ROUTE = '/academico/planes-estudio';

interface EditStudyPlanForm {
  name: FormControl<string>;
  degreeId: FormControl<number | null>;
  durationYears: FormControl<number | null>;
  validityYear: FormControl<number | null>;
  startDate: FormControl<Date | null>;
  endDate: FormControl<Date | null>;
}

@Component({
  selector: 'app-edit-study-plan',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BreadcrumbModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    Message,
    Select,
    TagModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './edit-study-plan.html',
  styleUrl: './edit-study-plan.css',
})
export class EditStudyPlan implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly studyPlansService = inject(StudyPlans);
  private readonly degreesService = inject(Degrees);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);

  planId!: number;

  degrees = signal<Degree[]>([]);
  planName = signal('');
  loading = signal(false);
  loadingPlan = signal(true);
  errorMessage = signal('');
  status = signal('');
  archiving = signal(false);
  archiveError = signal('');
  statusLoading = signal(false);
  statusError = signal('');

  protected readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  protected readonly breadcrumbTheme = { root: { background: 'transparent', padding: '0' } };
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Gestión académica' },
    { label: 'Planes de estudio', routerLink: STUDY_PLANS_ROUTE },
    { label: 'Editar plan de estudio' },
  ];

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
      startDate: this.formBuilder.control<Date | null>(null, [Validators.required]),
      endDate: this.formBuilder.control<Date | null>(null),
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

  statusLabel(value: string): string {
    return value === 'VIGENTE' ? 'Vigente' : value === 'NO_VIGENTE' ? 'No vigente' : 'Archivado';
  }

  statusSeverity(value: string): 'success' | 'warn' | 'secondary' {
    return value === 'VIGENTE' ? 'success' : value === 'NO_VIGENTE' ? 'warn' : 'secondary';
  }

  private parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date(dateStr);
  }

  private formatDateToYMD(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadPlan(): void {
    this.studyPlansService.getById(this.planId).subscribe({
      next: (plan) => {
        this.planName.set(plan.name);
        this.studyPlanForm.patchValue({
          name: plan.name,
          degreeId: plan.degree.id,
          durationYears: plan.durationYears,
          validityYear: plan.validityYear,
          startDate: this.parseDate(plan.startDate),
          endDate: this.parseDate(plan.endDate),
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
    const formattedStartDate = this.formatDateToYMD(value.startDate);
    const formattedEndDate = this.formatDateToYMD(value.endDate);

    if (!formattedStartDate) {
      this.errorMessage.set('La fecha desde es obligatoria.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.studyPlansService
      .update(this.planId, {
        name: value.name.trim(),
        degreeId: value.degreeId!,
        durationYears: value.durationYears!,
        validityYear: value.validityYear!,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      })
      .subscribe({
        next: (updated) => {
          this.loading.set(false);
          this.notification.success(
            'Plan de estudios actualizado correctamente',
            `El plan "${updated.name}" fue modificado con éxito.`,
          );
          void this.router.navigate([STUDY_PLANS_ROUTE, this.planId]);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          const msg = error.error?.message;
          const text = Array.isArray(msg) ? msg.join(' ') : msg;
          const errText =
            typeof text === 'string' && text.length > 0
              ? text
              : error.status === 403
                ? 'No tenés permisos para editar planes de estudio.'
                : 'Ocurrió un error al actualizar el plan de estudio.';
          this.errorMessage.set(errText);
          this.notification.error('Error al actualizar el plan de estudios', errText);
        },
      });
  }

  confirmArchive(): void {
    const pendingWarning = this.studyPlanForm.dirty
      ? ' Tenés cambios pendientes en el formulario que no serán guardados.'
      : '';

    this.confirmationService.confirm({
      header: 'Archivar plan de estudio',
      message: `¿Archivar "${this.planName() || 'este plan de estudio'}"? No se elimina: queda archivado y conserva su historial.${pendingWarning}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Archivar', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.archivePlan(),
    });
  }

  private archivePlan(): void {
    this.archiving.set(true);
    this.archiveError.set('');

    this.studyPlansService.delete(this.planId).subscribe({
      next: (plan) => {
        this.archiving.set(false);
        this.status.set(plan.status);
        this.notification.success(
          'Plan de estudios archivado correctamente',
          `El plan "${plan.name}" fue archivado.`,
        );
      },
      error: (error: HttpErrorResponse) => {
        this.archiving.set(false);
        const msg = error.error?.message;
        const text = Array.isArray(msg) ? msg.join(' ') : msg;
        const errText =
          typeof text === 'string' && text.length > 0
            ? text
            : error.status === 403
              ? 'No tenés permisos para archivar planes de estudio.'
              : 'No se pudo archivar el plan de estudio.';
        this.archiveError.set(errText);
        this.notification.error('Error al archivar el plan de estudios', errText);
      },
    });
  }

  cancel(): void {
    void this.router.navigate([STUDY_PLANS_ROUTE, this.planId]);
  }

  confirmStatusChange(newStatus: 'VIGENTE' | 'NO_VIGENTE'): void {
    const pendingWarning = this.studyPlanForm.dirty
      ? ' Tenés cambios pendientes en el formulario que no serán guardados.'
      : '';

    this.confirmationService.confirm({
      header: newStatus === 'VIGENTE' ? 'Marcar como vigente' : 'Pasar a no vigente',
      message:
        newStatus === 'VIGENTE'
          ? `¿Querés marcar "${this.planName()}" como vigente?${pendingWarning}`
          : `¿Querés pasar "${this.planName()}" a no vigente?${pendingWarning}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: newStatus === 'VIGENTE' ? 'Marcar vigente' : 'Pasar a no vigente',
        severity: newStatus === 'VIGENTE' ? 'success' : 'secondary',
      },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.changeStatus(newStatus, false),
    });
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
          this.notification.success(
            newStatus === 'VIGENTE'
              ? 'Plan de estudios marcado como vigente'
              : 'Plan de estudios pasado a no vigente',
            `El estado de "${plan.name}" se actualizó correctamente.`,
          );
        },
        error: (error: HttpErrorResponse) => {
          this.statusLoading.set(false);

          if (error.status === 409 && error.error?.code === 'VIGENTE_EXISTENTE') {
            const currentName = error.error?.currentPlan?.name;
            this.confirmationService.confirm({
              header: 'La carrera ya tiene un plan vigente',
              message: `La carrera ya tiene un plan vigente: "${currentName}". ¿Querés que este plan pase a ser el vigente? "${currentName}" quedará como no vigente.`,
              icon: 'pi pi-exclamation-triangle',
              acceptButtonProps: { label: 'Sí, reemplazar', severity: 'primary' },
              rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
              accept: () => this.changeStatus('VIGENTE', true),
            });
            return;
          }

          const msg = error.error?.message;
          const text = Array.isArray(msg) ? msg.join(' ') : msg;
          const errText =
            typeof text === 'string' && text.length > 0
              ? text
              : error.status === 403
                ? 'No tenés permisos para cambiar el estado del plan.'
                : 'No se pudo cambiar el estado del plan.';
          this.statusError.set(errText);
          this.notification.error('Error al cambiar estado del plan', errText);
        },
      });
  }
}
