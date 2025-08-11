import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './placeholder.component.html',
  styleUrl: './placeholder.component.scss'
})
export class PlaceholderComponent {
  @Input() title: string = 'Coming Soon';
  @Input() subtitle: string = 'This feature is under development';
  @Input() icon: string = 'pi pi-cog';
  @Input() showCard: boolean = true;
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;