import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PointDetailsComponent } from './point-details.component';
import { POIStoreService, Feature } from '../../services/poi-store.service';
import { FormValidatorService } from '../../services/form-validator.service';
import { Subject } from 'rxjs';

describe('PointDetailsComponent', () => {
  let component: PointDetailsComponent;
  let fixture: ComponentFixture<PointDetailsComponent>;
  let poiStore: POIStoreService;
  let formValidator: FormValidatorService;

  const mockFeature: Feature = {
    type: 'Feature',
    id: 'test-id',
    geometry: {
      type: 'Point',
      coordinates: [10, 20],
    },
    properties: {
      name: 'Test Point',
      category: 'Test Category',
      customField: 'Custom Value',
    },
  };

  beforeEach(async () => {
    const poiStoreSpy = {
      getState: vi.fn(),
      getPointById: vi.fn(),
      addPoint: vi.fn(),
      updatePoint: vi.fn(),
      deletePoint: vi.fn(),
      setState: vi.fn(),
      stateChanged$: new Subject(), // Use Subject instead of of() to control when it emits
    };
    (poiStoreSpy.getPointById as any).mockReturnValue(mockFeature);

    const formValidatorSpy = {
      validatePointProperties: vi.fn(),
      validateName: vi.fn(),
      validateCategory: vi.fn(),
    };
    (formValidatorSpy.validateName as any).mockReturnValue({ isValid: true, errors: [] });
    (formValidatorSpy.validateCategory as any).mockReturnValue({ isValid: true, errors: [] });

    await TestBed.configureTestingModule({
      imports: [PointDetailsComponent],
      providers: [
        { provide: POIStoreService, useValue: poiStoreSpy },
        { provide: FormValidatorService, useValue: formValidatorSpy },
      ],
    }).compileComponents();

    poiStore = TestBed.inject(POIStoreService);
    formValidator = TestBed.inject(FormValidatorService);

    fixture = TestBed.createComponent(PointDetailsComponent);
    component = fixture.componentInstance;
    component.pointId = 'test-id';
    fixture.detectChanges(); // This triggers ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load point data on init', () => {
    expect(poiStore.getPointById).toHaveBeenCalledWith('test-id');
    expect(component.point).toEqual(mockFeature);
  });

  it('should initialize form with point data', () => {
    expect(component.form.get('name')?.value).toBe('Test Point');
    expect(component.form.get('category')?.value).toBe('Test Category');
  });

  it('should emit close event when close button is clicked', async () => {
    const promise = new Promise<void>((resolve) => {
      component.close.subscribe(() => {
        expect(true).toBe(true);
        resolve();
      });
    });

    component.onClose();
    await promise;
  });

  it('should enable editing mode', () => {
    component.onEdit();
    expect(component.isEditing).toBe(true);
  });

  it('should cancel editing and restore original values', () => {
    component.isEditing = true;
    component.form.patchValue({
      name: 'Modified Name',
      category: 'Modified Category',
    });

    component.onCancelEdit();

    expect(component.isEditing).toBe(false);
    expect(component.form.get('name')?.value).toBe('Test Point');
    expect(component.form.get('category')?.value).toBe('Test Category');
  });

  it('should emit update event with valid form data', async () => {
    component.isEditing = true;
    component.form.patchValue({
      name: 'Updated Name',
      category: 'Updated Category',
    });

    const promise = new Promise<void>((resolve) => {
      component.update.subscribe((data) => {
        expect(data.id).toBe('test-id');
        expect(data.properties.name).toBe('Updated Name');
        expect(data.properties.category).toBe('Updated Category');
        resolve();
      });
    });

    component.onSubmit();
    await promise;
  });

  it('should not emit update event with invalid form data', () => {
    (formValidator.validateName as any).mockReturnValue({
      isValid: false,
      errors: [{ field: 'name', message: 'Name is required' }],
    });

    component.isEditing = true;
    component.form.patchValue({
      name: '',
      category: 'Updated Category',
    });

    const emitSpy = vi.spyOn(component.update, 'emit');
    component.onSubmit();

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should show delete confirmation dialog', () => {
    component.onDeleteClick();
    expect(component.showDeleteConfirmation).toBe(true);
  });

  it('should cancel deletion', () => {
    component.showDeleteConfirmation = true;
    component.onCancelDelete();
    expect(component.showDeleteConfirmation).toBe(false);
  });

  it('should emit delete event when deletion is confirmed', async () => {
    const promise = new Promise<void>((resolve) => {
      component.delete.subscribe((pointId) => {
        expect(pointId).toBe('test-id');
        resolve();
      });
    });

    component.onConfirmDelete();
    await promise;
  });

  it('should display error message for invalid name', () => {
    (formValidator.validateName as any).mockReturnValue({
      isValid: false,
      errors: [{ field: 'name', message: 'Name cannot be empty' }],
    });

    component.isEditing = true;
    component.form.patchValue({ name: '' });
    component.submitted = true;
    component.onSubmit();

    expect(component.hasError('name')).toBe(true);
    expect(component.getErrorMessage('name')).toBe('Name cannot be empty');
  });

  it('should get additional properties', () => {
    const additionalProps = component.getAdditionalProperties();
    expect(additionalProps.some((prop: any) => prop[0] === 'customField' && prop[1] === 'Custom Value')).toBe(true);
    expect(additionalProps.length).toBe(1);
  });

  it('should trim whitespace from form values on submit', async () => {
    component.isEditing = true;
    component.form.patchValue({
      name: '  Updated Name  ',
      category: '  Updated Category  ',
    });

    const promise = new Promise<void>((resolve) => {
      component.update.subscribe((data) => {
        expect(data.properties.name).toBe('Updated Name');
        expect(data.properties.category).toBe('Updated Category');
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
