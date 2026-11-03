import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Message } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { Degree, DegreeStatus } from '../../models/degree.model';
import { DegreeService } from '../../services/degree.service';

const DEGREES_ROUTE = '/administracion/carreras';

@Component({
  selector: 'app-degree-detail',
  standalone: true,
  imports: [DatePipe, BreadcrumbModule, ButtonModule, CardModule, Message, SkeletonModule, TagModule],
  templateUrl: './degree-detail.html',
  styleUrl: './degree-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DegreeDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly degreeService = inject(DegreeService);

  readonly degree = signal<Degree | null>(null);
  readonly loading = this.degreeService.loading;
  readonly error = this.degreeService.error;

  protected readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/dashboard' };
  protected readonly breadcrumbTheme = { root: { background: 'transparent', padding: '0' } };
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Administración' },
    { label: 'Carreras', routerLink: DEGREES_ROUTE },
    { label: 'Detalle' },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      void this.router.navigate([DEGREES_ROUTE]);
      return;
    }

    this.degreeService.getDegreeById(id).subscribe({
      next: (degree) => this.degree.set(degree.id ? degree : null),
      error: () => this.degree.set(null),
    });
  }

  goBack(): void {
    void this.router.navigate([DEGREES_ROUTE]);
  }

  goEdit(): void {
    const current = this.degree();
    if (current) {
      void this.router.navigate([DEGREES_ROUTE, current.id, 'editar']);
    }
  }

  statusLabel(value: DegreeStatus): string {
    return value === 'ACTIVE' ? 'Activo' : 'Inactivo';
  }

  statusSeverity(value: DegreeStatus): 'success' | 'danger' {
    return value === 'ACTIVE' ? 'success' : 'danger';
  }
}