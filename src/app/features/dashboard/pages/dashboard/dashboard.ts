import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {}
