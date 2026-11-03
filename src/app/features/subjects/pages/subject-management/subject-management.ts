import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
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
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Auth } from '../../../auth/services/auth';
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

const MOBILE_MEDIA_QUERY = '(max-width: 767px)';
const DEFAULT_PAGE_SIZE = 10;

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('es')
    .trim();
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
    PaginatorModule,
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
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Administración' },
    { label: 'Materias' },
  ];

  protected readonly isActive = isActive;
  protected readonly statusLabel = statusLabel;
  protected readonly statusSeverity = statusSeverity;
  protected readonly rowsPerPageOptions = [5, 10, 20];

  readonly subjects = signal<Subject[]>([]);
  readonly errorMessage = signal('');
  readonly rowMenuItems = signal<MenuItem[]>([]);

  readonly canCreate = computed(() => this.auth.hasPermission('subjects.create'));
  readonly canUpdate = computed(() => this.auth.hasPermission('subjects.update'));
  readonly canChangeStatus = computed(
    () => this.auth.hasPermission('subjects.update') || this.auth.hasPermission('subjects.delete'),
  );
  readonly hasRowMenuActions = computed(() => this.canUpdate() || this.canChangeStatus());

  readonly search = signal('');
  readonly studyPlanFilter = signal<number | null>(null);
  readonly yearFilter = signal<number | null>(null);
  readonly statusFilter = signal<string | null>(null);

  readonly first = signal(0);
  readonly rows = signal(DEFAULT_PAGE_SIZE);
  readonly isMobile = signal(this.checkInitialMobile());

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

  readonly paginatedSubjects = computed(() => {
    const start = this.first();
    return this.filteredSubjects().slice(start, start + this.rows());
  });

  ngOnInit(): void {
    this.setupViewportListener();
    this.loadSubjects();
  }

  private checkInitialMobile(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  }

  private setupViewportListener(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const listener = (event: MediaQueryListEvent) => this.isMobile.set(event.matches);
    mediaQuery.addEventListener('change', listener);
    this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', listener));
  }

  loadSubjects(): void {
    this.errorMessage.set('');
    this.subjectsService.getAll().subscribe({
      next: (subjects) => this.subjects.set(subjects),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(this.describeLoadError(error)),
    });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.first.set(0);
  }

  onStudyPlanFilterChange(value: number | null): void {
    this.studyPlanFilter.set(value ?? null);
    this.first.set(0);
  }

  onYearFilterChange(value: number | null): void {
    this.yearFilter.set(value ?? null);
    this.first.set(0);
  }

  onStatusFilterChange(value: string | null): void {
    this.statusFilter.set(value ?? null);
    this.first.set(0);
  }

  onPageChange(event: TablePageEvent | PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? DEFAULT_PAGE_SIZE);
  }

  goToCreate(): void {
    if (!this.canCreate()) return;
    this.router.navigate([SUBJECTS_ROUTE, 'nueva']);
  }

  goToDetail(subject: Subject): void {
    this.router.navigate([SUBJECTS_ROUTE, subject.id]);
  }

  goToEdit(subject: Subject): void {
    if (!this.canUpdate()) return;
    this.router.navigate([SUBJECTS_ROUTE, subject.id, 'editar']);
  }

  openRowMenu(event: Event, menu: Menu, subject: Subject): void {
    const active = isActive(subject);
    const items: MenuItem[] = [];

    if (this.canUpdate()) {
      items.push({
        label: 'Editar',
        icon: 'pi pi-pencil',
        command: () => this.goToEdit(subject),
      });
    }

    if (this.canChangeStatus()) {
      items.push({
        label: active ? 'Desactivar' : 'Activar',
        icon: active ? 'pi pi-ban' : 'pi pi-check-circle',
        command: () => this.confirmStatusChange(subject),
      });
    }

    if (!items.length) return;
    this.rowMenuItems.set(items);
    menu.toggle(event);
  }

  // PATCH /subjects/:id/status actualiza el estado ("ACTIVO" | "INACTIVO").
  // No hay borrado físico desde la interfaz: la baja es lógica.
  confirmStatusChange(subject: Subject): void {
    if (!this.canChangeStatus()) return;

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

    this.subjectsService.updateStatus(subject.id, status).subscribe({
      next: (updated) =>
        this.subjects.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        ),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(this.describeStatusError(error, subject, action)),
    });
  }

  private describeLoadError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    if (error.status === 403) {
      return 'No tenés permisos para consultar las materias.';
    }
    return 'Ocurrió un error al cargar las materias.';
  }

  private describeStatusError(
    error: HttpErrorResponse,
    subject: Subject,
    action: string,
  ): string {
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor.';
    }
    if (error.status === 400) {
      return (
        extractBackendMessage(error) ??
        `El servidor rechazó el cambio de estado de "${subject.name}".`
      );
    }
    if (error.status === 403) {
      return 'No tenés permisos para cambiar el estado de la materia.';
    }
    if (error.status === 404) {
      return extractBackendMessage(error) ?? `La materia "${subject.name}" ya no existe.`;
    }
    if (error.status === 409) {
      return (
        extractBackendMessage(error) ??
        `No se pudo ${action} la materia "${subject.name}" por un conflicto de estado.`
      );
    }
    return `No se pudo ${action} la materia "${subject.name}".`;
  }
}
