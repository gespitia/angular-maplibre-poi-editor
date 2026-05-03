/**
 * MapLibre GL type definitions
 * Provides type-safe interfaces for MapLibre GL operations
 */

import type { Marker, LngLatBounds, StyleSpecification } from 'maplibre-gl';

/**
 * Options for initializing a MapLibre GL map
 * Defines the required and optional configuration for map creation
 */
export interface MapInitOptions {
  /** HTML container element where the map will be rendered */
  container: HTMLElement;
  /** MapLibre GL style specification (URL or object) */
  style: StyleSpecification;
  /** Initial map center coordinates [longitude, latitude] */
  center: [number, number];
  /** Initial zoom level */
  zoom: number;
  /** Whether to display the attribution control (default: true) */
  attributionControl?: boolean;
}

/**
 * Options for fitting map bounds to a specific area
 * Extends MapLibre GL's fitBounds functionality with additional configuration
 */
export interface FitBoundsOptions {
  /** Padding around the bounds (can be a single number or object with individual sides) */
  padding?: number | { top: number; bottom: number; left: number; right: number };
  /** Animation duration in milliseconds */
  duration?: number;
  /** Maximum zoom level to use when fitting bounds */
  maxZoom?: number;
  /** Whether this is an essential animation that should not be interrupted */
  essential?: boolean;
}

/**
 * Event fired when the map is clicked
 * Contains click coordinates and timestamp for event tracking
 */
export interface MapClickEvent {
  /** Click coordinates [longitude, latitude] */
  coordinates: [number, number];
  /** Timestamp when the click occurred */
  timestamp: Date;
}

/**
 * Event fired when a marker is clicked
 * Contains marker identification and timestamp for event tracking
 */
export interface MarkerClickEvent {
  /** Unique identifier of the clicked marker */
  markerId: string;
  /** Timestamp when the click occurred */
  timestamp: Date;
}

/**
 * Current state of the map
 * Tracks initialization, loading, and positioning information
 */
export interface MapState {
  /** Whether the map has been initialized */
  isInitialized: boolean;
  /** Whether the map is currently loading resources */
  isLoading: boolean;
  /** Current map center coordinates [longitude, latitude] */
  center: [number, number];
  /** Current zoom level */
  zoom: number;
  /** Current map bounds (optional, only set when bounds are defined) */
  bounds?: LngLatBounds;
}

/**
 * Registry for managing markers on the map
 * Maps marker IDs to their corresponding MapLibre GL Marker instances
 */
export type MarkerRegistry = Map<string, Marker>;
