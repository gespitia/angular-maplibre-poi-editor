import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { Feature, PointProperties, FeatureCollection } from '../types';

// Re-export types for backward compatibility
export type { Feature, PointProperties, FeatureCollection };

/**
 * POI Store Service - Manages application state as a GeoJSON FeatureCollection
 *
 * Responsibilities:
 * - Maintain state as a valid GeoJSON FeatureCollection
 * - Emit events when state changes via stateChanged$ Observable
 * - Generate unique IDs (UUID v4) for each point
 * - Provide methods to add, update, delete, and replace points
 * - Preserve all additional properties beyond name and category
 *
 * Validates: Requirements 11.1, 11.2, 11.3
 */
@Injectable({
  providedIn: 'root',
})
export class POIStoreService {
  /**
   * Internal state representing the current collection of POI features
   * @private
   */
  private state: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  /**
   * Subject that manages state changes and emits to subscribers
   * @private
   */
  private stateSubject: BehaviorSubject<FeatureCollection> = new BehaviorSubject<FeatureCollection>(this.state);

  /**
   * Observable that emits whenever the state changes
   * Subscribers receive a deep copy of the current FeatureCollection
   * @type {Observable<FeatureCollection>}
   */
  public stateChanged$: Observable<FeatureCollection> = this.stateSubject.asObservable();

  constructor() {}

  /**
   * Get the current state (read-only)
   * Returns a deep copy to prevent external mutations
   * @returns {FeatureCollection} Current FeatureCollection state
   */
  getState(): FeatureCollection {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Get a specific point by ID
   * Returns a deep copy to prevent external mutations
   * @param {string} id - The unique identifier of the point
   * @returns {Feature | null} The Feature if found, null otherwise
   */
  getPointById(id: string): Feature | null {
    const feature = this.state.features.find((f) => f.id === id);
    return feature ? JSON.parse(JSON.stringify(feature)) : null;
  }

  /**
   * Add a new point to the state
   * Generates a unique UUID v4 identifier for the point
   * @param {[number, number]} coordinates - [longitude, latitude] pair
   * @param {PointProperties} properties - Point properties (name, category, and optional additional properties)
   * @returns {void}
   */
  addPoint(coordinates: [number, number], properties: PointProperties): void {
    const feature: Feature = {
      type: 'Feature',
      id: this.generateUUID(),
      geometry: {
        type: 'Point',
        coordinates,
      },
      properties,
    };

    this.state.features.push(feature);
    this.emitStateChange();
  }

  /**
   * Update properties of an existing point
   * Preserves all additional properties that are not being modified
   * @param {string} id - The unique identifier of the point
   * @param {Partial<PointProperties>} properties - Partial properties to update
   * @returns {void}
   */
  updatePoint(id: string, properties: Partial<PointProperties>): void {
    const feature = this.state.features.find((f) => f.id === id);
    if (!feature) {
      return;
    }

    // Merge new properties with existing ones, preserving additional properties
    feature.properties = {
      ...feature.properties,
      ...properties,
    };

    this.emitStateChange();
  }

  /**
   * Delete a point from the state
   * @param {string} id - The unique identifier of the point
   * @returns {void}
   */
  deletePoint(id: string): void {
    const index = this.state.features.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.state.features.splice(index, 1);
      this.emitStateChange();
    }
  }

  /**
   * Replace the entire state (typically used for importing)
   * Creates a deep copy of the new state to prevent external mutations
   * @param {FeatureCollection} newState - New FeatureCollection to set as state
   * @returns {void}
   */
  setState(newState: FeatureCollection): void {
    this.state = JSON.parse(JSON.stringify(newState));
    this.emitStateChange();
  }

  /**
   * Generate a UUID v4 identifier
   * Uses the standard UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   * @private
   * @returns {string} A unique UUID v4 string
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Emit state change to all subscribers
   * Sends a deep copy of the current state to prevent external mutations
   * @private
   * @returns {void}
   */
  private emitStateChange(): void {
    console.log('POI Store emitting state change with', this.state.features.length, 'features');
    this.stateSubject.next(JSON.parse(JSON.stringify(this.state)));
  }
}
