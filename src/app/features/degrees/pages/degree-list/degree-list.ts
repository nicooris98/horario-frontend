import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
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
    SkeletonModule,
    SelectModule,
    TagModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './degree-list.html',
  styleUrl: './degree-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DegreeListComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  private readonly degreeService = inject(DegreeService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly loading = this.degreeService.loading;
  readonly error = this.degreeService.error;
  readonly degrees = this.degreeService.degrees;
  readonly pendingDelete = signal<Degree | null>(null);

  readonly search = signal('');
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

  ngOnInit(): void {
    this.loadDegrees();
  }

  ngAfterViewInit(): void {
    this.checkPendingToast();
  }

  loadDegrees(): void {
    this.degreeService.getDegrees().subscribe();
  }

  private checkPendingToast(): void {
    // 1. Verificar mensaje en el servicio compartido
    const toast = this.degreeService.consumePendingToast();
    if (toast) {
      setTimeout(() => {
        this.messageService.add({
          severity: toast.severity,
          summary: toast.summary,
          detail: toast.detail,
          life: 5000,
        });
      }, 50);
      return;
    }

    // 2. Verificar alternativamente en sessionStorage
    try {
      const stored = sessionStorage.getItem('degrees_pending_toast');
      if (stored) {
        sessionStorage.removeItem('degrees_pending_toast');
        const parsed = JSON.parse(stored);
        setTimeout(() => {
          this.messageService.add({
            severity: parsed.severity,
            summary: parsed.summary,
            detail: parsed.detail,
            life: 5000,
          });
        }, 50);
        return;
      }
    } catch {
      // Ignorar errores de acceso a almacenamiento
    }

    // 3. Verificar en el state del historial
    const state = history.state as { toast?: { severity: string; summary: string; detail: string } } | undefined;
    if (state?.toast) {
      setTimeout(() => {
        this.messageService.add({
          severity: state.toast!.severity,
          summary: state.toast!.summary,
          detail: state.toast!.detail,
          life: 5000,
        });
      }, 50);

      if (history.replaceState) {
        history.replaceState({ ...history.state, toast: undefined }, '');
      }
    }
  }

  onSearchChange(value: string): void {
    this.search.set(value ?? '');
  }

  onStatusFilterChange(value: 'ALL' | DegreeStatus | null): void {
    this.statusFilter.set(value ?? 'ALL');
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

    const nextStatus: DegreeStatus = degree.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    this.degreeService.updateStatus(degree.id, nextStatus).subscribe(() => {
      this.pendingDelete.set(null);
      this.loadDegrees();
      this.messageService.add({
        severity: 'success',
        summary: nextStatus === 'ACTIVO' ? 'Carrera activada' : 'Carrera desactivada',
        detail: `La carrera "${degree.name}" fue ${nextStatus === 'ACTIVO' ? 'activada' : 'desactivada'} correctamente.`,
        life: 3000,
      });
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

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }
}
