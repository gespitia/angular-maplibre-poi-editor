# Documentación de Type Guards

## Introducción

Los type guards son funciones que validan tipos en tiempo de ejecución y permiten que TypeScript infiera tipos más específicos. Este documento proporciona documentación completa de todos los type guards disponibles en el proyecto.

## Tabla de Contenidos

1. [Conceptos Básicos](#conceptos-básicos)
2. [Type Guards Disponibles](#type-guards-disponibles)
3. [Patrones de Uso](#patrones-de-uso)
4. [Ejemplos Prácticos](#ejemplos-prácticos)
5. [Mejores Prácticas](#mejores-prácticas)

## Conceptos Básicos

### ¿Qué es un Type Guard?

Un type guard es una función que:
1. Valida un valor en tiempo de ejecución
2. Retorna un booleano indicando si el valor es válido
3. Usa un predicado de tipo (`value is Type`) para que TypeScript infiera el tipo

### Sintaxis

```typescript
function isType(value: unknown): value is Type {
  // Validación en tiempo de ejecución
  return /* condición */;
}
```

### Beneficios

- **Seguridad de tipos**: TypeScript infiere tipos más específicos
- **Validación en tiempo de ejecución**: Verifica datos de fuentes externas
- **Mejor autocompletar**: IDE proporciona sugerencias precisas
- **Prevención de errores**: Evita acceso a propiedades inexistentes

## Type Guards Disponibles

### 1. isFeatureCollection

Valida si un valor es una `FeatureCollection` válida.

#### Firma

```typescript
export function isFeatureCollection(value: unknown): value is FeatureCollection
```

#### Validaciones

- El valor debe ser un objeto
- Debe tener propiedad `type` con valor `'FeatureCollection'`
- Debe tener propiedad `features` que sea un array

#### Retorna

- `true` si el valor es una FeatureCollection válida
- `false` en caso contrario

#### Ejemplo

```typescript
import { isFeatureCollection } from '../types';

const data = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'poi-1',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { name: 'Test', category: 'Test' }
    }
  ]
};

if (isFeatureCollection(data)) {
  // data es tipado como FeatureCollection
  console.log(data.features.length); // ✅ Seguro
  data.features.forEach(feature => {
    console.log(feature.id);
  });
}
```

#### Casos de Uso

- Validar datos importados de archivos GeoJSON
- Validar respuestas de APIs
- Validar datos recuperados de localStorage

#### Casos Edge

```typescript
// ❌ No es FeatureCollection
isFeatureCollection(null);                    // false
isFeatureCollection(undefined);               // false
isFeatureCollection({});                      // false
isFeatureCollection({ type: 'Feature' });     // false
isFeatureCollection({ type: 'FeatureCollection' }); // false (sin features)
isFeatureCollection({ type: 'FeatureCollection', features: 'not-array' }); // false

// ✅ Es FeatureCollection
isFeatureCollection({ type: 'FeatureCollection', features: [] }); // true
isFeatureCollection({ type: 'FeatureCollection', features: [/* ... */] }); // true
```

---

### 2. isFeature

Valida si un valor es una `Feature` válida.

#### Firma

```typescript
export function isFeature(value: unknown): value is Feature
```

#### Validaciones

- El valor debe ser un objeto
- Debe tener propiedad `type` con valor `'Feature'`
- Debe tener propiedad `id` que sea un string
- Debe tener propiedad `geometry` que sea una PointGeometry válida
- Debe tener propiedad `properties` que sean PointProperties válidas

#### Retorna

- `true` si el valor es una Feature válida
- `false` en caso contrario

#### Ejemplo

```typescript
import { isFeature } from '../types';

const feature = {
  type: 'Feature',
  id: 'poi-1',
  geometry: { type: 'Point', coordinates: [10.5, 20.3] },
  properties: { name: 'Café', category: 'Food' }
};

if (isFeature(feature)) {
  // feature es tipado como Feature
  console.log(feature.id);                    // ✅ Seguro
  console.log(feature.properties.name);       // ✅ Seguro
  console.log(feature.geometry.coordinates);  // ✅ Seguro
}
```

#### Casos de Uso

- Validar features individuales de un GeoJSON
- Filtrar features válidas de un array
- Validar datos antes de guardar en la base de datos

#### Casos Edge

```typescript
// ❌ No es Feature
isFeature(null);                              // false
isFeature({});                                // false
isFeature({ type: 'Feature' });               // false (sin id)
isFeature({ type: 'Feature', id: 123 });      // false (id no es string)
isFeature({
  type: 'Feature',
  id: 'poi-1',
  geometry: null,                             // false (geometry inválida)
  properties: { name: 'Test', category: 'Test' }
});

// ✅ Es Feature
isFeature({
  type: 'Feature',
  id: 'poi-1',
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties: { name: 'Test', category: 'Test' }
}); // true
```

---

### 3. isPointProperties

Valida si un valor es `PointProperties` válido.

#### Firma

```typescript
export function isPointProperties(value: unknown): value is PointProperties
```

#### Validaciones

- El valor debe ser un objeto
- Debe tener propiedad `name` que sea un string no vacío
- Debe tener propiedad `category` que sea un string no vacío

#### Retorna

- `true` si el valor es PointProperties válido
- `false` en caso contrario

#### Ejemplo

```typescript
import { isPointProperties } from '../types';

const props = { name: 'Café', category: 'Food' };

if (isPointProperties(props)) {
  // props es tipado como PointProperties
  console.log(props.name);      // ✅ Seguro
  console.log(props.category);  // ✅ Seguro
}
```

#### Casos de Uso

- Validar propiedades de un POI antes de crear un Feature
- Validar datos de formularios
- Filtrar propiedades válidas de un array

#### Casos Edge

```typescript
// ❌ No es PointProperties
isPointProperties(null);                      // false
isPointProperties({});                        // false
isPointProperties({ name: 'Test' });          // false (sin category)
isPointProperties({ name: '', category: 'Food' }); // false (name vacío)
isPointProperties({ name: '   ', category: 'Food' }); // false (name solo espacios)
isPointProperties({ name: 'Test', category: '' }); // false (category vacío)
isPointProperties({ name: 123, category: 'Food' }); // false (name no es string)

// ✅ Es PointProperties
isPointProperties({ name: 'Café', category: 'Food' }); // true
isPointProperties({ name: 'Test', category: 'Test', extra: 'data' }); // true
```

---

### 4. isPointGeometry

Valida si un valor es una `PointGeometry` válida.

#### Firma

```typescript
export function isPointGeometry(value: unknown): value is PointGeometry
```

#### Validaciones

- El valor debe ser un objeto
- Debe tener propiedad `type` con valor `'Point'`
- Debe tener propiedad `coordinates` que sea un array
- El array debe tener exactamente 2 elementos
- Ambos elementos deben ser números

#### Retorna

- `true` si el valor es una PointGeometry válida
- `false` en caso contrario

#### Ejemplo

```typescript
import { isPointGeometry } from '../types';

const geometry = { type: 'Point', coordinates: [10.5, 20.3] };

if (isPointGeometry(geometry)) {
  // geometry es tipado como PointGeometry
  console.log(geometry.coordinates[0]); // ✅ Seguro (longitude)
  console.log(geometry.coordinates[1]); // ✅ Seguro (latitude)
}
```

#### Casos de Uso

- Validar geometría de un Feature
- Validar coordenadas antes de crear un marcador
- Filtrar geometrías válidas de un array

#### Casos Edge

```typescript
// ❌ No es PointGeometry
isPointGeometry(null);                        // false
isPointGeometry({});                          // false
isPointGeometry({ type: 'Point' });           // false (sin coordinates)
isPointGeometry({ type: 'Point', coordinates: [] }); // false (array vacío)
isPointGeometry({ type: 'Point', coordinates: [10] }); // false (1 elemento)
isPointGeometry({ type: 'Point', coordinates: [10, 20, 30] }); // false (3 elementos)
isPointGeometry({ type: 'Point', coordinates: ['10', '20'] }); // false (strings)
isPointGeometry({ type: 'LineString', coordinates: [10, 20] }); // false (type incorrecto)

// ✅ Es PointGeometry
isPointGeometry({ type: 'Point', coordinates: [0, 0] }); // true
isPointGeometry({ type: 'Point', coordinates: [-180, -90] }); // true
isPointGeometry({ type: 'Point', coordinates: [180, 90] }); // true
isPointGeometry({ type: 'Point', coordinates: [10.5, 20.3] }); // true
```

---

### 5. isAppError

Valida si un valor es un `AppError` válido.

#### Firma

```typescript
export function isAppError(value: unknown): value is AppError
```

#### Validaciones

- El valor debe ser un objeto
- Debe tener propiedad `code` que sea un string válido (uno de los valores de ErrorCode)
- Debe tener propiedad `message` que sea un string
- Debe tener propiedad `timestamp` que sea una Date

#### Retorna

- `true` si el valor es un AppError válido
- `false` en caso contrario

#### Ejemplo

```typescript
import { isAppError } from '../types';
import { ErrorCode } from '../types';

const error = {
  code: ErrorCode.VALIDATION_ERROR,
  message: 'Invalid input',
  timestamp: new Date()
};

if (isAppError(error)) {
  // error es tipado como AppError
  console.log(error.code);      // ✅ Seguro
  console.log(error.message);   // ✅ Seguro
  console.log(error.timestamp); // ✅ Seguro
}
```

#### Casos de Uso

- Validar errores capturados de operaciones asincrónicas
- Diferenciar entre AppError y otros tipos de error
- Manejar errores de forma tipada

#### Casos Edge

```typescript
// ❌ No es AppError
isAppError(null);                             // false
isAppError({});                               // false
isAppError({ code: 'INVALID_CODE', message: 'Error', timestamp: new Date() }); // false
isAppError({ code: ErrorCode.VALIDATION_ERROR, message: 'Error' }); // false (sin timestamp)
isAppError({ code: ErrorCode.VALIDATION_ERROR, message: 'Error', timestamp: 'not-a-date' }); // false
isAppError(new Error('Regular error'));       // false

// ✅ Es AppError
isAppError({
  code: ErrorCode.VALIDATION_ERROR,
  message: 'Invalid input',
  timestamp: new Date()
}); // true

isAppError({
  code: ErrorCode.STORAGE_ERROR,
  message: 'Storage failed',
  timestamp: new Date(),
  details: { reason: 'quota exceeded' }
}); // true
```

---

## Patrones de Uso

### Patrón 1: Validación Simple

```typescript
import { isFeature } from '../types';

function processFeature(data: unknown): void {
  if (isFeature(data)) {
    // data es Feature aquí
    console.log(data.id);
  } else {
    console.error('Invalid feature');
  }
}
```

### Patrón 2: Filtrado de Arrays

```typescript
import { isFeature } from '../types';

const items: unknown[] = [/* ... */];
const validFeatures = items.filter(isFeature);
// validFeatures es Feature[]
```

### Patrón 3: Validación Anidada

```typescript
import { isFeatureCollection, isFeature } from '../types';

function processCollection(data: unknown): void {
  if (isFeatureCollection(data)) {
    const validFeatures = data.features.filter(isFeature);
    validFeatures.forEach(feature => {
      console.log(feature.id);
    });
  }
}
```

### Patrón 4: Manejo de Errores

```typescript
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
        console.error('Error:', error.message);
    }
  } else if (error instanceof Error) {
    console.error('JavaScript error:', error.message);
  } else {
    console.error('Unknown error');
  }
}
```

### Patrón 5: Validación en Servicios

```typescript
import { isFeatureCollection } from '../types';
import type { FeatureCollection } from '../types';

export class GeoJSONParserService {
  parse(data: unknown): FeatureCollection {
    if (!isFeatureCollection(data)) {
      throw new Error('Invalid GeoJSON: must be a FeatureCollection');
    }
    return data;
  }
}
```

### Patrón 6: Validación en Componentes

```typescript
import { Component, Input } from '@angular/core';
import { isFeature } from '../types';
import type { Feature } from '../types';

@Component({
  selector: 'app-feature-display',
  template: `<div *ngIf="isValid">{{ feature.properties.name }}</div>`
})
export class FeatureDisplayComponent {
  @Input() set data(value: unknown) {
    this.isValid = isFeature(value);
    if (this.isValid) {
      this.feature = value;
    }
  }

  feature: Feature | null = null;
  isValid = false;
}
```

## Ejemplos Prácticos

### Ejemplo 1: Importar GeoJSON

```typescript
import { isFeatureCollection, isFeature } from '../types';
import type { FeatureCollection } from '../types';

async function importGeoJSON(file: File): Promise<FeatureCollection> {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!isFeatureCollection(data)) {
    throw new Error('Invalid GeoJSON: must be a FeatureCollection');
  }

  // Filtrar solo features válidas
  const validFeatures = data.features.filter(isFeature);

  return {
    type: 'FeatureCollection',
    features: validFeatures,
  };
}
```

### Ejemplo 2: Validar Datos de API

```typescript
import { isFeatureCollection } from '../types';
import type { FeatureCollection } from '../types';

async function fetchPOIs(): Promise<FeatureCollection> {
  const response = await fetch('/api/pois');
  const data = await response.json();

  if (!isFeatureCollection(data)) {
    throw new Error('Invalid API response');
  }

  return data;
}
```

### Ejemplo 3: Recuperar de localStorage

```typescript
import { isFeatureCollection } from '../types';
import type { FeatureCollection } from '../types';

function loadFromStorage(): FeatureCollection | null {
  const stored = localStorage.getItem('poi_editor_state');
  if (!stored) return null;

  try {
    const data = JSON.parse(stored);
    if (isFeatureCollection(data)) {
      return data;
    }
  } catch (error) {
    console.error('Failed to load from storage:', error);
  }

  return null;
}
```

### Ejemplo 4: Validar Entrada de Usuario

```typescript
import { isPointProperties } from '../types';
import type { PointProperties } from '../types';

function validateFormInput(formData: unknown): PointProperties | null {
  if (isPointProperties(formData)) {
    return formData;
  }
  return null;
}
```

### Ejemplo 5: Manejo Robusto de Errores

```typescript
import { isAppError } from '../types';
import { ErrorCode } from '../types';

async function executeWithErrorHandling<T>(
  operation: () => Promise<T>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (isAppError(error)) {
      console.error(`[${error.code}] ${error.message}`);
      if (error.details) {
        console.error('Details:', error.details);
      }
    } else if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('Unknown error occurred');
    }
    return null;
  }
}
```

## Mejores Prácticas

### 1. Siempre Validar Datos Externos

```typescript
// ✅ Correcto
const data = await fetch('/api/data').then(r => r.json());
if (isFeatureCollection(data)) {
  // Seguro usar data
}

// ❌ Incorrecto
const data = await fetch('/api/data').then(r => r.json()) as FeatureCollection;
// Asume que es válido sin validar
```

### 2. Usar Type Guards en Condicionales

```typescript
// ✅ Correcto
if (isFeature(item)) {
  console.log(item.id); // TypeScript sabe que item es Feature
}

// ❌ Incorrecto
if (item.type === 'Feature') {
  console.log(item.id); // TypeScript no sabe que item es Feature
}
```

### 3. Combinar Type Guards Lógicamente

```typescript
// ✅ Correcto
const validFeatures = items.filter(isFeature);
// validFeatures es Feature[]

// ❌ Incorrecto
const validFeatures = items.filter(item => item.type === 'Feature');
// validFeatures es unknown[]
```

### 4. Documentar Validaciones Complejas

```typescript
// ✅ Correcto
/**
 * Valida que los datos sean una FeatureCollection válida
 * @param data - Datos a validar
 * @returns true si es una FeatureCollection válida
 * @throws {Error} Si los datos no son válidos
 */
function validateGeoJSON(data: unknown): FeatureCollection {
  if (!isFeatureCollection(data)) {
    throw new Error('Invalid GeoJSON');
  }
  return data;
}

// ❌ Incorrecto
function validateGeoJSON(data: any): any {
  // Sin documentación
}
```

### 5. Usar Type Guards en Servicios

```typescript
// ✅ Correcto
@Injectable({ providedIn: 'root' })
export class ValidationService {
  validateFeature(data: unknown): Feature | null {
    return isFeature(data) ? data : null;
  }

  validateCollection(data: unknown): FeatureCollection | null {
    return isFeatureCollection(data) ? data : null;
  }
}

// ❌ Incorrecto
@Injectable({ providedIn: 'root' })
export class ValidationService {
  validateFeature(data: any): any {
    return data;
  }
}
```

## Resumen

| Guard | Valida | Retorna |
|-------|--------|---------|
| `isFeatureCollection` | FeatureCollection válida | `value is FeatureCollection` |
| `isFeature` | Feature válida | `value is Feature` |
| `isPointProperties` | PointProperties válida | `value is PointProperties` |
| `isPointGeometry` | PointGeometry válida | `value is PointGeometry` |
| `isAppError` | AppError válido | `value is AppError` |

---

**Última actualización**: 2026-05-03  
**Versión**: 1.0.0
