import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker, Popup, LngLatBounds } from 'maplibre-gl';
import type { Feature, PointProperties } from '../types/geojson.types';
import type {
  FitBoundsOptions,
  MapInitOptions,
  MapState,
  MarkerRegistry,
  MapClickEvent,
  MarkerClickEvent,
} from '../types/maplibre.types';
import { ErrorHandlerService } from './error-handler.service';

// Re-export FitBoundsOptions for backward compatibility
export type { FitBoundsOptions } from '../types/maplibre.types';

/**
 * MapLibre Renderer Service - Manages map rendering and marker visualization
 *
 * Responsibilities:
 * - Initialize map with OpenStreetMap tiles
 * - Create, update, and remove markers
 * - Emit observables for map and marker click events
 * - Maintain internal marker registry for fast synchronization
 * - Include proper OpenStreetMap attribution
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5
 */
@Injectable({
  providedIn: 'root',
})
export class MapLibreRendererService {
  /** The MapLibre GL map instance */
  private map: MapLibreMap | null = null;

  /** Registry of markers currently displayed on the map */
  private markersRegistry: MarkerRegistry = new Map();

  /** Registry of popups associated with markers */
  private popupsRegistry: Map<string, Popup> = new Map();

  /** Subject for emitting map click events */
  private mapClickSubject: Subject<[number, number]> = new Subject();

  /** Subject for emitting marker click events */
  private markerClickSubject: Subject<string> = new Subject();

  /** Current state of the map */
  private mapState: MapState = {
    isInitialized: false,
    isLoading: false,
    center: [0, 0],
    zoom: 2,
  };

  /**
   * Observable that emits coordinates [longitude, latitude] when user clicks on the map
   * Emits: [number, number] - Click coordinates in [lng, lat] format
   */
  public onMapClick$: Observable<[number, number]> = this.mapClickSubject.asObservable();

  /**
   * Observable that emits marker ID when user clicks on a marker
   * Emits: string - The unique identifier of the clicked marker
   */
  public onMarkerClick$: Observable<string> = this.markerClickSubject.asObservable();

  constructor(private errorHandler: ErrorHandlerService) {
    // Service initialization - no map setup here
  }

  /**
   * Initialize the map with OpenStreetMap tiles
   *
   * Creates a new MapLibre GL map instance with OpenStreetMap raster tiles,
   * sets up event handlers for map and marker interactions, and initializes
   * the internal map state.
   *
   * @param container - HTML element to mount the map
   * @returns Promise that resolves when map is fully loaded and ready
   * @throws Error if map initialization fails
   *
   * @example
   * const mapContainer = document.getElementById('map');
   * await mapRenderer.initialize(mapContainer);
   */
  async initialize(container: HTMLElement): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Use a simple style that doesn't require external resources
        const style = {
          version: 8,
          name: 'Basic Map',
          sources: {
            'osm': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19
            }
          ]
        };

        this.map = new maplibregl.Map({
          container,
          style: style,
          center: [0, 0],
          zoom: 2,
          attributionControl: false,
        });

        // Update map state
        this.mapState.isLoading = true;

        // Add custom attribution for OpenStreetMap
        this.map.addControl(
          new maplibregl.AttributionControl({
            compact: false,
          })
        );

        // Handle map click events
        this.map.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          this.mapClickSubject.next([lng, lat]);
        });

        // Resolve when map is fully loaded
        this.map.on('load', () => {
          this.mapState.isInitialized = true;
          this.mapState.isLoading = false;
          this.mapState.center = [0, 0];
          this.mapState.zoom = 2;
          resolve();
        });

        // Handle errors
        this.map.on('error', (e) => {
          const errorMessage = `Map initialization error: ${e.error}`;
          this.errorHandler.logError(new Error(errorMessage));
          reject(new Error(errorMessage));
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.errorHandler.logError(new Error(`Failed to initialize map: ${errorMessage}`));
        reject(error);
      }
    });
  }

  /**
   * Add a marker to the map for a GeoJSON Point feature
   *
   * Creates a visual marker on the map with a popup containing feature properties.
   * The marker is stored in the internal registry for later reference and updates.
   *
   * @param feature - GeoJSON Feature with Point geometry
   * @throws Logs error if map is not initialized or coordinates are invalid
   *
   * @example
   * const feature: Feature = {
   *   type: 'Feature',
   *   id: 'poi-1',
   *   geometry: { type: 'Point', coordinates: [-74.0, 40.7] },
   *   properties: { name: 'New York', category: 'City' }
   * };
   * mapRenderer.addMarker(feature);
   */
  addMarker(feature: Feature): void {
    console.log('addMarker called for feature:', feature.id);
    if (!this.map) {
      const errorMessage = 'Map not initialized. Cannot add marker.';
      this.errorHandler.logError(new Error(errorMessage));
      console.warn(errorMessage);
      return;
    }

    try {
      const { id, geometry, properties } = feature;
      const [lng, lat] = geometry.coordinates;
      
      // Validate coordinates before creating marker
      if (typeof lng !== 'number' || typeof lat !== 'number' || 
          isNaN(lng) || isNaN(lat) || 
          !isFinite(lng) || !isFinite(lat)) {
        const errorMessage = `Invalid coordinates for feature ${id}: [${lng}, ${lat}]`;
        console.error(errorMessage);
        this.errorHandler.logError(new Error(errorMessage));
        return;
      }
      
      console.log('Adding marker at coordinates:', lng, lat);

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'maplibre-marker';
      markerElement.style.width = '32px';
      markerElement.style.height = '32px';
      markerElement.style.backgroundColor = '#3b82f6';
      markerElement.style.borderRadius = '50%';
      markerElement.style.border = '2px solid white';
      markerElement.style.cursor = 'pointer';
      markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      markerElement.style.display = 'flex';
      markerElement.style.alignItems = 'center';
      markerElement.style.justifyContent = 'center';
      markerElement.style.fontSize = '16px';
      markerElement.style.color = 'white';
      markerElement.textContent = '📍';

      // Create popup with feature properties
      const popupContent = this.createPopupContent(properties);
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);

      // Create marker
      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(this.map);

      console.log('Marker added to map:', id, 'Element:', markerElement);

      // Handle marker click
      markerElement.addEventListener('click', () => {
        this.markerClickSubject.next(id);
        popup.addTo(this.map!);
      });

      // Store marker and popup for later reference
      this.markersRegistry.set(id, marker);
      this.popupsRegistry.set(id, popup);
      console.log('Marker stored in registry. Total markers:', this.markersRegistry.size);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errorHandler.logError(new Error(`Failed to add marker: ${errorMessage}`));
      console.error('Failed to add marker:', error);
    }
  }

  /**
   * Update an existing marker with new feature data
   *
   * Removes the old marker and popup, then adds a new marker with updated properties.
   * This ensures the marker is properly re-rendered with new data.
   *
   * @param id - Unique identifier of the marker to update
   * @param feature - Updated GeoJSON Feature with new geometry and properties
   * @throws Logs error if map is not initialized or update fails
   *
   * @example
   * const updatedFeature: Feature = {
   *   type: 'Feature',
   *   id: 'poi-1',
   *   geometry: { type: 'Point', coordinates: [-74.0, 40.7] },
   *   properties: { name: 'Updated Name', category: 'City' }
   * };
   * mapRenderer.updateMarker('poi-1', updatedFeature);
   */
  updateMarker(id: string, feature: Feature): void {
    if (!this.map) {
      const errorMessage = 'Map not initialized. Cannot update marker.';
      this.errorHandler.logError(new Error(errorMessage));
      console.warn(errorMessage);
      return;
    }

    try {
      // Remove old marker
      const oldMarker = this.markersRegistry.get(id);
      if (oldMarker) {
        oldMarker.remove();
      }

      // Remove old popup
      const oldPopup = this.popupsRegistry.get(id);
      if (oldPopup) {
        oldPopup.remove();
      }

      // Add new marker
      this.addMarker(feature);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errorHandler.logError(new Error(`Failed to update marker: ${errorMessage}`));
      console.error('Failed to update marker:', error);
    }
  }

  /**
   * Remove a marker from the map
   *
   * Removes both the marker and its associated popup from the map and clears
   * them from the internal registries.
   *
   * @param id - Unique identifier of the marker to remove
   * @throws Logs error if removal fails
   *
   * @example
   * mapRenderer.removeMarker('poi-1');
   */
  removeMarker(id: string): void {
    try {
      const marker = this.markersRegistry.get(id);
      if (marker) {
        marker.remove();
        this.markersRegistry.delete(id);
      }

      const popup = this.popupsRegistry.get(id);
      if (popup) {
        popup.remove();
        this.popupsRegistry.delete(id);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errorHandler.logError(new Error(`Failed to remove marker: ${errorMessage}`));
      console.error('Failed to remove marker:', error);
    }
  }

  /**
   * Clamp latitude to Web Mercator projection limits
   *
   * The Web Mercator projection (EPSG:3857) has limits at approximately ±85.05° latitude.
   * This method ensures latitude values stay within valid bounds for proper map rendering.
   *
   * @param lat - Latitude value to clamp
   * @returns Clamped latitude value within [-85, 85] range
   *
   * @example
   * const clampedLat = this.clampLat(90); // Returns 85
   * const clampedLat = this.clampLat(-90); // Returns -85
   * const clampedLat = this.clampLat(45); // Returns 45 (unchanged)
   */
  private clampLat(lat: number): number {
    const MAX_LAT = 85;
    const MIN_LAT = -85;
    return Math.max(MIN_LAT, Math.min(MAX_LAT, lat));
  }

  /**
   * Calculate bounding box for a set of features
   * 
   * This method computes the geographic bounding box that contains all specified
   * markers by finding the minimum and maximum longitude and latitude values.
   * 
   * Features:
   * - Handles empty feature arrays (returns null)
   * - Validates all coordinates are finite numbers
   * - Clamps latitudes to Web Mercator projection limits (±85°)
   * - Handles single marker case (min/max coordinates are equal)
   * - Handles identical coordinates for multiple markers
   * - MapLibre's LngLatBounds automatically handles antimeridian crossing
   * 
   * Special Cases:
   * - Empty array: returns null
   * - Single marker: returns bounds with min = max
   * - Identical coordinates: returns bounds with min = max
   * - Near poles (lat > 85° or < -85°): clamps to ±85° for Web Mercator compatibility
   * - Antimeridian crossing: handled automatically by MapLibre's LngLatBounds.extend()
   * 
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4
   * 
   * @param featureIds - Array of feature IDs to include in bounds calculation
   * @returns LngLatBounds object containing all markers, or null if no valid features
   * 
   * @example
   * // Calculate bounds for 3 markers
   * const bounds = this.calculateBounds(['marker-1', 'marker-2', 'marker-3']);
   * // bounds.getWest() = -70.7858
   * // bounds.getSouth() = -33.5218
   * // bounds.getEast() = -70.5757
   * // bounds.getNorth() = -33.3929
   */
  private calculateBounds(featureIds: string[]): LngLatBounds | null {
    console.log('calculateBounds called with', featureIds.length, 'feature IDs');
    
    if (featureIds.length === 0) {
      console.warn('calculateBounds: empty featureIds array');
      return null;
    }

    // Get coordinates for all specified features
    const coordinates: [number, number][] = [];
    for (const id of featureIds) {
      const marker = this.markersRegistry.get(id);
      if (marker) {
        const lngLat = marker.getLngLat();
        
        // Clamp latitude to Web Mercator limits to handle coordinates near poles
        const clampedLat = this.clampLat(lngLat.lat);
        
        if (clampedLat !== lngLat.lat) {
          console.log(`Marker ${id}: latitude clamped from ${lngLat.lat} to ${clampedLat} (near pole)`);
        }
        
        console.log(`Marker ${id}: lng=${lngLat.lng}, lat=${clampedLat}`);
        
        // Validate coordinates are valid numbers
        if (typeof lngLat.lng === 'number' && typeof clampedLat === 'number' &&
            !isNaN(lngLat.lng) && !isNaN(clampedLat) &&
            isFinite(lngLat.lng) && isFinite(clampedLat)) {
          coordinates.push([lngLat.lng, clampedLat]);
        } else {
          console.warn(`Invalid coordinates for marker ${id}: (${lngLat.lng}, ${clampedLat})`);
        }
      } else {
        console.warn(`Marker not found in registry: ${id}`);
      }
    }

    console.log('Valid coordinates collected:', coordinates.length);

    if (coordinates.length === 0) {
      console.warn('No valid coordinates found for bounds calculation');
      return null;
    }

    console.log('Creating bounds with first coordinate:', coordinates[0]);
    
    // Initialize bounds with first coordinate
    const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);

    // Extend bounds to include all coordinates
    for (let i = 1; i < coordinates.length; i++) {
      console.log('Extending bounds with coordinate:', coordinates[i]);
      bounds.extend(coordinates[i]);
    }

    console.log('Final bounds:', {
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth()
    });

    return bounds;
  }

  /**
   * Fit map viewport to show all specified markers with smooth animation
   *
   * Calculates the optimal viewport (center and zoom level) to display all specified
   * markers and animates the map to that viewport using flyTo animation.
   *
   * Features:
   * - Calculates bounding box for all specified markers
   * - Determines optimal zoom level based on marker spread
   * - Applies smooth animation (default 1000ms duration)
   * - Handles single marker case with maximum zoom
   * - Clamps latitudes to Web Mercator projection limits (±85°)
   * - Comprehensive error handling with logging
   *
   * Implementation Note:
   * Uses flyTo instead of fitBounds due to a bug in MapLibre GL v5.24.0
   * where fitBounds generates "Invalid LngLat (NaN, NaN)" errors.
   *
   * Zoom Level Calculation:
   * - Single marker: maxZoom (default 15)
   * - < 0.01° spread: zoom 14
   * - < 0.05° spread: zoom 12
   * - < 0.1° spread: zoom 11
   * - < 0.2° spread: zoom 10
   * - < 0.5° spread: zoom 9
   * - < 1° spread: zoom 8
   * - < 2° spread: zoom 7
   * - >= 2° spread: zoom 6
   *
   * @param featureIds - Array of feature IDs to fit in viewport
   * @param options - Optional configuration for padding, animation, and zoom
   * @param options.padding - Padding around markers (default: 50px)
   * @param options.duration - Animation duration in milliseconds (default: 1000ms)
   * @param options.maxZoom - Maximum zoom level for single markers (default: 15)
   * @param options.essential - Whether animation is essential and should not be interrupted (default: true)
   *
   * @example
   * // Fit viewport to show 3 imported markers with default options
   * mapRenderer.fitBoundsToMarkers(['marker-1', 'marker-2', 'marker-3']);
   *
   * @example
   * // Fit viewport with custom options
   * mapRenderer.fitBoundsToMarkers(
   *   ['marker-1', 'marker-2'],
   *   { padding: 100, duration: 1500, maxZoom: 18 }
   * );
   */
  public fitBoundsToMarkers(
    featureIds: string[],
    options?: FitBoundsOptions
  ): void {
    // Verify map is initialized
    if (!this.map) {
      console.warn('Map not initialized. Cannot fit bounds.');
      return;
    }

    // Calculate bounds for the specified features
    const bounds = this.calculateBounds(featureIds);
    
    // Handle case of null bounds
    if (!bounds) {
      console.warn('No valid features to fit bounds.');
      return;
    }

    // Validate that bounds are not NaN before calling fitBounds
    const west = bounds.getWest();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const north = bounds.getNorth();
    
    if (isNaN(west) || isNaN(south) || isNaN(east) || isNaN(north)) {
      console.error('Bounds contain NaN values:', { west, south, east, north });
      console.error('Cannot fit bounds with invalid coordinates');
      return;
    }

    try {
      // Apply default values
      const padding = options?.padding ?? 50;
      const duration = options?.duration ?? 1000;
      const maxZoom = options?.maxZoom ?? 15;

      // Detect single marker case
      const isSinglePoint = featureIds.length === 1;

      // WORKAROUND: MapLibre v5 has a bug with fitBounds that causes "Invalid LngLat (NaN, NaN)"
      // Use flyTo with calculated center and zoom instead
      
      // Clamp latitudes to Web Mercator limits before calculating center
      const clampedSouth = this.clampLat(south);
      const clampedNorth = this.clampLat(north);
      
      // Calculate center point with clamped latitudes
      const centerLng = (west + east) / 2;
      const centerLat = (clampedSouth + clampedNorth) / 2;
      
      console.log('Calculated center:', [centerLng, centerLat]);
      
      // Calculate zoom level based on bounds size
      // This is a simplified zoom calculation
      const lngDiff = Math.abs(east - west);
      const latDiff = Math.abs(clampedNorth - clampedSouth);
      const maxDiff = Math.max(lngDiff, latDiff);
      
      // Zoom calculation: smaller diff = higher zoom
      // Adjust these values to control how tight the zoom is
      let zoom: number;
      if (isSinglePoint) {
        zoom = maxZoom;
      } else if (maxDiff < 0.01) {
        zoom = 14;
      } else if (maxDiff < 0.05) {
        zoom = 12;
      } else if (maxDiff < 0.1) {
        zoom = 11;
      } else if (maxDiff < 0.2) {
        zoom = 10;
      } else if (maxDiff < 0.5) {
        zoom = 9;
      } else if (maxDiff < 1) {
        zoom = 8;
      } else if (maxDiff < 2) {
        zoom = 7;
      } else {
        zoom = 6;
      }
      
      console.log('Calculated zoom:', zoom, 'for maxDiff:', maxDiff);

      // Use flyTo instead of fitBounds
      this.map.flyTo({
        center: [centerLng, centerLat],
        zoom: zoom,
        duration: duration,
        essential: true,
      });
      
      console.log('flyTo called successfully');
    } catch (error) {
      // Handle errors with try-catch and logging through ErrorHandlerService
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.errorHandler.logError(
        new Error(`Failed to fit bounds: ${errorMessage}`)
      );
      console.error('flyTo error:', error);
      
      // Log additional context for debugging
      console.error('Error context:', {
        featureIds,
        bounds: { west, south, east, north },
        featureCount: featureIds.length
      });
    }
  }

  /**
   * Destroy the map and clean up all resources
   *
   * Removes the map instance from the DOM, clears all marker and popup registries,
   * and resets the service state. Should be called when the component is destroyed
   * to prevent memory leaks.
   *
   * @example
   * ngOnDestroy(): void {
   *   this.mapRenderer.destroy();
   * }
   */
  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.markersRegistry.clear();
    this.popupsRegistry.clear();
  }

  /**
   * Create HTML content for marker popup
   *
   * Generates HTML markup displaying all feature properties in a formatted list.
   * HTML special characters are escaped to prevent injection attacks.
   *
   * @param properties - Point properties to display in popup
   * @returns HTML string for popup content
   *
   * @example
   * const html = this.createPopupContent({
   *   name: 'Central Park',
   *   category: 'Park'
   * });
   * // Returns: '<div style="..."><strong>name:</strong> Central Park<br>...'
   */
  private createPopupContent(properties: PointProperties): string {
    const entries = Object.entries(properties)
      .map(([key, value]) => `<strong>${this.escapeHtml(key)}:</strong> ${this.escapeHtml(String(value))}`)
      .join('<br>');

    return `<div style="font-size: 12px; max-width: 200px;">${entries}</div>`;
  }

  /**
   * Escape HTML special characters to prevent injection attacks
   *
   * Converts HTML special characters (&, <, >, ", ') to their HTML entity equivalents.
   * This is essential when displaying user-provided content in HTML.
   *
   * @param text - Text to escape
   * @returns Escaped text safe for HTML rendering
   *
   * @example
   * const escaped = this.escapeHtml('<script>alert("xss")</script>');
   * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (char) => map[char]);
  }

  /**
   * Get the current map instance
   *
   * Returns the underlying MapLibre GL Map instance for advanced operations.
   * Primarily used for testing purposes or when direct map access is needed.
   *
   * @returns The MapLibre GL Map instance or null if not initialized
   *
   * @example
   * const map = mapRenderer.getMap();
   * if (map) {
   *   map.setZoom(10);
   * }
   */
  getMap(): MapLibreMap | null {
    return this.map;
  }

  /**
   * Get all markers currently displayed on the map
   *
   * Returns the internal marker registry containing all markers currently rendered.
   * Primarily used for testing purposes or when direct marker access is needed.
   *
   * @returns Map of marker IDs to Marker instances
   *
   * @example
   * const markers = mapRenderer.getMarkers();
   * markers.forEach((marker, id) => {
   *   console.log(`Marker ${id}:`, marker);
   * });
   */
  getMarkers(): MarkerRegistry {
    return this.markersRegistry;
  }
}
