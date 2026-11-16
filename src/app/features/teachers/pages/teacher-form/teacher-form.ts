import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { Teacher } from '../../../../core/models/module2.models';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  isNonEmpty,
  isPositiveInt,
  isValidDni,
  isValidEmail,
  normalizeDni,
} from '../../../../core/utils/validators';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';
import { TeachersService } from '../../services/teachers.service';

const TEACHERS_ROUTE = '/docentes';

@Component({
  selector: 'app-teacher-form',
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
    TagModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './teacher-form.html',
  styleUrl: './teacher-form.css',
})
export class TeacherForm implements OnInit {
  private readonly teachersService = inject(TeachersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;

  readonly teacherId = signal<number | null>(null);
  readonly isEdit = computed(() => this.teacherId() !== null);
  readonly teacher = signal<Teacher | null>(null);
  readonly saving = signal(false);
  readonly changingStatus = signal(false);
  readonly errorMessage = signal('');

  readonly form = new FormGroup({
    dni: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    phone: new FormControl<string>('', { nonNullable: true }),
    email: new FormControl<string>('', { nonNullable: true }),
    fileNumber: new FormControl<number | null>(null),
  });

  readonly isTeacherActive = computed(() => (this.teacher()?.status || 'ACTIVO') === 'ACTIVO');

  readonly breadcrumbItems = computed<MenuItem[]>(() => {
    const t = this.teacher();
    if (!this.isEdit()) return [{ label: 'Docentes', routerLink: TEACHERS_ROUTE }, { label: 'Nuevo docente' }];
    return [
      { label: 'Docentes', routerLink: TEACHERS_ROUTE },
      { label: t ? `${t.lastName}, ${t.firstName}` : 'Docente', routerLink: [TEACHERS_ROUTE, this.teacherId()] },
      { label: 'Editar' },
    ];
  });

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId !== null) {
      const id = Number(rawId);
      if (!Number.isInteger(id) || id <= 0) {
        this.errorMessage.set('El docente solicitado no es válido.');
        this.form.disable();
        return;
      }
      this.teacherId.set(id);
      this.loadTeacher(id);
    }

    this.form.valueChanges.subscribe(() => this.errorMessage.set(''));
  }

  private loadTeacher(id: number): void {
    this.teachersService.findOne(id).subscribe({
      next: (t) => {
        this.teacher.set(t);
        this.form.setValue(
          {
            dni: t.dni ?? '',
            lastName: t.lastName ?? '',
            firstName: t.firstName ?? '',
            phone: t.phone ?? '',
            email: t.email ?? '',
            fileNumber: t.fileNumber ?? null,
          },
          { emitEvent: false },
        );
        this.form.markAsPristine();
      },
      error: () => this.errorMessage.set('No se pudo cargar la información del docente.'),
    });
  }

  private validateBusinessRules(): string | null {
    const raw = this.form.getRawValue();
    if (!isValidDni(raw.dni)) {
      return 'El DNI debe contener 7 u 8 dígitos.';
    }
    if (!isNonEmpty(raw.lastName)) {
      return 'El apellido es obligatorio.';
    }
    if (!isNonEmpty(raw.firstName)) {
      return 'El nombre es obligatorio.';
    }
    if (!isNonEmpty(raw.phone) && !isNonEmpty(raw.email)) {
      return 'Debés ingresar al menos un teléfono o un email de contacto.';
    }
    if (isNonEmpty(raw.email) && !isValidEmail(raw.email)) {
      return 'El email no tiene un formato válido.';
    }
    if (raw.fileNumber !== null && !isPositiveInt(raw.fileNumber)) {
      return 'El legajo debe ser un número entero positivo.';
    }
    return null;
  }

  save(): void {
    if (this.saving()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
    }

    const validationError = this.validateBusinessRules();
    if (validationError) {
      this.errorMessage.set(validationError);
      this.notification.warn('Revisá el formulario', validationError);
      return;
    }

    const raw = this.form.getRawValue();
    const dto = {
      dni: normalizeDni(raw.dni),
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      phone: raw.phone.trim() || null,
      email: raw.email.trim() || null,
      fileNumber: raw.fileNumber == null ? null : Number(raw.fileNumber),
      status: this.teacher()?.status || 'ACTIVO',
    };

    const id = this.teacherId();
    const request = id !== null ? this.teachersService.update(id, dto) : this.teachersService.create(dto);

    this.saving.set(true);
    this.errorMessage.set('');

    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.notification.success(
          id !== null ? 'Docente actualizado correctamente' : 'Docente registrado correctamente',
          `${saved.lastName}, ${saved.firstName} se guardó correctamente.`,
        );
        void this.router.navigate(id !== null ? [TEACHERS_ROUTE, saved.id] : [TEACHERS_ROUTE]);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const msg = this.extractError(err, id !== null ? 'No se pudo actualizar el docente.' : 'No se pudo crear el docente.');
        this.errorMessage.set(msg);
        this.notification.error(
          id !== null ? 'Error al actualizar el docente' : 'Error al registrar el docente',
          msg,
        );
      },
    });
  }

  confirmStatusChange(): void {
    const current = this.teacher();
    if (!current || this.changingStatus()) return;

    const deactivating = this.isTeacherActive();
    const pendingWarning = this.form.dirty
      ? ' Tenés cambios pendientes en el formulario que no serán guardados.'
      : '';

    this.confirmationService.confirm({
      header: deactivating ? 'Desactivar docente' : 'Reactivar docente',
      message: deactivating
        ? `¿Querés desactivar a ${current.firstName} ${current.lastName}? Dejará de estar activo en el sistema.${pendingWarning}`
        : `¿Querés reactivar a ${current.firstName} ${current.lastName}?${pendingWarning}`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: deactivating ? 'Desactivar' : 'Reactivar',
        severity: deactivating ? 'danger' : 'success',
      },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.executeStatusChange(current, deactivating),
    });
  }

  private executeStatusChange(current: Teacher, deactivating: boolean): void {
    this.changingStatus.set(true);

    const req = deactivating
      ? this.teachersService.deactivate(current.id)
      : this.teachersService.update(current.id, {
          dni: current.dni,
          firstName: current.firstName,
          lastName: current.lastName,
          phone: current.phone ?? null,
          email: current.email ?? null,
          fileNumber: current.fileNumber == null ? null : Number(current.fileNumber),
          status: 'ACTIVO',
        });

    req.subscribe({
      next: (updated) => {
        this.changingStatus.set(false);
        this.teacher.set(updated);
        this.notification.success(
          deactivating ? 'Docente desactivado correctamente' : 'Docente reactivado correctamente',
          `${updated.lastName}, ${updated.firstName} ahora está ${deactivating ? 'inactivo' : 'activo'}.`,
        );
      },
      error: (err: HttpErrorResponse) => {
        this.changingStatus.set(false);
        const msg = this.extractError(
          err,
          deactivating ? 'No se pudo desactivar el docente.' : 'No se pudo reactivar el docente.',
        );
        this.notification.error(
          deactivating ? 'Error al desactivar docente' : 'Error al reactivar docente',
          msg,
        );
      },
    });
  }

  statusLabel(status?: string): string {
    return status === 'INACTIVO' ? 'Inactivo' : 'Activo';
  }

  statusSeverity(status?: string): 'success' | 'danger' {
    return status === 'INACTIVO' ? 'danger' : 'success';
  }

  cancel(): void {
    const id = this.teacherId();
    void this.router.navigate(id !== null ? [TEACHERS_ROUTE, id] : [TEACHERS_ROUTE]);
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    const msg = err.error?.message;
    if (Array.isArray(msg)) return msg.join('; ');
    return typeof msg === 'string' && msg.trim() ? msg : fallback;
  }
}
