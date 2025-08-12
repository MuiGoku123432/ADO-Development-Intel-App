import { Injectable } from '@angular/core';

export type TagSeverity = 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast';

@Injectable({
  providedIn: 'root'
})
export class DisplayHelpersService {

  constructor() {
    console.log('🎨 DisplayHelpersService initialized');
  }

  /**
   * Get priority label for work items
   */
  getPriorityLabel(priority?: number): string {
    switch (priority) {
      case 1: return 'Critical';
      case 2: return 'High';
      case 3: return 'Medium';
      case 4: return 'Low';
      default: return 'None';
    }
  }

  /**
   * Get priority severity for PrimeNG tags
   */
  getPrioritySeverity(priority?: number): TagSeverity {
    switch (priority) {
      case 1: return 'danger';    // Critical
      case 2: return 'warning';   // High
      case 3: return 'info';      // Medium
      case 4: return 'secondary'; // Low
      default: return 'secondary';
    }
  }

  /**
   * Get state severity for PrimeNG tags
   */
  getStateSeverity(state?: string): TagSeverity {
    switch (state?.toLowerCase()) {
      case 'done':
      case 'closed':
      case 'resolved':
        return 'success';
      case 'active':
      case 'in progress':
      case 'in-progress':
      case 'committed':
        return 'warning';
      case 'new':
      case 'to do':
      case 'proposed':
        return 'info';
      case 'removed':
      case 'cut':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Get work item type severity for PrimeNG tags
   */
  getWorkItemTypeSeverity(type?: string): TagSeverity {
    switch (type?.toLowerCase()) {
      case 'bug':
        return 'danger';
      case 'user story':
      case 'story':
        return 'info';
      case 'task':
        return 'success';
      case 'feature':
        return 'warning';
      case 'epic':
        return 'contrast';
      default:
        return 'secondary';
    }
  }

  /**
   * Format relative time for display
   */
  getRelativeTime(date?: string): string {
    if (!date) return '-';
    
    const now = new Date();
    const itemDate = new Date(date);
    const diffMs = now.getTime() - itemDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 7) {
      return itemDate.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Truncate text with ellipsis
   */
  truncateText(text?: string, maxLength: number = 50): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  /**
   * Get initials from display name
   */
  getInitials(displayName?: string): string {
    if (!displayName) return '?';
    
    const words = displayName.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  /**
   * Format story points for display
   */
  formatStoryPoints(points?: number): string {
    if (!points || points === 0) return '-';
    return points.toString();
  }

  /**
   * Get avatar background color based on name
   */
  getAvatarColor(name?: string): string {
    if (!name) return 'var(--surface-300)';
    
    const colors = [
      'var(--blue-500)',
      'var(--green-500)',
      'var(--orange-500)',
      'var(--purple-500)',
      'var(--pink-500)',
      'var(--teal-500)',
      'var(--indigo-500)',
      'var(--cyan-500)'
    ];
    
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }
}