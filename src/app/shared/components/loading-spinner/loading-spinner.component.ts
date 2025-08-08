import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SkeletonModule } from 'primeng/skeleton';

export type LoadingType = 'spinner' | 'skeleton';
export type LoadingSize = 'small' | 'medium' | 'large';

export interface SkeletonItem {
  shape: 'rectangle' | 'circle';
  size: string;
  borderRadius?: string;
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
export class LoadingSpinnerComponent implements OnInit {
  @Input() type: LoadingType = 'spinner';
  @Input() size: LoadingSize = 'medium';
  @Input() message?: string;
  @Input() overlay: boolean = false;
  @Input() show: boolean = true;
  @Input() strokeWidth?: string;
  @Input() skeletonCount: number = 3;
  @Input() customSkeletons?: SkeletonItem[];

  // Computed properties for PrimeNG components
  spinnerStyle: { [key: string]: string } = {};
  spinnerClass: string = '';
  skeletonItems: SkeletonItem[] = [];

  constructor() {
    console.log('🔄 LoadingSpinnerComponent initialized');
  }

  ngOnInit(): void {
    this.setupSpinnerProperties();
    this.setupSkeletonItems();
  }

  private setupSpinnerProperties(): void {
    // Configure spinner based on size
    switch (this.size) {
      case 'small':
        this.spinnerStyle = { 
          width: '24px', 
          height: '24px'
        };
        this.spinnerClass = 'loading-spinner-small';
        break;
      case 'large':
        this.spinnerStyle = { 
          width: '64px', 
          height: '64px'
        };
        this.spinnerClass = 'loading-spinner-large';
        break;
      default: // medium
        this.spinnerStyle = { 
          width: '40px', 
          height: '40px'
        };
        this.spinnerClass = 'loading-spinner-medium';
        break;
    }

    // Add overlay styles if needed
    if (this.overlay) {
      this.spinnerClass += ' loading-spinner-overlay';
    }
  }

  private setupSkeletonItems(): void {
    if (this.customSkeletons) {
      this.skeletonItems = this.customSkeletons;
      return;
    }

    // Generate default skeleton items based on type and count
    this.skeletonItems = [];
    const baseHeight = this.getSkeletonHeight();
    
    for (let i = 0; i < this.skeletonCount; i++) {
      this.skeletonItems.push({
        shape: 'rectangle',
        size: baseHeight,
        width: '100%',
        height: baseHeight,
        borderRadius: '4px'
      });
    }
  }

  private getSkeletonHeight(): string {
    switch (this.size) {
      case 'small':
        return '32px';
      case 'large':
        return '64px';
      default:
        return '48px';
    }
  }

  /**
   * Create skeleton items for table rows
   */
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
          height: '20px',
          borderRadius: '4px'
        });
      }
    }
    
    return skeletons;
  }

  /**
   * Create skeleton items for card layouts
   */
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
        height: '20px',
        borderRadius: '4px'
      });
      
      // Card content lines
      skeletons.push({
        shape: 'rectangle',
        size: '16px',
        width: '100%',
        height: '16px',
        borderRadius: '4px'
      });
      skeletons.push({
        shape: 'rectangle',
        size: '16px',
        width: '80%',
        height: '16px',
        borderRadius: '4px'
      });
    }
    
    return skeletons;
  }

  /**
   * Track by function for ngFor performance
   */
  trackByIndex(index: number): number {
    return index;
  }

  /**
   * Check if this is a table-specific skeleton layout
   */
  isTableSkeleton(): boolean {
    return this.customSkeletons !== undefined && this.customSkeletons.length > 6;
  }

  /**
   * Organize skeleton items into table rows
   */
  getTableRows(): SkeletonItem[][] {
    if (!this.customSkeletons) {
      return [];
    }

    const rows: SkeletonItem[][] = [];
    const columnsPerRow = 6; // Default table column count
    
    for (let i = 0; i < this.customSkeletons.length; i += columnsPerRow) {
      rows.push(this.customSkeletons.slice(i, i + columnsPerRow));
    }
    
    return rows;
  }
}