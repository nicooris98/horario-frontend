import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { Degree, DegreeStatus } from '../../models/degree.model';
import { DegreeService } from '../../services/degree.service';

@Component({
  selector: 'app-degree-detail',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TagModule],
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

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      void this.router.navigate(['/administracion/carreras']);
      return;
    }

    this.degreeService.getDegreeById(id).subscribe({
      next: (degree) => this.degree.set(degree.id ? degree : null),
      error: () => this.degree.set(null),
    });
  }

  goBack(): void {
    void this.router.navigate(['/administracion/carreras']);
  }

  goEdit(): void {
    const current = this.degree();
    if (current) {
      void this.router.navigate(['/administracion/carreras', current.id, 'editar']);
    }
  }

  statusLabel(value: DegreeStatus): string {
    return value === 'ACTIVE' ? 'Activo' : 'Inactivo';
  }

  statusSeverity(value: DegreeStatus): 'success' | 'danger' {
    return value === 'ACTIVE' ? 'success' : 'danger';
  }
}
