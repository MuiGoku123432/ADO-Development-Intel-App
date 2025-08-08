import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './placeholder.component.html',
  styleUrl: './placeholder.component.scss'
})
export class PlaceholderComponent {
  @Input() title: string = 'Coming Soon';
  @Input() subtitle: string = 'This feature is under development';
  @Input() icon: string = 'pi pi-cog';
}