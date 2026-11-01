import { describe, expect, it } from 'vitest';
import type { Degree } from '../models/degree.model';
import { uniqueDegreeNameValidator } from './degree.validators';

describe('uniqueDegreeNameValidator', () => {
  const degrees: Degree[] = [
    { id: 1, name: 'Ingeniería de software', durationYears: 4, status: 'ACTIVE' },
    { id: 2, name: 'Administración', durationYears: 3, status: 'INACTIVE' },
  ];

  it('rejects a duplicated degree name for a different record', async () => {
    const validator = uniqueDegreeNameValidator(() => degrees, () => 99);

    const result = await validator({ value: 'Ingeniería de software' } as never);

    expect(result).toEqual({ uniqueName: true });
  });

  it('allows the same name when editing the same degree', async () => {
    const validator = uniqueDegreeNameValidator(() => degrees, () => 1);

    const result = await validator({ value: 'Ingeniería de software' } as never);

    expect(result).toBeNull();
  });

  it('allows a new unique name', async () => {
    const validator = uniqueDegreeNameValidator(() => degrees, () => null);

    const result = await validator({ value: 'Psicología' } as never);

    expect(result).toBeNull();
  });
});
