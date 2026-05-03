import { Injectable } from '@angular/core';
import { FeatureCollection } from './poi-store.service';
import { ErrorHandlerService } from './error-handler.service';

/**
 * GeoJSON Exporter Service - Exports POI state as downloadable GeoJSON files
 *
 * Responsibilities:
 * - Generate valid GeoJSON FeatureCollection from application state
 * - Format output with 2-space indentation for readability
 * - Trigger browser downloads with timestamp in filename
 * - Ensure all point properties are preserved in export
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */
@Injectable({
  providedIn: 'root',
})
export class GeoJSONExporterService {
  constructor(private errorHandler: ErrorHandlerService) {}

  /**
   * Generate a formatted GeoJSON string from a FeatureCollection
   * Formats with 2-space indentation for readability
   *
   * @param state - The FeatureCollection to stringify
   * @returns Formatted JSON string with 2-space indentation
   */
  stringify(state: FeatureCollection): string {
    return JSON.stringify(state, null, 2);
  }

  /**
   * Export the current state as a downloadable GeoJSON file
   * Triggers browser download with timestamp in filename
   *
   * @param state - The FeatureCollection to export
   */
  export(state: FeatureCollection): void {
    try {
      // Generate formatted GeoJSON string
      const geojsonString = this.stringify(state);

      // Create a Blob from the string
      const blob = new Blob([geojsonString], { type: 'application/geo+json' });

      // Generate filename with timestamp
      const timestamp = this.generateTimestamp();
      const filename = `poi_editor_export_${timestamp}.geojson`;

      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errorHandler.logError(new Error(`Failed to export GeoJSON: ${errorMessage}`));
      console.error('Failed to export GeoJSON:', error);
      throw error;
    }
  }

  /**
   * Generate a timestamp string for use in filenames
   * Format: YYYY-MM-DD_HH-mm-ss
   *
   * @returns Timestamp string
   */
  private generateTimestamp(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }
}
