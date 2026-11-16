import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { Teacher } from '../../../../core/models/module2.models';
import { DetailHeaderComponent } from '../../../../shared/components/detail-header/detail-header';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';
import { TeachersService } from '../../services/teachers.service';

const TEACHERS_ROUTE = '/docentes';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [BreadcrumbModule, CardModule, Message, SkeletonModule, TagModule, DetailHeaderComponent],
  templateUrl: './teacher-detail.html',
  styleUrl: './teacher-detail.css',
})
export class TeacherDetail implements OnInit {
  private readonly teachersService = inject(TeachersService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;

  readonly teacher = signal<Teacher | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly fullName = computed(() => {
    const t = this.teacher();
    if (!t) return this.loading() ? 'Cargando...' : 'Docente';
    return `${t.lastName}, ${t.firstName}`;
  });

  readonly breadcrumbItems = computed<MenuItem[]>(() => [
    { label: 'Docentes', routerLink: TEACHERS_ROUTE },
    { label: this.teacher() ? `${this.teacher()!.lastName}, ${this.teacher()!.firstName}` : 'Detalle' },
  ]);

  readonly highlights = computed(() => {
    const t = this.teacher();
    if (!t) return [];
    return [
      { icon: 'pi pi-id-card', value: t.dni, label: 'DNI' },
      { icon: 'pi pi-hashtag', value: t.fileNumber != null ? String(t.fileNumber) : '—', label: 'Legajo' },
      { icon: 'pi pi-envelope', value: t.email || '—', label: 'Email' },
      { icon: 'pi pi-briefcase', value: String(t.currentAssignments?.length ?? 0), label: 'Asignaciones vigentes' },
    ];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('El docente solicitado no es válido.');
      this.loading.set(false);
      return;
    }

    this.teachersService.findOne(id).subscribe({
      next: (data) => {
        this.teacher.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 404
            ? 'No se encontró el docente solicitado.'
            : 'Ocurrió un error al cargar el docente.',
        );
      },
    });
  }

  statusLabel(status?: string): string {
    return status === 'INACTIVO' ? 'Inactivo' : 'Activo';
  }

  statusSeverity(status?: string): 'success' | 'danger' {
    return status === 'INACTIVO' ? 'danger' : 'success';
  }

  goBack(): void {
    void this.router.navigate([TEACHERS_ROUTE]);
  }

  goToEdit(): void {
    const t = this.teacher();
    if (t) {
      void this.router.navigate([TEACHERS_ROUTE, t.id, 'editar']);
    }
  }
}
