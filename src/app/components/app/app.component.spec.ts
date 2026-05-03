import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppComponent } from './app.component';
import { POIStoreService } from '../../services/poi-store.service';
import { MapLibreRendererService } from '../../services/maplibre-renderer.service';
import { PersistenceManagerService } from '../../services/persistence-manager.service';
import { Subject } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let poiStore: POIStoreService;
  let mapRenderer: MapLibreRendererService;
  let persistenceManager: PersistenceManagerService;
  let stateChangedSubject: Subject<any>;

  beforeEach(async () => {
    stateChangedSubject = new Subject();

    const poiStoreSpy = {
      getState: vi.fn(),
      getPointById: vi.fn(),
      addPoint: vi.fn(),
      updatePoint: vi.fn(),
      deletePoint: vi.fn(),
      setState: vi.fn(),
      stateChanged$: stateChangedSubject.asObservable(),
    };

    const mapRendererSpy = {
      initialize: vi.fn(),
      addMarker: vi.fn(),
      updateMarker: vi.fn(),
      removeMarker: vi.fn(),
      destroy: vi.fn(),
      getMarkers: vi.fn(() => new Map()),
      onMapClick$: new Subject().asObservable(),
      onMarkerClick$: new Subject().asObservable(),
    };
    (mapRendererSpy.initialize as any).mockResolvedValue(undefined);

    const persistenceManagerSpy = {
      save: vi.fn(),
      restore: vi.fn(),
      clear: vi.fn(),
    };
    (persistenceManagerSpy.restore as any).mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: POIStoreService, useValue: poiStoreSpy },
        { provide: MapLibreRendererService, useValue: mapRendererSpy },
        { provide: PersistenceManagerService, useValue: persistenceManagerSpy },
      ],
    }).compileComponents();

    poiStore = TestBed.inject(POIStoreService);
    mapRenderer = TestBed.inject(MapLibreRendererService);
    persistenceManager = TestBed.inject(PersistenceManagerService);

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should restore state from localStorage on init', () => {
    const savedState = {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          id: 'test-id',
          geometry: {
            type: 'Point' as const,
            coordinates: [0, 0] as [number, number],
          },
          properties: {
            name: 'Test Point',
            category: 'Test',
          },
        },
      ],
    };

    (persistenceManager.restore as any).mockReturnValue(savedState);

    component.ngOnInit();

    expect(persistenceManager.restore).toHaveBeenCalled();
    expect(poiStore.setState).toHaveBeenCalledWith(savedState);
  });

  it('should subscribe to state changes', async () => {
    const newState = {
      type: 'FeatureCollection' as const,
      features: [],
    };

    (poiStore.getState as any).mockReturnValue(newState);

    component.ngOnInit();

    // Emit the state change after initialization
    stateChangedSubject.next(newState);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // The component should have received the state
    expect(component.currentState).toBeDefined();
  });

  it('should handle map click event', () => {
    component.onMapClick([10, 20]);

    expect(component.formCoordinates).toEqual([10, 20]);
    expect(component.showPointForm).toBe(true);
    expect(component.showPointDetails).toBe(false);
  });

  it('should handle marker click event', () => {
    component.onMarkerClick('test-id');

    expect(component.selectedPointId).toBe('test-id');
    expect(component.showPointDetails).toBe(true);
    expect(component.showPointForm).toBe(false);
  });

  it('should handle point form submission', () => {
    const data = {
      coordinates: [10, 20] as [number, number],
      properties: { name: 'Test', category: 'Category' },
    };

    component.onPointFormSubmit(data);

    expect(poiStore.addPoint).toHaveBeenCalledWith(data.coordinates, data.properties);
    expect(component.showPointForm).toBe(false);
  });

  it('should handle point form cancel', () => {
    component.showPointForm = true;
    component.formCoordinates = [10, 20];

    component.onPointFormCancel();

    expect(component.showPointForm).toBe(false);
    expect(component.formCoordinates).toBeNull();
  });

  it('should handle point update', () => {
    const data = {
      id: 'test-id',
      properties: { name: 'Updated', category: 'Category' },
    };

    component.onPointUpdate(data);

    expect(poiStore.updatePoint).toHaveBeenCalledWith(data.id, data.properties);
  });

  it('should handle point deletion', () => {
    component.selectedPointId = 'test-id';
    component.showPointDetails = true;

    component.onPointDelete('test-id');

    expect(poiStore.deletePoint).toHaveBeenCalledWith('test-id');
    expect(component.showPointDetails).toBe(false);
    expect(component.selectedPointId).toBeNull();
  });

  it('should cleanup on destroy', () => {
    component.ngOnDestroy();

    expect(mapRenderer.destroy).toHaveBeenCalled();
  });
});
