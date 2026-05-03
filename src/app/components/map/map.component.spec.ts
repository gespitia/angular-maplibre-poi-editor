import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MapComponent } from './map.component';
import { MapLibreRendererService } from '../../services/maplibre-renderer.service';
import { POIStoreService, Feature } from '../../services/poi-store.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { Subject } from 'rxjs';

/**
 * MapComponent Test Suite
 * 
 * Consolidated tests for MapComponent covering:
 * - Basic functionality (creation, event emission)
 * - Marker synchronization (add, update, remove)
 * - Import detection and auto-zoom
 * - Cleanup and lifecycle
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4, 3.5
 */
describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let mapRenderer: any;
  let poiStore: any;
  let mapClickSubject: Subject<[number, number]>;
  let markerClickSubject: Subject<string>;
  let stateChangedSubject: Subject<any>;

  beforeEach(async () => {
    mapClickSubject = new Subject<[number, number]>();
    markerClickSubject = new Subject<string>();
    stateChangedSubject = new Subject<any>();

    const mapRendererSpy = {
      initialize: vi.fn(),
      addMarker: vi.fn(),
      updateMarker: vi.fn(),
      removeMarker: vi.fn(),
      destroy: vi.fn(),
      getMarkers: vi.fn(() => new Map()),
      fitBoundsToMarkers: vi.fn(),
      onMapClick$: mapClickSubject.asObservable(),
      onMarkerClick$: markerClickSubject.asObservable(),
    };
    (mapRendererSpy.initialize as any).mockResolvedValue(undefined);

    const poiStoreSpy = {
      getState: vi.fn(),
      getPointById: vi.fn(),
      addPoint: vi.fn(),
      updatePoint: vi.fn(),
      deletePoint: vi.fn(),
      setState: vi.fn(),
      stateChanged$: stateChangedSubject.asObservable(),
    };
    (poiStoreSpy.getState as any).mockReturnValue({
      type: 'FeatureCollection',
      features: [],
    });

    const errorHandlerSpy = {
      showError: vi.fn(),
      logError: vi.fn(),
      showImportSummary: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [
        { provide: MapLibreRendererService, useValue: mapRendererSpy },
        { provide: POIStoreService, useValue: poiStoreSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
      ],
    }).compileComponents();

    mapRenderer = TestBed.inject(MapLibreRendererService);
    poiStore = TestBed.inject(POIStoreService);

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have mapClick output', () => {
      expect(component.mapClick).toBeTruthy();
    });

    it('should have markerClick output', () => {
      expect(component.markerClick).toBeTruthy();
    });
  });

  describe('Event Emission', () => {
    it('should emit mapClick event when map is clicked', async () => {
      fixture.detectChanges();

      const promise = new Promise<void>((resolve) => {
        component.mapClick.subscribe((coordinates) => {
          expect(coordinates).toEqual([10, 20]);
          resolve();
        });
      });

      mapClickSubject.next([10, 20]);
      await promise;
    });

    it('should emit markerClick event when marker is clicked', async () => {
      fixture.detectChanges();

      const promise = new Promise<void>((resolve) => {
        component.markerClick.subscribe((pointId) => {
          expect(pointId).toBe('test-id');
          resolve();
        });
      });

      markerClickSubject.next('test-id');
      await promise;
    });

    it('should emit correct coordinates for different click locations', async () => {
      fixture.detectChanges();

      const coordinates = [
        [5, 10],
        [15, 25],
        [-30, 45],
      ];

      let clickCount = 0;

      const promise = new Promise<void>((resolve) => {
        component.mapClick.subscribe((coords) => {
          expect(coords).toEqual(coordinates[clickCount]);
          clickCount++;

          if (clickCount === coordinates.length) {
            resolve();
          }
        });
      });

      coordinates.forEach((coord) => {
        mapClickSubject.next([coord[0], coord[1]]);
      });

      await promise;
    });

    it('should emit correct marker IDs for multiple markers', async () => {
      fixture.detectChanges();

      const markerIds = ['marker-1', 'marker-2', 'marker-3'];
      let clickCount = 0;

      const promise = new Promise<void>((resolve) => {
        component.markerClick.subscribe((id) => {
          expect(id).toBe(markerIds[clickCount]);
          clickCount++;

          if (clickCount === markerIds.length) {
            resolve();
          }
        });
      });

      markerIds.forEach((id) => {
        markerClickSubject.next(id);
      });

      await promise;
    });
  });

  describe('Marker Synchronization', () => {
    it('should add marker for new point', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const feature: Feature = {
        type: 'Feature',
        id: 'test-id',
        geometry: {
          type: 'Point',
          coordinates: [10, 20],
        },
        properties: {
          name: 'Test Point',
          category: 'Test',
        },
      };

      stateChangedSubject.next({
        type: 'FeatureCollection',
        features: [feature],
      });

      await fixture.whenStable();

      expect(mapRenderer.addMarker).toHaveBeenCalledWith(feature);
    });

    it('should update marker for modified point', async () => {
      const feature: Feature = {
        type: 'Feature',
        id: 'test-id',
        geometry: {
          type: 'Point',
          coordinates: [10, 20],
        },
        properties: {
          name: 'Test Point',
          category: 'Test',
        },
      };

      const existingMarkers = new Map();
      existingMarkers.set('test-id', {} as any);
      (mapRenderer.getMarkers as any).mockReturnValue(existingMarkers);

      fixture.detectChanges();
      await fixture.whenStable();

      stateChangedSubject.next({
        type: 'FeatureCollection',
        features: [feature],
      });

      await fixture.whenStable();

      expect(mapRenderer.updateMarker).toHaveBeenCalledWith('test-id', feature);
    });

    it('should remove marker for deleted point', async () => {
      const existingMarkers = new Map();
      existingMarkers.set('deleted-id', {} as any);
      (mapRenderer.getMarkers as any).mockReturnValue(existingMarkers);

      fixture.detectChanges();
      await fixture.whenStable();

      stateChangedSubject.next({
        type: 'FeatureCollection',
        features: [],
      });

      await fixture.whenStable();

      expect(mapRenderer.removeMarker).toHaveBeenCalledWith('deleted-id');
    });

    it('should handle multiple markers correctly', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      const features: Feature[] = [
        {
          type: 'Feature',
          id: 'marker-1',
          geometry: { type: 'Point', coordinates: [10, 20] },
          properties: { name: 'Point 1', category: 'Test' },
        },
        {
          type: 'Feature',
          id: 'marker-2',
          geometry: { type: 'Point', coordinates: [30, 40] },
          properties: { name: 'Point 2', category: 'Test' },
        },
        {
          type: 'Feature',
          id: 'marker-3',
          geometry: { type: 'Point', coordinates: [50, 60] },
          properties: { name: 'Point 3', category: 'Test' },
        },
      ];

      stateChangedSubject.next({
        type: 'FeatureCollection',
        features,
      });

      await fixture.whenStable();

      expect(mapRenderer.addMarker).toHaveBeenCalledTimes(3);
      features.forEach((feature) => {
        expect(mapRenderer.addMarker).toHaveBeenCalledWith(feature);
      });
    });
  });

  describe('Import Detection and Auto-Zoom', () => {
    it('should detect import when feature count increases', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      // Simulate initial sync with 0 features (this completes the initial sync)
      stateChangedSubject.next({
        type: 'FeatureCollection',
        features: [],
      });
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Clear the mock calls from initial sync
      mapRenderer.fitBoundsToMarkers.mockClear();

      // Simulate import with 3 new features
      const features: Feature[] = [
        {
          type: 'Feature',
          id: 'marker-1',
          geometry: { type: 'Point', coordinates: [-70.6483, -33.4569] },
          properties: { name: 'Point 1', category: 'test' },
        },
        {
          type: 'Feature',
          id: 'marker-2',
          geometry: { type: 'Point', coordinates: [-70.615, -33.44] },
          properties: { name: 'Point 2', category: 'test' },
        },
        {
          type: 'Feature',
          id: 'marker-3',
          geometry: { type: 'Point', coordinates: [-70.7, -33.5] },
          properties: { name: 'Point 3', category: 'test' },
        },
      ];

      // Mock getMarkers to return empty initially, then return the new markers
      mapRenderer.getMarkers.mockReturnValue(new Map());
      
      stateChangedSubject.next({
        type: 'FeatureCollection',
        features,
      });

      // Update mock to return the new markers after they're added
      const mockMarkers = new Map();
      features.forEach((f) => mockMarkers.set(f.id, {} as any));
      mapRenderer.getMarkers.mockReturnValue(mockMarkers);

      // Wait for the setTimeout (300ms) to complete
      await new Promise((resolve) => setTimeout(resolve, 350));
      await fixture.whenStable();

      // Verify fitBoundsToMarkers was called with the new marker IDs
      expect(mapRenderer.fitBoundsToMarkers).toHaveBeenCalled();
      const callArgs = mapRenderer.fitBoundsToMarkers.mock.calls[0][0];
      expect(callArgs.sort()).toEqual(['marker-1', 'marker-2', 'marker-3'].sort());
    });

    it('should NOT trigger auto-zoom when updating existing markers', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Simulate initial state with 2 markers
      const initialFeatures: Feature[] = [
        {
          type: 'Feature',
          id: 'existing-1',
          geometry: { type: 'Point', coordinates: [-70.6483, -33.4569] },
          properties: { name: 'Existing 1', category: 'test' },
        },
        {
          type: 'Feature',
          id: 'existing-2',
          geometry: { type: 'Point', coordinates: [-70.615, -33.44] },
          properties: { name: 'Existing 2', category: 'test' },
        },
      ];

      // Mock getMarkers to return existing markers
      const mockMarkers = new Map();
      initialFeatures.forEach((f) => mockMarkers.set(f.id, {} as any));
      mapRenderer.getMarkers.mockReturnValue(mockMarkers);

      stateChangedSubject.next({
        type: 'FeatureCollection',
        features: initialFeatures,
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      await fixture.whenStable();

      // Clear mock calls
      mapRenderer.fitBoundsToMarkers.mockClear();

      // Simulate update (same IDs, different properties)
      const updatedFeatures: Feature[] = [
        {
          type: 'Feature',
          id: 'existing-1',
          geometry: { type: 'Point', coordinates: [-70.6483, -33.4569] },
          properties: { name: 'Updated 1', category: 'test' },
        },
        {
          type: 'Feature',
          id: 'existing-2',
          geometry: { type: 'Point', coordinates: [-70.615, -33.44] },
          properties: { name: 'Updated 2', category: 'test' },
        },
      ];

      stateChangedSubject.next({
        type: 'FeatureCollection',
        features: updatedFeatures,
      });

      // Wait for potential setTimeout
      await new Promise((resolve) => setTimeout(resolve, 350));
      await fixture.whenStable();

      // Verify fitBoundsToMarkers was NOT called
      expect(mapRenderer.fitBoundsToMarkers).not.toHaveBeenCalled();
    });

    it('should NOT trigger auto-zoom when deleting markers', async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Simulate initial state with 3 markers
      const initialFeatures: Feature[] = [
        {
          type: 'Feature',
          id: 'delete-1',
          geometry: { type: 'Point', coordinates: [-70.6483, -33.4569] },
          properties: { name: 'Delete 1', category: 'test' },
        },
        {
          type: 'Feature',
          id: 'delete-2',
          geometry: { type: 'Point', coordinates: [-70.615, -33.44] },
          properties: { name: 'Delete 2', category: 'test' },
        },
        {
          type: 'Feature',
          id: 'delete-3',
          geometry: { type: 'Point', coordinates: [-70.7, -33.5] },
          properties: { name: 'Delete 3', category: 'test' },
        },
      ];

      // Mock getMarkers to return existing markers
      const mockMarkers = new Map();
      initialFeatures.forEach((f) => mockMarkers.set(f.id, {} as any));
      mapRenderer.getMarkers.mockReturnValue(mockMarkers);

      stateChangedSubject.next({
        type: 'FeatureCollection',
        features: initialFeatures,
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      await fixture.whenStable();

      // Clear mock calls
      mapRenderer.fitBoundsToMarkers.mockClear();

      // Simulate deletion (remove 2 markers)
      const remainingFeatures: Feature[] = [
        {
          type: 'Feature',
          id: 'delete-1',
          geometry: { type: 'Point', coordinates: [-70.6483, -33.4569] },
          properties: { name: 'Delete 1', category: 'test' },
        },
      ];

      // Update mock to reflect deletion
      const updatedMockMarkers = new Map();
      updatedMockMarkers.set('delete-1', {} as any);
      mapRenderer.getMarkers.mockReturnValue(updatedMockMarkers);

      stateChangedSubject.next({
        type: 'FeatureCollection',
        features: remainingFeatures,
      });

      // Wait for potential setTimeout
      await new Promise((resolve) => setTimeout(resolve, 350));
      await fixture.whenStable();

      // Verify fitBoundsToMarkers was NOT called
      expect(mapRenderer.fitBoundsToMarkers).not.toHaveBeenCalled();
    });

    it('should trigger auto-zoom on first import after initial sync', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      // Simulate initial sync with 0 features (this completes the initial sync)
      stateChangedSubject.next({
        type: 'FeatureCollection',
        features: [],
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      await fixture.whenStable();

      // Clear the mock calls from initial sync
      mapRenderer.fitBoundsToMarkers.mockClear();

      // Simulate first import with features
      const features: Feature[] = [
        {
          type: 'Feature',
          id: 'marker-1',
          geometry: { type: 'Point', coordinates: [-70.6483, -33.4569] },
          properties: { name: 'Point 1', category: 'test' },
        },
        {
          type: 'Feature',
          id: 'marker-2',
          geometry: { type: 'Point', coordinates: [-70.615, -33.44] },
          properties: { name: 'Point 2', category: 'test' },
        },
      ];

      // Mock getMarkers to return empty initially
      mapRenderer.getMarkers.mockReturnValue(new Map());

      stateChangedSubject.next({
        type: 'FeatureCollection',
        features,
      });

      // Update mock to return the new markers after they're added
      const mockMarkers = new Map();
      features.forEach((f) => mockMarkers.set(f.id, {} as any));
      mapRenderer.getMarkers.mockReturnValue(mockMarkers);

      // Wait for the setTimeout (300ms) to complete
      await new Promise((resolve) => setTimeout(resolve, 350));
      await fixture.whenStable();

      // Verify fitBoundsToMarkers was called
      expect(mapRenderer.fitBoundsToMarkers).toHaveBeenCalled();
      const callArgs = mapRenderer.fitBoundsToMarkers.mock.calls[0][0];
      expect(callArgs).toEqual(['marker-1', 'marker-2']);
    });
  });

  describe('Lifecycle', () => {
    it('should cleanup on destroy', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      expect(mapRenderer.destroy).toHaveBeenCalled();
    });

    it('should initialize map on view init', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      expect(mapRenderer.initialize).toHaveBeenCalled();
    });
  });
});
