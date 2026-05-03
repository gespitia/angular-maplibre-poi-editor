import { Injectable } from '@angular/core';
import { ErrorHandlerService } from './error-handler.service';
import type { FeatureCollection, Feature } from '../types/geojson.types';
import { isFeatureCollection, isFeature } from '../types/guards';

/**
 * Persistence Manager Service - Manages saving and restoring application state from localStorage
 *
 * Responsibilities:
 * - Save FeatureCollection state to localStorage with key "poi_editor_state"
 * - Restore FeatureCollection state from localStorage
 * - Validate restored data before loading
 * - Clear localStorage when needed
 * - Handle localStorage errors gracefully
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */
@Injectable({
  providedIn: 'root',
})
export class PersistenceManagerService {
  private readonly STORAGE_KEY = 'poi_editor_state';

  constructor(private errorHandler: ErrorHandlerService) {}

  /**
   * Save the current state to localStorage
   * Serializes the FeatureCollection as JSON
   *
   * @param state - The FeatureCollection to save
   * @throws Error if localStorage is not available or quota exceeded
   */
  save(state: FeatureCollection): void {
    try {
      const serialized = JSON.stringify(state);
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errorHandler.logError(new Error(`Failed to save state to localStorage: ${errorMessage}`));
      console.error('Failed to save state to localStorage:', error);
    }
  }

  /**
   * Restore the state from localStorage
   * Validates the restored data before returning
   *
   * @returns The restored FeatureCollection if valid, null if not found or invalid
   */
  restore(): FeatureCollection | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);

      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);

      // Validate the restored data
      if (!this.isValidFeatureCollection(parsed)) {
        this.errorHandler.logError(new Error('Stored data is not a valid FeatureCollection'));
        console.warn('Stored data is not a valid FeatureCollection');
        return null;
      }

      return parsed as FeatureCollection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errorHandler.logError(new Error(`Failed to restore state from localStorage: ${errorMessage}`));
      console.error('Failed to restore state from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear the stored state from localStorage
   */
  clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errorHandler.logError(new Error(`Failed to clear localStorage: ${errorMessage}`));
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Validate that an object is a valid FeatureCollection
   * Uses type guard to check structure and validate all features
   *
   * @param data - The data to validate (unknown type for safety)
   * @returns true if valid FeatureCollection, false otherwise
   */
  private isValidFeatureCollection(data: unknown): data is FeatureCollection {
    if (!isFeatureCollection(data)) {
      return false;
    }

    // Validate each feature in the collection
    for (const feature of data.features) {
      if (!isFeature(feature)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate that an object is a valid Feature
   * Uses type guard to check structure and properties
   *
   * @param feature - The feature to validate (unknown type for safety)
   * @returns true if valid Feature, false otherwise
   */
  private isValidFeature(feature: unknown): feature is Feature {
    return isFeature(feature);
  }
}
