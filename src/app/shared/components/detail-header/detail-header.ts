import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

export type DetailStatusSeverity = 'success' | 'warn' | 'danger' | 'secondary' | 'info' | 'contrast';

@Component({
  selector: 'app-detail-header',
  standalone: true,
  imports: [ButtonModule, TagModule],
  templateUrl: './detail-header.html',
  styleUrl: './detail-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailHeaderComponent {
  readonly title = input.required<string>();
  readonly recordName = input.required<string>();
  readonly statusLabel = input<string | null>(null);
  readonly statusSeverity = input<DetailStatusSeverity>('secondary');
  readonly backAriaLabel = input<string>('Volver al listado');
  readonly editLabel = input<string | null>(null);
  readonly showEdit = input<boolean>(true);
  readonly headingId = input<string>('detail-page-title');

  readonly back = output<void>();
  readonly edit = output<void>();
}
