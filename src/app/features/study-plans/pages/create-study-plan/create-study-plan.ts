import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { NotificationService } from '../../../../core/services/notification.service';
import { StudyPlans } from '../../services/study-plan';
import { Degrees } from '../../services/degrees';
import { Degree } from '../../interfaces/degree';

const STUDY_PLANS_ROUTE = '/academico/planes-estudio';

interface CreateStudyPlanForm {
  name: FormControl<string>;
  degreeId: FormControl<number | null>;
  durationYears: FormControl<number | null>;
  validityYear: FormControl<number | null>;
  startDate: FormControl<Date | null>;
  endDate: FormControl<Date | null>;
}

@Component({
  selector: 'app-create-study-plan',
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
  ],
  providers: [ConfirmationService],
  templateUrl: './create-study-plan.html',
  styleUrl: './create-study-plan.css',
})
export class CreateStudyPlan implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly studyPlansService = inject(StudyPlans);
  private readonly degreesService = inject(Degrees);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);

  degrees = signal<Degree[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  protected readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Gestión académica' },
    { label: 'Planes de estudio', routerLink: STUDY_PLANS_ROUTE },
    { label: 'Nuevo plan de estudio' },
  ];

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
      startDate: this.formBuilder.control<Date | null>(null, [Validators.required]),
      endDate: this.formBuilder.control<Date | null>(null),
    });

    this.studyPlanForm.valueChanges.subscribe(() => this.errorMessage.set(''));

    this.loadDegrees();
  }

  loadDegrees(): void {
    this.degreesService.getAll(true).subscribe({
      next: (degrees) => this.degrees.set(degrees),
      error: () => this.errorMessage.set('No se pudieron cargar las carreras.'),
    });
  }

  save(): void {
    if (this.studyPlanForm.invalid) {
      this.studyPlanForm.markAllAsTouched();
      return;
    }

    this.submit(false);
  }

  private formatDateToYMD(date: Date | null): string | null {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private submit(replaceCurrentVigente: boolean): void {
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
      .create({
        name: value.name.trim(),
        degreeId: value.degreeId!,
        durationYears: value.durationYears!,
        validityYear: value.validityYear!,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        replaceCurrentVigente,
      })
      .subscribe({
        next: (created) => {
          this.loading.set(false);
          this.notification.success(
            'Plan de estudios registrado correctamente',
            replaceCurrentVigente
              ? `El plan "${created.name}" fue creado como vigente. El plan anterior pasó a no vigente.`
              : `El plan "${created.name}" se agregó correctamente al sistema.`,
          );
          void this.router.navigate([STUDY_PLANS_ROUTE]);
        },
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);

          if (error.status === 409 && error.error?.code === 'VIGENTE_EXISTENTE') {
            const currentName = error.error?.currentPlan?.name;
            this.confirmationService.confirm({
              header: 'La carrera ya tiene un plan vigente',
              message: `¿Querés que este plan pase a ser el vigente? "${currentName}" quedará como no vigente.`,
              icon: 'pi pi-exclamation-triangle',
              acceptButtonProps: { label: 'Sí, reemplazar' },
              rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
              accept: () => this.submit(true),
            });
            return;
          }

          const msg = error.error?.message;
          const text = Array.isArray(msg) ? msg.join(' ') : msg;

          const errMsg =
            typeof text === 'string' && text.length > 0
              ? text
              : error.status === 403
                ? 'No tenés permisos para crear planes de estudio.'
                : 'Ocurrió un error al crear el plan de estudio.';
          this.errorMessage.set(errMsg);
          this.notification.error('Error al registrar el plan de estudios', errMsg);
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/academico/planes-estudio']);
  }
}
