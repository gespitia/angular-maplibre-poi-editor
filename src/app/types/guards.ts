import type {
  Feature,
  FeatureCollection,
  PointProperties,
  PointGeometry,
} from './geojson.types';
import type { AppError } from './error.types';
import { ErrorCode } from './error.types';

/**
 * Verifica si un valor es una FeatureCollection válida
 * Type guard que valida la estructura de una FeatureCollection GeoJSON
 *
 * @param value - Valor a validar
 * @returns true si el valor es una FeatureCollection válida
 *
 * @example
 * ```typescript
 * const data = { type: 'FeatureCollection', features: [] };
 * if (isFeatureCollection(data)) {
 *   // data es tipado como FeatureCollection
 *   console.log(data.features);
 * }
 * ```
 */
export function isFeatureCollection(value: unknown): value is FeatureCollection {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Validar que type sea 'FeatureCollection'
  if (obj['type'] !== 'FeatureCollection') {
    return false;
  }

  // Validar que features sea un array
  if (!Array.isArray(obj['features'])) {
    return false;
  }

  return true;
}

/**
 * Verifica si un valor es una Feature válida
 * Type guard que valida la estructura de una Feature GeoJSON
 *
 * @param value - Valor a validar
 * @returns true si el valor es una Feature válida
 *
 * @example
 * ```typescript
 * const data = {
 *   type: 'Feature',
 *   id: 'poi-1',
 *   geometry: { type: 'Point', coordinates: [0, 0] },
 *   properties: { name: 'Test', category: 'Test' }
 * };
 * if (isFeature(data)) {
 *   // data es tipado como Feature
 *   console.log(data.id);
 * }
 * ```
 */
export function isFeature(value: unknown): value is Feature {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Validar que type sea 'Feature'
  if (obj['type'] !== 'Feature') {
    return false;
  }

  // Validar que id sea un string
  if (typeof obj['id'] !== 'string') {
    return false;
  }

  // Validar que geometry sea una PointGeometry válida
  if (!isPointGeometry(obj['geometry'])) {
    return false;
  }

  // Validar que properties sean PointProperties válidas
  if (!isPointProperties(obj['properties'])) {
    return false;
  }

  return true;
}

/**
 * Verifica si un valor es PointProperties válido
 * Type guard que valida la estructura de propiedades de un POI
 *
 * @param value - Valor a validar
 * @returns true si el valor es PointProperties válido
 *
 * @example
 * ```typescript
 * const props = { name: 'Café', category: 'Food' };
 * if (isPointProperties(props)) {
 *   // props es tipado como PointProperties
 *   console.log(props.name);
 * }
 * ```
 */
export function isPointProperties(value: unknown): value is PointProperties {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Validar que name sea un string no vacío
  if (typeof obj['name'] !== 'string' || (obj['name'] as string).trim().length === 0) {
    return false;
  }

  // Validar que category sea un string no vacío
  if (typeof obj['category'] !== 'string' || (obj['category'] as string).trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Verifica si un valor es una geometría Point válida
 * Type guard que valida la estructura de una geometría Point de GeoJSON
 *
 * @param value - Valor a validar
 * @returns true si el valor es una PointGeometry válida
 *
 * @example
 * ```typescript
 * const geom = { type: 'Point', coordinates: [10.5, 20.3] };
 * if (isPointGeometry(geom)) {
 *   // geom es tipado como PointGeometry
 *   console.log(geom.coordinates);
 * }
 * ```
 */
export function isPointGeometry(value: unknown): value is PointGeometry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Validar que type sea 'Point'
  if (obj['type'] !== 'Point') {
    return false;
  }

  // Validar que coordinates sea un array
  if (!Array.isArray(obj['coordinates'])) {
    return false;
  }

  // Validar que coordinates tenga exactamente 2 elementos
  if ((obj['coordinates'] as unknown[]).length !== 2) {
    return false;
  }

  // Validar que ambos elementos sean números
  const coords = obj['coordinates'] as unknown[];
  if (typeof coords[0] !== 'number' || typeof coords[1] !== 'number') {
    return false;
  }

  return true;
}

/**
 * Verifica si un valor es un AppError válido
 * Type guard que valida la estructura de un error de aplicación
 *
 * @param value - Valor a validar
 * @returns true si el valor es un AppError válido
 *
 * @example
 * ```typescript
 * const error = {
 *   code: ErrorCode.VALIDATION_ERROR,
 *   message: 'Invalid input',
 *   timestamp: new Date()
 * };
 * if (isAppError(error)) {
 *   // error es tipado como AppError
 *   console.log(error.code);
 * }
 * ```
 */
export function isAppError(value: unknown): value is AppError {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Validar que code sea un string válido (uno de los ErrorCode)
  if (typeof obj['code'] !== 'string') {
    return false;
  }

  // Validar que code sea uno de los valores válidos de ErrorCode
  const validCodes = Object.values(ErrorCode);
  if (!validCodes.includes(obj['code'] as ErrorCode)) {
    return false;
  }

  // Validar que message sea un string
  if (typeof obj['message'] !== 'string') {
    return false;
  }

  // Validar que timestamp sea una Date
  if (!(obj['timestamp'] instanceof Date)) {
    return false;
  }

  return true;
}
