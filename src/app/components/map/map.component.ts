import { Component, OnInit, OnDestroy, AfterViewInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { MapLibreRendererService } from '../../services/maplibre-renderer.service';
import { POIStoreService, Feature } from '../../services/poi-store.service';

/**
 * MapComponent - Wrapper for MapLibre GL JS map
 *
 * Responsibilities:
 * - Initialize and manage map rendering
 * - Handle map click events
 * - Handle marker click events
 * - Synchronize markers with POI Store state
 * - Subscribe to POI Store state changes and update markers
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 4.1, 4.2, 3.1, 3.5, 5.5
 */
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `<div #mapContainer class="map-container"></div>`,
  styles: [`
    .map-container {
      width: 100%;
      height: 100%;
      position: relative;
    }

    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  @Output() mapClick = new EventEmitter<[number, number]>();
  @Output() markerClick = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  private mapReady$ = new Subject<void>();
  private mapInitialized = false;
  private lastFeatureCount = 0;
  private isImportSync = false;
  private hasCompletedInitialSync = false;

  constructor(
    private mapRenderer: MapLibreRendererService,
    private poiStore: POIStoreService
  ) {}

  /**
   * Initialize component subscriptions
   * - Subscribe to map click events
   * - Subscribe to marker click events
   * - Subscribe to state changes and sync markers (after map is ready)
   */
  ngOnInit(): void {
    // Subscribe to map click events (don't depend on map initialization)
    this.mapRenderer.onMapClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe((coordinates) => {
        this.mapClick.emit(coordinates);
      });

    // Subscribe to marker click events (don't depend on map initialization)
    this.mapRenderer.onMarkerClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe((pointId) => {
        this.markerClick.emit(pointId);
      });

    // Wait for map to be ready, then:
    // 1. Sync the CURRENT state (catches any imports during initialization)
    // 2. Subscribe to FUTURE state changes
    // This ensures no state changes are lost due to timing
    this.mapReady$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        console.log('Map ready, syncing initial state');
        // Get and sync current state immediately
        const currentState = this.poiStore.getState();
        console.log('Syncing initial state with', currentState.features.length, 'features');
        this.syncMarkersWithState(currentState.features);
      });

    // Subscribe to future state changes after map is ready
    // This subscription is separate to avoid creating multiple subscriptions
    this.mapReady$
      .pipe(
        switchMap(() => this.poiStore.stateChanged$),
        takeUntil(this.destroy$)
      )
      .subscribe((state) => {
        console.log('State changed, syncing markers with state');
        this.syncMarkersWithState(state.features);
      });
  }

  /**
   * Initialize map after view is initialized
   * This ensures the map container element is available
   */
  ngAfterViewInit(): void {
    this.initializeMap();
  }

  /**
   * Initialize the map
   * Emits mapReady$ when initialization is complete
   */
  private initializeMap(): void {
    console.log('initializeMap called');
    if (this.mapContainer) {
      this.mapRenderer.initialize(this.mapContainer.nativeElement)
        .then(() => {
          console.log('Map initialized successfully');
          this.mapInitialized = true;
          // Emit that the map is ready
          // The mapReady$ subscription in ngOnInit will handle state sync
          this.mapReady$.next();
        })
        .catch((error) => {
          console.error('Failed to initialize map:', error);
        });
    }
  }

  /**
   * Synchronize markers with POI Store state
   * 
   * This method performs the following operations:
   * - Removes markers for deleted features
   * - Updates markers for modified features
   * - Adds markers for new features
   * - Detects import operations (bulk additions) and triggers auto-zoom
   * 
   * Auto-Zoom Detection Logic:
   * - Tracks the number of features between syncs
   * - An import is detected when features increase AND initial sync is complete
   * - Initial sync (from localStorage) does NOT trigger auto-zoom
   * - Only truly new markers (not updates) are included in auto-zoom
   * 
   * Implementation Details:
   * - Captures existing marker IDs BEFORE modifications to distinguish new vs. updated markers
   * - Uses setTimeout(300ms) to ensure markers are rendered before auto-zoom
   * - Validates markers exist in registry before calling fitBoundsToMarkers
   * 
   * Validates: Requirements 3.1, 3.2, 3.5, 5.5
   * 
   * @param features - Current features from POI Store
   * 
   * @example
   * // After importing a GeoJSON file with 10 features:
   * // 1. syncMarkersWithState is called with 10 features
   * // 2. isImportSync = true (10 new features added)
   * // 3. All 10 markers are added to the map
   * // 4. After 300ms, fitBoundsToMarkers is called with the 10 new marker IDs
   * // 5. Map viewport animates to show all imported markers
   */
  private syncMarkersWithState(features: Feature[]): void {
    console.log('syncMarkersWithState called with', features.length, 'features');
    const currentMarkers = this.mapRenderer.getMarkers();
    const featureIds = new Set(features.map((f) => f.id));
    
    // CRITICAL: Capture existing marker IDs BEFORE any modifications
    // This allows us to distinguish truly new markers from updated ones
    const markerIds = new Set(currentMarkers.keys());

    console.log('Current markers:', markerIds.size, 'Feature IDs:', featureIds.size);

    // Detect if this is an import operation (significant increase in features)
    const newFeatureCount = features.length;
    const addedCount = newFeatureCount - this.lastFeatureCount;
    
    // Only consider it an import if:
    // 1. There's an increase in features (addedCount > 0)
    // 2. We've completed the initial sync (hasCompletedInitialSync = true) - this excludes initial load from localStorage
    this.isImportSync = addedCount > 0 && this.hasCompletedInitialSync;
    const newFeatureIds: string[] = [];
    
    console.log('Import detection:', {
      addedCount,
      hasCompletedInitialSync: this.hasCompletedInitialSync,
      isImportSync: this.isImportSync
    });

    // Remove markers for deleted points
    for (const markerId of markerIds) {
      if (!featureIds.has(markerId)) {
        console.log('Removing marker:', markerId);
        this.mapRenderer.removeMarker(markerId);
      }
    }

    // Add or update markers for points
    for (const feature of features) {
      if (markerIds.has(feature.id)) {
        // Update existing marker
        console.log('Updating marker:', feature.id);
        this.mapRenderer.updateMarker(feature.id, feature);
        // DO NOT add to newFeatureIds - this is an update, not a new marker
      } else {
        // Add new marker
        console.log('Adding marker:', feature.id, 'at', feature.geometry.coordinates);
        this.mapRenderer.addMarker(feature);
        // Only add to newFeatureIds if this marker ID did NOT exist before
        // This is the key fix: markerIds was captured BEFORE any modifications
        if (this.isImportSync) {
          newFeatureIds.push(feature.id);
        }
      }
    }

    // Update feature count for next sync
    this.lastFeatureCount = newFeatureCount;
    
    // Mark that we've completed the initial sync
    // This allows subsequent imports to trigger auto-zoom
    if (!this.hasCompletedInitialSync) {
      this.hasCompletedInitialSync = true;
      console.log('Initial sync completed, future imports will trigger auto-zoom');
    }

    // If this was an import sync with new markers, fit bounds
    if (this.isImportSync && newFeatureIds.length > 0) {
      console.log('Import detected, fitting bounds to', newFeatureIds.length, 'new markers');
      // Use setTimeout to ensure markers are rendered before fitting bounds
      // Increased timeout to 300ms to ensure markers are fully registered
      setTimeout(() => {
        // Verify markers are actually in the registry before fitting bounds
        const currentMarkers = this.mapRenderer.getMarkers();
        const validIds = newFeatureIds.filter(id => currentMarkers.has(id));
        
        if (validIds.length > 0) {
          console.log('Fitting bounds to', validIds.length, 'valid markers');
          this.mapRenderer.fitBoundsToMarkers(validIds);
        } else {
          console.warn('No valid markers found in registry for auto-zoom');
        }
      }, 300);
    }
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.mapRenderer.destroy();
    this.mapReady$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
