import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
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
    ButtonModule,
    SelectModule,
    TagModule,
    DialogModule,
    ConfirmDialogModule,
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

  readonly loading = this.degreeService.loading;
  readonly error = this.degreeService.error;
  readonly degrees = this.degreeService.degrees;
  readonly pendingDelete = signal<Degree | null>(null);

  searchText = '';
  statusFilter: 'ALL' | DegreeStatus = 'ALL';

  readonly statusOptions = [
    { label: 'Todos', value: 'ALL' },
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' },
  ];

  readonly filteredDegrees = computed(() => {
    const term = this.searchText.trim().toLocaleLowerCase();

    return this.degrees()
      .filter((degree) => {
        const matchesText = !term || degree.name.toLocaleLowerCase().includes(term);
        const matchesStatus = this.statusFilter === 'ALL' || degree.status === this.statusFilter;
        return matchesText && matchesStatus;
      })
      .sort((left, right) => left.name.localeCompare(right.name, 'es', { sensitivity: 'base' }));
  });

  ngOnInit(): void {
    this.loadDegrees();
  }

  loadDegrees(): void {
    this.degreeService.getDegrees().subscribe();
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

  openDeleteDialog(degree: Degree): void {
    this.pendingDelete.set(degree);
  }

  confirmDelete(): void {
    const degree = this.pendingDelete();

    if (!degree) {
      return;
    }

    this.degreeService.inactivateDegree(degree.id).subscribe(() => {
      this.pendingDelete.set(null);
      this.loadDegrees();
    });
  }

  statusLabel(value: DegreeStatus): string {
    return value === 'ACTIVE' ? 'Activo' : 'Inactivo';
  }

  statusSeverity(value: DegreeStatus): 'success' | 'danger' {
    return value === 'ACTIVE' ? 'success' : 'danger';
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }
}
