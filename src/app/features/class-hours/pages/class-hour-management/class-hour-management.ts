import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { ClassHour, ClassHourRequest } from '../../interfaces/class-hour';
import { ClassHours } from '../../services/class-hours';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';

const DEFAULT_CLASS_HOUR_MINUTES = 40;
const MINUTES_IN_A_DAY = 24 * 60;

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function toTime(totalMinutes: number): string {
  const dayMinutes = totalMinutes % MINUTES_IN_A_DAY;
  const hours = String(Math.floor(dayMinutes / 60)).padStart(2, '0');
  const minutes = String(dayMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

@Component({
  selector: 'app-class-hour-management',
  standalone: true,
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    Message,
    TableModule,
  ],
  templateUrl: './class-hour-management.html',
  styleUrl: './class-hour-management.css',
})
export class ClassHourManagement implements OnInit {
  private readonly classHoursService = inject(ClassHours);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Configuración institucional' },
    { label: 'Estructura horaria' },
  ];

  readonly classHours = signal<ClassHour[]>([]);
  readonly errorMessage = signal('');
  readonly classHourMinutes = signal(DEFAULT_CLASS_HOUR_MINUTES);

  readonly sortedClassHours = computed(() =>
    [...this.classHours()].sort((a, b) => a.slotNumber - b.slotNumber),
  );

  readonly dialogVisible = signal(false);
  readonly editingClassHour = signal<ClassHour | null>(null);
  readonly slotNumberInput = signal<number | null>(null);
  readonly startTimeInput = signal('');
  readonly formError = signal('');
  readonly saving = signal(false);

  readonly endTimePreview = computed(() => {
    const startTime = this.startTimeInput();
    return startTime ? toTime(toMinutes(startTime) + this.classHourMinutes()) : '';
  });

  readonly classHourDialogVisible = signal(false);
  readonly classHourInput = signal<number | null>(null);
  readonly classHourError = signal('');

  ngOnInit(): void {
    this.loadClassHours();
  }

  loadClassHours(): void {
    this.errorMessage.set('');
    this.classHoursService.getAll().subscribe({
      next: (classHours) => {
        this.classHours.set(classHours);
        const first = this.sortedClassHours()[0];
        if (first) {
          this.classHourMinutes.set(this.duration(first));
        }
      },
      error: () => this.errorMessage.set('Ocurrió un error al cargar las franjas horarias.'),
    });
  }

  shortTime(time: string): string {
    return time.slice(0, 5);
  }

  duration(classHour: ClassHour): number {
    return toMinutes(classHour.endTime) - toMinutes(classHour.startTime);
  }

  respectsClassHour(classHour: ClassHour): boolean {
    return this.duration(classHour) === this.classHourMinutes();
  }

  openCreate(): void {
    const last = this.sortedClassHours().at(-1);
    this.editingClassHour.set(null);
    this.slotNumberInput.set(last ? last.slotNumber + 1 : 1);
    this.startTimeInput.set(last ? this.shortTime(last.endTime) : '');
    this.formError.set('');
    this.dialogVisible.set(true);
  }

  openEdit(classHour: ClassHour): void {
    this.editingClassHour.set(classHour);
    this.slotNumberInput.set(classHour.slotNumber);
    this.startTimeInput.set(this.shortTime(classHour.startTime));
    this.formError.set('');
    this.dialogVisible.set(true);
  }

  save(): void {
    const slotNumber = this.slotNumberInput();
    const startTime = this.startTimeInput();

    if (!slotNumber || !startTime) {
      this.formError.set('Completá el número de franja y el inicio.');
      return;
    }

    const start = toMinutes(startTime);
    const end = start + this.classHourMinutes();

    if (end >= MINUTES_IN_A_DAY) {
      this.formError.set('La franja no puede terminar después de las 23:59.');
      return;
    }

    const others = this.classHours().filter(
      (classHour) => classHour.id !== this.editingClassHour()?.id,
    );

    if (others.some((classHour) => classHour.slotNumber === slotNumber)) {
      this.formError.set('Ya existe una franja con ese número.');
      return;
    }

    const overlapped = others.find(
      (classHour) =>
        start < toMinutes(classHour.endTime) && end > toMinutes(classHour.startTime),
    );
    if (overlapped) {
      this.formError.set(
        `Se superpone con la franja ${overlapped.slotNumber} ` +
          `(${this.shortTime(overlapped.startTime)} a ${this.shortTime(overlapped.endTime)}).`,
      );
      return;
    }

    const data = { slotNumber, startTime, endTime: toTime(end) };
    const editing = this.editingClassHour();
    const request = editing
      ? this.classHoursService.update(editing.id, data)
      : this.classHoursService.create(data);

    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.loadClassHours();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(
          error.status === 400
            ? 'El servidor rechazó los datos de la franja.'
            : 'No se pudo guardar la franja.',
        );
      },
    });
  }

  openClassHourEdit(): void {
    this.classHourInput.set(this.classHourMinutes());
    this.classHourError.set('');
    this.classHourDialogVisible.set(true);
  }

  saveClassHour(): void {
    const minutes = this.classHourInput();
    if (!minutes || minutes < 1) {
      this.classHourError.set('Ingresá la duración en minutos.');
      return;
    }

    if (this.classHours().length === 0) {
      this.classHourMinutes.set(minutes);
      this.classHourDialogVisible.set(false);
      return;
    }

    const byStart = [...this.classHours()].sort(
      (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
    );

    const changes: { id: number; data: ClassHourRequest }[] = [];
    let previousOldEnd = 0;
    let previousNewEnd = 0;

    for (const classHour of byStart) {
      const oldStart = toMinutes(classHour.startTime);
      const breakMinutes = changes.length === 0 ? 0 : oldStart - previousOldEnd;
      const newStart = changes.length === 0 ? oldStart : previousNewEnd + breakMinutes;
      const newEnd = newStart + minutes;

      if (newEnd >= MINUTES_IN_A_DAY) {
        this.classHourError.set(
          `Con ${minutes} minutos la franja ${classHour.slotNumber} terminaría después de las 23:59.`,
        );
        return;
      }

      changes.push({
        id: classHour.id,
        data: {
          slotNumber: classHour.slotNumber,
          startTime: toTime(newStart),
          endTime: toTime(newEnd),
        },
      });
      previousOldEnd = toMinutes(classHour.endTime);
      previousNewEnd = newEnd;
    }

    this.saving.set(true);
    forkJoin(changes.map((change) => this.classHoursService.update(change.id, change.data))).subscribe({
      next: () => {
        this.saving.set(false);
        this.classHourDialogVisible.set(false);
        this.loadClassHours();
      },
      error: () => {
        this.saving.set(false);
        this.classHourError.set('El servidor rechazó el cambio de las franjas.');
        this.loadClassHours();
      },
    });
  }
}
