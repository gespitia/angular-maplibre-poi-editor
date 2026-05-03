/**
 * Central export point for all application types
 * Provides a single import location for type definitions
 */

export type { AdditionalProperties } from './common.types';
export type { AsyncResult, PaginationOptions, PaginatedResponse } from './common.types';
export type { NotificationType, Notification } from './common.types';

export { ErrorCode } from './error.types';
export type { AppError, ValidationError, ValidationResult } from './error.types';

export type { GeoJSONCoordinates, PointProperties, PointGeometry, Feature, FeatureCollection, FeatureValidation } from './geojson.types';

export type { MapInitOptions, FitBoundsOptions, MapClickEvent, MarkerClickEvent, MapState, MarkerRegistry } from './maplibre.types';

export {
  isFeatureCollection,
  isFeature,
  isPointProperties,
  isPointGeometry,
  isAppError,
} from './guards';
