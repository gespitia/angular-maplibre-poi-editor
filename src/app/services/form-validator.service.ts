import { Injectable } from '@angular/core';
import type { ValidationResult } from '../types/common.types';
import type { ValidationError } from '../types/error.types';

/**
 * Form Validator Service - Validates user input from forms
 *
 * Responsibilities:
 * - Validate name as non-empty string
 * - Validate category as non-empty string
 * - Validate complete point properties
 * - Provide clear error messages
 *
 * Validates: Requirements 10.3, 10.4
 */
@Injectable({
  providedIn: 'root',
})
export class FormValidatorService {
  constructor() {}

  /**
   * Validate complete point properties
   * @param properties - Object containing name, category, and optional additional properties
   * @returns ValidationResult with isValid flag and error messages
   */
  public validatePointProperties(properties: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if properties is an object
    if (!properties || typeof properties !== 'object') {
      return {
        isValid: false,
        errors: [
          {
            field: 'properties',
            message: 'Properties must be a valid object',
          },
        ],
      };
    }

    const propsObj = properties as Record<string, unknown>;

    // Validate name
    const nameResult: ValidationResult = this.validateName(propsObj['name']);
    if (!nameResult.isValid) {
      errors.push(...nameResult.errors);
    }

    // Validate category
    const categoryResult: ValidationResult = this.validateCategory(propsObj['category']);
    if (!categoryResult.isValid) {
      errors.push(...categoryResult.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate name field
   * @param name - Name value to validate
   * @returns ValidationResult with isValid flag and error messages
   */
  public validateName(name: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if name is a string
    if (typeof name !== 'string') {
      return {
        isValid: false,
        errors: [
          {
            field: 'name',
            message: 'Name must be a string',
            value: name,
          },
        ],
      };
    }

    // Check if name is not empty and not just whitespace
    if (name.trim().length === 0) {
      errors.push({
        field: 'name',
        message: 'Name cannot be empty or contain only whitespace',
        value: name,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate category field
   * @param category - Category value to validate
   * @returns ValidationResult with isValid flag and error messages
   */
  public validateCategory(category: unknown): ValidationResult {
    const errors: ValidationError[] = [];

    // Check if category is a string
    if (typeof category !== 'string') {
      return {
        isValid: false,
        errors: [
          {
            field: 'category',
            message: 'Category must be a string',
            value: category,
          },
        ],
      };
    }

    // Check if category is not empty and not just whitespace
    if (category.trim().length === 0) {
      errors.push({
        field: 'category',
        message: 'Category cannot be empty or contain only whitespace',
        value: category,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
