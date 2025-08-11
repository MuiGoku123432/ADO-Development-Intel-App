import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';

export type LoadingType = 'spinner' | 'skeleton';
export type LoadingSize = 'small' | 'medium' | 'large';

export interface SkeletonItem {
  shape: 'rectangle' | 'circle';
  size: string;
  width?: string;
  height?: string;
}

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, SkeletonModule],
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {
  @Input() type: LoadingType = 'spinner';
  @Input() size: LoadingSize = 'medium';
  @Input() message?: string;
  @Input() overlay: boolean = false;
  @Input() show: boolean = true;
  @Input() skeletonCount: number = 3;
  @Input() customSkeletons?: SkeletonItem[];

  get spinnerSize(): string {
    switch (this.size) {
      case 'small': return '24px';
      case 'large': return '64px';
      default: return '40px';
    }
  }

  get defaultSkeletons(): SkeletonItem[] {
    if (this.customSkeletons) return this.customSkeletons;
    
    return Array.from({ length: this.skeletonCount }, () => ({
      shape: 'rectangle' as const,
      size: this.skeletonSize,
      width: '100%',
      height: this.skeletonSize
    }));
  }

  get skeletonSize(): string {
    switch (this.size) {
      case 'small': return '32px';
      case 'large': return '64px';
      default: return '48px';
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Static utility methods for creating skeleton layouts
  static createTableSkeletons(rowCount: number = 5, columnCount: number = 6): SkeletonItem[] {
    const skeletons: SkeletonItem[] = [];
    
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < columnCount; col++) {
        let width = '100%';
        
        // Vary widths for more realistic table appearance
        if (col === 0) width = '60px';        // ID column
        else if (col === 1) width = '200px';   // Title column  
        else if (col === 2) width = '100px';   // Type column
        else if (col === 3) width = '120px';   // Status column
        else if (col === 4) width = '80px';    // Priority column
        else width = '140px';                  // Other columns
        
        skeletons.push({
          shape: 'rectangle',
          size: '32px',
          width,
          height: '20px'
        });
      }
    }
    
    return skeletons;
  }

  static createCardSkeletons(cardCount: number = 3): SkeletonItem[] {
    const skeletons: SkeletonItem[] = [];
    
    for (let i = 0; i < cardCount; i++) {
      // Card header (avatar + title)
      skeletons.push({
        shape: 'circle',
        size: '40px'
      });
      skeletons.push({
        shape: 'rectangle',
        size: '20px',
        width: '60%',
        height: '20px'
      });
      
      // Card content lines
      skeletons.push({
        shape: 'rectangle',
        size: '16px',
        width: '100%',
        height: '16px'
      });
      skeletons.push({
        shape: 'rectangle',
        size: '16px',
        width: '80%',
        height: '16px'
      });
    }
    
    return skeletons;
  }
}