import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import {
  CourseSection,
  CourseSectionRequest,
  Offer,
  OfferRequest,
  OfferStudyPlan,
} from '../interfaces/academic-offer';

@Injectable({ providedIn: 'root' })
export class Offers {
  private readonly api = inject(Api);

  getStudyPlans() {
    return this.api.get<OfferStudyPlan[]>('study-plans');
  }

  getOffers() {
    return this.api.get<Offer[]>('study-plan-academic-cycles');
  }

  createOffer(data: OfferRequest) {
    return this.api.post<Offer>('study-plan-academic-cycles', data);
  }

  deleteOffer(id: number) {
    return this.api.delete<Offer>(`study-plan-academic-cycles/${id}`);
  }

  getSections() {
    return this.api.get<CourseSection[]>('course-sections');
  }

  createSection(data: CourseSectionRequest) {
    return this.api.post<CourseSection>('course-sections', data);
  }

  updateSection(id: number, data: CourseSectionRequest) {
    return this.api.patch<CourseSection>(`course-sections/${id}`, data);
  }

  changeSectionStatus(id: number, status: string) {
    return this.api.patch<CourseSection>(`course-sections/${id}/status`, { status });
  }
}
