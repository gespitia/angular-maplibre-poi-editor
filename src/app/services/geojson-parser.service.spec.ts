import { TestBed } from '@angular/core/testing';
import { GeoJSONParserService, ParseResult, InvalidFeature } from './geojson-parser.service';
import { CoordinateValidatorService } from './coordinate-validator.service';
import { FormValidatorService } from './form-validator.service';

describe('GeoJSONParserService', () => {
  let service: GeoJSONParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoJSONParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateFeatureCollection', () => {
    it('should accept valid FeatureCollection', () => {
      const data = {
        type: 'FeatureCollection',
        features: [],
      };
      const result = service.validateFeatureCollection(data);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject non-FeatureCollection type', () => {
      const data = {
        type: 'Feature',
        features: [],
      };
      const result = service.validateFeatureCollection(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('FeatureCollection');
    });

    it('should reject missing features array', () => {
      const data = {
        type: 'FeatureCollection',
      };
      const result = service.validateFeatureCollection(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('features');
    });

    it('should reject non-array features', () => {
      const data = {
        type: 'FeatureCollection',
        features: 'not an array',
      };
      const result = service.validateFeatureCollection(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject null data', () => {
      const result = service.validateFeatureCollection(null);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject non-object data', () => {
      const result = service.validateFeatureCollection('string');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validatePoint', () => {
    it('should accept valid Point feature', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          name: 'Test Point',
          category: 'Test Category',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should accept Point with additional properties', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [45.5, 23.5],
        },
        properties: {
          name: 'Test Point',
          category: 'Test Category',
          description: 'Additional property',
          customField: 123,
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject non-Point geometry', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[0, 0], [1, 1]],
        },
        properties: {
          name: 'Test',
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Point');
    });

    it('should reject feature with invalid type', () => {
      const feature = {
        type: 'NotFeature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          name: 'Test',
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with missing geometry', () => {
      const feature = {
        type: 'Feature',
        properties: {
          name: 'Test',
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('geometry');
    });

    it('should reject feature with invalid coordinates', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [181, 0],
        },
        properties: {
          name: 'Test',
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with out-of-range latitude', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 91],
        },
        properties: {
          name: 'Test',
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with missing name property', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with missing category property', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          name: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with empty name', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          name: '',
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with empty category', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          name: 'Test',
          category: '',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with non-string name', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          name: 123,
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with non-string category', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          name: 'Test',
          category: 123,
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with missing properties', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with null properties', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: null,
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject feature with invalid coordinates array', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0],
        },
        properties: {
          name: 'Test',
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept boundary coordinate values', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [180, 90],
        },
        properties: {
          name: 'Test',
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(true);
    });

    it('should accept negative boundary coordinate values', () => {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-180, -90],
        },
        properties: {
          name: 'Test',
          category: 'Test',
        },
      };
      const result = service.validatePoint(feature);
      expect(result.isValid).toBe(true);
    });
  });

  describe('parse', () => {
    it('should parse valid FeatureCollection with single Point', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Test Point',
              category: 'Test Category',
            },
          },
        ],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(1);
      expect(result.invalidFeatures.length).toBe(0);
      expect(result.errors.length).toBe(0);
      expect(result.validFeatures[0].properties.name).toBe('Test Point');
      expect(result.validFeatures[0].properties.category).toBe('Test Category');
    });

    it('should parse valid FeatureCollection with multiple Points', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Point 1',
              category: 'Category 1',
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [45, 45],
            },
            properties: {
              name: 'Point 2',
              category: 'Category 2',
            },
          },
        ],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(2);
      expect(result.invalidFeatures.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });

    it('should reject non-Point features', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[0, 0], [1, 1]],
            },
            properties: {
              name: 'Line',
              category: 'Test',
            },
          },
        ],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(0);
      expect(result.invalidFeatures.length).toBe(1);
      expect(result.errors.length).toBe(0);
      expect(result.invalidFeatures[0].reason).toContain('Point');
    });

    it('should filter Point features and reject non-Point geometries', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Valid Point',
              category: 'Test',
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            },
            properties: {
              name: 'Polygon',
              category: 'Test',
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [45, 45],
            },
            properties: {
              name: 'Another Point',
              category: 'Test',
            },
          },
        ],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(2);
      expect(result.invalidFeatures.length).toBe(1);
      expect(result.errors.length).toBe(0);
    });

    it('should validate coordinates are within valid ranges', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [181, 0],
            },
            properties: {
              name: 'Invalid Longitude',
              category: 'Test',
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 91],
            },
            properties: {
              name: 'Invalid Latitude',
              category: 'Test',
            },
          },
        ],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(0);
      expect(result.invalidFeatures.length).toBe(2);
      expect(result.errors.length).toBe(0);
    });

    it('should validate required properties (name and category)', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Test',
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [45, 45],
            },
            properties: {
              category: 'Test',
            },
          },
        ],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(0);
      expect(result.invalidFeatures.length).toBe(2);
      expect(result.errors.length).toBe(0);
    });

    it('should preserve additional properties beyond name and category', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Test Point',
              category: 'Test Category',
              description: 'A test point',
              customField: 123,
              nested: { key: 'value' },
            },
          },
        ],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(1);
      expect(result.validFeatures[0].properties.name).toBe('Test Point');
      expect(result.validFeatures[0].properties.category).toBe('Test Category');
      expect(result.validFeatures[0].properties['description']).toBe('A test point');
      expect(result.validFeatures[0].properties['customField']).toBe(123);
      expect((result.validFeatures[0].properties['nested'] as Record<string, unknown>)['key']).toBe('value');
    });

    it('should handle invalid JSON', async () => {
      const file = new File(['{ invalid json }'], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(0);
      expect(result.invalidFeatures.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid JSON');
    });

    it('should handle non-FeatureCollection root object', async () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0],
        },
        properties: {
          name: 'Test',
          category: 'Test',
        },
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(0);
      expect(result.invalidFeatures.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('FeatureCollection');
    });

    it('should generate unique IDs for valid features', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Point 1',
              category: 'Test',
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [45, 45],
            },
            properties: {
              name: 'Point 2',
              category: 'Test',
            },
          },
        ],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(2);
      expect(result.validFeatures[0].id).toBeDefined();
      expect(result.validFeatures[1].id).toBeDefined();
      expect(result.validFeatures[0].id).not.toBe(result.validFeatures[1].id);
      // Check UUID v4 format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(result.validFeatures[0].id).toMatch(uuidRegex);
      expect(result.validFeatures[1].id).toMatch(uuidRegex);
    });

    it('should collect detailed error information for invalid features', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [181, 0],
            },
            properties: {
              name: 'Invalid Coordinates',
              category: 'Test',
            },
          },
        ],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.invalidFeatures.length).toBe(1);
      expect(result.invalidFeatures[0].feature).toBeDefined();
      expect(result.invalidFeatures[0].reason).toBeDefined();
      expect(result.invalidFeatures[0].reason).toContain('Longitude');
    });

    it('should handle empty FeatureCollection', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(0);
      expect(result.invalidFeatures.length).toBe(0);
      expect(result.errors.length).toBe(0);
    });

    it('should handle mixed valid and invalid features', async () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Valid Point',
              category: 'Test',
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [181, 0],
            },
            properties: {
              name: 'Invalid Coordinates',
              category: 'Test',
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [45, 45],
            },
            properties: {
              name: 'Another Valid Point',
              category: 'Test',
            },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: {
              name: 'Missing Category',
            },
          },
        ],
      };

      const file = new File([JSON.stringify(geojson)], 'test.geojson', { type: 'application/json' });
      const result = await service.parse(file);

      expect(result.validFeatures.length).toBe(2);
      expect(result.invalidFeatures.length).toBe(2);
      expect(result.errors.length).toBe(0);
    });
  });
});
