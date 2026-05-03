import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PersistenceManagerService } from './persistence-manager.service';
import { FeatureCollection } from './poi-store.service';

describe('PersistenceManagerService', () => {
  let service: PersistenceManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersistenceManagerService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('save()', () => {
    it('should save FeatureCollection to localStorage', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id-1',
            geometry: {
              type: 'Point',
              coordinates: [10, 20],
            },
            properties: {
              name: 'Test Point',
              category: 'Monument',
            },
          },
        ],
      };

      service.save(state);

      const stored = localStorage.getItem('poi_editor_state');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(state);
    });

    it('should save empty FeatureCollection', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      service.save(state);

      const stored = localStorage.getItem('poi_editor_state');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.type).toBe('FeatureCollection');
      expect(parsed.features).toEqual([]);
    });

    it('should save multiple features', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'id-1',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Point 1', category: 'Cat1' },
          },
          {
            type: 'Feature',
            id: 'id-2',
            geometry: { type: 'Point', coordinates: [1, 1] },
            properties: { name: 'Point 2', category: 'Cat2' },
          },
          {
            type: 'Feature',
            id: 'id-3',
            geometry: { type: 'Point', coordinates: [2, 2] },
            properties: { name: 'Point 3', category: 'Cat3' },
          },
        ],
      };

      service.save(state);

      const stored = localStorage.getItem('poi_editor_state');
      const parsed = JSON.parse(stored!);
      expect(parsed.features.length).toBe(3);
      expect(parsed.features[0].properties.name).toBe('Point 1');
      expect(parsed.features[1].properties.name).toBe('Point 2');
      expect(parsed.features[2].properties.name).toBe('Point 3');
    });

    it('should preserve all properties including custom ones', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: {
              name: 'Test Point',
              category: 'Monument',
              description: 'A test monument',
              yearBuilt: 1950,
              customField: 'custom value',
            },
          },
        ],
      };

      service.save(state);

      const stored = localStorage.getItem('poi_editor_state');
      const parsed = JSON.parse(stored!);
      expect(parsed.features[0].properties.name).toBe('Test Point');
      expect(parsed.features[0].properties.category).toBe('Monument');
      expect(parsed.features[0].properties.description).toBe('A test monument');
      expect(parsed.features[0].properties.yearBuilt).toBe(1950);
      expect(parsed.features[0].properties.customField).toBe('custom value');
    });

    it('should overwrite previous saved state', () => {
      const state1: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'id-1',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Point 1', category: 'Cat1' },
          },
        ],
      };

      const state2: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'id-2',
            geometry: { type: 'Point', coordinates: [1, 1] },
            properties: { name: 'Point 2', category: 'Cat2' },
          },
          {
            type: 'Feature',
            id: 'id-3',
            geometry: { type: 'Point', coordinates: [2, 2] },
            properties: { name: 'Point 3', category: 'Cat3' },
          },
        ],
      };

      service.save(state1);
      service.save(state2);

      const stored = localStorage.getItem('poi_editor_state');
      const parsed = JSON.parse(stored!);
      expect(parsed.features.length).toBe(2);
      expect(parsed.features[0].properties.name).toBe('Point 2');
      expect(parsed.features[1].properties.name).toBe('Point 3');
    });

    it('should throw error if localStorage is not available', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const errorHandlerSpy = vi.spyOn(service['errorHandler'], 'logError');

      service.save(state);

      expect(errorHandlerSpy).toHaveBeenCalled();

      setItemSpy.mockRestore();
      errorHandlerSpy.mockRestore();
    });

    it('should preserve geometry coordinates with decimal precision', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [123.456789, -45.678901] },
            properties: { name: 'Test', category: 'Test' },
          },
        ],
      };

      service.save(state);

      const stored = localStorage.getItem('poi_editor_state');
      const parsed = JSON.parse(stored!);
      expect(parsed.features[0].geometry.coordinates).toEqual([123.456789, -45.678901]);
    });
  });

  describe('restore()', () => {
    it('should restore FeatureCollection from localStorage', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id-1',
            geometry: {
              type: 'Point',
              coordinates: [10, 20],
            },
            properties: {
              name: 'Test Point',
              category: 'Monument',
            },
          },
        ],
      };

      service.save(state);
      const restored = service.restore();

      expect(restored).toEqual(state);
    });

    it('should return null if no state is stored', () => {
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should restore empty FeatureCollection', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      service.save(state);
      const restored = service.restore();

      expect(restored).toBeTruthy();
      expect(restored!.type).toBe('FeatureCollection');
      expect(restored!.features).toEqual([]);
    });

    it('should restore multiple features', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'id-1',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Point 1', category: 'Cat1' },
          },
          {
            type: 'Feature',
            id: 'id-2',
            geometry: { type: 'Point', coordinates: [1, 1] },
            properties: { name: 'Point 2', category: 'Cat2' },
          },
        ],
      };

      service.save(state);
      const restored = service.restore();

      expect(restored!.features.length).toBe(2);
      expect(restored!.features[0].properties.name).toBe('Point 1');
      expect(restored!.features[1].properties.name).toBe('Point 2');
    });

    it('should restore all properties including custom ones', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: {
              name: 'Test Point',
              category: 'Monument',
              description: 'A test monument',
              yearBuilt: 1950,
              customField: 'custom value',
            },
          },
        ],
      };

      service.save(state);
      const restored = service.restore();

      expect(restored!.features[0].properties.name).toBe('Test Point');
      expect(restored!.features[0].properties.category).toBe('Monument');
      expect(restored!.features[0].properties['description']).toBe('A test monument');
      expect(restored!.features[0].properties['yearBuilt']).toBe(1950);
      expect(restored!.features[0].properties['customField']).toBe('custom value');
    });

    it('should return null if stored data is invalid JSON', () => {
      localStorage.setItem('poi_editor_state', 'invalid json {');
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should return null if stored data is not a FeatureCollection', () => {
      localStorage.setItem('poi_editor_state', JSON.stringify({ type: 'Feature' }));
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should return null if stored data has invalid feature structure', () => {
      const invalidData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: {
              name: 'Test',
              // Missing category
            },
          },
        ],
      };

      localStorage.setItem('poi_editor_state', JSON.stringify(invalidData));
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should return null if feature has missing geometry', () => {
      const invalidData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            // Missing geometry
            properties: {
              name: 'Test',
              category: 'Test',
            },
          },
        ],
      };

      localStorage.setItem('poi_editor_state', JSON.stringify(invalidData));
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should return null if feature has invalid geometry type', () => {
      const invalidData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
            properties: {
              name: 'Test',
              category: 'Test',
            },
          },
        ],
      };

      localStorage.setItem('poi_editor_state', JSON.stringify(invalidData));
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should return null if feature has invalid coordinates', () => {
      const invalidData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [10] }, // Only one coordinate
            properties: {
              name: 'Test',
              category: 'Test',
            },
          },
        ],
      };

      localStorage.setItem('poi_editor_state', JSON.stringify(invalidData));
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should return null if feature has non-numeric coordinates', () => {
      const invalidData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: ['10', '20'] },
            properties: {
              name: 'Test',
              category: 'Test',
            },
          },
        ],
      };

      localStorage.setItem('poi_editor_state', JSON.stringify(invalidData));
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should return null if feature has empty name', () => {
      const invalidData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: {
              name: '',
              category: 'Test',
            },
          },
        ],
      };

      localStorage.setItem('poi_editor_state', JSON.stringify(invalidData));
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should return null if feature has whitespace-only name', () => {
      const invalidData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: {
              name: '   ',
              category: 'Test',
            },
          },
        ],
      };

      localStorage.setItem('poi_editor_state', JSON.stringify(invalidData));
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should return null if feature has empty category', () => {
      const invalidData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: {
              name: 'Test',
              category: '',
            },
          },
        ],
      };

      localStorage.setItem('poi_editor_state', JSON.stringify(invalidData));
      const restored = service.restore();
      expect(restored).toBeNull();
    });

    it('should restore with geometry coordinates having decimal precision', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [123.456789, -45.678901] },
            properties: { name: 'Test', category: 'Test' },
          },
        ],
      };

      service.save(state);
      const restored = service.restore();

      expect(restored!.features[0].geometry.coordinates).toEqual([123.456789, -45.678901]);
    });

    it('should handle localStorage errors gracefully', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const restored = service.restore();
      expect(restored).toBeNull();

      getItemSpy.mockRestore();
    });
  });

  describe('clear()', () => {
    it('should remove state from localStorage', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      service.save(state);
      expect(localStorage.getItem('poi_editor_state')).toBeTruthy();

      service.clear();
      expect(localStorage.getItem('poi_editor_state')).toBeNull();
    });

    it('should not throw error if nothing is stored', () => {
      expect(() => service.clear()).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('Storage error');
      });

      // The service should NOT throw - it catches errors internally
      expect(() => service.clear()).not.toThrow();

      removeItemSpy.mockRestore();
    });
  });

  describe('Integration tests', () => {
    it('should save and restore equivalent state', () => {
      const originalState: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id-1',
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: {
              name: 'Test Point 1',
              category: 'Monument',
              description: 'A test monument',
            },
          },
          {
            type: 'Feature',
            id: 'test-id-2',
            geometry: { type: 'Point', coordinates: [30, 40] },
            properties: {
              name: 'Test Point 2',
              category: 'Park',
              yearEstablished: 1995,
            },
          },
        ],
      };

      service.save(originalState);
      const restored = service.restore();

      expect(restored).toEqual(originalState);
    });

    it('should handle save, clear, and restore cycle', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: { name: 'Test', category: 'Test' },
          },
        ],
      };

      service.save(state);
      expect(service.restore()).toBeTruthy();

      // Restore localStorage to normal state before clearing
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      removeItemSpy.mockRestore();
      
      service.clear();
      expect(service.restore()).toBeNull();
    });

    it('should initialize with empty FeatureCollection when nothing is stored', () => {
      const restored = service.restore();
      expect(restored).toBeNull();

      // Application should initialize with empty FeatureCollection
      const emptyState: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      service.save(emptyState);
      const restoredEmpty = service.restore();

      expect(restoredEmpty).toEqual(emptyState);
    });

    it('should maintain data integrity through multiple save/restore cycles', () => {
      const state1: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'id-1',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Point 1', category: 'Cat1' },
          },
        ],
      };

      service.save(state1);
      let restored = service.restore();
      expect(restored).toEqual(state1);

      const state2: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          ...state1.features,
          {
            type: 'Feature',
            id: 'id-2',
            geometry: { type: 'Point', coordinates: [1, 1] },
            properties: { name: 'Point 2', category: 'Cat2' },
          },
        ],
      };

      service.save(state2);
      restored = service.restore();
      expect(restored).toEqual(state2);
      expect(restored!.features.length).toBe(2);
    });

    it('should preserve complex properties through save/restore', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'complex-id',
            geometry: { type: 'Point', coordinates: [123.456789, -45.678901] },
            properties: {
              name: 'Complex Point',
              category: 'Special',
              metadata: {
                nested: 'value',
                array: [1, 2, 3],
              },
              nullValue: null,
              boolValue: true,
              numberValue: 42.5,
            },
          },
        ],
      };

      service.save(state);
      const restored = service.restore();

      expect(restored!.features[0].geometry.coordinates).toEqual([123.456789, -45.678901]);
      expect((restored!.features[0].properties['metadata'] as Record<string, unknown>)['nested']).toBe('value');
      expect((restored!.features[0].properties['metadata'] as Record<string, unknown>)['array']).toEqual([1, 2, 3]);
      expect(restored!.features[0].properties['nullValue']).toBeNull();
      expect(restored!.features[0].properties['boolValue']).toBe(true);
      expect(restored!.features[0].properties['numberValue']).toBe(42.5);
    });
  });
});
