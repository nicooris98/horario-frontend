import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { Subject } from '../../interfaces/subject';
import { Subjects } from '../../services/subjects';
import {
  BREADCRUMB_HOME,
  BREADCRUMB_THEME,
  SUBJECTS_ROUTE,
  maxTeachersLabel,
  statusLabel,
  statusSeverity,
  subjectsBreadcrumb,
} from '../../subject-display';

interface DetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  imports: [BreadcrumbModule, ButtonModule, CardModule, Message, TagModule],
  templateUrl: './subject-detail.html',
  styleUrl: './subject-detail.css',
})
export class SubjectDetail implements OnInit {
  private readonly subjectsService = inject(Subjects);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly statusLabel = statusLabel;
  protected readonly statusSeverity = statusSeverity;

  readonly subject = signal<Subject | null>(null);
  readonly errorMessage = signal('');

  readonly breadcrumbItems = computed<MenuItem[]>(() =>
    subjectsBreadcrumb({ label: this.subject()?.name ?? 'Detalle' }),
  );

  readonly highlights = computed(() => {
    const subject = this.subject();
    if (!subject) return [];
    return [
      { icon: 'pi pi-calendar', value: String(subject.year), label: 'Año de cursado' },
      { icon: 'pi pi-book', value: subject.regime.name, label: 'Régimen' },
      { icon: 'pi pi-clock', value: String(subject.weeklyHours), label: 'Horas semanales' },
      { icon: 'pi pi-users', value: maxTeachersLabel(subject), label: 'Docentes máximo' },
    ];
  });

  readonly rows = computed<DetailRow[]>(() => {
    const subject = this.subject();
    if (!subject) return [];
    return [
      { label: 'Nombre', value: subject.name },
      { label: 'Plan de estudio', value: subject.studyPlan.name },
      { label: 'Año de cursado', value: String(subject.year) },
      { label: 'Régimen', value: subject.regime.name },
      { label: 'Horas semanales', value: String(subject.weeklyHours) },
      { label: 'Permite múltiples docentes', value: subject.allowsMultipleTeachers ? 'Sí' : 'No' },
      {
        label: 'Máximo de docentes',
        value: subject.maxTeachers === null ? '—' : String(subject.maxTeachers),
      },
    ];
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('La materia solicitada no es válida.');
      return;
    }

    this.subjectsService.getById(id).subscribe({
      next: (subject) => this.subject.set(subject),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(
          error.status === 404
            ? 'No se encontró la materia solicitada.'
            : 'Ocurrió un error al cargar la materia.',
        ),
    });
  }

  goBack(): void {
    this.router.navigate([SUBJECTS_ROUTE]);
  }

  goToEdit(): void {
    const subject = this.subject();
    if (subject) this.router.navigate([SUBJECTS_ROUTE, subject.id, 'editar']);
  }
}
