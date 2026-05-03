import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandlerService } from './error-handler.service';
import { NotificationService } from './notification.service';
import { ParseResult } from './geojson-parser.service';

describe('ErrorHandlerService', () => {
  let service: ErrorHandlerService;
  let notificationService: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ErrorHandlerService, NotificationService],
    });
    service = TestBed.inject(ErrorHandlerService);
    notificationService = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showError', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let notificationErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      notificationErrorSpy = vi.spyOn(notificationService, 'showError').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      notificationErrorSpy.mockRestore();
    });

    it('should display error message to user', () => {
      const message = 'Test error message';
      service.showError(message);

      expect(notificationErrorSpy).toHaveBeenCalledWith(message, undefined, 6000);
    });

    it('should include details in error message when provided', () => {
      const message = 'Test error message';
      const details = 'Additional error details';
      service.showError(message, details);

      expect(notificationErrorSpy).toHaveBeenCalledWith(message, details, 6000);
    });

    it('should log error to console', () => {
      const message = 'Test error message';
      service.showError(message);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const calls = consoleErrorSpy.mock.calls as any[];
      expect(calls.some((call: any) => call[1] === message)).toBe(true);
    });

    it('should handle error messages with special characters', () => {
      const message = 'Error: Invalid JSON\n\nExpected: {}\nGot: [';
      service.showError(message);

      expect(notificationErrorSpy).toHaveBeenCalledWith(message, undefined, 6000);
    });

    it('should handle very long error messages', () => {
      const message = 'A'.repeat(1000);
      service.showError(message);

      expect(notificationErrorSpy).toHaveBeenCalledWith(message, undefined, 6000);
    });

    it('should handle empty details string', () => {
      const message = 'Test error';
      const details = '';
      service.showError(message, details);

      // Empty details should still be passed
      expect(notificationErrorSpy).toHaveBeenCalledWith(message, details, 6000);
    });
  });

  describe('logError', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log error message to console', () => {
      const error = new Error('Test error');
      service.logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const calls = consoleErrorSpy.mock.calls as any[];
      expect(calls.some((call: any) => call[1] === 'Test error')).toBe(true);
    });

    it('should include timestamp in log', () => {
      const error = new Error('Test error');
      service.logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const calls = consoleErrorSpy.mock.calls as any[];
      const hasTimestamp = calls.some((call: any) => {
        const arg = call[0];
        return typeof arg === 'string' && arg.includes('[') && arg.includes(']');
      });
      expect(hasTimestamp).toBe(true);
    });

    it('should log stack trace when available', () => {
      const error = new Error('Test error');
      service.logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const calls = consoleErrorSpy.mock.calls as any[];
      expect(calls.some((call: any) => call[0] === 'Stack trace:')).toBe(true);
    });

    it('should handle errors with custom messages', () => {
      const error = new Error('Custom error: Invalid coordinate');
      service.logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const calls = consoleErrorSpy.mock.calls as any[];
      expect(calls.some((call: any) => call[1] === 'Custom error: Invalid coordinate')).toBe(true);
    });
  });

  describe('showImportSummary', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let notificationSuccessSpy: ReturnType<typeof vi.spyOn>;
    let notificationWarningSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      notificationSuccessSpy = vi.spyOn(notificationService, 'showSuccess').mockImplementation(() => {});
      notificationWarningSpy = vi.spyOn(notificationService, 'showWarning').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      notificationSuccessSpy.mockRestore();
      notificationWarningSpy.mockRestore();
    });

    it('should show success message when all features are valid', () => {
      const result: ParseResult = {
        validFeatures: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Test', category: 'Test' },
          },
        ],
        invalidFeatures: [],
        errors: [],
      };

      service.showImportSummary(result);

      expect(notificationSuccessSpy).toHaveBeenCalled();
      const call = notificationSuccessSpy.mock.calls[0];
      expect(call[1]).toContain('1 features imported');
    });

    it('should show summary with rejected features', () => {
      const result: ParseResult = {
        validFeatures: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Valid', category: 'Test' },
          },
        ],
        invalidFeatures: [
          {
            feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] } },
            reason: 'Longitude out of range',
          },
        ],
        errors: [],
      };

      service.showImportSummary(result);

      expect(notificationWarningSpy).toHaveBeenCalled();
      const call = notificationWarningSpy.mock.calls[0];
      const message = call[1];
      expect(message).toContain('Valid features imported: 1');
      expect(message).toContain('Rejected features: 1');
      expect(message).toContain('Longitude out of range');
    });

    it('should show general errors in summary', () => {
      const result: ParseResult = {
        validFeatures: [],
        invalidFeatures: [],
        errors: ['Invalid JSON format', 'Missing FeatureCollection'],
      };

      service.showImportSummary(result);

      expect(notificationWarningSpy).toHaveBeenCalled();
      const call = notificationWarningSpy.mock.calls[0];
      const message = call[1];
      expect(message).toContain('General Errors');
      expect(message).toContain('Invalid JSON format');
      expect(message).toContain('Missing FeatureCollection');
    });

    it('should group invalid features by reason', () => {
      const result: ParseResult = {
        validFeatures: [],
        invalidFeatures: [
          {
            feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] } },
            reason: 'Longitude out of range',
          },
          {
            feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [180, 100] } },
            reason: 'Longitude out of range',
          },
          {
            feature: { type: 'Feature', geometry: { type: 'LineString' } },
            reason: 'Only Point geometries are supported',
          },
        ],
        errors: [],
      };

      service.showImportSummary(result);

      expect(notificationWarningSpy).toHaveBeenCalled();
      const call = notificationWarningSpy.mock.calls[0];
      const message = call[1];
      expect(message).toContain('Longitude out of range (2 features)');
      expect(message).toContain('Only Point geometries are supported (1 feature)');
    });

    it('should handle empty import result', () => {
      const result: ParseResult = {
        validFeatures: [],
        invalidFeatures: [],
        errors: [],
      };

      service.showImportSummary(result);

      expect(notificationSuccessSpy).toHaveBeenCalled();
      const call = notificationSuccessSpy.mock.calls[0];
      expect(call[1]).toContain('0 features imported');
    });

    it('should handle large number of rejected features', () => {
      const invalidFeatures = Array.from({ length: 100 }, (_, i) => ({
        feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] } },
        reason: 'Longitude out of range',
      }));

      const result: ParseResult = {
        validFeatures: [],
        invalidFeatures,
        errors: [],
      };

      service.showImportSummary(result);

      expect(notificationWarningSpy).toHaveBeenCalled();
      const call = notificationWarningSpy.mock.calls[0];
      const message = call[1];
      expect(message).toContain('Rejected features: 100');
      expect(message).toContain('Longitude out of range (100 features)');
    });

    it('should handle multiple different rejection reasons', () => {
      const result: ParseResult = {
        validFeatures: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Valid', category: 'Test' },
          },
        ],
        invalidFeatures: [
          {
            feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] } },
            reason: 'Longitude out of range',
          },
          {
            feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 100] } },
            reason: 'Latitude out of range',
          },
          {
            feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0], properties: {} } },
            reason: 'Missing required property: name',
          },
        ],
        errors: [],
      };

      service.showImportSummary(result);

      expect(notificationWarningSpy).toHaveBeenCalled();
      const call = notificationWarningSpy.mock.calls[0];
      const message = call[1];
      expect(message).toContain('Valid features imported: 1');
      expect(message).toContain('Rejected features: 3');
      expect(message).toContain('Longitude out of range');
      expect(message).toContain('Latitude out of range');
      expect(message).toContain('Missing required property: name');
    });

    it('should display singular "feature" for single rejected feature', () => {
      const result: ParseResult = {
        validFeatures: [],
        invalidFeatures: [
          {
            feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] } },
            reason: 'Longitude out of range',
          },
        ],
        errors: [],
      };

      service.showImportSummary(result);

      expect(notificationWarningSpy).toHaveBeenCalled();
      const call = notificationWarningSpy.mock.calls[0];
      const message = call[1];
      expect(message).toContain('(1 feature)');
      expect(message).not.toContain('(1 features)');
    });

    it('should display plural "features" for multiple rejected features', () => {
      const result: ParseResult = {
        validFeatures: [],
        invalidFeatures: [
          {
            feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] } },
            reason: 'Longitude out of range',
          },
          {
            feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [180, 100] } },
            reason: 'Longitude out of range',
          },
        ],
        errors: [],
      };

      service.showImportSummary(result);

      expect(notificationWarningSpy).toHaveBeenCalled();
      const call = notificationWarningSpy.mock.calls[0];
      const message = call[1];
      expect(message).toContain('(2 features)');
    });

    it('should log summary to console', () => {
      const result: ParseResult = {
        validFeatures: [
          {
            type: 'Feature',
            id: '1',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Test', category: 'Test' },
          },
        ],
        invalidFeatures: [],
        errors: [],
      };

      service.showImportSummary(result);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log warning for import with errors', () => {
      const result: ParseResult = {
        validFeatures: [],
        invalidFeatures: [
          {
            feature: { type: 'Feature', geometry: { type: 'Point', coordinates: [200, 0] } },
            reason: 'Longitude out of range',
          },
        ],
        errors: [],
      };

      service.showImportSummary(result);

      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });
});

