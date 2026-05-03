import { Component, OnInit, OnDestroy, HostListener, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { POIStoreService, FeatureCollection } from '../../services/poi-store.service';
import { MapLibreRendererService } from '../../services/maplibre-renderer.service';
import { PersistenceManagerService } from '../../services/persistence-manager.service';
import { GeoJSONParserService } from '../../services/geojson-parser.service';
import { GeoJSONExporterService } from '../../services/geojson-exporter.service';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { NotificationService } from '../../services/notification.service';
import { MapComponent } from '../map/map.component';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { PointFormComponent } from '../point-form/point-form.component';
import { PointDetailsComponent } from '../point-details/point-details.component';
import { NotificationComponent } from '../notification/notification.component';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

/**
 * AppComponent - Main application component
 *
 * Responsibilities:
 * - Coordinate between POI Store, MapLibre Renderer, and Persistence Manager
 * - Subscribe to state changes and propagate to child components
 * - Restore state on application load
 * - Handle import/export operations
 * - Manage component lifecycle
 *
 * Validates: Requirements 1.1, 7.2, 11.2, 2.1, 2.8, 8.1, 8.4
 */
@Component({
  selector: 'app-app',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    ToolbarComponent,
    PointFormComponent,
    PointDetailsComponent,
    NotificationComponent,
    LoadingSpinnerComponent,
  ],
  template: `<div class="app-container">
  <!-- Toolbar -->
  <app-toolbar
    (import)="onImport($event)"
    (export)="onExport()"
  ></app-toolbar>

  <!-- Main content area -->
  <div class="main-content">
    <!-- Map container -->
    <div class="map-wrapper">
      <app-map
        #mapContainer
        (mapClick)="onMapClick($event)"
        (markerClick)="onMarkerClick($event)"
      ></app-map>
    </div>

    <!-- Point form modal -->
    @if (showPointForm && formCoordinates) {
      <app-point-form
        [coordinates]="formCoordinates"
        (submit)="onPointFormSubmit($event)"
        (cancel)="onPointFormCancel()"
      ></app-point-form>
    }

    <!-- Point details panel -->
    @if (showPointDetails && selectedPointId) {
      <app-point-details
        [pointId]="selectedPointId"
        (close)="onPointDetailsClose()"
        (update)="onPointUpdate($event)"
        (delete)="onPointDelete($event)"
      ></app-point-details>
    }
  </div>

  <!-- Notifications -->
  <app-notification></app-notification>

  <!-- Loading spinner -->
  <app-loading-spinner [isLoading]="isLoading" [message]="loadingMessage"></app-loading-spinner>
</div>`,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      background-color: #f5f5f5;
    }

    .main-content {
      display: flex;
      flex: 1;
      overflow: hidden;
      position: relative;
    }

    .map-wrapper {
      flex: 1;
      width: 100%;
      height: 100%;
      position: relative;
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  // State management
  currentState: FeatureCollection | null = null;
  selectedPointId: string | null = null;
  showPointForm = false;
  showPointDetails = false;
  formCoordinates: [number, number] | null = null;
  isLoading = false;
  loadingMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private poiStore: POIStoreService,
    private mapRenderer: MapLibreRendererService,
    private persistenceManager: PersistenceManagerService,
    private geoJsonParser: GeoJSONParserService,
    private geoJsonExporter: GeoJSONExporterService,
    private errorHandler: ErrorHandlerService,
    private notificationService: NotificationService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Initialize component
   * - Restore state from localStorage
   * - Subscribe to state changes for persistence
   * Note: Map initialization is handled by MapComponent.ngAfterViewInit()
   */
  ngOnInit(): void {
    // Restore state from localStorage (Requirement 7.2)
    this.restoreState();

    // Subscribe to state changes
    this.poiStore.stateChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.currentState = state;
        // Persist state on every change (Requirement 7.1)
        this.persistenceManager.save(state);
      });
  }

  /**
   * Handle keyboard events
   * Requirement 12.6: Close dialogs with Escape key
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showPointForm) {
      this.closePointForm();
    } else if (this.showPointDetails) {
      this.onPointDetailsClose();
    }
  }

  /**
   * Restore state from localStorage
   * Requirement 7.2: When the application loads, restore state if it exists
   */
  private restoreState(): void {
    const savedState = this.persistenceManager.restore();
    if (savedState) {
      this.poiStore.setState(savedState);
    }
  }

  /**
   * Handle map click event - open form to add new point
   * @param coordinates - [longitude, latitude] pair
   */
  onMapClick(coordinates: [number, number]): void {
    this.formCoordinates = coordinates;
    this.selectedPointId = null;
    this.showPointForm = true;
    this.showPointDetails = false;
  }

  /**
   * Handle marker click event - show point details
   * @param pointId - ID of the clicked point
   */
  onMarkerClick(pointId: string): void {
    this.selectedPointId = pointId;
    this.showPointDetails = true;
    this.showPointForm = false;
  }

  /**
   * Handle point form submission
   * @param data - Form data with coordinates and properties
   */
  onPointFormSubmit(data: {
    coordinates: [number, number];
    properties: { name: string; category: string };
  }): void {
    try {
      this.poiStore.addPoint(data.coordinates, data.properties);
      this.closePointForm();
    } catch (error) {
      this.errorHandler.showError(
        'Failed to add point',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle point form cancel
   */
  onPointFormCancel(): void {
    this.closePointForm();
  }

  /**
   * Close point form
   */
  private closePointForm(): void {
    this.showPointForm = false;
    this.formCoordinates = null;
  }

  /**
   * Handle point details close
   */
  onPointDetailsClose(): void {
    this.showPointDetails = false;
    this.selectedPointId = null;
  }

  /**
   * Handle point update from details component
   * @param data - Updated point data
   */
  onPointUpdate(data: { id: string; properties: { name: string; category: string } }): void {
    try {
      this.poiStore.updatePoint(data.id, data.properties);
    } catch (error) {
      this.errorHandler.showError(
        'Failed to update point',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle point deletion from details component
   * @param pointId - ID of point to delete
   */
  onPointDelete(pointId: string): void {
    try {
      this.poiStore.deletePoint(pointId);
      this.onPointDetailsClose();
    } catch (error) {
      this.errorHandler.showError(
        'Failed to delete point',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle import action from toolbar
   * Requirement 2.1, 2.8: Parse GeoJSON file and add valid features to state
   * @param file - GeoJSON file to import
   */
  async onImport(file: File): Promise<void> {
    console.log('onImport started');
    this.isLoading = true;
    this.loadingMessage = 'Importing file...';

    try {
      console.log('Parsing file...');
      const result = await this.geoJsonParser.parse(file);
      console.log('Parse result:', result);

      // Add valid features to state
      if (result.validFeatures.length > 0) {
        console.log('Adding valid features to state');
        const currentState = this.poiStore.getState();
        const newFeatures = [...currentState.features, ...result.validFeatures];
        this.poiStore.setState({
          type: 'FeatureCollection',
          features: newFeatures,
        });
        console.log('State updated');
      }

      // Show import summary with errors if any
      if (result.invalidFeatures.length === 0 && result.errors.length === 0) {
        console.log('Showing success notification');
        this.notificationService.showSuccess(
          'Import successful',
          `${result.validFeatures.length} features imported.`
        );
      } else {
        console.log('Showing warning notification');
        let details = `${result.validFeatures.length} features imported.`;
        if (result.invalidFeatures.length > 0) {
          details += ` ${result.invalidFeatures.length} features rejected.`;
        }
        this.notificationService.showWarning('Import completed with warnings', details);
      }

      console.log('Showing import summary');
      this.errorHandler.showImportSummary(result);
      console.log('Import summary shown');
    } catch (error) {
      console.error('Import error:', error);
      this.notificationService.showError(
        'Failed to import file',
        error instanceof Error ? error.message : 'Unknown error'
      );
      this.errorHandler.showError(
        'Failed to import file',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      console.log('Setting isLoading to false');
      // Use ngZone to ensure Angular detects the change
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
        console.log('onImport finished, isLoading:', this.isLoading);
      });
    }
  }

  /**
   * Handle export action from toolbar
   * Requirement 8.1, 8.4: Export current state as GeoJSON file
   */
  onExport(): void {
    this.isLoading = true;
    this.loadingMessage = 'Exporting file...';

    try {
      const currentState = this.poiStore.getState();
      this.geoJsonExporter.export(currentState);

      // Show success message
      this.notificationService.showSuccess(
        'Export successful',
        'Your data has been downloaded as a GeoJSON file'
      );
    } catch (error) {
      this.notificationService.showError(
        'Failed to export file',
        error instanceof Error ? error.message : 'Unknown error'
      );
      this.errorHandler.showError(
        'Failed to export file',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      // Use ngZone to ensure Angular detects the change
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
    }
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mapRenderer.destroy();
  }
}
