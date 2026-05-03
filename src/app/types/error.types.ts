/**
 * Códigos de error de la aplicación
 * Define los códigos de error estándar utilizados en toda la aplicación
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MAP_INITIALIZATION_ERROR = 'MAP_INITIALIZATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  GEOJSON_PARSE_ERROR = 'GEOJSON_PARSE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error de validación
 * Representa un error específico en la validación de un campo
 */
export interface ValidationError {
  /** Nombre del campo que falló la validación */
  field: string;

  /** Mensaje descriptivo del error */
  message: string;

  /** Valor que causó el error (opcional) */
  value?: unknown;
}

/**
 * Error de la aplicación
 * Estructura estándar para todos los errores de la aplicación
 */
export interface AppError {
  /** Código de error estandarizado */
  code: ErrorCode;

  /** Mensaje descriptivo del error */
  message: string;

  /** Detalles adicionales del error (opcional) */
  details?: Record<string, unknown>;

  /** Timestamp de cuándo ocurrió el error */
  timestamp: Date;

  /** Error original de JavaScript (opcional) */
  originalError?: Error;
}

/**
 * Resultado de validación
 * Estructura para retornar resultados de validación con errores detallados
 */
export interface ValidationResult {
  /** Indica si la validación fue exitosa */
  isValid: boolean;

  /** Lista de errores de validación encontrados */
  errors: ValidationError[];
}
