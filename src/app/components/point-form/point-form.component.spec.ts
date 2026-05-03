import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PointFormComponent } from './point-form.component';
import { FormValidatorService } from '../../services/form-validator.service';

describe('PointFormComponent', () => {
  let component: PointFormComponent;
  let fixture: ComponentFixture<PointFormComponent>;
  let formValidator: FormValidatorService;

  beforeEach(async () => {
    const formValidatorSpy = {
      validatePointProperties: vi.fn(),
      validateName: vi.fn(),
      validateCategory: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PointFormComponent],
      providers: [{ provide: FormValidatorService, useValue: formValidatorSpy }],
    }).compileComponents();

    formValidator = TestBed.inject(FormValidatorService);

    fixture = TestBed.createComponent(PointFormComponent);
    component = fixture.componentInstance;
    component.coordinates = [10, 20];

    // Setup default validator responses
    (formValidator.validateName as any).mockReturnValue({ isValid: true, errors: [] });
    (formValidator.validateCategory as any).mockReturnValue({ isValid: true, errors: [] });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.get('category')?.value).toBe('');
  });

  it('should focus name input on view init', () => {
    vi.spyOn(component.nameInput.nativeElement, 'focus');
    component.ngAfterViewInit();
    expect(component.nameInput.nativeElement.focus).toHaveBeenCalled();
  });

  it('should emit submit event with valid form data', async () => {
    component.form.patchValue({
      name: 'Test Point',
      category: 'Test Category',
    });

    const promise = new Promise<void>((resolve) => {
      component.submit.subscribe((data) => {
        expect(data.coordinates).toEqual([10, 20]);
        expect(data.properties.name).toBe('Test Point');
        expect(data.properties.category).toBe('Test Category');
        resolve();
      });
    });

    component.onSubmit();
    await promise;
  });

  it('should not emit submit event with invalid form data', () => {
    (formValidator.validateName as any).mockReturnValue({
      isValid: false,
      errors: [{ field: 'name', message: 'Name is required' }],
    });

    component.form.patchValue({
      name: '',
      category: 'Test Category',
    });

    const emitSpy = vi.spyOn(component.submit, 'emit');
    component.onSubmit();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit cancel event when cancel button is clicked', async () => {
    const promise = new Promise<void>((resolve) => {
      component.cancel.subscribe(() => {
        expect(true).toBe(true);
        resolve();
      });
    });

    component.onCancel();
    await promise;
  });

  it('should display error message for invalid name', () => {
    (formValidator.validateName as any).mockReturnValue({
      isValid: false,
      errors: [{ field: 'name', message: 'Name cannot be empty' }],
    });

    component.form.patchValue({ name: '' });
    component.submitted = true;
    component.onSubmit();

    expect(component.hasError('name')).toBe(true);
    expect(component.getErrorMessage('name')).toBe('Name cannot be empty');
  });

  it('should display error message for invalid category', () => {
    (formValidator.validateCategory as any).mockReturnValue({
      isValid: false,
      errors: [{ field: 'category', message: 'Category cannot be empty' }],
    });

    component.form.patchValue({ category: '' });
    component.submitted = true;
    component.onSubmit();

    expect(component.hasError('category')).toBe(true);
    expect(component.getErrorMessage('category')).toBe('Category cannot be empty');
  });

  it('should trim whitespace from form values on submit', async () => {
    component.form.patchValue({
      name: '  Test Point  ',
      category: '  Test Category  ',
    });

    const promise = new Promise<void>((resolve) => {
      component.submit.subscribe((data) => {
        expect(data.properties.name).toBe('Test Point');
        expect(data.properties.category).toBe('Test Category');
        resolve();
      });
    });

    component.onSubmit();
    await promise;
  });

  it('should cleanup on destroy', () => {
    component.ngOnDestroy();
    // Verify the component is destroyed without errors
    expect(component).toBeTruthy();
  });
});
