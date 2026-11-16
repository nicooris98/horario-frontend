import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';

@Component({
  selector: 'app-row-actions',
  standalone: true,
  imports: [ButtonModule, MenuModule],
  templateUrl: './row-actions.html',
  styleUrl: './row-actions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RowActionsComponent {
  readonly viewAriaLabel = input<string>('Ver detalle');
  readonly menuAriaLabel = input<string>('Más acciones');
  readonly actions = input<MenuItem[]>([]);
  readonly showView = input<boolean>(true);

  readonly view = output<void>();

  openMenu(event: Event, menu: Menu): void {
    event.stopPropagation();
    menu.toggle(event);
  }
}
