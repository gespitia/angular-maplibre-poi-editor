import { Injectable } from '@angular/core';
import type { Feature, FeatureCollection } from '../types/geojson.types';
import type { AppError, ValidationError } from '../types/error.types';
import { NotificationService } from './notification.service';

/**
 * Result of parsing a GeoJSON file
 */
export interface ParseResult {
  validFeatures: Feature[];
  invalidFeatures: InvalidFeature[];
  errors: string[];
}

/**
 * Represents an invalid feature with reason for rejection
 */
export interface InvalidFeature {
  feature: unknown;
  reason: string;
}

/**
 * Error Handler Service - Manages error display and logging
 *
 * Responsibilities:
 * - Display user-friendly error messages
 * - Log errors to browser console for debugging
 * - Show summary of rejected features during import
 * - Provide clear actions (Retry, Cancel) for users
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  constructor(private notificationService: NotificationService) {}

  /**
   * Show error message to user
   * @param message - Main error message to display
   * @param details - Optional detailed error information
   */
  public showError(message: string, details?: string): void {
    // Log to console for debugging
    this.logError(new Error(message));

    // Display to user via notification service
    this.notificationService.showError(message, details, 6000);
  }

  /**
   * Log error to browser console for debugging
   * @param error - Error object to log
   */
  public logError(error: Error): void {
    // Log with timestamp and full stack trace
    const timestamp: string = new Date().toISOString();
    console.error(`[${timestamp}] Error:`, error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Show import summary with rejected features
   * @param result - ParseResult containing valid and invalid features
   */
  public showImportSummary(result: ParseResult): void {
    // If there are no errors, show success message
    if (result.invalidFeatures.length === 0 && result.errors.length === 0) {
      const message: string = `Import successful! ${result.validFeatures.length} features imported.`;
      console.log('SUCCESS:', message);
      this.notificationService.showSuccess('Import successful', message, 4000);
      return;
    }

    // Build summary message
    let summary: string = '';

    // Add general errors
    if (result.errors.length > 0) {
      summary += 'General Errors:\n';
      result.errors.forEach((error: string) => {
        summary += `  • ${error}\n`;
      });
      summary += '\n';
    }

    // Add valid features count
    summary += `Valid features imported: ${result.validFeatures.length}\n`;

    // Add invalid features summary
    if (result.invalidFeatures.length > 0) {
      summary += `\nRejected features: ${result.invalidFeatures.length}\n`;
      summary += 'Reasons:\n';

      // Group invalid features by reason for cleaner display
      const reasonMap: Map<string, number> = new Map<string, number>();
      result.invalidFeatures.forEach((invalid: InvalidFeature) => {
        const reason: string = invalid.reason;
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
      });

      // Display grouped reasons
      reasonMap.forEach((count: number, reason: string) => {
        summary += `  • ${reason} (${count} feature${count > 1 ? 's' : ''})\n`;
      });
    }

    // Log and display summary via notification
    console.warn('IMPORT SUMMARY:', summary);
    this.notificationService.showWarning('Import completed with warnings', summary, 8000);
  }
}
