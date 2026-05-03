import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { POIStoreService, Feature } from '../../services/poi-store.service';
import { FormValidatorService } from '../../services/form-validator.service';

/**
 * PointDetailsComponent - Display and edit point properties
 *
 * Responsibilities:
 * - Display complete point properties
 * - Allow editing of point properties
 * - Allow deletion with confirmation
 * - Handle form submission
 * - Handle component close
 *
 * Validates: Requirements 3.3, 5.1, 6.1
 */
@Component({
  selector: 'app-point-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `<div class="details-overlay">
  <div class="details-container">
    <div class="details-header">
      <h2>Point Details</h2>
      <button class="close-button" (click)="onClose()" title="Close" aria-label="Close details panel">✕</button>
    </div>
    @if (point) {
      <div class="coordinates-section">
        <h3>Location</h3>
        <p><strong>Latitude:</strong> {{ point.geometry.coordinates[1] | number : '1.4-4' }}</p>
        <p><strong>Longitude:</strong> {{ point.geometry.coordinates[0] | number : '1.4-4' }}</p>
      </div>
      @if (isEditing) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="edit-form">
          <div class="form-group">
            <label for="name">Name *</label>
            <input id="name" type="text" formControlName="name" placeholder="Enter point name" class="form-input" [class.error]="hasError('name')" aria-label="Point name" aria-required="true" />
            @if (hasError('name')) {
              <span class="error-message" role="alert">{{ getErrorMessage('name') }}</span>
            }
          </div>
          <div class="form-group">
            <label for="category">Category *</label>
            <input id="category" type="text" formControlName="category" placeholder="Enter category" class="form-input" [class.error]="hasError('category')" aria-label="Point category" aria-required="true" />
            @if (hasError('category')) {
              <span class="error-message" role="alert">{{ getErrorMessage('category') }}</span>
            }
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="Object.keys(errors).length > 0">Save</button>
            <button type="button" class="btn btn-secondary" (click)="onCancelEdit()">Cancel</button>
          </div>
        </form>
      } @else {
        <div class="properties-section">
          <h3>Properties</h3>
          <div class="property">
            <strong>Name:</strong>
            <span>{{ point.properties.name }}</span>
          </div>
          <div class="property">
            <strong>Category:</strong>
            <span>{{ point.properties.category }}</span>
          </div>
          @for (prop of getAdditionalProperties(); track prop[0]) {
            <div class="property">
              <strong>{{ prop[0] }}:</strong>
              <span>{{ prop[1] }}</span>
            </div>
          }
        </div>
        <div class="action-buttons">
          <button class="btn btn-primary" (click)="onEdit()" aria-label="Edit point">Edit</button>
          <button class="btn btn-danger" (click)="onDeleteClick()" aria-label="Delete point">Delete</button>
        </div>
      }
      @if (showDeleteConfirmation) {
        <div class="confirmation-dialog">
          <div class="confirmation-content">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this point?</p>
            <div class="confirmation-actions">
              <button class="btn btn-danger" (click)="onConfirmDelete()">Delete</button>
              <button class="btn btn-secondary" (click)="onCancelDelete()">Cancel</button>
            </div>
          </div>
        </div>
      }
    }
  </div>
</div>`,
  styles: [`
    .details-overlay {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 350px;
      background-color: rgba(0, 0, 0, 0.3);
      z-index: 999;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }

    .details-container {
      height: 100%;
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
    }

    .details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .details-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    }

    .close-button:hover {
      background-color: #f0f0f0;
    }

    .details-container > div {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }

    h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .coordinates-section {
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }

    .coordinates-section p {
      margin: 8px 0;
      font-size: 13px;
      color: #666;
    }

    .properties-section {
      margin-bottom: 16px;
    }

    .property {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
    }

    .property strong {
      color: #333;
      font-weight: 500;
      min-width: 100px;
    }

    .property span {
      color: #666;
      word-break: break-word;
      text-align: right;
      flex: 1;
      margin-left: 8px;
    }

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    label {
      font-size: 13px;
      font-weight: 500;
      color: #333;
    }

    .form-input {
      padding: 8px 10px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
      transition: border-color 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .error-message {
      font-size: 11px;
      color: #ef4444;
      margin-top: 2px;
    }

    .action-buttons,
    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }

    .btn {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      flex: 1;
    }

    .btn-primary {
      background-color: #3b82f6;
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .btn-primary:disabled {
      background-color: #d0d0d0;
      cursor: not-allowed;
      color: #999;
    }

    .btn-secondary {
      background-color: #e5e7eb;
      color: #333;
    }

    .btn-secondary:hover {
      background-color: #d1d5db;
    }

    .btn-danger {
      background-color: #ef4444;
      color: #ffffff;
    }

    .btn-danger:hover {
      background-color: #dc2626;
    }

    .confirmation-dialog {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
    }

    .confirmation-content {
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      max-width: 300px;
    }

    .confirmation-content h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
    }

    .confirmation-content p {
      margin: 0 0 16px 0;
      font-size: 14px;
      color: #666;
    }

    .confirmation-actions {
      display: flex;
      gap: 8px;
    }
  `],
})
export class PointDetailsComponent implements OnInit, OnDestroy {
  @Input() pointId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() update = new EventEmitter<{ id: string; properties: { name: string; category: string } }>();
  @Output() delete = new EventEmitter<string>();

  point: Feature | null = null;
  form!: FormGroup;
  isEditing = false;
  showDeleteConfirmation = false;
  submitted = false;
  errors: { [key: string]: string } = {};
  Object = Object; // Expose Object to template

  private destroy$ = new Subject<void>();

  constructor(
    private poiStore: POIStoreService,
    private formBuilder: FormBuilder,
    private formValidator: FormValidatorService
  ) {}

  /**
   * Initialize component
   * - Load point data
   * - Create form
   */
  ngOnInit(): void {
    this.loadPoint();
    this.createForm();
  }

  /**
   * Handle keyboard events
   * Requirement 12.6: Close panel with Escape key
   */
  @HostListener('keydown.escape')
  onEscapeKey(): void {
    this.onClose();
  }

  /**
   * Load point data from POI Store
   */
  private loadPoint(): void {
    this.point = this.poiStore.getPointById(this.pointId);

    // Subscribe to state changes to update point data
    this.poiStore.stateChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.point = this.poiStore.getPointById(this.pointId);
        if (this.point && !this.isEditing) {
          this.updateFormValues();
        }
      });
  }

  /**
   * Create form with validators
   */
  private createForm(): void {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      category: ['', [Validators.required, Validators.minLength(1)]],
    });

    this.updateFormValues();

    // Subscribe to form value changes for validation
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isEditing) {
          this.validateForm();
        }
      });
  }

  /**
   * Update form values from point data
   */
  private updateFormValues(): void {
    if (this.point) {
      this.form.patchValue(
        {
          name: this.point.properties.name,
          category: this.point.properties.category,
        },
        { emitEvent: false }
      );
    }
  }

  /**
   * Enable editing mode
   */
  onEdit(): void {
    this.isEditing = true;
    this.submitted = false;
    this.errors = {};
  }

  /**
   * Cancel editing
   */
  onCancelEdit(): void {
    this.isEditing = false;
    this.submitted = false;
    this.errors = {};
    this.updateFormValues();
  }

  /**
   * Validate form using Form Validator service
   */
  private validateForm(): void {
    this.errors = {};

    const nameResult = this.formValidator.validateName(this.form.get('name')?.value);
    if (!nameResult.isValid) {
      this.errors['name'] = nameResult.errors[0]?.message || 'Invalid name';
    }

    const categoryResult = this.formValidator.validateCategory(this.form.get('category')?.value);
    if (!categoryResult.isValid) {
      this.errors['category'] = categoryResult.errors[0]?.message || 'Invalid category';
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    this.submitted = true;
    this.validateForm();

    if (Object.keys(this.errors).length === 0 && this.form.valid) {
      this.update.emit({
        id: this.pointId,
        properties: {
          name: this.form.get('name')?.value.trim(),
          category: this.form.get('category')?.value.trim(),
        },
      });
      this.isEditing = false;
    }
  }

  /**
   * Show delete confirmation dialog
   */
  onDeleteClick(): void {
    this.showDeleteConfirmation = true;
  }

  /**
   * Cancel deletion
   */
  onCancelDelete(): void {
    this.showDeleteConfirmation = false;
  }

  /**
   * Confirm deletion
   */
  onConfirmDelete(): void {
    this.delete.emit(this.pointId);
  }

  /**
   * Close details panel
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Get error message for field
   * @param fieldName - Name of the field
   * @returns Error message or empty string
   */
  getErrorMessage(fieldName: string): string {
    return this.errors[fieldName] || '';
  }

  /**
   * Check if field has error
   * @param fieldName - Name of the field
   * @returns true if field has error
   */
  hasError(fieldName: string): boolean {
    return this.submitted && !!this.errors[fieldName];
  }

  /**
   * Get all additional properties (excluding name and category)
   * @returns Array of [key, value] pairs
   */
  getAdditionalProperties(): Array<[string, any]> {
    if (!this.point) return [];

    return Object.entries(this.point.properties).filter(
      ([key]) => key !== 'name' && key !== 'category'
    );
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
