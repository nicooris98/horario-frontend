import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { TeachersService } from '../../services/teachers.service';
import { SelectOption, Teacher } from '../../../../core/models/module2.models';
import {
  isNonEmpty,
  isPositiveInt,
  isValidDni,
  isValidEmail,
  normalizeDni,
} from '../../../../core/utils/validators';

@Component({
  selector: 'app-teachers-page',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    FormsModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './teachers-page.html',
  styleUrl: './teachers-page.css',
})
export class TeachersPage implements OnInit {
  private teachersService = inject(TeachersService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  teachers: Teacher[] = [];
  loading = false;

  displayDialog = false;
  isEdit = false;
  teacher: Teacher = this.emptyTeacher();

  filterDni = '';
  filterLastName = '';
  private filterTimeout: ReturnType<typeof setTimeout> | null = null;

  submitted = false;
  errors: Record<string, string> = {};

  readonly statusOptions: SelectOption[] = [
    { id: 0, label: 'ACTIVO' },
    { id: 1, label: 'INACTIVO' },
  ];
  status: 'ACTIVO' | 'INACTIVO' = 'ACTIVO';

  ngOnInit() {
    this.load();
  }

  emptyTeacher(): Teacher {
    return {
      id: 0,
      dni: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      fileNumber: null,
      status: 'ACTIVO',
    };
  }

  load() {
    this.loading = true;
    this.teachersService.findAll(this.filterDni || undefined, this.filterLastName || undefined).subscribe({
      next: (data) => {
        this.teachers = data;
        this.loading = false;
      },
      error: (err) => {
        // El backend responde 404 cuando el filtro no encuentra docentes.
        if ((err as { status?: number })?.status === 404) {
          this.teachers = [];
          this.loading = false;
          if (this.filterDni.trim() || this.filterLastName.trim()) {
            this.messageService.add({
              severity: 'info',
              summary: 'Sin resultados',
              detail: 'Probá con acentos (ej. Gómez) o revisá el filtro.',
            });
          }
          return;
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los docentes',
        });
        this.loading = false;
      },
    });
  }

  openNew() {
    this.teacher = this.emptyTeacher();
    this.status = 'ACTIVO';
    this.isEdit = false;
    this.errors = {};
    this.submitted = false;
    this.displayDialog = true;
  }

  edit(teacher: Teacher) {
    this.teacher = { ...teacher };
    this.status = (teacher.status as 'ACTIVO' | 'INACTIVO') ?? 'ACTIVO';
    this.isEdit = true;
    this.errors = {};
    this.submitted = false;
    this.displayDialog = true;
  }

  hasError(field: string): boolean {
    return this.submitted && !!this.errors[field];
  }

  private validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!isValidDni(this.teacher.dni)) {
      errors['dni'] = 'El DNI debe tener 7 u 8 dígitos.';
    }
    if (!isNonEmpty(this.teacher.firstName)) {
      errors['firstName'] = 'El nombre es obligatorio.';
    }
    if (!isNonEmpty(this.teacher.lastName)) {
      errors['lastName'] = 'El apellido es obligatorio.';
    }
    const phone = (this.teacher.phone ?? '').trim();
    const email = (this.teacher.email ?? '').trim();
    if (!phone && !email) {
      errors['contact'] = 'Ingresá al menos un teléfono o un email.';
    }
    if (email && !isValidEmail(email)) {
      errors['email'] = 'El email no tiene un formato válido.';
    }
    const fileNumber =
      typeof this.teacher.fileNumber === 'string'
        ? Number(this.teacher.fileNumber)
        : this.teacher.fileNumber;
    if (fileNumber != null && !isPositiveInt(fileNumber)) {
      errors['fileNumber'] = 'El legajo debe ser un entero positivo.';
    }
    return errors;
  }

  save() {
    this.submitted = true;
    this.errors = this.validate();
    if (Object.keys(this.errors).length > 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Revisá el formulario',
        detail: 'Hay campos inválidos o incompletos.',
      });
      return;
    }

    const dto = {
      dni: normalizeDni(this.teacher.dni),
      firstName: this.teacher.firstName.trim(),
      lastName: this.teacher.lastName.trim(),
      phone: this.teacher.phone ?? null,
      email: this.teacher.email ?? null,
      fileNumber:
        this.teacher.fileNumber == null
          ? null
          : Number(this.teacher.fileNumber),
      status: this.status,
    };

    if (this.isEdit && this.teacher.id) {
      this.teachersService.update(this.teacher.id, dto).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Docente actualizado' });
          this.displayDialog = false;
          this.load();
        },
        error: (err) =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.errorMessage(err, 'No se pudo actualizar'),
          }),
      });
    } else {
      this.teachersService.create(dto).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Docente creado' });
          this.displayDialog = false;
          this.load();
        },
        error: (err) =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: this.errorMessage(err, 'No se pudo crear'),
          }),
      });
    }
  }

  deactivate(teacher: Teacher) {
    this.confirmationService.confirm({
      message: `¿Desactivar a ${teacher.firstName} ${teacher.lastName}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.teachersService.deactivate(teacher.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Docente desactivado' });
            this.load();
          },
          error: (err) =>
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.errorMessage(err, 'No se pudo desactivar'),
            }),
        });
      },
    });
  }

  reactivate(teacher: Teacher) {
    this.confirmationService.confirm({
      message: `¿Reactivar a ${teacher.firstName} ${teacher.lastName}?`,
      header: 'Confirmar',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.teachersService.update(teacher.id, {
          dni: teacher.dni,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          phone: teacher.phone ?? null,
          email: teacher.email ?? null,
          fileNumber:
            teacher.fileNumber == null
              ? null
              : Number(teacher.fileNumber),
          status: 'ACTIVO',
        }).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'OK', detail: 'Docente reactivado' });
            this.load();
          },
          error: (err) =>
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.errorMessage(err, 'No se pudo reactivar'),
            }),
        });
      },
    });
  }

  clearFilters() {
    this.filterDni = '';
    this.filterLastName = '';
    this.load();
  }

  hasActiveFilters(): boolean {
    return !!this.filterDni.trim() || !!this.filterLastName.trim();
  }

  onFilterChange(): void {
    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }
    this.filterTimeout = setTimeout(() => {
      this.load();
    }, 300);
  }

  trackByTeacher(_index: number, teacher: Teacher): number {
    return teacher.id;
  }

  getAssignmentsTooltip(teacher: Teacher): string {
    const assignments = teacher.currentAssignments || [];
    if (assignments.length === 0) return 'Sin asignaciones';
    return assignments
      .map((a) => {
        const section = a.courseSectionSubject?.courseSection;
        const subject = a.courseSectionSubject?.subject?.name || '-';
        const division = section ? `${section.courseYear}° ${section.section}` : '-';
        const cargo = a.positionType?.name || '-';
        const hasta = a.endDate || 'sin fin';
        return `- ${cargo}: ${subject} (${division}) | ${a.startDate} a ${hasta}`;
      })
      .join('\n');
  }

  private errorMessage(err: unknown, fallback: string): string {
    const message = (err as { error?: { message?: string | string[] } })?.error?.message;
    if (Array.isArray(message)) return message.join('; ');
    return message ?? fallback;
  }
}
