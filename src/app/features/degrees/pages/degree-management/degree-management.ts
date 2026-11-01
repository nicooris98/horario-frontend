import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Degree, VIGENTE_STATUSES } from '../../interfaces/degree';
import { Degrees } from '../../services/degrees';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';

@Component({
  selector: 'app-degree-management',
  standalone: true,
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    Message,
    TableModule,
  ],
  templateUrl: './degree-management.html',
  styleUrl: './degree-management.css',
})
export class DegreeManagement implements OnInit {
  private readonly degreesService = inject(Degrees);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Gestión académica' },
    { label: 'Carreras' },
  ];

  readonly degrees = signal<Degree[]>([]);
  readonly errorMessage = signal('');
  readonly search = signal('');

  readonly vigentePlans = signal<Map<number, number> | null>(null);

  readonly filteredDegrees = computed(() => {
    const search = this.search().toLowerCase().trim();
    return this.degrees().filter((degree) => degree.name.toLowerCase().includes(search));
  });

  readonly dialogVisible = signal(false);
  readonly editingDegree = signal<Degree | null>(null);
  readonly nameInput = signal('');
  readonly formError = signal('');
  readonly saving = signal(false);

  ngOnInit(): void {
    this.loadDegrees();
    this.loadVigentePlans();
  }

  loadDegrees(): void {
    this.errorMessage.set('');
    this.degreesService.getAll().subscribe({
      next: (degrees) => this.degrees.set(degrees),
      error: () => this.errorMessage.set('Ocurrió un error al cargar las carreras.'),
    });
  }

  loadVigentePlans(): void {
    this.degreesService.getStudyPlans().subscribe({
      next: (plans) => {
        const counts = new Map<number, number>();
        for (const plan of plans) {
          if (VIGENTE_STATUSES.includes(plan.status)) {
            counts.set(plan.degree.id, (counts.get(plan.degree.id) ?? 0) + 1);
          }
        }
        this.vigentePlans.set(counts);
      },
      error: () => this.vigentePlans.set(null),
    });
  }

  vigenteCount(degree: Degree): string {
    const counts = this.vigentePlans();
    return counts ? String(counts.get(degree.id) ?? 0) : '—';
  }

  openCreate(): void {
    this.editingDegree.set(null);
    this.nameInput.set('');
    this.formError.set('');
    this.dialogVisible.set(true);
  }

  openEdit(degree: Degree): void {
    this.editingDegree.set(degree);
    this.nameInput.set(degree.name);
    this.formError.set('');
    this.dialogVisible.set(true);
  }

  save(): void {
    const name = this.nameInput().trim();
    if (!name) {
      this.formError.set('El nombre es obligatorio.');
      return;
    }

    const repeated = this.degrees().some(
      (degree) =>
        degree.name.toLowerCase() === name.toLowerCase() &&
        degree.id !== this.editingDegree()?.id,
    );
    if (repeated) {
      this.formError.set('Ya existe una carrera con ese nombre.');
      return;
    }

    const editing = this.editingDegree();
    const request = editing
      ? this.degreesService.update(editing.id, { name })
      : this.degreesService.create({ name });

    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible.set(false);
        this.loadDegrees();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(
          error.status === 400
            ? 'El servidor rechazó los datos de la carrera.'
            : 'No se pudo guardar la carrera.',
        );
      },
    });
  }
}
