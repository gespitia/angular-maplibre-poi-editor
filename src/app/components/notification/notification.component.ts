import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';
import type { Notification } from '../../types';

/**
 * NotificationComponent - Display toast notifications
 *
 * Responsibilities:
 * - Display notifications from NotificationService
 * - Show success, error, info, and warning messages
 * - Auto-dismiss notifications
 * - Allow manual dismissal
 * - Provide visual feedback with icons and colors
 *
 * Validates: Requirements 12.4
 */
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="notification-container" role="region" aria-live="polite" aria-label="Notifications">
  @for (notification of notifications; track notification.id) {
    <div
      class="notification"
      [class]="'notification-' + notification.type"
      role="alert"
      [attr.aria-label]="notification.message"
    >
      <div class="notification-icon">
        @switch (notification.type) {
          @case ('success') {
            <span class="icon">✓</span>
          }
          @case ('error') {
            <span class="icon">✕</span>
          }
          @case ('info') {
            <span class="icon">ℹ</span>
          }
          @case ('warning') {
            <span class="icon">⚠</span>
          }
        }
      </div>
      <div class="notification-content">
        <div class="notification-message">{{ notification.message }}</div>
        @if (notification.details) {
          <div class="notification-details">{{ notification.details }}</div>
        }
      </div>
      <button
        class="notification-close"
        (click)="onDismiss(notification.id)"
        title="Dismiss"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  }
</div>`,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      pointer-events: none;
    }

    .notification {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
      pointer-events: auto;
      background-color: #ffffff;
      border-left: 4px solid #3b82f6;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notification-success {
      border-left-color: #10b981;
      background-color: #f0fdf4;
    }

    .notification-error {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }

    .notification-info {
      border-left-color: #3b82f6;
      background-color: #f0f9ff;
    }

    .notification-warning {
      border-left-color: #f59e0b;
      background-color: #fffbeb;
    }

    .notification-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-weight: bold;
      font-size: 14px;
    }

    .notification-success .notification-icon {
      background-color: #10b981;
      color: #ffffff;
    }

    .notification-error .notification-icon {
      background-color: #ef4444;
      color: #ffffff;
    }

    .notification-info .notification-icon {
      background-color: #3b82f6;
      color: #ffffff;
    }

    .notification-warning .notification-icon {
      background-color: #f59e0b;
      color: #ffffff;
    }

    .notification-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .notification-message {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      line-height: 1.4;
    }

    .notification-details {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    }

    .notification-close {
      flex-shrink: 0;
      background: none;
      border: none;
      font-size: 16px;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .notification-close:hover {
      background-color: rgba(0, 0, 0, 0.05);
      color: #4b5563;
    }

    .notification-close:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `],
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {}

  /**
   * Initialize component
   * - Subscribe to notifications
   */
  ngOnInit(): void {
    this.notificationService
      .getNotifications()
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notifications = notifications;
      });
  }

  /**
   * Dismiss notification
   * @param id - Notification id
   */
  onDismiss(id: string): void {
    this.notificationService.dismissNotification(id);
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
