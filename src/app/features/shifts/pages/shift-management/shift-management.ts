import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SHIFT_ACTIVE, SHIFT_INACTIVE, Shift } from '../../interfaces/shift';
import { Shifts } from '../../services/shifts';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';

@Component({
  selector: 'app-shift-management',
  standalone: true,
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    Message,
    TableModule,
    TagModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './shift-management.html',
  styleUrl: './shift-management.css',
})
export class ShiftManagement implements OnInit {
  private readonly shiftsService = inject(Shifts);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Configuración institucional' },
    { label: 'Turnos' },
  ];

  readonly shifts = signal<Shift[]>([]);
  readonly errorMessage = signal('');
  readonly search = signal('');

  readonly filteredShifts = computed(() => {
    const search = this.search().toLowerCase().trim();
    return this.shifts().filter((shift) => shift.name.toLowerCase().includes(search));
  });

  readonly dialogVisible = signal(false);
  readonly editingShift = signal<Shift | null>(null);
  readonly nameInput = signal('');
  readonly formError = signal('');
  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadShifts();
  }

  loadShifts(): void {
    this.errorMessage.set('');
    this.shiftsService.getAll().subscribe({
      next: (shifts) => this.shifts.set(shifts),
      error: () => this.errorMessage.set('Ocurrió un error al cargar los turnos.'),
    });
  }

  isActive(shift: Shift): boolean {
    return shift.status === SHIFT_ACTIVE;
  }

  openCreate(): void {
    this.editingShift.set(null);
    this.nameInput.set('');
    this.formError.set('');
    this.dialogVisible.set(true);
  }

  openEdit(shift: Shift): void {
    this.editingShift.set(shift);
    this.nameInput.set(shift.name);
    this.formError.set('');
    this.dialogVisible.set(true);
  }

  save(): void {
    const name = this.nameInput().trim();
    if (!name) {
      this.formError.set('El nombre es obligatorio.');
      return;
    }

    const repeated = this.shifts().some(
      (shift) =>
        shift.name.toLowerCase() === name.toLowerCase() && shift.id !== this.editingShift()?.id,
    );
    if (repeated) {
      this.formError.set('Ya existe un turno con ese nombre.');
      return;
    }

    const editing = this.editingShift();
    const request = editing
      ? this.shiftsService.update(editing.id, { name })
      : this.shiftsService.create({ name });

    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.loadShifts();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(
          error.status === 400
            ? 'El servidor rechazó los datos del turno.'
            : 'No se pudo guardar el turno.',
        );
      },
    });
  }

  confirmStatusChange(shift: Shift): void {
    const deactivate = this.isActive(shift);

    this.confirmationService.confirm({
      header: deactivate ? 'Desactivar turno' : 'Activar turno',
      message: `¿Querés ${deactivate ? 'desactivar' : 'activar'} el turno "${shift.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: deactivate ? 'Desactivar' : 'Activar',
        severity: deactivate ? 'danger' : 'primary',
      },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.changeStatus(shift, deactivate ? SHIFT_INACTIVE : SHIFT_ACTIVE),
    });
  }

  private changeStatus(shift: Shift, status: string): void {
    this.errorMessage.set('');
    this.shiftsService.update(shift.id, { status }).subscribe({
      next: () => this.loadShifts(),
      error: () => this.errorMessage.set(`No se pudo cambiar el estado del turno "${shift.name}".`),
    });
  }
}
