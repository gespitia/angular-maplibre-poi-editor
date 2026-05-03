import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { Notification, NotificationType } from '../types';

/**
 * Notification Service - Manages toast notifications and visual feedback
 *
 * Responsibilities:
 * - Display success messages
 * - Display error messages
 * - Display info messages
 * - Display warning messages
 * - Auto-dismiss notifications after timeout
 * - Provide Observable stream of notifications
 *
 * Validates: Requirements 12.4
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  /**
   * Observable stream of notifications
   * @private
   */
  private readonly notifications$: BehaviorSubject<Notification[]> =
    new BehaviorSubject<Notification[]>([]);

  /**
   * Counter for generating unique notification IDs
   * @private
   */
  private notificationIdCounter: number = 0;

  /**
   * Map to track timeout IDs for auto-dismiss functionality
   * @private
   */
  private timeoutMap: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * Get notifications observable
   * @returns Observable stream of current notifications
   */
  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  /**
   * Show success notification
   * @param message - Success message to display
   * @param details - Optional additional details
   * @param duration - Auto-dismiss duration in milliseconds (default: 4000)
   */
  showSuccess(message: string, details?: string, duration: number = 4000): void {
    this.addNotification({
      type: 'success',
      message,
      details,
      duration,
    });
  }

  /**
   * Show error notification
   * @param message - Error message to display
   * @param details - Optional additional details
   * @param duration - Auto-dismiss duration in milliseconds (default: 6000)
   */
  showError(message: string, details?: string, duration: number = 6000): void {
    this.addNotification({
      type: 'error',
      message,
      details,
      duration,
    });
  }

  /**
   * Show info notification
   * @param message - Info message to display
   * @param details - Optional additional details
   * @param duration - Auto-dismiss duration in milliseconds (default: 4000)
   */
  showInfo(message: string, details?: string, duration: number = 4000): void {
    this.addNotification({
      type: 'info',
      message,
      details,
      duration,
    });
  }

  /**
   * Show warning notification
   * @param message - Warning message to display
   * @param details - Optional additional details
   * @param duration - Auto-dismiss duration in milliseconds (default: 5000)
   */
  showWarning(message: string, details?: string, duration: number = 5000): void {
    this.addNotification({
      type: 'warning',
      message,
      details,
      duration,
    });
  }

  /**
   * Add notification to the list
   * @param notification - Notification to add (without id)
   * @private
   */
  private addNotification(
    notification: Omit<Notification, 'id'>
  ): void {
    const id: string = `notification-${++this.notificationIdCounter}`;
    const fullNotification: Notification = {
      ...notification,
      id,
    };

    // Add notification to list
    const current: Notification[] = this.notifications$.value;
    this.notifications$.next([...current, fullNotification]);

    // Auto-dismiss if duration is set and greater than 0
    if (fullNotification.duration && fullNotification.duration > 0) {
      const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
        this.dismissNotification(id);
      }, fullNotification.duration);

      this.timeoutMap.set(id, timeoutId);
    }
  }

  /**
   * Dismiss notification by id
   * @param id - Notification id to dismiss
   */
  dismissNotification(id: string): void {
    // Clear timeout if exists
    const timeoutId: ReturnType<typeof setTimeout> | undefined = this.timeoutMap.get(id);
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.timeoutMap.delete(id);
    }

    // Remove notification from list
    const current: Notification[] = this.notifications$.value;
    this.notifications$.next(current.filter((n: Notification) => n.id !== id));
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    // Clear all pending timeouts
    this.timeoutMap.forEach((timeoutId: ReturnType<typeof setTimeout>) => {
      clearTimeout(timeoutId);
    });
    this.timeoutMap.clear();

    // Clear notifications
    this.notifications$.next([]);
  }
}
