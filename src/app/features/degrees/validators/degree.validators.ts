import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import type { Degree } from '../models/degree.model';

export function uniqueDegreeNameValidator(
  getDegrees: () => Degree[],
  getCurrentId: () => number | null = () => null,
): AsyncValidatorFn {
  return async (control: AbstractControl): Promise<ValidationErrors | null> => {
    const name = control.value?.toString().trim();

    if (!name) {
      return null;
    }

    const currentId = getCurrentId();
    const hasDuplicate = getDegrees().some((degree) => {
      const sameName = degree.name.trim().toLowerCase() === name.toLowerCase();
      return sameName && degree.id !== currentId;
    });

    return hasDuplicate ? { uniqueName: true } : null;
  };
}
