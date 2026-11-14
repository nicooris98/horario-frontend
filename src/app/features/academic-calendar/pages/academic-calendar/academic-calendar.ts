import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import {
  AcademicCycle,
  CYCLE_ACTIVE,
  CYCLE_INACTIVE,
  Semester,
} from '../../interfaces/academic-calendar';
import { Calendar } from '../../services/academic-calendar';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';

@Component({
  selector: 'app-academic-calendar',
  standalone: true,
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    Message,
    SelectModule,
    TableModule,
    TagModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './academic-calendar.html',
  styleUrl: './academic-calendar.css',
})
export class AcademicCalendar implements OnInit {
  private readonly calendarService = inject(Calendar);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Configuración institucional' },
    { label: 'Calendario académico' },
  ];

  readonly cycles = signal<AcademicCycle[]>([]);
  readonly semesters = signal<Semester[]>([]);
  readonly errorMessage = signal('');

  readonly selectedCycle = signal<AcademicCycle | null>(null);

  readonly filteredSemesters = computed(() => {
    const cycle = this.selectedCycle();
    if (!cycle) {
      return this.semesters();
    }
    return this.semesters().filter(
      (semester) => semester.startDate >= cycle.startDate && semester.endDate <= cycle.endDate,
    );
  });

  readonly cycleDialogVisible = signal(false);
  readonly editingCycle = signal<AcademicCycle | null>(null);
  readonly cycleYear = signal<number | null>(null);
  readonly cycleStart = signal('');
  readonly cycleEnd = signal('');
  readonly cycleError = signal('');

  readonly semesterDialogVisible = signal(false);
  readonly editingSemester = signal<Semester | null>(null);
  readonly semesterName = signal('');
  readonly semesterNumber = signal<number | null>(null);
  readonly semesterStart = signal('');
  readonly semesterEnd = signal('');
  readonly semesterError = signal('');

  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadCycles();
    this.loadSemesters();
  }

  loadCycles(): void {
    this.calendarService.getCycles().subscribe({
      next: (cycles) => this.cycles.set(cycles),
      error: () => this.errorMessage.set('Ocurrió un error al cargar los ciclos lectivos.'),
    });
  }

  loadSemesters(): void {
    this.calendarService.getSemesters().subscribe({
      next: (semesters) => this.semesters.set(semesters),
      error: () => this.errorMessage.set('Ocurrió un error al cargar los cuatrimestres.'),
    });
  }

  isActive(cycle: AcademicCycle): boolean {
    return cycle.status === CYCLE_ACTIVE;
  }

  openCreateCycle(): void {
    this.editingCycle.set(null);
    this.cycleYear.set(null);
    this.cycleStart.set('');
    this.cycleEnd.set('');
    this.cycleError.set('');
    this.cycleDialogVisible.set(true);
  }

  openEditCycle(cycle: AcademicCycle): void {
    this.editingCycle.set(cycle);
    this.cycleYear.set(cycle.year);
    this.cycleStart.set(cycle.startDate);
    this.cycleEnd.set(cycle.endDate);
    this.cycleError.set('');
    this.cycleDialogVisible.set(true);
  }

  saveCycle(): void {
    const year = this.cycleYear();
    const startDate = this.cycleStart();
    const endDate = this.cycleEnd();

    if (!year || !startDate || !endDate) {
      this.cycleError.set('Completá el año y las fechas.');
      return;
    }

    if (endDate < startDate) {
      this.cycleError.set('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    const data = { year, startDate, endDate };
    const editing = this.editingCycle();
    const request = editing
      ? this.calendarService.updateCycle(editing.id, data)
      : this.calendarService.createCycle(data);

    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.cycleDialogVisible.set(false);
        this.loadCycles();
      },
      error: () => {
        this.saving.set(false);
        this.cycleError.set('No se pudo guardar el ciclo lectivo.');
      },
    });
  }

  confirmCycleStatusChange(cycle: AcademicCycle): void {
    const deactivate = this.isActive(cycle);

    this.confirmationService.confirm({
      header: deactivate ? 'Desactivar ciclo lectivo' : 'Activar ciclo lectivo',
      message: `¿Querés ${deactivate ? 'desactivar' : 'activar'} el ciclo lectivo ${cycle.year}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: deactivate ? 'Desactivar' : 'Activar',
        severity: deactivate ? 'danger' : 'primary',
      },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.changeCycleStatus(cycle, deactivate ? CYCLE_INACTIVE : CYCLE_ACTIVE),
    });
  }

  private changeCycleStatus(cycle: AcademicCycle, status: string): void {
    this.errorMessage.set('');
    this.calendarService.changeCycleStatus(cycle.id, status).subscribe({
      next: () => this.loadCycles(),
      error: () =>
        this.errorMessage.set(`No se pudo cambiar el estado del ciclo lectivo ${cycle.year}.`),
    });
  }

  openCreateSemester(): void {
    this.editingSemester.set(null);
    this.semesterName.set('');
    this.semesterNumber.set(null);
    this.semesterStart.set('');
    this.semesterEnd.set('');
    this.semesterError.set('');
    this.semesterDialogVisible.set(true);
  }

  openEditSemester(semester: Semester): void {
    this.editingSemester.set(semester);
    this.semesterName.set(semester.name);
    this.semesterNumber.set(semester.number);
    this.semesterStart.set(semester.startDate);
    this.semesterEnd.set(semester.endDate);
    this.semesterError.set('');
    this.semesterDialogVisible.set(true);
  }

  saveSemester(): void {
    const name = this.semesterName().trim();
    const number = this.semesterNumber();
    const startDate = this.semesterStart();
    const endDate = this.semesterEnd();

    if (!name || !number || !startDate || !endDate) {
      this.semesterError.set('Completá todos los campos.');
      return;
    }

    if (endDate < startDate) {
      this.semesterError.set('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    const data = { name, number, startDate, endDate };
    const editing = this.editingSemester();
    const request = editing
      ? this.calendarService.updateSemester(editing.id, data)
      : this.calendarService.createSemester(data);

    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.semesterDialogVisible.set(false);
        this.loadSemesters();
      },
      error: () => {
        this.saving.set(false);
        this.semesterError.set('No se pudo guardar el cuatrimestre.');
      },
    });
  }

  confirmDeleteSemester(semester: Semester): void {
    this.confirmationService.confirm({
      header: 'Eliminar cuatrimestre',
      message: `¿Querés eliminar el cuatrimestre "${semester.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Eliminar', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.deleteSemester(semester),
    });
  }

  private deleteSemester(semester: Semester): void {
    this.errorMessage.set('');
    this.calendarService.deleteSemester(semester.id).subscribe({
      next: () => this.loadSemesters(),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(
          error.status === 409
            ? error.error.message
            : `No se pudo eliminar el cuatrimestre "${semester.name}".`,
        ),
    });
  }
}
