import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule, TablePageEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Message } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem, MessageService } from 'primeng/api';
import { PaginatorState } from 'primeng/paginator';
import { StudyPlans } from '../../services/study-plan';
import { Degrees } from '../../services/degrees';
import { StudyPlan } from '../../interfaces/study-plan';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-study-plan-management',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    CardModule,
    TagModule,
    Message,
    ToastModule,
    BreadcrumbModule,
  ],
  providers: [MessageService],
  templateUrl: './study-plan-management.html',
  styleUrl: './study-plan-management.css',
})
export class StudyPlanManagement implements OnInit {
  private readonly studyPlansService = inject(StudyPlans);
  private readonly degreesService = inject(Degrees);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);

  studyPlans = signal<StudyPlan[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  checkingDegrees = signal(false);

  // Paginación homogénea con el resto del sistema
  readonly first = signal(0);
  readonly rows = signal(DEFAULT_PAGE_SIZE);
  readonly rowsPerPageOptions = [10, 25, 50];

  // Breadcrumbs
  protected readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  protected readonly breadcrumbTheme = { root: { background: 'transparent', padding: '0' } };
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Gestión académica' },
    { label: 'Planes de estudio' },
  ];

  ngOnInit(): void {
    this.loadStudyPlans();
    // Precargar carreras en segundo plano para disponer del estado de inmediato
    this.degreesService.getAll().subscribe({
      error: () => {
        // Silencioso en carga inicial; se gestionará al pulsar el botón
      },
    });
  }

  loadStudyPlans(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.studyPlansService.getAll().subscribe({
      next: (plans) => {
        this.studyPlans.set(plans);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.status === 403
            ? 'No tenés permisos para ver los planes de estudio.'
            : 'Ocurrió un error al cargar los planes de estudio.',
        );
      },
    });
  }

  onPageChange(event: TablePageEvent | PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? DEFAULT_PAGE_SIZE);
  }

  goToCreate(): void {
    if (this.checkingDegrees()) {
      return;
    }

    // Si ya fueron consultadas previamente y tenemos estado 'success'
    if (this.degreesService.state() === 'success') {
      const degrees = this.degreesService.degrees();
      if (degrees.length > 0) {
        this.router.navigate(['/academico/planes-estudio/nuevo']);
      } else {
        this.notifyNoDegrees();
      }
      return;
    }

    // Si no estaban cargadas o hubo un error previo, consultar
    this.checkingDegrees.set(true);
    this.degreesService.getAll(true).subscribe({
      next: (degrees) => {
        this.checkingDegrees.set(false);
        if (degrees.length > 0) {
          this.router.navigate(['/academico/planes-estudio/nuevo']);
        } else {
          this.notifyNoDegrees();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.checkingDegrees.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al verificar carreras',
          detail:
            error.status === 403
              ? 'No tenés permisos para consultar las carreras.'
              : 'Ocurrió un error al consultar las carreras registradas. Intentá nuevamente.',
          life: 5000,
        });
      },
    });
  }

  private notifyNoDegrees(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'No hay carreras registradas',
      detail:
        'Para agregar un plan de estudio, primero necesitás registrar una carrera. Cada plan de estudio debe estar asociado a una carrera.',
      life: 6000,
    });
  }

  editPlan(id: number): void {
    this.router.navigate(['/academico/planes-estudio', id, 'editar']);
  }

  deletePlan(id: number): void {
    if (!confirm('¿Dar de baja este plan de estudio?')) {
      return;
    }

    this.errorMessage.set('');

    this.studyPlansService.delete(id).subscribe({
      next: () => this.loadStudyPlans(),
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(
          error.status === 403
            ? 'No tenés permisos para dar de baja planes de estudio.'
            : (error.error?.message ?? 'No se pudo dar de baja el plan de estudio.'),
        );
      },
    });
  }
}
