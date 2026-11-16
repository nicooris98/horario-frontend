import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
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
import { Message } from 'primeng/message';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { SelectModule } from 'primeng/select';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Teacher } from '../../../../core/models/module2.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { createIsMobileSignal } from '../../../../shared/utils/viewport';
import { RowActionsComponent } from '../../../../shared/components/row-actions/row-actions';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';
import { TeachersService } from '../../services/teachers.service';

const TEACHERS_ROUTE = '/docentes';
const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-teachers-page',
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
    Message,
    SelectModule,
    PaginatorModule,
    TableModule,
    TagModule,
    RowActionsComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './teachers-page.html',
  styleUrl: './teachers-page.css',
})
export class TeachersPage implements OnInit {
  private readonly teachersService = inject(TeachersService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly breadcrumbItems: MenuItem[] = [{ label: 'Docentes' }];
  protected readonly rowsPerPageOptions = [5, 10, 20];

  readonly teachers = signal<Teacher[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly searchName = signal('');
  readonly searchDni = signal('');
  readonly statusFilter = signal<string | null>(null);
  readonly first = signal(0);
  readonly rows = signal(DEFAULT_PAGE_SIZE);
  readonly isMobile = createIsMobileSignal(this.destroyRef);

  readonly statusOptions = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Inactivo', value: 'INACTIVO' },
  ];

  readonly filtersDisabled = computed(
    () => !this.loading() && !this.errorMessage() && this.teachers().length === 0,
  );

  readonly filteredTeachers = computed(() => {
    const nameTerm = this.searchName().trim().toLocaleLowerCase('es');
    const dniTerm = this.searchDni().trim();
    const status = this.statusFilter();

    return this.teachers().filter((teacher) => {
      const fullName = `${teacher.lastName} ${teacher.firstName}`.toLocaleLowerCase('es');
      const matchesName = !nameTerm || fullName.includes(nameTerm);
      const matchesDni = !dniTerm || teacher.dni.includes(dniTerm);
      const teacherStatus = teacher.status || 'ACTIVO';
      const matchesStatus = status === null || teacherStatus === status;
      return matchesName && matchesDni && matchesStatus;
    });
  });

  readonly paginatedTeachers = computed(() => {
    const start = this.first();
    return this.filteredTeachers().slice(start, start + this.rows());
  });

  readonly rowActionsMap = computed(() => {
    const map = new Map<number, MenuItem[]>();
    for (const t of this.filteredTeachers()) {
      const isInactive = t.status === 'INACTIVO';
      map.set(t.id, [
        {
          label: 'Editar',
          icon: 'pi pi-pencil',
          command: () => this.goToEdit(t.id),
        },
        {
          label: isInactive ? 'Reactivar' : 'Desactivar',
          icon: isInactive ? 'pi pi-check-circle' : 'pi pi-ban',
          command: () => this.confirmStatusChange(t),
        },
      ]);
    }
    return map;
  });

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.teachersService.findAll().subscribe({
      next: (data) => {
        this.teachers.set([...data]);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.teachers.set([]);
          return;
        }
        this.errorMessage.set('Ocurrió un error al cargar los docentes.');
      },
    });
  }

  onSearchNameChange(value: string): void {
    this.searchName.set(value ?? '');
    this.first.set(0);
  }

  onSearchDniChange(value: string): void {
    this.searchDni.set(value ?? '');
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
    void this.router.navigate([TEACHERS_ROUTE, 'nuevo']);
  }

  goToDetail(id: number): void {
    void this.router.navigate([TEACHERS_ROUTE, id]);
  }

  goToEdit(id: number): void {
    void this.router.navigate([TEACHERS_ROUTE, id, 'editar']);
  }

  confirmStatusChange(teacher: Teacher): void {
    const deactivating = teacher.status !== 'INACTIVO';

    this.confirmationService.confirm({
      header: deactivating ? 'Desactivar docente' : 'Reactivar docente',
      message: deactivating
        ? `¿Desactivar a ${teacher.firstName} ${teacher.lastName}?`
        : `¿Reactivar a ${teacher.firstName} ${teacher.lastName}?`,
      icon: deactivating ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle',
      acceptButtonProps: {
        label: deactivating ? 'Desactivar' : 'Reactivar',
        severity: deactivating ? 'danger' : 'success',
      },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.executeStatusChange(teacher, deactivating),
    });
  }

  private executeStatusChange(teacher: Teacher, deactivating: boolean): void {
    const req = deactivating
      ? this.teachersService.deactivate(teacher.id)
      : this.teachersService.update(teacher.id, {
          dni: teacher.dni,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          phone: teacher.phone ?? null,
          email: teacher.email ?? null,
          fileNumber: teacher.fileNumber == null ? null : Number(teacher.fileNumber),
          status: 'ACTIVO',
        });

    req.subscribe({
      next: (updated) => {
        this.teachers.update((list) =>
          list.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
        );
        this.notification.success(
          deactivating ? 'Docente desactivado correctamente' : 'Docente reactivado correctamente',
          `${updated.lastName}, ${updated.firstName} ahora está ${deactivating ? 'inactivo' : 'activo'}.`,
        );
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.message;
        const text = Array.isArray(msg) ? msg.join('; ') : msg;
        this.notification.error(
          deactivating ? 'Error al desactivar docente' : 'Error al reactivar docente',
          typeof text === 'string' && text.trim()
            ? text
            : deactivating
              ? 'No se pudo desactivar el docente.'
              : 'No se pudo reactivar el docente.',
        );
      },
    });
  }
}
