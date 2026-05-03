import { Injectable } from '@angular/core';
import type { ValidationResult } from '../types/common.types';
import type { Feature, PointProperties } from '../types/geojson.types';
import { CoordinateValidatorService } from './coordinate-validator.service';
import { FormValidatorService } from './form-validator.service';
import { ErrorHandlerService } from './error-handler.service';

/**
 * Result of parsing a GeoJSON file
 */
export interface ParseResult {
  validFeatures: Feature[];
  invalidFeatures: InvalidFeature[];
  errors: string[];
}

/**
 * Represents an invalid feature with reason for rejection
 */
export interface InvalidFeature {
  feature: unknown;
  reason: string;
}

/**
 * GeoJSON Parser Service - Parses and validates GeoJSON files
 *
 * Responsibilities:
 * - Parse GeoJSON files and extract Feature objects
 * - Validate that root object is a FeatureCollection
 * - Filter only Point features and discard non-Point geometries
 * - Validate coordinates are within valid ranges (longitude [-180, 180], latitude [-90, 90])
 * - Validate each Point has required properties: name (string) and category (string)
 * - Preserve all additional properties beyond name and category
 * - Collect detailed error information for invalid features
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 10.1
 */
@Injectable({
  providedIn: 'root',
})
export class GeoJSONParserService {
  private readonly coordinateValidator: CoordinateValidatorService = new CoordinateValidatorService();
  private readonly formValidator: FormValidatorService = new FormValidatorService();

  constructor(private readonly errorHandler: ErrorHandlerService) {}

  /**
   * Parse a GeoJSON file
   * @param file - The File object to parse
   * @returns Promise<ParseResult> with valid features, invalid features, and errors
   */
  public async parse(file: File): Promise<ParseResult> {
    const result: ParseResult = {
      validFeatures: [],
      invalidFeatures: [],
      errors: [],
    };

    try {
      // Read file as text
      const text: string = await this.readFileAsText(file);

      // Parse JSON
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch (error) {
        result.errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return result;
      }

      // Validate FeatureCollection structure
      const fcValidation: ValidationResult = this.validateFeatureCollection(data);
      if (!fcValidation.isValid) {
        result.errors.push(...fcValidation.errors.map((e) => e.message));
        return result;
      }

      // Process each feature
      const dataObj = data as Record<string, unknown>;
      const features: unknown[] = (dataObj['features'] as unknown[]) || [];
      for (let i: number = 0; i < features.length; i++) {
        const feature: unknown = features[i];
        const pointValidation: ValidationResult = this.validatePoint(feature);

        if (pointValidation.isValid) {
          // Add valid feature with generated ID
          const featureObj = feature as Record<string, unknown>;
          const geometry = featureObj['geometry'] as Record<string, unknown>;
          const validFeature: Feature = {
            type: 'Feature',
            id: this.generateUUID(),
            geometry: {
              type: 'Point',
              coordinates: geometry['coordinates'] as [number, number],
            },
            properties: featureObj['properties'] as PointProperties,
          };
          result.validFeatures.push(validFeature);
        } else {
          // Collect invalid feature
          result.invalidFeatures.push({
            feature,
            reason: pointValidation.errors.map((e) => e.message).join('; '),
          });
        }
      }
    } catch (error) {
      result.errors.push(`Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Validate that the root object is a FeatureCollection
   * @param data - The parsed JSON data
   * @returns ValidationResult with isValid flag and error messages
   */
  public validateFeatureCollection(data: unknown): ValidationResult {
    const errors: string[] = [];

    // Check if data is an object
    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: [
          {
            field: 'root',
            message: 'Root object must be a valid object',
          },
        ],
      };
    }

    const dataObj = data as Record<string, unknown>;

    // Check if type is FeatureCollection
    if (dataObj['type'] !== 'FeatureCollection') {
      errors.push(`Root object must be a FeatureCollection, got type: ${dataObj['type'] || 'undefined'}`);
    }

    // Check if features is an array
    if (!Array.isArray(dataObj['features'])) {
      errors.push('FeatureCollection must have a "features" property that is an array');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.map((message) => ({
        field: 'FeatureCollection',
        message,
      })),
    };
  }

  /**
   * Validate a Point feature
   * @param feature - The feature to validate
   * @returns ValidationResult with isValid flag and error messages
   */
  public validatePoint(feature: unknown): ValidationResult {
    const errors: string[] = [];

    // Check if feature is an object
    if (!feature || typeof feature !== 'object') {
      return {
        isValid: false,
        errors: [
          {
            field: 'feature',
            message: 'Feature must be a valid object',
          },
        ],
      };
    }

    const featureObj = feature as Record<string, unknown>;

    // Check if type is Feature
    if (featureObj['type'] !== 'Feature') {
      errors.push(`Feature must have type "Feature", got: ${featureObj['type'] || 'undefined'}`);
    }

    // Check if geometry exists
    if (!featureObj['geometry'] || typeof featureObj['geometry'] !== 'object') {
      errors.push('Feature must have a valid geometry object');
      return {
        isValid: false,
        errors: errors.map((message) => ({
          field: 'geometry',
          message,
        })),
      };
    }

    const geometry = featureObj['geometry'] as Record<string, unknown>;

    // Check if geometry type is Point
    if (geometry['type'] !== 'Point') {
      errors.push(`Only Point geometries are supported, got: ${geometry['type'] || 'undefined'}`);
      return {
        isValid: false,
        errors: errors.map((message) => ({
          field: 'geometry.type',
          message,
        })),
      };
    }

    // Check if coordinates exist and are valid
    if (!Array.isArray(geometry['coordinates']) || (geometry['coordinates'] as unknown[]).length !== 2) {
      errors.push('Point geometry must have coordinates as [longitude, latitude]');
      return {
        isValid: false,
        errors: errors.map((message) => ({
          field: 'geometry.coordinates',
          message,
        })),
      };
    }

    // Validate coordinates
    const coordValidation: ValidationResult = this.coordinateValidator.validate(
      geometry['coordinates'] as [number, number]
    );
    if (!coordValidation.isValid) {
      errors.push(...coordValidation.errors.map((e) => e.message));
    }

    // Check if properties exist
    if (!featureObj['properties'] || typeof featureObj['properties'] !== 'object') {
      errors.push('Feature must have a properties object');
      return {
        isValid: false,
        errors: errors.map((message) => ({
          field: 'properties',
          message,
        })),
      };
    }

    // Validate properties (name and category)
    const propsValidation: ValidationResult = this.formValidator.validatePointProperties(
      featureObj['properties']
    );
    if (!propsValidation.isValid) {
      errors.push(...propsValidation.errors.map((e) => e.message));
    }

    return {
      isValid: errors.length === 0,
      errors: errors.map((message) => ({
        field: 'feature',
        message,
      })),
    };
  }

  /**
   * Read file as text
   * @param file - The File object to read
   * @returns Promise<string> with file contents
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader: FileReader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const content: string | ArrayBuffer | null = event.target?.result ?? null;
        if (typeof content === 'string') {
          resolve(content);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      reader.readAsText(file);
    });
  }

  /**
   * Generate a UUID v4
   * @returns A UUID v4 string
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c: string) {
      const r: number = (Math.random() * 16) | 0;
      const v: number = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
