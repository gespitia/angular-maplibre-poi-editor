import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import type { Notification } from '../types';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeDefined();
  });

  it('should show success notification', async () => {
    service.showSuccess('Test success');

    const notifications = await new Promise<Notification[]>((resolve) => {
      service.getNotifications().subscribe((notifs: Notification[]) => {
        if (notifs.length > 0) {
          resolve(notifs);
        }
      });
    });

    expect(notifications[0].type).toBe('success');
    expect(notifications[0].message).toBe('Test success');
  });

  it('should show error notification', async () => {
    service.showError('Test error');

    const notifications = await new Promise<Notification[]>((resolve) => {
      service.getNotifications().subscribe((notifs: Notification[]) => {
        if (notifs.length > 0) {
          resolve(notifs);
        }
      });
    });

    expect(notifications[0].type).toBe('error');
    expect(notifications[0].message).toBe('Test error');
  });

  it('should show info notification', async () => {
    service.showInfo('Test info');

    const notifications = await new Promise<Notification[]>((resolve) => {
      service.getNotifications().subscribe((notifs: Notification[]) => {
        if (notifs.length > 0) {
          resolve(notifs);
        }
      });
    });

    expect(notifications[0].type).toBe('info');
    expect(notifications[0].message).toBe('Test info');
  });

  it('should show warning notification', async () => {
    service.showWarning('Test warning');

    const notifications = await new Promise<Notification[]>((resolve) => {
      service.getNotifications().subscribe((notifs: Notification[]) => {
        if (notifs.length > 0) {
          resolve(notifs);
        }
      });
    });

    expect(notifications[0].type).toBe('warning');
    expect(notifications[0].message).toBe('Test warning');
  });

  it('should dismiss notification by id', async () => {
    service.showSuccess('Test');

    const notifications = await new Promise<Notification[]>((resolve) => {
      let notificationId: string = '';
      service.getNotifications().subscribe((notifs: Notification[]) => {
        if (notifs.length === 0 && notificationId) {
          resolve(notifs);
        } else if (notifs.length > 0 && !notificationId) {
          notificationId = notifs[0].id;
          service.dismissNotification(notificationId);
        }
      });
    });

    expect(notifications.length).toBe(0);
  });

  it('should clear all notifications', async () => {
    service.showSuccess('Test 1');
    service.showSuccess('Test 2');

    await new Promise((resolve) => setTimeout(resolve, 100));

    service.clearAll();

    const notifications = await new Promise<Notification[]>((resolve) => {
      service.getNotifications().subscribe((notifs: Notification[]) => {
        if (notifs.length === 0) {
          resolve(notifs);
        }
      });
    });

    expect(notifications.length).toBe(0);
  });

  it('should auto-dismiss notification after duration', async () => {
    service.showSuccess('Test', undefined, 100);

    const notifications = await new Promise<Notification[]>((resolve) => {
      service.getNotifications().subscribe((notifs: Notification[]) => {
        if (notifs.length === 0) {
          resolve(notifs);
        }
      });
    });

    expect(notifications.length).toBe(0);
  });

  it('should include details in notification', async () => {
    service.showSuccess('Test', 'Test details');

    const notifications = await new Promise<Notification[]>((resolve) => {
      service.getNotifications().subscribe((notifs: Notification[]) => {
        if (notifs.length > 0) {
          resolve(notifs);
        }
      });
    });

    expect(notifications[0].details).toBe('Test details');
  });

  it('should not auto-dismiss if duration is 0', async () => {
    service.showSuccess('Test', undefined, 0);

    await new Promise((resolve) => setTimeout(resolve, 200));

    const notifications = await new Promise<Notification[]>((resolve) => {
      service.getNotifications().subscribe((notifs: Notification[]) => {
        resolve(notifs);
      });
    });

    expect(notifications.length).toBe(1);
  });
});
