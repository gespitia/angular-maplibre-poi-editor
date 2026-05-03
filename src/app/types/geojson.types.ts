import type { AdditionalProperties, ValidationError } from './common.types';

/**
 * Coordenadas GeoJSON [longitude, latitude]
 * Sigue el estándar RFC 7946 para GeoJSON
 */
export type GeoJSONCoordinates = [number, number];

/**
 * Propiedades de un POI (Point of Interest)
 * Reemplaza el uso de `any` con tipos específicos
 * Permite propiedades adicionales de cualquier tipo
 */
export interface PointProperties extends Record<string, unknown> {
  name: string;
  category: string;
}

/**
 * Geometría Point de GeoJSON
 * Representa un punto único en el mapa
 */
export interface PointGeometry {
  type: 'Point';
  coordinates: GeoJSONCoordinates;
}

/**
 * Feature GeoJSON con geometría Point
 * Representa un POI completo con su geometría y propiedades
 */
export interface Feature {
  type: 'Feature';
  id: string;
  geometry: PointGeometry;
  properties: PointProperties;
}

/**
 * FeatureCollection GeoJSON
 * Colección de Features para representar múltiples POIs
 */
export interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}

/**
 * Validación de Feature
 * Resultado de validar un Feature
 */
export interface FeatureValidation {
  isValid: boolean;
  errors: ValidationError[];
}
