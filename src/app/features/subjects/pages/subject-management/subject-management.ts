import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Menu, MenuModule } from 'primeng/menu';
import { Message } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SUBJECT_STATUS, Subject } from '../../interfaces/subject';
import { Subjects } from '../../services/subjects';
import {
  BREADCRUMB_HOME,
  BREADCRUMB_THEME,
  SUBJECTS_ROUTE,
  isActive,
  statusLabel,
  statusSeverity,
} from '../../subject-display';

interface Option<T> {
  label: string;
  value: T;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim();
}

@Component({
  selector: 'app-subject-management',
  standalone: true,
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MenuModule,
    Message,
    SelectModule,
    TableModule,
    TagModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './subject-management.html',
  styleUrl: './subject-management.css',
})
export class SubjectManagement implements OnInit {
  private readonly subjectsService = inject(Subjects);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Administración' },
    { label: 'Materias' },
  ];

  protected readonly statusLabel = statusLabel;
  protected readonly statusSeverity = statusSeverity;

  readonly subjects = signal<Subject[]>([]);
  readonly errorMessage = signal('');
  readonly rowMenuItems = signal<MenuItem[]>([]);

  readonly search = signal('');
  readonly studyPlanFilter = signal<number | null>(null);
  readonly yearFilter = signal<number | null>(null);
  readonly statusFilter = signal<string | null>(null);

  // Los filtros se arman con los datos que ya trae GET /subjects:
  // el backend no filtra ni pagina.
  readonly studyPlanOptions = computed<Option<number>[]>(() => {
    const plans = new Map<number, string>();
    for (const { studyPlan } of this.subjects()) plans.set(studyPlan.id, studyPlan.name);
    return [...plans]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
  });

  readonly yearOptions = computed<Option<number>[]>(() =>
    [...new Set(this.subjects().map((subject) => subject.year))]
      .sort((a, b) => a - b)
      .map((year) => ({ value: year, label: `${year}° año` })),
  );

  readonly statusOptions: Option<string>[] = [
    { value: SUBJECT_STATUS.ACTIVE, label: 'Activo' },
    { value: SUBJECT_STATUS.INACTIVE, label: 'Inactivo' },
  ];

  readonly filteredSubjects = computed(() => {
    const search = normalize(this.search());
    const studyPlanId = this.studyPlanFilter();
    const year = this.yearFilter();
    const status = this.statusFilter();

    return this.subjects().filter(
      (subject) =>
        (!search || normalize(subject.name).includes(search)) &&
        (studyPlanId === null || subject.studyPlan.id === studyPlanId) &&
        (year === null || subject.year === year) &&
        (status === null || subject.status === status),
    );
  });

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    this.errorMessage.set('');
    this.subjectsService.getAll().subscribe({
      next: (subjects) => this.subjects.set(subjects),
      error: () => this.errorMessage.set('Ocurrió un error al cargar las materias.'),
    });
  }

  goToCreate(): void {
    this.router.navigate([SUBJECTS_ROUTE, 'nueva']);
  }

  goToDetail(subject: Subject): void {
    this.router.navigate([SUBJECTS_ROUTE, subject.id]);
  }

  goToEdit(subject: Subject): void {
    this.router.navigate([SUBJECTS_ROUTE, subject.id, 'editar']);
  }

  openRowMenu(event: Event, menu: Menu, subject: Subject): void {
    const active = isActive(subject);
    this.rowMenuItems.set([
      { label: 'Editar', icon: 'pi pi-pencil', command: () => this.goToEdit(subject) },
      {
        label: active ? 'Desactivar' : 'Activar',
        icon: active ? 'pi pi-ban' : 'pi pi-check-circle',
        command: () => this.confirmStatusChange(subject),
      },
    ]);
    menu.toggle(event);
  }

  // PATCH /subjects/:id admite "status": se usa para activar o desactivar.
  // No hay borrado: DELETE es físico y queda fuera del alcance.
  private confirmStatusChange(subject: Subject): void {
    const deactivate = isActive(subject);
    const action = deactivate ? 'desactivar' : 'activar';

    this.confirmationService.confirm({
      header: deactivate ? 'Desactivar materia' : 'Activar materia',
      message: `¿Querés ${action} la materia "${subject.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: deactivate ? 'Desactivar' : 'Activar',
        severity: deactivate ? 'danger' : 'primary',
      },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.changeStatus(subject, action),
    });
  }

  private changeStatus(subject: Subject, action: string): void {
    const status = isActive(subject) ? SUBJECT_STATUS.INACTIVE : SUBJECT_STATUS.ACTIVE;
    this.errorMessage.set('');

    this.subjectsService.update(subject.id, { status }).subscribe({
      next: (updated) =>
        this.subjects.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        ),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(
          error.status === 400
            ? `El servidor rechazó el cambio de estado de "${subject.name}".`
            : `No se pudo ${action} la materia "${subject.name}".`,
        ),
    });
  }
}
