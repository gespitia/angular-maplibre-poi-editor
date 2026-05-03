# Angular MapLibre POI Editor

A modern web application for managing Points of Interest (POI) on an interactive map. Built with Angular 21 and MapLibre GL JS, this editor allows users to import, create, edit, and export geographic data in GeoJSON format with automatic local persistence.

## Features

- **Interactive Map**: View and interact with POI data on an OpenStreetMap-based map
- **GeoJSON Import/Export**: Import existing GeoJSON files and export your edits
- **Point Management**: Add, edit, and delete points directly on the map
- **Local Persistence**: Automatic saving to browser localStorage
- **Data Validation**: Comprehensive validation of coordinates and properties
- **Responsive UI**: Clean, intuitive interface with keyboard navigation support
- **Error Handling**: Clear error messages and import summaries

## Installation

### Prerequisites

- Node.js 18+ and npm 11+
- Angular CLI 21+

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd angular-maplibre-poi-editor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:4200/`

## Usage

### Adding Points

1. Click anywhere on the map to add a new point
2. Fill in the point details (name and category are required)
3. Click "Save" to add the point to the map
4. The point is automatically saved to local storage

### Editing Points

1. Click on an existing marker to view its details
2. Click the "Edit" button to modify the point
3. Update the properties as needed
4. Click "Save" to apply changes

### Deleting Points

1. Click on a marker to view its details
2. Click the "Delete" button
3. Confirm the deletion when prompted

### Importing GeoJSON

1. Click the "Import" button in the toolbar
2. Select a GeoJSON file from your computer
3. The application will validate and import all valid Point features
4. A summary will show how many points were imported and if any were rejected

**Supported GeoJSON Format:**
- Must be a valid FeatureCollection
- Only Point geometries are imported (other geometry types are ignored)
- Each Point must have:
  - Valid coordinates: longitude [-180, 180], latitude [-90, 90]
  - Properties with `name` and `category` as non-empty strings
  - Additional custom properties are preserved

### Exporting GeoJSON

1. Click the "Export" button in the toolbar
2. A GeoJSON file will be downloaded with all current points
3. The file is named `poi_editor_export_[timestamp].geojson`
4. The exported file can be re-imported into the application

### Keyboard Navigation

- **Escape**: Close any open dialog or form
- **Tab**: Navigate between form fields
- **Enter**: Submit forms

## Architecture

### Core Components

The application follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Angular Application                       │
├─────────────────────────────────────────────────────────────┤
│  UI Components (AppComponent, MapComponent, ToolbarComponent)│
│  ↓                                                            │
│  POI Store (State Management)                                │
│  ↓                                                            │
│  Services (Validators, Parsers, Renderers, Managers)        │
│  ↓                                                            │
│  MapLibre GL JS (Map Rendering)                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Services

#### POI Store Service
- **Responsibility**: Centralized state management
- **Features**: 
  - Maintains state as a valid GeoJSON FeatureCollection
  - Generates unique UUIDs for each point
  - Emits state changes via RxJS Observables
  - Provides methods: `addPoint()`, `updatePoint()`, `deletePoint()`, `setState()`

#### MapLibre Renderer Service
- **Responsibility**: Map initialization and marker management
- **Features**:
  - Initializes map with OpenStreetMap tiles
  - Creates and manages markers
  - Handles map and marker click events
  - Maintains marker-to-point synchronization

#### GeoJSON Parser Service
- **Responsibility**: Validates and parses GeoJSON files
- **Features**:
  - Validates FeatureCollection structure
  - Filters only Point geometries
  - Validates coordinates and required properties
  - Collects detailed error information
  - Preserves additional custom properties

#### GeoJSON Exporter Service
- **Responsibility**: Exports state as downloadable GeoJSON
- **Features**:
  - Generates valid GeoJSON FeatureCollection
  - Formats with 2-space indentation for readability
  - Includes all properties (standard and custom)
  - Triggers browser download with timestamp

#### Persistence Manager Service
- **Responsibility**: Local data persistence
- **Features**:
  - Saves state to browser localStorage
  - Restores state on application load
  - Validates restored data before loading
  - Uses key: `poi_editor_state`

#### Validators
- **Coordinate Validator**: Validates longitude [-180, 180] and latitude [-90, 90]
- **Form Validator**: Validates name and category as non-empty strings

#### Error Handler Service
- **Responsibility**: User-facing error management
- **Features**:
  - Displays error messages
  - Shows import summaries
  - Logs errors for debugging

### Data Flow

```
User Action (Click, Import, etc.)
    ↓
UI Component
    ↓
POI Store (Update State)
    ├→ MapLibre Renderer (Update Map)
    └→ Persistence Manager (Save to localStorage)
    ↓
User sees changes
```

## Architecture Decisions and Tradeoffs

### 1. Separation of Concerns

**Decision**: Separate MapLibre Renderer from POI Store

**Rationale**: 
- Allows state management to be independent of rendering
- Facilitates testing and future library changes
- Enables potential multi-view scenarios

**Tradeoff**: 
- Requires synchronization between two systems
- Slightly more complex than tightly coupled approach
- Benefit: Greater flexibility and maintainability

### 2. Unidirectional Data Flow

**Decision**: Use RxJS Observables for state changes

**Rationale**:
- Provides predictable, reactive data flow
- Automatic synchronization of UI and map
- Easier to reason about state changes

**Tradeoff**:
- Requires understanding of reactive programming
- More code than imperative approach
- Benefit: Better maintainability and fewer bugs

### 3. Layered Validation

**Decision**: Validate at multiple points (input, parsing, state, persistence)

**Rationale**:
- Defense in depth against invalid data
- Catches errors at appropriate layers
- Provides specific error messages

**Tradeoff**:
- More validation code
- Slight performance overhead
- Benefit: Higher data reliability

### 4. Browser-Based Persistence

**Decision**: Use localStorage instead of backend database

**Rationale**:
- No server required
- Meets requirements for local persistence
- Simpler deployment

**Tradeoff**:
- Limited to browser storage (~5-10MB)
- Not synced across devices
- Benefit: Simpler architecture, no backend needed

### 5. OpenStreetMap Tiles

**Decision**: Use OpenStreetMap instead of commercial providers

**Rationale**:
- No API keys required
- Open source and free
- Meets all functional requirements

**Tradeoff**:
- Fewer features than commercial providers
- Community-maintained
- Benefit: No licensing costs or API limits

### 6. GeoJSON as Primary Format

**Decision**: Use GeoJSON as the primary data format

**Rationale**:
- Industry standard for geographic data
- Widely supported by other tools
- Enables data portability

**Tradeoff**:
- Limited to Point geometries in this application
- Requires validation for custom properties
- Benefit: Data can be used in other applications

## Type System

The project features a comprehensive type system with zero `any` in production code. All types are organized in `src/app/types/` for easy discovery and reuse.

### Type Organization

```
src/app/types/
├── common.types.ts          # General types (AsyncResult, Notification, etc.)
├── geojson.types.ts         # GeoJSON types (Feature, FeatureCollection, etc.)
├── maplibre.types.ts        # MapLibre GL types (MapInitOptions, MapState, etc.)
├── error.types.ts           # Error types (ErrorCode, AppError, ValidationError)
├── guards.ts                # Type guards for runtime validation
├── TYPING_GUIDE.md          # Comprehensive typing guide
└── GUARDS_DOCUMENTATION.md  # Type guards documentation
```

### Key Type Features

- **Type-Safe GeoJSON**: Strongly typed Feature, FeatureCollection, and PointProperties
- **Error Handling**: Structured AppError with ErrorCode enum
- **Type Guards**: Runtime validation functions (isFeature, isFeatureCollection, etc.)
- **Strict Mode**: TypeScript strict mode enabled for maximum safety

### Quick Examples

#### Using Type Guards

```typescript
import { isFeatureCollection, isFeature } from './types';

// Validate external data
const data = await fetch('/api/pois').then(r => r.json());
if (isFeatureCollection(data)) {
  // data is now typed as FeatureCollection
  data.features.forEach(feature => {
    if (isFeature(feature)) {
      console.log(feature.id);
    }
  });
}
```

#### Creating Typed Features

```typescript
import type { Feature, PointProperties } from './types';

const properties: PointProperties = {
  name: 'Café Downtown',
  category: 'Food',
};

const feature: Feature = {
  type: 'Feature',
  id: 'poi-1',
  geometry: { type: 'Point', coordinates: [10.5, 20.3] },
  properties,
};
```

#### Error Handling

```typescript
import { isAppError } from './types';
import { ErrorCode } from './types';

try {
  // operation
} catch (error) {
  if (isAppError(error)) {
    switch (error.code) {
      case ErrorCode.VALIDATION_ERROR:
        console.error('Validation failed:', error.details);
        break;
      case ErrorCode.STORAGE_ERROR:
        console.error('Storage failed:', error.message);
        break;
    }
  }
}
```

### Documentation

- **[TYPING_GUIDE.md](./src/app/types/TYPING_GUIDE.md)**: Comprehensive guide to the type system, conventions, patterns, and best practices
- **[GUARDS_DOCUMENTATION.md](./src/app/types/GUARDS_DOCUMENTATION.md)**: Complete documentation of all type guards with examples and edge cases

### Type Safety Configuration

The project uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Development

### Running Tests

Run the test suite:
```bash
npm test
```

Tests are organized by service and component, with both unit tests and property-based tests for core functionality.

### Building for Production

Create an optimized production build:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Code Quality

The project uses:
- **TypeScript**: Strict mode for type safety
- **Prettier**: Code formatting (100 char line width)
- **Angular CLI**: Build and development tooling
- **Vitest**: Fast unit testing framework
- **Jasmine**: Test assertions

### Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── app/                 # Root component
│   │   ├── map/                 # Map container
│   │   ├── toolbar/             # Action buttons
│   │   ├── point-form/          # Add/edit form
│   │   ├── point-details/       # Point information
│   │   ├── notification/        # Notification display
│   │   └── loading-spinner/     # Loading indicator
│   ├── services/
│   │   ├── poi-store.service.ts
│   │   ├── maplibre-renderer.service.ts
│   │   ├── geojson-parser.service.ts
│   │   ├── geojson-exporter.service.ts
│   │   ├── persistence-manager.service.ts
│   │   ├── coordinate-validator.service.ts
│   │   ├── form-validator.service.ts
│   │   ├── error-handler.service.ts
│   │   └── notification.service.ts
│   ├── app.ts                   # Bootstrap
│   ├── app.config.ts            # Configuration
│   └── app.routes.ts            # Routing
└── main.ts                      # Entry point
```

## Data Validation Rules

### Coordinates
- **Longitude**: Must be between -180 and 180
- **Latitude**: Must be between -90 and 90

### Properties
- **Name**: Required, must be a non-empty string (not just whitespace)
- **Category**: Required, must be a non-empty string (not just whitespace)
- **Additional Properties**: Preserved as-is during import/export

### GeoJSON Structure
- Must be a valid FeatureCollection
- Only Point geometries are processed
- Other geometry types are silently ignored
- Invalid features are reported with specific error reasons

## Error Handling

The application provides clear error messages for:
- Invalid GeoJSON files
- Coordinates outside valid ranges
- Missing or invalid required properties
- Validation errors in forms
- Storage errors

Import errors show a summary of:
- Number of valid features imported
- Number of invalid features rejected
- Specific reasons for each rejection

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Any modern browser with ES2020+ support

## Performance Considerations

- **Map Rendering**: Efficient marker management with MapLibre GL JS
- **State Management**: Immutable state updates for predictability
- **Storage**: Automatic persistence with debouncing to avoid excessive writes
- **Memory**: Efficient data structures for large point collections

## Troubleshooting

### Points not appearing on map
- Check browser console for errors
- Verify GeoJSON coordinates are valid
- Ensure localStorage is enabled

### Import fails with validation errors
- Check that all Point features have `name` and `category` properties
- Verify coordinates are within valid ranges
- Ensure the file is valid GeoJSON

### Changes not persisting
- Check that localStorage is enabled in browser settings
- Verify browser storage quota is not exceeded
- Check browser console for storage errors

## Contributing

When contributing to this project:
1. Follow the existing code style and architecture
2. Add tests for new functionality
3. Ensure all tests pass before submitting
4. Update documentation as needed

## License

This project is provided as-is for educational and development purposes.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the browser console for error messages
3. Verify your GeoJSON file format
4. Check that your browser supports the required features

---

**Version**: 1.0.0  
**Last Updated**: 2026-05-03  
**Built with**: Angular 21, MapLibre GL JS 5.24, RxJS 7.8
