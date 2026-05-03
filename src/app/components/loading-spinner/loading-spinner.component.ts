import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * LoadingSpinnerComponent - Display loading indicator
 *
 * Responsibilities:
 * - Display loading spinner
 * - Show loading message
 * - Provide visual feedback during async operations
 *
 * Validates: Requirements 12.4
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `@if (isLoading) {
  <div class="spinner-overlay" role="status" aria-label="Loading">
    <div class="spinner-container">
      <div class="spinner"></div>
      @if (message) {
        <p class="spinner-message">{{ message }}</p>
      }
    </div>
  </div>
}`,
  styles: [`
    .spinner-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1500;
    }

    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .spinner-message {
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      margin: 0;
      text-align: center;
    }
  `],
})
export class LoadingSpinnerComponent {
  @Input() isLoading = false;
  @Input() message = '';
}
