import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../../core/services/notification.service';
import { createIsMobileSignal } from '../../../../shared/utils/viewport';
import { RowActionsComponent } from '../../../../shared/components/row-actions/row-actions';
import { Degree, DegreeStatus } from '../../models/degree.model';
import { DegreeService } from '../../services/degree.service';

@Component({
  selector: 'app-degree-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    BreadcrumbModule,
    CardModule,
    ConfirmDialogModule,
    SkeletonModule,
    SelectModule,
    PaginatorModule,
    TagModule,
    RowActionsComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './degree-list.html',
  styleUrl: './degree-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DegreeListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly degreeService = inject(DegreeService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = this.degreeService.loading;
  readonly error = this.degreeService.error;
  readonly degrees = this.degreeService.degrees;

  readonly search = signal('');
  readonly first = signal(0);
  readonly rows = signal(10);
  readonly rowsPerPageOptions = [5, 10, 20];
  readonly isMobile = createIsMobileSignal(this.destroyRef);
  readonly statusFilter = signal<'ALL' | DegreeStatus>('ALL');

  readonly statusOptions = [
    { label: 'Todos los estados', value: 'ALL' },
    { label: 'Activo', value: 'ACTIVO' },
    { label: 'Inactivo', value: 'INACTIVO' },
  ];

  readonly filteredDegrees = computed(() => {
    const term = this.search().trim().toLocaleLowerCase();
    const status = this.statusFilter();

    return this.degrees()
      .filter((degree) => {
        const matchesText = !term || degree.name.toLocaleLowerCase().includes(term);
        const matchesStatus = status === 'ALL' || degree.status === status;
        return matchesText && matchesStatus;
      })
      .sort((left, right) => left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }));
  });

  readonly paginatedDegrees = computed(() => {
    const start = this.first();
    return this.filteredDegrees().slice(start, start + this.rows());
  });

  readonly rowActionsMap = computed(() => {
    const map = new Map<number, MenuItem[]>();
    for (const degree of this.filteredDegrees()) {
      const isActive = degree.status === 'ACTIVO';
      map.set(degree.id, [
        {
          label: 'Editar',
          icon: 'pi pi-pencil',
          command: () => this.goToEdit(degree.id),
        },
        {
          label: isActive ? 'Desactivar' : 'Activar',
          icon: isActive ? 'pi pi-ban' : 'pi pi-check-circle',
          command: () => this.confirmStatusChange(degree),
        },
      ]);
    }
    return map;
  });

  ngOnInit(): void {
    this.loadDegrees();
  }

  loadDegrees(): void {
    this.degreeService.getDegrees().subscribe();
  }

  onSearchChange(value: string): void {
    this.search.set(value ?? '');
    this.first.set(0);
  }

  onStatusFilterChange(value: 'ALL' | DegreeStatus | null): void {
    this.statusFilter.set(value ?? 'ALL');
    this.first.set(0);
  }

  onPageChange(event: TablePageEvent | PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? 10);
  }

  goToCreate(): void {
    void this.router.navigate(['/administracion/carreras/nuevo']);
  }

  goToDetail(id: number): void {
    void this.router.navigate(['/administracion/carreras', id]);
  }

  goToEdit(id: number): void {
    void this.router.navigate(['/administracion/carreras', id, 'editar']);
  }

  confirmStatusChange(degree: Degree): void {
    const deactivate = degree.status === 'ACTIVO';
    const nextStatus: DegreeStatus = deactivate ? 'INACTIVO' : 'ACTIVO';

    this.confirmationService.confirm({
      header: deactivate ? 'Desactivar carrera' : 'Activar carrera',
      message: `¿Querés ${deactivate ? 'desactivar' : 'activar'} la carrera "${degree.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: deactivate ? 'Desactivar' : 'Activar',
        severity: deactivate ? 'danger' : 'success',
      },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => {
        this.degreeService.updateStatus(degree.id, nextStatus).subscribe({
          next: (updated) => {
            if (!updated || updated.id === 0) {
              this.notification.error(
                deactivate ? 'Error al desactivar la carrera' : 'Error al activar la carrera',
                this.error() ?? 'No se pudo cambiar el estado de la carrera.',
              );
              return;
            }
            this.notification.success(
              deactivate ? 'Carrera desactivada correctamente' : 'Carrera activada correctamente',
              `La carrera "${updated.name}" ahora está ${deactivate ? 'inactiva' : 'activa'}.`,
            );
          },
        });
      },
    });
  }

  protected readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  protected readonly breadcrumbTheme = { root: { background: 'transparent', padding: '0' } };
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Administración' },
    { label: 'Carreras' },
  ];

  statusLabel(value: DegreeStatus): string {
    return value === 'ACTIVO' ? 'Activo' : 'Inactivo';
  }

  statusSeverity(value: DegreeStatus): 'success' | 'danger' {
    return value === 'ACTIVO' ? 'success' : 'danger';
  }
}
