import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Message } from 'primeng/message';
import { StudyPlans } from '../../services/study-plan';
import { StudyPlan } from '../../interfaces/study-plan';

@Component({
  selector: 'app-study-plan-management',
  standalone: true,
  imports: [TableModule, ButtonModule, CardModule, TagModule, Message],
  templateUrl: './study-plan-management.html',
  styleUrl: './study-plan-management.css',
})
export class StudyPlanManagement implements OnInit {
  private readonly studyPlansService = inject(StudyPlans);
  private readonly router = inject(Router);

  studyPlans = signal<StudyPlan[]>([]);
  loading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.loadStudyPlans();
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

  goToCreate(): void {
    this.router.navigate(['/academico/planes-estudio/nuevo']);
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