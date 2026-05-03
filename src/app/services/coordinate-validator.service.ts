import { Injectable } from '@angular/core';
import type { ValidationError } from '../types/error.types';
import type { ValidationResult } from '../types/common.types';

/**
 * Coordinate Validator Service - Validates geographic coordinates
 *
 * Responsibilities:
 * - Validate longitude in range [-180, 180]
 * - Validate latitude in range [-90, 90]
 * - Validate coordinate pairs
 * - Provide clear error messages
 *
 * Validates: Requirements 10.1, 10.2
 */
@Injectable({
  providedIn: 'root',
})
export class CoordinateValidatorService {
  constructor() {}

  /**
   * Validate a pair of coordinates [longitude, latitude]
   * @param coordinates - [longitude, latitude] pair
   * @returns ValidationResult with isValid flag and error messages
   */
  public validate(coordinates: [number, number]): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if coordinates is an array with exactly 2 elements
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return {
        isValid: false,
        errors: [
          {
            field: 'coordinates',
            message: 'Coordinates must be an array with exactly 2 elements [longitude, latitude]',
          },
        ],
      };
    }

    const [longitude, latitude]: [number, number] = coordinates;

    // Validate longitude
    const longitudeResult: ValidationResult = this.validateLongitude(longitude);
    if (!longitudeResult.isValid) {
      errors.push(...longitudeResult.errors);
    }

    // Validate latitude
    const latitudeResult: ValidationResult = this.validateLatitude(latitude);
    if (!latitudeResult.isValid) {
      errors.push(...latitudeResult.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate longitude value
   * @param longitude - Longitude value to validate
   * @returns ValidationResult with isValid flag and error messages
   */
  public validateLongitude(longitude: number): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if longitude is a number
    if (typeof longitude !== 'number' || isNaN(longitude)) {
      return {
        isValid: false,
        errors: [
          {
            field: 'longitude',
            message: 'Longitude must be a valid number',
          },
        ],
      };
    }

    // Check if longitude is in valid range [-180, 180]
    if (longitude < -180 || longitude > 180) {
      errors.push({
        field: 'longitude',
        message: `Longitude must be between -180 and 180, got ${longitude}`,
        value: longitude,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate latitude value
   * @param latitude - Latitude value to validate
   * @returns ValidationResult with isValid flag and error messages
   */
  public validateLatitude(latitude: number): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if latitude is a number
    if (typeof latitude !== 'number' || isNaN(latitude)) {
      return {
        isValid: false,
        errors: [
          {
            field: 'latitude',
            message: 'Latitude must be a valid number',
          },
        ],
      };
    }

    // Check if latitude is in valid range [-90, 90]
    if (latitude < -90 || latitude > 90) {
      errors.push({
        field: 'latitude',
        message: `Latitude must be between -90 and 90, got ${latitude}`,
        value: latitude,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
