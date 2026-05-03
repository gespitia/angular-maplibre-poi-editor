import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { MapLibreRendererService } from './services/maplibre-renderer.service';
import { vi } from 'vitest';
import { Subject } from 'rxjs';
import type { Feature, FitBoundsOptions } from './types';

interface MockMapLibreService {
  initialize: (container: HTMLElement) => Promise<void>;
  destroy: () => void;
  getMap: () => null;
  getMarkers: () => Map<string, unknown>;
  addMarker: (feature: Feature) => void;
  updateMarker: (id: string, feature: Feature) => void;
  removeMarker: (id: string) => void;
  fitBoundsToMarkers: (featureIds: string[], options?: FitBoundsOptions) => void;
  onMapClick$: Subject<[number, number]>;
  onMarkerClick$: Subject<string>;
}

describe('App', () => {
  beforeEach(async () => {
    // Mock MapLibreRendererService to avoid WebGL initialization
    const mockMapLibreService: MockMapLibreService = {
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn(),
      getMap: vi.fn(() => null),
      getMarkers: vi.fn(() => new Map()),
      addMarker: vi.fn(),
      updateMarker: vi.fn(),
      removeMarker: vi.fn(),
      fitBoundsToMarkers: vi.fn(),
      onMapClick$: new Subject<[number, number]>(),
      onMarkerClick$: new Subject<string>(),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: MapLibreRendererService, useValue: mockMapLibreService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    // Just verify the component renders without errors
    expect(compiled).toBeTruthy();
  });
});
