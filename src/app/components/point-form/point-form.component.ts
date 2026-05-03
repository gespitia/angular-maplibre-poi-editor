import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FormValidatorService } from '../../services/form-validator.service';

/**
 * PointFormComponent - Form for adding/editing points
 *
 * Responsibilities:
 * - Display form for point properties (name, category)
 * - Validate input using Form Validator
 * - Handle form submission
 * - Focus first field for accessibility
 * - Handle form cancellation
 *
 * Validates: Requirements 4.2, 4.3, 5.1, 5.2, 12.5
 */
@Component({
  selector: 'app-point-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `<div class="form-overlay" role="dialog" aria-modal="true" aria-labelledby="form-title">
  <div class="form-container">
    <h2 id="form-title">Add New Point</h2>
    <div class="coordinates-display">
      <p><strong>Coordinates:</strong> {{ coordinates[0] | number : '1.4-4' }}, {{ coordinates[1] | number : '1.4-4' }}</p>
    </div>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label for="name">Name <span class="required" aria-label="required">*</span></label>
        <input #nameInput id="name" type="text" formControlName="name" placeholder="Enter point name" class="form-input" [class.error]="hasError('name')" aria-label="Point name" aria-required="true" aria-describedby="name-error" />
        @if (hasError('name')) {
          <span class="error-message" id="name-error" role="alert">{{ getErrorMessage('name') }}</span>
        }
      </div>
      <div class="form-group">
        <label for="category">Category <span class="required" aria-label="required">*</span></label>
        <input id="category" type="text" formControlName="category" placeholder="Enter category" class="form-input" [class.error]="hasError('category')" aria-label="Point category" aria-required="true" aria-describedby="category-error" />
        @if (hasError('category')) {
          <span class="error-message" id="category-error" role="alert">{{ getErrorMessage('category') }}</span>
        }
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" [disabled]="Object.keys(errors).length > 0" aria-label="Add point to map">Add Point</button>
        <button type="button" class="btn btn-secondary" (click)="onCancel()" aria-label="Cancel adding point">Cancel</button>
      </div>
    </form>
  </div>
</div>`,
  styles: [`
    .form-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .form-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 90%;
    }

    h2 {
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }

    .coordinates-display {
      background-color: #f3f4f6;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
      border: 1px solid #e5e7eb;
    }

    .coordinates-display p {
      margin: 0;
      color: #374151;
    }

    form {
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
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }

    .required {
      color: #ef4444;
      font-weight: 600;
    }

    .form-input {
      padding: 10px 12px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s ease;
      color: #1f2937;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error {
      border-color: #dc2626;
    }

    .error-message {
      font-size: 12px;
      color: #dc2626;
      margin-top: 2px;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }

    .btn {
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
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

    .btn-primary:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .btn-primary:disabled {
      background-color: #d1d5db;
      cursor: not-allowed;
      color: #6b7280;
    }

    .btn-secondary {
      background-color: #e5e7eb;
      color: #1f2937;
    }

    .btn-secondary:hover {
      background-color: #d1d5db;
    }

    .btn-secondary:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
  `],
})
export class PointFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  @Input() coordinates!: [number, number];
  @Output() submit = new EventEmitter<{
    coordinates: [number, number];
    properties: { name: string; category: string };
  }>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  submitted = false;
  errors: { [key: string]: string } = {};
  Object = Object; // Expose Object to template

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private formValidator: FormValidatorService
  ) {}

  /**
   * Initialize component
   * - Create form with validators
   */
  ngOnInit(): void {
    this.createForm();
  }

  /**
   * After view init
   * - Focus first field for accessibility
   */
  ngAfterViewInit(): void {
    // Focus first field for accessibility
    if (this.nameInput) {
      this.nameInput.nativeElement.focus();
    }
  }

  /**
   * Handle keyboard events
   * Requirement 12.6: Close form with Escape key
   */
  @HostListener('keydown.escape')
  onEscapeKey(): void {
    this.onCancel();
  }

  /**
   * Create form with validators
   */
  private createForm(): void {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(1)]],
      category: ['', [Validators.required, Validators.minLength(1)]],
    });

    // Subscribe to form value changes for validation
    this.form.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.validateForm();
      });
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
      this.submit.emit({
        coordinates: this.coordinates,
        properties: {
          name: this.form.get('name')?.value.trim(),
          category: this.form.get('category')?.value.trim(),
        },
      });
    }
  }

  /**
   * Handle form cancellation
   */
  onCancel(): void {
    this.cancel.emit();
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
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
