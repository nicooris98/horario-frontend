import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AcademicCycle } from '../../../academic-calendar/interfaces/academic-calendar';
import { Calendar } from '../../../academic-calendar/services/academic-calendar';
import { SHIFT_ACTIVE, Shift } from '../../../shifts/interfaces/shift';
import { Shifts } from '../../../shifts/services/shifts';
import {
  CourseSection,
  Offer,
  OfferStudyPlan,
  SECTION_ACTIVE,
  SECTION_INACTIVE,
} from '../../interfaces/academic-offer';
import { Offers } from '../../services/academic-offer';
import { BREADCRUMB_HOME, BREADCRUMB_THEME } from '../../../subjects/subject-display';

@Component({
  selector: 'app-academic-offer',
  standalone: true,
  imports: [
    FormsModule,
    BreadcrumbModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    DialogModule,
    InputTextModule,
    Message,
    SelectModule,
    TableModule,
    TagModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './academic-offer.html',
  styleUrl: './academic-offer.css',
})
export class AcademicOffer implements OnInit {
  private readonly offersService = inject(Offers);
  private readonly calendarService = inject(Calendar);
  private readonly shiftsService = inject(Shifts);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly breadcrumbHome = BREADCRUMB_HOME;
  protected readonly breadcrumbTheme = BREADCRUMB_THEME;
  protected readonly breadcrumbItems: MenuItem[] = [
    { label: 'Gestión académica' },
    { label: 'Oferta académica' },
  ];

  readonly cycles = signal<AcademicCycle[]>([]);
  readonly studyPlans = signal<OfferStudyPlan[]>([]);
  readonly shifts = signal<Shift[]>([]);
  readonly offers = signal<Offer[]>([]);
  readonly sections = signal<CourseSection[]>([]);
  readonly errorMessage = signal('');

  readonly selectedCycle = signal<AcademicCycle | null>(null);

  readonly cycleOffers = computed(() =>
    this.offers().filter((offer) => offer.academicCycle.id === this.selectedCycle()?.id),
  );

  readonly cycleSections = computed(() =>
    this.sections().filter(
      (section) => section.studyPlanAcademicCycle.academicCycle.id === this.selectedCycle()?.id,
    ),
  );

  readonly planOptions = computed(() =>
    this.studyPlans().map((plan) => ({ label: this.planLabel(plan), value: plan })),
  );

  readonly shiftOptions = computed(() =>
    this.shifts()
      .filter((shift) => shift.status === SHIFT_ACTIVE)
      .map((shift) => ({ label: this.shiftLabel(shift), value: shift })),
  );

  readonly offerOptions = computed(() =>
    this.cycleOffers().map((offer) => ({ label: this.offerLabel(offer), value: offer })),
  );

  readonly offerDialogVisible = signal(false);
  readonly offerPlan = signal<OfferStudyPlan | null>(null);
  readonly offerShift = signal<Shift | null>(null);
  readonly offerError = signal('');

  readonly sectionDialogVisible = signal(false);
  readonly editingSection = signal<CourseSection | null>(null);
  readonly sectionOffer = signal<Offer | null>(null);
  readonly sectionYear = signal<number | null>(null);
  readonly sectionName = signal('');
  readonly sectionError = signal('');

  readonly saving = signal(false);

  ngOnInit(): void {
    this.calendarService.getCycles().subscribe({
      next: (cycles) => {
        this.cycles.set(cycles);
        this.selectedCycle.set(cycles[0] ?? null);
      },
      error: () => this.errorMessage.set('Ocurrió un error al cargar los ciclos lectivos.'),
    });
    this.offersService.getStudyPlans().subscribe({
      next: (plans) => this.studyPlans.set(plans),
      error: () => this.errorMessage.set('Ocurrió un error al cargar los planes de estudio.'),
    });
    this.shiftsService.getAll().subscribe({
      next: (shifts) => this.shifts.set(shifts),
      error: () => this.errorMessage.set('Ocurrió un error al cargar los turnos.'),
    });
    this.loadOffers();
    this.loadSections();
  }

  loadOffers(): void {
    this.offersService.getOffers().subscribe({
      next: (offers) => this.offers.set(offers),
      error: () => this.errorMessage.set('Ocurrió un error al cargar la oferta académica.'),
    });
  }

  loadSections(): void {
    this.offersService.getSections().subscribe({
      next: (sections) => this.sections.set(sections),
      error: () => this.errorMessage.set('Ocurrió un error al cargar los cursos.'),
    });
  }

  planLabel(plan: OfferStudyPlan): string {
    return plan.degree ? `${plan.name} (${plan.degree.name})` : plan.name;
  }

  shiftLabel(shift: Shift): string {
    return `${shift.name} (${shift.startTime.slice(0, 5)} a ${shift.endTime.slice(0, 5)})`;
  }

  offerLabel(offer: Offer): string {
    return `${offer.studyPlan.name} - ${offer.shift.name}`;
  }

  isActive(section: CourseSection): boolean {
    return section.status === SECTION_ACTIVE;
  }

  openCreateOffer(): void {
    this.offerPlan.set(null);
    this.offerShift.set(null);
    this.offerError.set('');
    this.offerDialogVisible.set(true);
  }

  saveOffer(): void {
    const cycle = this.selectedCycle();
    const plan = this.offerPlan();
    const shift = this.offerShift();

    if (!cycle || !plan || !shift) {
      this.offerError.set('Elegí el plan de estudio y el turno.');
      return;
    }

    const repeated = this.cycleOffers().some(
      (offer) => offer.studyPlan.id === plan.id && offer.shift.id === shift.id,
    );
    if (repeated) {
      this.offerError.set('Ese plan ya se ofrece en ese turno para este ciclo.');
      return;
    }

    this.saving.set(true);
    this.offersService
      .createOffer({ studyPlanId: plan.id, academicCycleId: cycle.id, shiftId: shift.id })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.offerDialogVisible.set(false);
          this.loadOffers();
        },
        error: () => {
          this.saving.set(false);
          this.offerError.set('No se pudo agregar el plan al ciclo.');
        },
      });
  }

  confirmDeleteOffer(offer: Offer): void {
    this.confirmationService.confirm({
      header: 'Quitar plan del ciclo',
      message: `¿Querés quitar "${this.offerLabel(offer)}" de este ciclo lectivo?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Quitar', severity: 'danger' },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () => this.deleteOffer(offer),
    });
  }

  private deleteOffer(offer: Offer): void {
    this.errorMessage.set('');
    this.offersService.deleteOffer(offer.id).subscribe({
      next: () => this.loadOffers(),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(
          error.status === 409 ? error.error.message : 'No se pudo quitar el plan del ciclo.',
        ),
    });
  }

  openCreateSection(): void {
    this.editingSection.set(null);
    this.sectionOffer.set(null);
    this.sectionYear.set(null);
    this.sectionName.set('');
    this.sectionError.set('');
    this.sectionDialogVisible.set(true);
  }

  openEditSection(section: CourseSection): void {
    this.editingSection.set(section);
    this.sectionOffer.set(
      this.cycleOffers().find((offer) => offer.id === section.studyPlanAcademicCycle.id) ?? null,
    );
    this.sectionYear.set(section.courseYear);
    this.sectionName.set(section.section);
    this.sectionError.set('');
    this.sectionDialogVisible.set(true);
  }

  saveSection(): void {
    const offer = this.sectionOffer();
    const courseYear = this.sectionYear();
    const section = this.sectionName().trim();

    if (!offer || !courseYear || !section) {
      this.sectionError.set('Completá todos los campos.');
      return;
    }

    if (courseYear > Math.ceil(offer.studyPlan.durationYears)) {
      this.sectionError.set(
        `El plan dura ${offer.studyPlan.durationYears} años; el año de cursado no puede ser mayor.`,
      );
      return;
    }

    const data = { studyPlanAcademicCycleId: offer.id, courseYear, section };
    const editing = this.editingSection();
    const request = editing
      ? this.offersService.updateSection(editing.id, data)
      : this.offersService.createSection(data);

    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.sectionDialogVisible.set(false);
        this.loadSections();
      },
      error: () => {
        this.saving.set(false);
        this.sectionError.set('No se pudo guardar el curso.');
      },
    });
  }

  confirmSectionStatusChange(section: CourseSection): void {
    const deactivate = this.isActive(section);
    const name = `${section.courseYear}° ${section.section}`;

    this.confirmationService.confirm({
      header: deactivate ? 'Desactivar curso' : 'Activar curso',
      message: `¿Querés ${deactivate ? 'desactivar' : 'activar'} el curso ${name}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: {
        label: deactivate ? 'Desactivar' : 'Activar',
        severity: deactivate ? 'danger' : 'primary',
      },
      rejectButtonProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
      accept: () =>
        this.changeSectionStatus(section, deactivate ? SECTION_INACTIVE : SECTION_ACTIVE),
    });
  }

  private changeSectionStatus(section: CourseSection, status: string): void {
    this.errorMessage.set('');
    this.offersService.changeSectionStatus(section.id, status).subscribe({
      next: () => this.loadSections(),
      error: () => this.errorMessage.set('No se pudo cambiar el estado del curso.'),
    });
  }
}
