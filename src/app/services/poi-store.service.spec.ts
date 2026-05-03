import { TestBed } from '@angular/core/testing';
import { POIStoreService } from './poi-store.service';
import type { Feature, FeatureCollection, PointProperties } from '../types';

describe('POIStoreService', () => {
  let service: POIStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(POIStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getState()', () => {
    it('should return an empty FeatureCollection on initialization', () => {
      const state = service.getState();
      expect(state.type).toBe('FeatureCollection');
      expect(state.features).toEqual([]);
    });

    it('should return a deep copy of the state', () => {
      service.addPoint([0, 0], { name: 'Test', category: 'Test' });
      const state1 = service.getState();
      const state2 = service.getState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2); // Different object references
      expect(state1.features).not.toBe(state2.features); // Different array references
    });
  });

  describe('addPoint()', () => {
    it('should add a point with valid coordinates', () => {
      service.addPoint([10, 20], { name: 'Test Point', category: 'Monument' });
      const state = service.getState();

      expect(state.features.length).toBe(1);
      expect(state.features[0].geometry.coordinates).toEqual([10, 20]);
      expect(state.features[0].properties.name).toBe('Test Point');
      expect(state.features[0].properties.category).toBe('Monument');
    });

    it('should generate a unique UUID for each point', () => {
      service.addPoint([0, 0], { name: 'Point 1', category: 'Cat1' });
      service.addPoint([1, 1], { name: 'Point 2', category: 'Cat2' });
      const state = service.getState();

      expect(state.features[0].id).toBeTruthy();
      expect(state.features[1].id).toBeTruthy();
      expect(state.features[0].id).not.toBe(state.features[1].id);
    });

    it('should generate valid UUID v4 format', () => {
      service.addPoint([0, 0], { name: 'Test', category: 'Test' });
      const state = service.getState();
      const uuid = state.features[0].id;

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(uuid)).toBe(true);
    });

    it('should preserve additional properties beyond name and category', () => {
      const properties: PointProperties = {
        name: 'Test',
        category: 'Monument',
        description: 'A test monument',
        yearBuilt: 1950,
        customField: 'custom value',
      };

      service.addPoint([0, 0], properties);
      const state = service.getState();
      const addedPoint = state.features[0];

      expect(addedPoint.properties.name).toBe('Test');
      expect(addedPoint.properties.category).toBe('Monument');
      expect(addedPoint.properties['description']).toBe('A test monument');
      expect(addedPoint.properties['yearBuilt']).toBe(1950);
      expect(addedPoint.properties['customField']).toBe('custom value');
    });

    it('should emit stateChanged$ event when point is added', () => {
      return new Promise<void>((resolve) => {
        service.stateChanged$.subscribe((state) => {
          if (state.features.length > 0) {
            expect(state.features.length).toBe(1);
            resolve();
          }
        });

        service.addPoint([0, 0], { name: 'Test', category: 'Test' });
      });
    });

    it('should add multiple points', () => {
      service.addPoint([0, 0], { name: 'Point 1', category: 'Cat1' });
      service.addPoint([1, 1], { name: 'Point 2', category: 'Cat2' });
      service.addPoint([2, 2], { name: 'Point 3', category: 'Cat3' });

      const state = service.getState();
      expect(state.features.length).toBe(3);
    });
  });

  describe('updatePoint()', () => {
    beforeEach(() => {
      service.addPoint([0, 0], {
        name: 'Original Name',
        category: 'Original Category',
        description: 'Original description',
      });
    });

    it('should update point properties', () => {
      const state = service.getState();
      const pointId = state.features[0].id;

      service.updatePoint(pointId, { name: 'Updated Name' });
      const updatedState = service.getState();

      expect(updatedState.features[0].properties.name).toBe('Updated Name');
    });

    it('should preserve additional properties when updating', () => {
      const state = service.getState();
      const pointId = state.features[0].id;

      service.updatePoint(pointId, { name: 'New Name' });
      const updatedState = service.getState();

      expect(updatedState.features[0].properties.name).toBe('New Name');
      expect(updatedState.features[0].properties.category).toBe('Original Category');
      expect(updatedState.features[0].properties['description']).toBe('Original description');
    });

    it('should update multiple properties at once', () => {
      const state = service.getState();
      const pointId = state.features[0].id;

      service.updatePoint(pointId, {
        name: 'New Name',
        category: 'New Category',
      });

      const updatedState = service.getState();
      expect(updatedState.features[0].properties.name).toBe('New Name');
      expect(updatedState.features[0].properties.category).toBe('New Category');
      expect(updatedState.features[0].properties['description']).toBe('Original description');
    });

    it('should add new properties while preserving existing ones', () => {
      const state = service.getState();
      const pointId = state.features[0].id;

      service.updatePoint(pointId, {
        newProperty: 'new value',
      });

      const updatedState = service.getState();
      expect(updatedState.features[0].properties.name).toBe('Original Name');
      expect(updatedState.features[0].properties.category).toBe('Original Category');
      expect(updatedState.features[0].properties['description']).toBe('Original description');
      expect(updatedState.features[0].properties['newProperty']).toBe('new value');
    });

    it('should not update if point ID does not exist', () => {
      const originalState = service.getState();
      service.updatePoint('non-existent-id', { name: 'Should not update' });
      const newState = service.getState();

      expect(newState).toEqual(originalState);
    });

    it('should emit stateChanged$ event when point is updated', () => {
      const state = service.getState();
      const pointId = state.features[0].id;

      return new Promise<void>((resolve) => {
        let emitCount = 0;
        service.stateChanged$.subscribe((newState) => {
          emitCount++;
          if (emitCount === 2) {
            // First emit is from addPoint, second is from updatePoint
            expect(newState.features[0].properties.name).toBe('Updated Name');
            resolve();
          }
        });

        service.updatePoint(pointId, { name: 'Updated Name' });
      });
    });
  });

  describe('deletePoint()', () => {
    beforeEach(() => {
      service.addPoint([0, 0], { name: 'Point 1', category: 'Cat1' });
      service.addPoint([1, 1], { name: 'Point 2', category: 'Cat2' });
      service.addPoint([2, 2], { name: 'Point 3', category: 'Cat3' });
    });

    it('should delete a point by ID', () => {
      const state = service.getState();
      const pointIdToDelete = state.features[1].id;

      service.deletePoint(pointIdToDelete);
      const updatedState = service.getState();

      expect(updatedState.features.length).toBe(2);
      expect(updatedState.features.some((f) => f.id === pointIdToDelete)).toBe(false);
    });

    it('should remove the correct point when multiple exist', () => {
      const state = service.getState();
      const pointIdToDelete = state.features[1].id;
      const remainingIds = [state.features[0].id, state.features[2].id];

      service.deletePoint(pointIdToDelete);
      const updatedState = service.getState();

      expect(updatedState.features.length).toBe(2);
      expect(updatedState.features[0].id).toBe(remainingIds[0]);
      expect(updatedState.features[1].id).toBe(remainingIds[1]);
    });

    it('should not throw error when deleting non-existent point', () => {
      expect(() => {
        service.deletePoint('non-existent-id');
      }).not.toThrow();
    });

    it('should not change state when deleting non-existent point', () => {
      const originalState = service.getState();
      service.deletePoint('non-existent-id');
      const newState = service.getState();

      expect(newState.features.length).toBe(originalState.features.length);
    });

    it('should emit stateChanged$ event when point is deleted', () => {
      service.addPoint([0, 0], { name: 'Point 1', category: 'Cat1' });
      service.addPoint([1, 1], { name: 'Point 2', category: 'Cat2' });
      service.addPoint([2, 2], { name: 'Point 3', category: 'Cat3' });

      const state = service.getState();
      const pointIdToDelete = state.features[1].id;
      const initialLength = state.features.length;

      return new Promise<void>((resolve) => {
        let hasEmitted = false;
        service.stateChanged$.subscribe((newState) => {
          if (!hasEmitted) {
            hasEmitted = true;
            // Skip the initial emit (BehaviorSubject behavior)
            return;
          }
          expect(newState.features.length).toBe(initialLength - 1);
          resolve();
        });

        service.deletePoint(pointIdToDelete);
      });
    });

    it('should delete all points one by one', () => {
      const state = service.getState();
      const ids = state.features.map((f) => f.id);

      ids.forEach((id) => {
        service.deletePoint(id);
      });

      const finalState = service.getState();
      expect(finalState.features.length).toBe(0);
    });
  });

  describe('setState()', () => {
    it('should replace entire state with new FeatureCollection', () => {
      service.addPoint([0, 0], { name: 'Old Point', category: 'Old' });

      const newState: FeatureCollection = {
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
              name: 'New Point 1',
              category: 'New',
            },
          },
          {
            type: 'Feature',
            id: 'test-id-2',
            geometry: {
              type: 'Point',
              coordinates: [30, 40],
            },
            properties: {
              name: 'New Point 2',
              category: 'New',
            },
          },
        ],
      };

      service.setState(newState);
      const currentState = service.getState();

      expect(currentState.features.length).toBe(2);
      expect(currentState.features[0].properties.name).toBe('New Point 1');
      expect(currentState.features[1].properties.name).toBe('New Point 2');
    });

    it('should replace state with empty FeatureCollection', () => {
      service.addPoint([0, 0], { name: 'Point', category: 'Cat' });

      const emptyState: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      service.setState(emptyState);
      const currentState = service.getState();

      expect(currentState.features.length).toBe(0);
    });

    it('should preserve additional properties in new state', () => {
      const newState: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Test',
              category: 'Test',
              description: 'Test description',
              customField: 'custom value',
            },
          },
        ],
      };

      service.setState(newState);
      const currentState = service.getState();

      expect(currentState.features[0].properties['description']).toBe('Test description');
      expect(currentState.features[0].properties['customField']).toBe('custom value');
    });

    it('should emit stateChanged$ event when state is set', () => {
      const newState: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Test',
              category: 'Test',
            },
          },
        ],
      };

      return new Promise<void>((resolve) => {
        service.stateChanged$.subscribe((state) => {
          if (state.features.length === 1) {
            expect(state.features[0].properties.name).toBe('Test');
            resolve();
          }
        });

        service.setState(newState);
      });
    });

    it('should create a deep copy of the new state', () => {
      const newState: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Test',
              category: 'Test',
            },
          },
        ],
      };

      service.setState(newState);

      // Modify the original state object
      newState.features[0].properties.name = 'Modified';

      const currentState = service.getState();
      expect(currentState.features[0].properties.name).toBe('Test');
    });
  });

  describe('getPointById()', () => {
    beforeEach(() => {
      service.addPoint([0, 0], { name: 'Point 1', category: 'Cat1' });
      service.addPoint([1, 1], { name: 'Point 2', category: 'Cat2' });
    });

    it('should return a point by ID', () => {
      const state = service.getState();
      const pointId = state.features[0].id;

      const point = service.getPointById(pointId);

      expect(point).toBeTruthy();
      expect(point?.properties.name).toBe('Point 1');
    });

    it('should return null for non-existent ID', () => {
      const point = service.getPointById('non-existent-id');
      expect(point).toBeNull();
    });

    it('should return a deep copy of the point', () => {
      const state = service.getState();
      const pointId = state.features[0].id;

      const point1 = service.getPointById(pointId);
      const point2 = service.getPointById(pointId);

      expect(point1).toEqual(point2);
      expect(point1).not.toBe(point2);
    });

    it('should return point with all properties', () => {
      service.addPoint([5, 5], {
        name: 'Test',
        category: 'Test',
        description: 'Test description',
        customField: 'custom',
      });

      const state = service.getState();
      const pointId = state.features[2].id;

      const point = service.getPointById(pointId);

      expect(point?.properties.name).toBe('Test');
      expect(point?.properties.category).toBe('Test');
      expect(point?.properties['description']).toBe('Test description');
      expect(point?.properties['customField']).toBe('custom');
    });
  });

  describe('stateChanged$ Observable', () => {
    it('should emit initial state on subscription', () => {
      return new Promise<void>((resolve) => {
        service.stateChanged$.subscribe((state) => {
          expect(state.type).toBe('FeatureCollection');
          expect(Array.isArray(state.features)).toBe(true);
          resolve();
        });
      });
    });

    it('should emit updated state after addPoint', () => {
      return new Promise<void>((resolve) => {
        let emitCount = 0;

        service.stateChanged$.subscribe((state) => {
          emitCount++;
          if (emitCount === 2) {
            // First emit is initial, second is after addPoint
            expect(state.features.length).toBe(1);
            resolve();
          }
        });

        service.addPoint([0, 0], { name: 'Test', category: 'Test' });
      });
    });

    it('should emit updated state after updatePoint', () => {
      service.addPoint([0, 0], { name: 'Original', category: 'Test' });

      const state = service.getState();
      const pointId = state.features[0].id;

      return new Promise<void>((resolve) => {
        let hasEmitted = false;
        service.stateChanged$.subscribe((newState) => {
          if (!hasEmitted) {
            hasEmitted = true;
            // Skip the initial emit (BehaviorSubject behavior)
            return;
          }
          expect(newState.features[0].properties.name).toBe('Updated');
          resolve();
        });

        service.updatePoint(pointId, { name: 'Updated' });
      });
    });

    it('should emit updated state after deletePoint', () => {
      service.addPoint([0, 0], { name: 'Point', category: 'Test' });

      const state = service.getState();
      const pointId = state.features[0].id;

      return new Promise<void>((resolve) => {
        let hasEmitted = false;
        service.stateChanged$.subscribe((newState) => {
          if (!hasEmitted) {
            hasEmitted = true;
            // Skip the initial emit (BehaviorSubject behavior)
            return;
          }
          expect(newState.features.length).toBe(0);
          resolve();
        });

        service.deletePoint(pointId);
      });
    });

    it('should allow multiple subscribers', () => {
      return new Promise<void>((resolve) => {
        let subscriber1Count = 0;
        let subscriber2Count = 0;

        service.stateChanged$.subscribe(() => {
          subscriber1Count++;
        });

        service.stateChanged$.subscribe(() => {
          subscriber2Count++;
        });

        service.addPoint([0, 0], { name: 'Test', category: 'Test' });

        setTimeout(() => {
          expect(subscriber1Count).toBe(2); // Initial + addPoint
          expect(subscriber2Count).toBe(2); // Initial + addPoint
          resolve();
        }, 100);
      });
    });
  });

  describe('Integration tests', () => {
    it('should handle complex workflow: add, update, delete', () => {
      // Add points
      service.addPoint([0, 0], { name: 'Point 1', category: 'Cat1', description: 'Desc 1' });
      service.addPoint([1, 1], { name: 'Point 2', category: 'Cat2', description: 'Desc 2' });
      service.addPoint([2, 2], { name: 'Point 3', category: 'Cat3', description: 'Desc 3' });

      let state = service.getState();
      expect(state.features.length).toBe(3);

      // Update middle point
      const middlePointId = state.features[1].id;
      service.updatePoint(middlePointId, { name: 'Updated Point 2' });

      state = service.getState();
      expect(state.features[1].properties.name).toBe('Updated Point 2');
      expect(state.features[1].properties['description']).toBe('Desc 2'); // Preserved

      // Delete first point
      const firstPointId = state.features[0].id;
      service.deletePoint(firstPointId);

      state = service.getState();
      expect(state.features.length).toBe(2);
      expect(state.features[0].properties.name).toBe('Updated Point 2');
      expect(state.features[1].properties.name).toBe('Point 3');
    });

    it('should handle setState followed by modifications', () => {
      const initialState: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'id-1',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Initial Point', category: 'Initial' },
          },
        ],
      };

      service.setState(initialState);
      service.addPoint([1, 1], { name: 'New Point', category: 'New' });

      const state = service.getState();
      expect(state.features.length).toBe(2);
      expect(state.features[0].properties.name).toBe('Initial Point');
      expect(state.features[1].properties.name).toBe('New Point');
    });
  });
});
