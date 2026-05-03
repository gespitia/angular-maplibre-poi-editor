import { TestBed } from '@angular/core/testing';
import { CoordinateValidatorService } from './coordinate-validator.service';

describe('CoordinateValidatorService', () => {
  let service: CoordinateValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoordinateValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateLongitude', () => {
    it('should accept valid longitude values', () => {
      const testCases = [0, 180, -180, 90, -90, 45.5, -123.456];
      testCases.forEach((longitude) => {
        const result = service.validateLongitude(longitude);
        expect(result.isValid).toBe(true, `Failed for longitude: ${longitude}`);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject longitude values above 180', () => {
      const result = service.validateLongitude(181);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('between -180 and 180');
    });

    it('should reject longitude values below -180', () => {
      const result = service.validateLongitude(-181);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('between -180 and 180');
    });

    it('should reject non-numeric longitude values', () => {
      const testCases = ['180', null, undefined, {}, []];
      testCases.forEach((longitude) => {
        const result = service.validateLongitude(longitude as any);
        expect(result.isValid).toBe(false, `Failed for longitude: ${longitude}`);
        expect(result.errors[0].message).toContain('valid number');
      });
    });

    it('should reject NaN', () => {
      const result = service.validateLongitude(NaN);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('valid number');
    });

    it('should accept boundary values', () => {
      const result1 = service.validateLongitude(180);
      expect(result1.isValid).toBe(true);

      const result2 = service.validateLongitude(-180);
      expect(result2.isValid).toBe(true);
    });
  });

  describe('validateLatitude', () => {
    it('should accept valid latitude values', () => {
      const testCases = [0, 90, -90, 45, -45, 23.5, -67.89];
      testCases.forEach((latitude) => {
        const result = service.validateLatitude(latitude);
        expect(result.isValid).toBe(true, `Failed for latitude: ${latitude}`);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject latitude values above 90', () => {
      const result = service.validateLatitude(91);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('between -90 and 90');
    });

    it('should reject latitude values below -90', () => {
      const result = service.validateLatitude(-91);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('between -90 and 90');
    });

    it('should reject non-numeric latitude values', () => {
      const testCases = ['90', null, undefined, {}, []];
      testCases.forEach((latitude) => {
        const result = service.validateLatitude(latitude as any);
        expect(result.isValid).toBe(false, `Failed for latitude: ${latitude}`);
        expect(result.errors[0].message).toContain('valid number');
      });
    });

    it('should reject NaN', () => {
      const result = service.validateLatitude(NaN);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('valid number');
    });

    it('should accept boundary values', () => {
      const result1 = service.validateLatitude(90);
      expect(result1.isValid).toBe(true);

      const result2 = service.validateLatitude(-90);
      expect(result2.isValid).toBe(true);
    });
  });

  describe('validate', () => {
    it('should accept valid coordinate pairs', () => {
      const testCases: [number, number][] = [
        [0, 0],
        [180, 90],
        [-180, -90],
        [45.5, 23.5],
        [-123.456, 67.89],
      ];
      testCases.forEach((coordinates) => {
        const result = service.validate(coordinates);
        expect(result.isValid).toBe(true, `Failed for coordinates: ${coordinates}`);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject coordinates with invalid longitude', () => {
      const result = service.validate([181, 45]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject coordinates with invalid latitude', () => {
      const result = service.validate([45, 91]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject coordinates with both invalid longitude and latitude', () => {
      const result = service.validate([181, 91]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);
    });

    it('should reject non-array coordinates', () => {
      const testCases = [null, undefined, {}, 'string', 123];
      testCases.forEach((coordinates) => {
        const result = service.validate(coordinates as any);
        expect(result.isValid).toBe(false, `Failed for coordinates: ${coordinates}`);
        expect(result.errors[0].message).toContain('array');
      });
    });

    it('should reject arrays with wrong length', () => {
      const testCases: any[] = [[45], [45, 90, 0], []];
      testCases.forEach((coordinates) => {
        const result = service.validate(coordinates);
        expect(result.isValid).toBe(false, `Failed for coordinates: ${coordinates}`);
        expect(result.errors[0].message).toContain('exactly 2 elements');
      });
    });

    it('should accept boundary coordinate pairs', () => {
      const result1 = service.validate([180, 90]);
      expect(result1.isValid).toBe(true);

      const result2 = service.validate([-180, -90]);
      expect(result2.isValid).toBe(true);

      const result3 = service.validate([0, 0]);
      expect(result3.isValid).toBe(true);
    });

    it('should reject coordinates with non-numeric values', () => {
      const result = service.validate(['45' as any, 90]);
      expect(result.isValid).toBe(false);
    });
  });
});
