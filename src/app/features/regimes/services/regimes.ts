import { Injectable, inject } from '@angular/core';
import { Api } from '../../../core/services/api';
import { Regime } from '../interfaces/regime';

@Injectable({ providedIn: 'root' })
export class Regimes {
  private readonly api = inject(Api);

  getAll() {
    return this.api.get<Regime[]>('regimes');
  }

  create(name: string) {
    return this.api.post<Regime>('regimes', { name });
  }

  update(id: number, name: string) {
    return this.api.patch<Regime>(`regimes/${id}`, { name });
  }

  delete(id: number) {
    return this.api.delete<Regime>(`regimes/${id}`);
  }
}
