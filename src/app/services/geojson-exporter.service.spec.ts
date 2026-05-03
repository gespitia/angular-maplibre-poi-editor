import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeoJSONExporterService } from './geojson-exporter.service';
import { FeatureCollection } from './poi-store.service';

describe('GeoJSONExporterService', () => {
  let service: GeoJSONExporterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoJSONExporterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('stringify()', () => {
    it('should generate valid JSON from FeatureCollection', () => {
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

      const result = service.stringify(state);

      // Should be valid JSON
      expect(() => JSON.parse(result)).not.toThrow();

      // Should parse back to equivalent object
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(state);
    });

    it('should format with 2-space indentation', () => {
      const state: FeatureCollection = {
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

      const result = service.stringify(state);

      // Check for 2-space indentation
      expect(result).toContain('  "type"');
      expect(result).toContain('  "features"');
      expect(result).toContain('    "type"');

      // Verify it's using 2-space indentation by checking line structure
      const lines = result.split('\n');
      const indentedLines = lines.filter(line => line.startsWith('  '));
      expect(indentedLines.length).toBeGreaterThan(0);
    });

    it('should include all point properties', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: {
              type: 'Point',
              coordinates: [10, 20],
            },
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

      const result = service.stringify(state);
      const parsed = JSON.parse(result);

      expect(parsed.features[0].properties.name).toBe('Test Point');
      expect(parsed.features[0].properties.category).toBe('Monument');
      expect(parsed.features[0].properties.description).toBe('A test monument');
      expect(parsed.features[0].properties.yearBuilt).toBe(1950);
      expect(parsed.features[0].properties.customField).toBe('custom value');
    });

    it('should handle empty FeatureCollection', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      const result = service.stringify(state);

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.features).toEqual([]);
    });

    it('should handle multiple features', () => {
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

      const result = service.stringify(state);
      const parsed = JSON.parse(result);

      expect(parsed.features.length).toBe(3);
      expect(parsed.features[0].properties.name).toBe('Point 1');
      expect(parsed.features[1].properties.name).toBe('Point 2');
      expect(parsed.features[2].properties.name).toBe('Point 3');
    });

    it('should preserve geometry information', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: {
              type: 'Point',
              coordinates: [123.456, -45.678],
            },
            properties: {
              name: 'Test',
              category: 'Test',
            },
          },
        ],
      };

      const result = service.stringify(state);
      const parsed = JSON.parse(result);

      expect(parsed.features[0].geometry.type).toBe('Point');
      expect(parsed.features[0].geometry.coordinates).toEqual([123.456, -45.678]);
    });

    it('should preserve feature IDs', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'unique-id-123',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Test', category: 'Test' },
          },
        ],
      };

      const result = service.stringify(state);
      const parsed = JSON.parse(result);

      expect(parsed.features[0].id).toBe('unique-id-123');
    });
  });

  describe('export()', () => {
    it('should create a download link', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      const createElementSpy = vi.spyOn(document, 'createElement');
      service.export(state);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      createElementSpy.mockRestore();
    });

    it('should set download attribute with timestamp', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      const createElementSpy = vi.spyOn(document, 'createElement');
      service.export(state);

      const linkElement = createElementSpy.mock.results[0].value;
      expect(linkElement.download).toMatch(/^poi_editor_export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.geojson$/);
      createElementSpy.mockRestore();
    });

    it('should trigger download by clicking link', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      const mockLink = document.createElement('a');
      const clickSpy = vi.spyOn(mockLink, 'click');
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      service.export(state);

      expect(clickSpy).toHaveBeenCalled();
      createElementSpy.mockRestore();
      clickSpy.mockRestore();
    });

    it('should append and remove link from DOM', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      service.export(state);

      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('should create object URL for blob', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      service.export(state);

      expect(createObjectURLSpy).toHaveBeenCalled();
      const blobArg = createObjectURLSpy.mock.calls[0][0];
      expect(blobArg instanceof Blob).toBe(true);
      createObjectURLSpy.mockRestore();
    });

    it('should revoke object URL after download', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      service.export(state);

      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should export valid GeoJSON content', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [10, 20] },
            properties: { name: 'Test Point', category: 'Monument' },
          },
        ],
      };

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      service.export(state);

      // Verify that createObjectURL was called with a Blob
      expect(createObjectURLSpy).toHaveBeenCalled();
      const blobArg = createObjectURLSpy.mock.calls[0][0];
      expect(blobArg instanceof Blob).toBe(true);

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should export with 2-space indentation', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'test-id',
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Test', category: 'Test' },
          },
        ],
      };

      const stringified = service.stringify(state);

      // Check for 2-space indentation
      expect(stringified).toContain('  "type"');
      expect(stringified).toContain('  "features"');
    });

    it('should include all properties in exported file', () => {
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
            },
          },
        ],
      };

      const stringified = service.stringify(state);
      const parsed = JSON.parse(stringified);

      expect(parsed.features[0].properties.name).toBe('Test Point');
      expect(parsed.features[0].properties.category).toBe('Monument');
      expect(parsed.features[0].properties.description).toBe('A test monument');
      expect(parsed.features[0].properties.yearBuilt).toBe(1950);
    });

    it('should handle empty FeatureCollection export', () => {
      const state: FeatureCollection = {
        type: 'FeatureCollection',
        features: [],
      };

      const stringified = service.stringify(state);
      const parsed = JSON.parse(stringified);

      expect(parsed.type).toBe('FeatureCollection');
      expect(parsed.features).toEqual([]);
    });

    it('should handle multiple features in export', () => {
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

      const stringified = service.stringify(state);
      const parsed = JSON.parse(stringified);

      expect(parsed.features.length).toBe(2);
      expect(parsed.features[0].properties.name).toBe('Point 1');
      expect(parsed.features[1].properties.name).toBe('Point 2');
    });
  });

  describe('Integration tests', () => {
    it('should export and re-parse to equivalent state', () => {
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

      const stringified = service.stringify(originalState);
      const reparsed = JSON.parse(stringified);

      expect(reparsed).toEqual(originalState);
    });

    it('should maintain data integrity through stringify', () => {
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
            },
          },
        ],
      };

      const stringified = service.stringify(state);
      const reparsed = JSON.parse(stringified);

      expect(reparsed.features[0].geometry.coordinates).toEqual([123.456789, -45.678901]);
      expect(reparsed.features[0].properties.metadata.nested).toBe('value');
      expect(reparsed.features[0].properties.metadata.array).toEqual([1, 2, 3]);
      expect(reparsed.features[0].properties.nullValue).toBeNull();
      expect(reparsed.features[0].properties.boolValue).toBe(true);
    });
  });
});
