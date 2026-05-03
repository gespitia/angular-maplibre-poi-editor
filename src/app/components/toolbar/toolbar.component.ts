import { Component, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ToolbarComponent - Application toolbar with action buttons
 *
 * Responsibilities:
 * - Display buttons for: Import, Export, Add Point, Help
 * - Handle button click events
 * - Show tooltips on hover
 * - Manage file input for import
 * - Emit import/export events to parent component
 *
 * Validates: Requirements 12.2, 12.3, 2.1, 8.1, 8.4
 */
@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="toolbar" role="toolbar" aria-label="Application toolbar">
  <div class="toolbar-buttons">
    <button class="toolbar-button" (click)="onImportClick()" title="Import GeoJSON file" aria-label="Import GeoJSON file">
      <span>Import</span>
    </button>
    <button class="toolbar-button" (click)="onExportClick()" title="Export as GeoJSON" aria-label="Export as GeoJSON">
      <span>Export</span>
    </button>
    <button class="toolbar-button" (click)="onAddPointClick()" title="Add a new point" aria-label="Add a new point">
      <span>Add Point</span>
    </button>
    <button class="toolbar-button help-button" (click)="onHelpClick()" (mouseenter)="showHelp()" (mouseleave)="hideHelp()" title="Show help" aria-label="Show help">
      <span>Help</span>
      @if (showHelpTooltip) {
        <div class="tooltip" role="tooltip">
          <p><strong>Import:</strong> Load a GeoJSON file with points of interest</p>
          <p><strong>Export:</strong> Download your points as a GeoJSON file</p>
          <p><strong>Add Point:</strong> Click on the map to add a new point</p>
          <p><strong>Edit:</strong> Click on a marker to edit its properties</p>
          <p><strong>Delete:</strong> Click on a marker and select delete</p>
        </div>
      }
    </button>
  </div>
  <input #fileInput type="file" accept=".geojson,.json" (change)="onFileSelected($event)" style="display: none" aria-hidden="true" />
</div>`,
  styles: [`
    .toolbar {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background-color: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 100;
    }

    .toolbar-buttons {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .toolbar-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background-color: #f3f4f6;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      transition: all 0.2s ease;
      position: relative;
    }

    .toolbar-button:hover {
      background-color: #e5e7eb;
      border-color: #9ca3af;
    }

    .toolbar-button:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .toolbar-button:active {
      background-color: #d1d5db;
    }

    .help-button {
      margin-left: auto;
    }

    .tooltip {
      position: absolute;
      bottom: -180px;
      right: 0;
      background-color: #1f2937;
      color: #ffffff;
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      white-space: normal;
      z-index: 1000;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      min-width: 250px;
    }

    .tooltip p {
      margin: 4px 0;
      line-height: 1.4;
    }

    .tooltip p:first-child {
      margin-top: 0;
    }

    .tooltip p:last-child {
      margin-bottom: 0;
    }

    .tooltip strong {
      font-weight: 600;
    }
  `],
})
export class ToolbarComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Output() import = new EventEmitter<File>();
  @Output() export = new EventEmitter<void>();
  @Output() addPoint = new EventEmitter<void>();
  @Output() help = new EventEmitter<void>();

  showHelpTooltip = false;

  /**
   * Handle import button click
   * Requirement 2.1: Trigger file input for GeoJSON import
   */
  onImportClick(): void {
    this.fileInput.nativeElement.click();
  }

  /**
   * Handle file selection for import
   * Requirement 2.1: Emit selected file to parent component
   * @param event - File input change event
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.import.emit(file);
      // Reset file input
      input.value = '';
    }
  }

  /**
   * Handle export button click
   * Requirement 8.1, 8.4: Emit export event to parent component
   */
  onExportClick(): void {
    this.export.emit();
  }

  /**
   * Handle add point button click
   */
  onAddPointClick(): void {
    this.addPoint.emit();
  }

  /**
   * Handle help button click
   */
  onHelpClick(): void {
    this.help.emit();
  }

  /**
   * Show help tooltip
   */
  showHelp(): void {
    this.showHelpTooltip = true;
  }

  /**
   * Hide help tooltip
   */
  hideHelp(): void {
    this.showHelpTooltip = false;
  }
}
