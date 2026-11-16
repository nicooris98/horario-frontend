import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { DetailHeaderComponent } from '../../../../shared/components/detail-header/detail-header';
import { StudyPlan } from '../../interfaces/study-plan';
import { StudyPlans } from '../../services/study-plan';

const STUDY_PLANS_ROUTE = '/academico/planes-estudio';

interface DetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-study-plan-detail',
  standalone: true,
  imports: [
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    Message,
    SkeletonModule,
    TagModule,
    DetailHeaderComponent,
  ],
  templateUrl: './study-plan-detail.html',
  styleUrl: './study-plan-detail.css',
})
export class StudyPlanDetail implements OnInit {
  private readonly studyPlansService = inject(StudyPlans);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  protected readonly breadcrumbTheme = { root: { background: 'transparent', padding: '0' } };

  readonly studyPlan = signal<StudyPlan | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly breadcrumbItems = computed<MenuItem[]>(() => [
    { label: 'Gestión académica' },
    { label: 'Planes de estudio', routerLink: STUDY_PLANS_ROUTE },
    { label: this.studyPlan()?.name ?? 'Detalle' },
  ]);

  readonly highlights = computed(() => {
    const plan = this.studyPlan();
    if (!plan) return [];
    return [
      { icon: 'pi pi-calendar', value: String(plan.validityYear), label: 'Año de vigencia' },
      { icon: 'pi pi-clock', value: `${plan.durationYears} ${plan.durationYears === 1 ? 'año' : 'años'}`, label: 'Duración' },
      { icon: 'pi pi-calendar-plus', value: this.formatDate(plan.startDate), label: 'Fecha de inicio' },
      { icon: 'pi pi-calendar-times', value: plan.endDate ? this.formatDate(plan.endDate) : '—', label: 'Fecha de fin' },
    ];
  });

  readonly rows = computed<DetailRow[]>(() => {
    const plan = this.studyPlan();
    if (!plan) return [];
    return [
      { label: 'Nombre del plan', value: plan.name },
      { label: 'Carrera', value: plan.degree?.name ?? '—' },
      { label: 'Año de vigencia', value: String(plan.validityYear) },
      { label: 'Duración de la carrera', value: `${plan.durationYears} ${plan.durationYears === 1 ? 'año' : 'años'}` },
      { label: 'Fecha de inicio (Desde)', value: this.formatDate(plan.startDate) },
      { label: 'Fecha de finalización (Hasta)', value: plan.endDate ? this.formatDate(plan.endDate) : 'No definida (—)' },
    ];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('El plan de estudio solicitado no es válido.');
      this.loading.set(false);
      return;
    }

    this.studyPlansService.getById(id).subscribe({
      next: (plan) => {
        this.studyPlan.set(plan);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.status === 404
            ? 'El plan de estudio no existe.'
            : error.status === 403
              ? 'No tenés permisos para ver este plan de estudio.'
              : 'Ocurrió un error al cargar el plan de estudio.',
        );
      },
    });
  }

  goBack(): void {
    void this.router.navigate([STUDY_PLANS_ROUTE]);
  }

  goToEdit(): void {
    const plan = this.studyPlan();
    if (plan) {
      void this.router.navigate([STUDY_PLANS_ROUTE, plan.id, 'editar']);
    }
  }

  statusLabel(status: string): string {
    return status === 'VIGENTE' ? 'Vigente' : status === 'NO_VIGENTE' ? 'No vigente' : 'Archivado';
  }

  statusSeverity(status: string): 'success' | 'warn' | 'secondary' {
    return status === 'VIGENTE' ? 'success' : status === 'NO_VIGENTE' ? 'warn' : 'secondary';
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }
}
