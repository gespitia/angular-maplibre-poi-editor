# Guía de Tipos del Proyecto

## Introducción

Este documento proporciona una guía completa sobre el sistema de tipos del proyecto Angular MapLibre POI Editor. El proyecto utiliza TypeScript con configuración estricta para garantizar máxima seguridad de tipos.

## Tabla de Contenidos

1. [Convenciones de Tipado](#convenciones-de-tipado)
2. [Estructura de Tipos](#estructura-de-tipos)
3. [Tipos Principales](#tipos-principales)
4. [Type Guards](#type-guards)
5. [Patrones Comunes](#patrones-comunes)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Ejemplos de Uso](#ejemplos-de-uso)

## Convenciones de Tipado

### Reglas Generales

1. **Nunca usar `any`**: Utilizar `unknown` cuando el tipo es realmente desconocido
2. **Tipos explícitos**: Todos los parámetros y retornos deben tener tipos explícitos
3. **Interfaces sobre tipos**: Usar `interface` para objetos, `type` para uniones y tipos complejos
4. **Documentación JSDoc**: Documentar tipos complejos con comentarios JSDoc

### Nomenclatura

- **Interfaces**: PascalCase (ej: `PointProperties`, `MapInitOptions`)
- **Tipos**: PascalCase (ej: `GeoJSONCoordinates`, `AdditionalProperties`)
- **Enums**: PascalCase (ej: `ErrorCode`)
- **Type Guards**: camelCase con prefijo `is` (ej: `isFeature`, `isPointProperties`)

### Organización

Los tipos están organizados en archivos temáticos dentro de `src/app/types/`:

```
types/
├── index.ts                 # Exporta todos los tipos
├── common.types.ts          # Tipos generales y comunes
├── geojson.types.ts         # Tipos específicos de GeoJSON
├── maplibre.types.ts        # Tipos específicos de MapLibre GL
├── error.types.ts           # Tipos de error y validación
└── guards.ts                # Type guards para validación
```

## Estructura de Tipos

### Importación de Tipos

Siempre importar tipos desde `src/app/types`:

```typescript
// ✅ Correcto
import type { Feature, FeatureCollection } from '../types';

// ❌ Incorrecto
import type { Feature } from '../types/geojson.types';
```

### Exportación desde index.ts

El archivo `index.ts` re-exporta todos los tipos públicos:

```typescript
export type { AdditionalProperties, AsyncResult, /* ... */ } from './common.types';
export type { Feature, FeatureCollection, /* ... */ } from './geojson.types';
export type { MapInitOptions, FitBoundsOptions, /* ... */ } from './maplibre.types';
export { ErrorCode } from './error.types';
export type { AppError, ValidationError, /* ... */ } from './error.types';
export { isFeature, isFeatureCollection, /* ... */ } from './guards';
```

## Tipos Principales

### Tipos Comunes (common.types.ts)

#### AdditionalProperties
Tipo para propiedades adicionales seguras:

```typescript
export type AdditionalProperties = Record<
  string,
  string | number | boolean | null | undefined
>;
```

**Uso**: Propiedades personalizadas en objetos que necesitan flexibilidad pero con tipos seguros.

#### AsyncResult<T>
Resultado de operaciones asincrónicas:

```typescript
export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: AppError;
}
```

**Uso**: Retornar resultados de operaciones async con manejo de errores.

#### Notification
Notificaciones para mostrar al usuario:

```typescript
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  details?: string;
  duration?: number;
}
```

### Tipos GeoJSON (geojson.types.ts)

#### GeoJSONCoordinates
Coordenadas en formato GeoJSON:

```typescript
export type GeoJSONCoordinates = [number, number]; // [longitude, latitude]
```

#### PointProperties
Propiedades de un POI:

```typescript
export interface PointProperties extends Record<string, unknown> {
  name: string;
  category: string;
}
```

**Características**:
- `name` y `category` son requeridos
- Permite propiedades adicionales de cualquier tipo
- Reemplaza el uso de `any` con tipos seguros

#### PointGeometry
Geometría Point de GeoJSON:

```typescript
export interface PointGeometry {
  type: 'Point';
  coordinates: GeoJSONCoordinates;
}
```

#### Feature
Feature GeoJSON completo:

```typescript
export interface Feature {
  type: 'Feature';
  id: string;
  geometry: PointGeometry;
  properties: PointProperties;
}
```

#### FeatureCollection
Colección de Features:

```typescript
export interface FeatureCollection {
  type: 'FeatureCollection';
  features: Feature[];
}
```

### Tipos MapLibre (maplibre.types.ts)

#### MapInitOptions
Opciones para inicializar el mapa:

```typescript
export interface MapInitOptions {
  container: HTMLElement;
  style: StyleSpecification;
  center: [number, number];
  zoom: number;
  attributionControl?: boolean;
}
```

#### FitBoundsOptions
Opciones para ajustar los bounds del mapa:

```typescript
export interface FitBoundsOptions {
  padding?: number | { top: number; bottom: number; left: number; right: number };
  duration?: number;
  maxZoom?: number;
  essential?: boolean;
}
```

#### MapState
Estado actual del mapa:

```typescript
export interface MapState {
  isInitialized: boolean;
  isLoading: boolean;
  center: [number, number];
  zoom: number;
  bounds?: LngLatBounds;
}
```

### Tipos de Error (error.types.ts)

#### ErrorCode
Códigos de error estandarizados:

```typescript
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MAP_INITIALIZATION_ERROR = 'MAP_INITIALIZATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  GEOJSON_PARSE_ERROR = 'GEOJSON_PARSE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

#### AppError
Estructura estándar para errores:

```typescript
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  originalError?: Error;
}
```

#### ValidationError
Error de validación específico:

```typescript
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}
```

## Type Guards

Los type guards son funciones que validan tipos en tiempo de ejecución. Ver [GUARDS_DOCUMENTATION.md](./GUARDS_DOCUMENTATION.md) para documentación completa.

### Uso Básico

```typescript
import { isFeature, isFeatureCollection } from '../types';

function processData(data: unknown): void {
  if (isFeatureCollection(data)) {
    // data es tipado como FeatureCollection
    data.features.forEach(feature => {
      if (isFeature(feature)) {
        console.log(feature.id);
      }
    });
  }
}
```

### Type Guards Disponibles

- `isFeatureCollection(value: unknown): value is FeatureCollection`
- `isFeature(value: unknown): value is Feature`
- `isPointProperties(value: unknown): value is PointProperties`
- `isPointGeometry(value: unknown): value is PointGeometry`
- `isAppError(value: unknown): value is AppError`

## Patrones Comunes

### Patrón 1: Validación con Type Guards

```typescript
// ✅ Correcto
function handleData(data: unknown): void {
  if (isFeatureCollection(data)) {
    // data es FeatureCollection aquí
    processFeatures(data.features);
  } else {
    throw new Error('Invalid data format');
  }
}

// ❌ Incorrecto
function handleData(data: any): void {
  // Pierde seguridad de tipos
  processFeatures(data.features);
}
```

### Patrón 2: Parámetros Tipados

```typescript
// ✅ Correcto
function addPoint(
  coordinates: [number, number],
  properties: PointProperties
): Feature {
  return {
    type: 'Feature',
    id: generateId(),
    geometry: { type: 'Point', coordinates },
    properties,
  };
}

// ❌ Incorrecto
function addPoint(coordinates: any, properties: any): any {
  // Sin seguridad de tipos
}
```

### Patrón 3: Retornos Tipados

```typescript
// ✅ Correcto
function getFeatureById(id: string): Feature | null {
  return this.features.find(f => f.id === id) ?? null;
}

// ❌ Incorrecto
function getFeatureById(id: string): any {
  return this.features.find(f => f.id === id);
}
```

### Patrón 4: Manejo de Errores

```typescript
// ✅ Correcto
function handleError(error: unknown): void {
  if (isAppError(error)) {
    console.error(`[${error.code}] ${error.message}`);
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error');
  }
}

// ❌ Incorrecto
function handleError(error: any): void {
  console.error(error.message); // Puede fallar
}
```

### Patrón 5: Propiedades Privadas Tipadas

```typescript
// ✅ Correcto
export class POIStoreService {
  private state: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  private stateSubject: BehaviorSubject<FeatureCollection> =
    new BehaviorSubject<FeatureCollection>(this.state);

  public stateChanged$: Observable<FeatureCollection> =
    this.stateSubject.asObservable();
}

// ❌ Incorrecto
export class POIStoreService {
  private state: any = { type: 'FeatureCollection', features: [] };
  private stateSubject: any = new BehaviorSubject(this.state);
}
```

## Mejores Prácticas

### 1. Usar `unknown` en lugar de `any`

```typescript
// ✅ Correcto
function process(data: unknown): void {
  if (typeof data === 'object' && data !== null) {
    // Ahora es seguro acceder a propiedades
  }
}

// ❌ Incorrecto
function process(data: any): void {
  // Pierde seguridad de tipos
}
```

### 2. Documentar Tipos Complejos

```typescript
// ✅ Correcto
/**
 * Procesa una colección de features
 * @param collection - FeatureCollection válida
 * @returns Array de features procesados
 * @throws {AppError} Si la colección no es válida
 */
function processCollection(collection: FeatureCollection): Feature[] {
  // ...
}

// ❌ Incorrecto
function processCollection(collection: any): any {
  // Sin documentación
}
```

### 3. Usar Type Predicates en Condicionales

```typescript
// ✅ Correcto
const features: unknown[] = [];
const validFeatures: Feature[] = features.filter(isFeature);

// ❌ Incorrecto
const validFeatures = features.filter(f => f.type === 'Feature') as Feature[];
```

### 4. Evitar Casting Innecesario

```typescript
// ✅ Correcto
function getFeature(id: string): Feature | null {
  return this.features.find(f => f.id === id) ?? null;
}

// ❌ Incorrecto
function getFeature(id: string): Feature {
  return this.features.find(f => f.id === id) as Feature;
}
```

### 5. Usar Tipos Genéricos Apropiadamente

```typescript
// ✅ Correcto
function createAsyncResult<T>(data: T): AsyncResult<T> {
  return { success: true, data };
}

// ❌ Incorrecto
function createAsyncResult(data: any): any {
  return { success: true, data };
}
```

## Ejemplos de Uso

### Ejemplo 1: Servicio Tipado

```typescript
import { Injectable } from '@angular/core';
import type { Feature, FeatureCollection, PointProperties } from '../types';
import { isFeature, isFeatureCollection } from '../types';

@Injectable({ providedIn: 'root' })
export class POIStoreService {
  private state: FeatureCollection = {
    type: 'FeatureCollection',
    features: [],
  };

  private stateSubject: BehaviorSubject<FeatureCollection> =
    new BehaviorSubject<FeatureCollection>(this.state);

  public stateChanged$: Observable<FeatureCollection> =
    this.stateSubject.asObservable();

  public addPoint(
    coordinates: [number, number],
    properties: PointProperties
  ): Feature {
    const feature: Feature = {
      type: 'Feature',
      id: generateId(),
      geometry: { type: 'Point', coordinates },
      properties,
    };

    this.state.features.push(feature);
    this.stateSubject.next(this.state);
    return feature;
  }

  public getFeatureById(id: string): Feature | null {
    return this.state.features.find(f => f.id === id) ?? null;
  }
}
```

### Ejemplo 2: Validación con Type Guards

```typescript
import { isFeatureCollection, isFeature } from '../types';
import type { FeatureCollection } from '../types';

function importGeoJSON(data: unknown): FeatureCollection {
  if (!isFeatureCollection(data)) {
    throw new Error('Invalid GeoJSON: must be a FeatureCollection');
  }

  const validFeatures = data.features.filter(isFeature);
  
  return {
    type: 'FeatureCollection',
    features: validFeatures,
  };
}
```

### Ejemplo 3: Manejo de Errores Tipado

```typescript
import type { AppError } from '../types';
import { isAppError } from '../types';
import { ErrorCode } from '../types';

function handleError(error: unknown): void {
  if (isAppError(error)) {
    switch (error.code) {
      case ErrorCode.VALIDATION_ERROR:
        console.error('Validation failed:', error.details);
        break;
      case ErrorCode.STORAGE_ERROR:
        console.error('Storage failed:', error.message);
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  } else if (error instanceof Error) {
    console.error('JavaScript error:', error.message);
  } else {
    console.error('Unknown error type');
  }
}
```

### Ejemplo 4: Componente Tipado

```typescript
import { Component, OnInit } from '@angular/core';
import type { Feature, FeatureCollection } from '../types';
import { POIStoreService } from '../services/poi-store.service';

@Component({
  selector: 'app-poi-list',
  template: `
    <div *ngFor="let feature of features">
      <h3>{{ feature.properties.name }}</h3>
      <p>{{ feature.properties.category }}</p>
    </div>
  `,
})
export class POIListComponent implements OnInit {
  features: Feature[] = [];

  constructor(private poiStore: POIStoreService) {}

  ngOnInit(): void {
    this.poiStore.stateChanged$.subscribe((state: FeatureCollection) => {
      this.features = state.features;
    });
  }
}
```

## Configuración de TypeScript

El proyecto utiliza configuración estricta de TypeScript en `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

Esta configuración garantiza máxima seguridad de tipos durante el desarrollo.

## Recursos Adicionales

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [GeoJSON Specification (RFC 7946)](https://tools.ietf.org/html/rfc7946)
- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [Angular Style Guide - Types](https://angular.io/guide/styleguide#types)

## Preguntas Frecuentes

### ¿Cuándo usar `type` vs `interface`?

- Usar `interface` para objetos que pueden ser extendidos
- Usar `type` para uniones, tuplas y tipos complejos
- En este proyecto: `interface` para tipos de datos, `type` para tipos derivados

### ¿Cómo manejar datos de fuentes externas?

Siempre validar con type guards:

```typescript
const externalData: unknown = await fetch('/api/data').then(r => r.json());
if (isFeatureCollection(externalData)) {
  // Seguro usar externalData como FeatureCollection
}
```

### ¿Puedo usar `any` en tests?

Se recomienda evitar `any` incluso en tests. Usar tipos específicos o `unknown` con type guards.

---

**Última actualización**: 2026-05-03  
**Versión**: 1.0.0
