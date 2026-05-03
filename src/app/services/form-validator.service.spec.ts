import { TestBed } from '@angular/core/testing';
import { FormValidatorService } from './form-validator.service';

describe('FormValidatorService', () => {
  let service: FormValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateName', () => {
    it('should accept valid non-empty names', () => {
      const testCases = ['Monument', 'Restaurant', 'A', 'Very Long Name With Spaces'];
      testCases.forEach((name) => {
        const result = service.validateName(name);
        expect(result.isValid).toBe(true, `Failed for name: ${name}`);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject empty string', () => {
      const result = service.validateName('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('cannot be empty');
    });

    it('should reject whitespace-only strings', () => {
      const testCases = [' ', '  ', '\t', '\n', '   \t  '];
      testCases.forEach((name) => {
        const result = service.validateName(name);
        expect(result.isValid).toBe(false, `Failed for name: "${name}"`);
        expect(result.errors[0].message).toContain('cannot be empty');
      });
    });

    it('should reject non-string values', () => {
      const testCases = [null, undefined, 123, {}, [], true];
      testCases.forEach((name) => {
        const result = service.validateName(name);
        expect(result.isValid).toBe(false, `Failed for name: ${name}`);
        expect(result.errors[0].message).toContain('must be a string');
      });
    });

    it('should accept names with leading/trailing spaces after trim', () => {
      const result = service.validateName('  Monument  ');
      expect(result.isValid).toBe(true);
    });

    it('should accept names with special characters', () => {
      const testCases = ['Café', 'Musée d\'Art', 'Point-of-Interest', 'POI #1'];
      testCases.forEach((name) => {
        const result = service.validateName(name);
        expect(result.isValid).toBe(true, `Failed for name: ${name}`);
      });
    });
  });

  describe('validateCategory', () => {
    it('should accept valid non-empty categories', () => {
      const testCases = ['Monument', 'Restaurant', 'Museum', 'Park'];
      testCases.forEach((category) => {
        const result = service.validateCategory(category);
        expect(result.isValid).toBe(true, `Failed for category: ${category}`);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject empty string', () => {
      const result = service.validateCategory('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('cannot be empty');
    });

    it('should reject whitespace-only strings', () => {
      const testCases = [' ', '  ', '\t', '\n', '   \t  '];
      testCases.forEach((category) => {
        const result = service.validateCategory(category);
        expect(result.isValid).toBe(false, `Failed for category: "${category}"`);
        expect(result.errors[0].message).toContain('cannot be empty');
      });
    });

    it('should reject non-string values', () => {
      const testCases = [null, undefined, 123, {}, [], true];
      testCases.forEach((category) => {
        const result = service.validateCategory(category);
        expect(result.isValid).toBe(false, `Failed for category: ${category}`);
        expect(result.errors[0].message).toContain('must be a string');
      });
    });

    it('should accept categories with leading/trailing spaces after trim', () => {
      const result = service.validateCategory('  Museum  ');
      expect(result.isValid).toBe(true);
    });

    it('should accept single character categories', () => {
      const result = service.validateCategory('A');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validatePointProperties', () => {
    it('should accept valid point properties', () => {
      const testCases = [
        { name: 'Monument', category: 'Historical' },
        { name: 'Restaurant', category: 'Food', extra: 'data' },
        { name: 'A', category: 'B', custom1: 'value1', custom2: 123 },
      ];
      testCases.forEach((properties) => {
        const result = service.validatePointProperties(properties);
        expect(result.isValid).toBe(true, `Failed for properties: ${JSON.stringify(properties)}`);
        expect(result.errors.length).toBe(0);
      });
    });

    it('should reject properties with invalid name', () => {
      const result = service.validatePointProperties({
        name: '',
        category: 'Valid',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject properties with invalid category', () => {
      const result = service.validatePointProperties({
        name: 'Valid',
        category: '   ',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject properties with both invalid name and category', () => {
      const result = service.validatePointProperties({
        name: '',
        category: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(2);
    });

    it('should reject non-object properties', () => {
      const testCases = [null, undefined, 'string', 123];
      testCases.forEach((properties) => {
        const result = service.validatePointProperties(properties);
        expect(result.isValid).toBe(false, `Failed for properties: ${properties}`);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should accept properties with additional custom fields', () => {
      const result = service.validatePointProperties({
        name: 'Monument',
        category: 'Historical',
        description: 'A beautiful monument',
        yearBuilt: 1850,
        architect: 'John Doe',
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject properties with non-string name', () => {
      const result = service.validatePointProperties({
        name: 123,
        category: 'Valid',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Name must be a string');
    });

    it('should reject properties with non-string category', () => {
      const result = service.validatePointProperties({
        name: 'Valid',
        category: 123,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Category must be a string');
    });

    it('should reject properties missing name field', () => {
      const result = service.validatePointProperties({
        category: 'Valid',
      });
      expect(result.isValid).toBe(false);
    });

    it('should reject properties missing category field', () => {
      const result = service.validatePointProperties({
        name: 'Valid',
      });
      expect(result.isValid).toBe(false);
    });
  });
});
