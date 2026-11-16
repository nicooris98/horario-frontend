import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Message } from 'primeng/message';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TableModule, TablePageEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { NotificationService } from '../../../../core/services/notification.service';
import { createIsMobileSignal } from '../../../../shared/utils/viewport';
import { RowActionsComponent } from '../../../../shared/components/row-actions/row-actions';
import { StudyPlans } from '../../services/study-plan';
import { Degrees } from '../../services/degrees';
import { StudyPlan } from '../../interfaces/study-plan';

const DEFAULT_PAGE_SIZE = 10;
const STUDY_PLANS_ROUTE = '/academico/planes-estudio';

@Component({
  selector: 'app-study-plan-management',
  standalone: true,
  imports: [
    PaginatorModule,
    TableModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    TagModule,
    Message,
    BreadcrumbModule,
    RowActionsComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './study-plan-management.html',
  styleUrl: './study-plan-management.css',
})
export class StudyPlanManagement implements OnInit {
  private readonly studyPlansService = inject(StudyPlans);
  private readonly degreesService = inject(Degrees);
  private readonly notification = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  studyPlans = signal<StudyPlan[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  checkingDegrees = signal(false);

  // Paginación homogénea con el resto del sistema
  readonly first = signal(0);
  readonly rows = signal(DEFAULT_PAGE_SIZE);
  readonly rowsPerPageOptions = [10, 25, 50];
  readonly isMobile = createIsMobileSignal(this.destroyRef);

  // Breadcrumbs
  protected readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Gestión académica' },
    { label: 'Planes de estudio' },
  ];

  readonly paginatedStudyPlans = computed(() => {
    const start = this.first();
    return this.studyPlans().slice(start, start + this.rows());
  });

  readonly rowActionsMap = computed(() => {
    const map = new Map<number, MenuItem[]>();
    for (const plan of this.studyPlans()) {
      const items: MenuItem[] = [
        {
          label: 'Editar',
          icon: 'pi pi-pencil',
          command: () => this.editPlan(plan.id),
        },
      ];

      if (plan.status === 'VIGENTE') {
        items.push({
          label: 'Pasar a no vigente',
          icon: 'pi pi-arrow-down',
          command: () => this.confirmStatusChange(plan, 'NO_VIGENTE'),
        });
      } else if (plan.status === 'NO_VIGENTE') {
        items.push({
          label: 'Marcar como vigente',
          icon: 'pi pi-check-circle',
          command: () => this.confirmStatusChange(plan, 'VIGENTE'),
        });
      }

      if (plan.status !== 'ARCHIVADO') {
        items.push({
          label: 'Archivar',
          icon: 'pi pi-inbox',
          command: () => this.confirmArchive(plan),
        });
      }

      map.set(plan.id, items);
    }
    return map;
  });

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
        void this.router.navigate(['/academico/planes-estudio/nuevo']);
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
          void this.router.navigate(['/academico/planes-estudio/nuevo']);
        } else {
          this.notifyNoDegrees();
        }
      },
      error: (error: HttpErrorResponse) => {
        this.checkingDegrees.set(false);
        this.notification.error(
          'Error al verificar carreras',
          error.status === 403
            ? 'No tenés permisos para consultar las carreras.'
            : 'Ocurrió un error al consultar las carreras registradas. Intentá nuevamente.',
        );
      },
    });
  }

  private notifyNoDegrees(): void {
    this.notification.warn(
      'No hay carreras registradas',
      'Para agregar un plan de estudio, primero necesitás registrar una carrera. Cada plan de estudio debe estar asociado a una carrera.',
      6000,
    );
  }

  goToDetail(id: number): void {
    void this.router.navigate([STUDY_PLANS_ROUTE, id]);
  }

  editPlan(id: number): void {
    void this.router.navigate([STUDY_PLANS_ROUTE, id, 'editar']);
  }

  confirmStatusChange(plan: StudyPlan, newStatus: 'VIGENTE' | 'NO_VIGENTE'): void {
    this.confirmationService.confirm({
      header: newStatus === 'VIGENTE' ? 'Marcar como vigente' : 'Pasar a no vigente',
      message:
        newStatus === 'VIGENTE'
          ? `¿Querés marcar "${plan.name}" como vigente?`
          : `¿Querés pasar "${plan.name}" a no vigente?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: newStatus === 'VIGENTE' ? 'Marcar vigente' : 'Pasar a no vigente',
        severity: newStatus === 'VIGENTE' ? 'success' : 'secondary',
      },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.changeStatus(plan, newStatus, false),
    });
  }

  private changeStatus(
    plan: StudyPlan,
    newStatus: 'VIGENTE' | 'NO_VIGENTE',
    replaceCurrentVigente: boolean,
  ): void {
    this.studyPlansService
      .update(plan.id, { status: newStatus, replaceCurrentVigente })
      .subscribe({
        next: (updated) => {
          this.studyPlans.update((list) =>
            list.map((item) => (item.id === updated.id ? updated : item)),
          );
          if (replaceCurrentVigente) {
            this.loadStudyPlans();
          }
          this.notification.success(
            newStatus === 'VIGENTE'
              ? 'Plan de estudios marcado como vigente'
              : 'Plan de estudios pasado a no vigente',
            `El estado de "${updated.name}" se actualizó correctamente.`,
          );
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 409 && error.error?.code === 'VIGENTE_EXISTENTE') {
            const currentName = error.error?.currentPlan?.name;
            this.confirmationService.confirm({
              header: 'La carrera ya tiene un plan vigente',
              message: `La carrera ya tiene un plan vigente: "${currentName}". ¿Querés que este plan pase a ser el vigente? "${currentName}" quedará como no vigente.`,
              icon: 'pi pi-exclamation-triangle',
              acceptButtonProps: { label: 'Sí, reemplazar', severity: 'primary' },
              rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
              accept: () => this.changeStatus(plan, 'VIGENTE', true),
            });
            return;
          }

          const msg = error.error?.message;
          const text = Array.isArray(msg) ? msg.join(' ') : msg;
          this.notification.error(
            'Error al cambiar estado del plan',
            typeof text === 'string' && text.length > 0
              ? text
              : 'No se pudo cambiar el estado del plan de estudios.',
          );
        },
      });
  }

  confirmArchive(plan: StudyPlan): void {
    this.confirmationService.confirm({
      header: 'Archivar plan de estudio',
      message: `¿Archivar "${plan.name}"? No se elimina: queda archivado y conserva su historial.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Archivar', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.archivePlan(plan),
    });
  }

  private archivePlan(plan: StudyPlan): void {
    this.studyPlansService.delete(plan.id).subscribe({
      next: (updated) => {
        this.studyPlans.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.notification.success(
          'Plan de estudios archivado correctamente',
          `El plan "${updated.name}" fue archivado.`,
        );
      },
      error: (error: HttpErrorResponse) => {
        const msg = error.error?.message;
        const text = Array.isArray(msg) ? msg.join(' ') : msg;
        this.notification.error(
          'Error al archivar el plan de estudios',
          typeof text === 'string' && text.length > 0
            ? text
            : 'No se pudo archivar el plan de estudios.',
        );
      },
    });
  }
}
