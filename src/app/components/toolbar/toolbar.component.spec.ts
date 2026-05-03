import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit import event when file is selected', async () => {
    const file = new File(['test'], 'test.geojson', { type: 'application/json' });

    const importPromise = new Promise<File>((resolve) => {
      component.import.subscribe((emittedFile) => {
        resolve(emittedFile);
      });
    });

    const input = component.fileInput.nativeElement;
    
    // Create a FileList-like object
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
    } as any;
    
    Object.defineProperty(input, 'files', {
      value: fileList,
      writable: false,
    });

    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);

    const emittedFile = await importPromise;
    expect(emittedFile).toBe(file);
  });

  it('should emit export event when export button is clicked', async () => {
    const exportPromise = new Promise<void>((resolve) => {
      component.export.subscribe(() => {
        resolve();
      });
    });

    component.onExportClick();
    await exportPromise;
    expect(true).toBe(true);
  });

  it('should emit addPoint event when add point button is clicked', async () => {
    const addPointPromise = new Promise<void>((resolve) => {
      component.addPoint.subscribe(() => {
        resolve();
      });
    });

    component.onAddPointClick();
    await addPointPromise;
    expect(true).toBe(true);
  });

  it('should emit help event when help button is clicked', async () => {
    const helpPromise = new Promise<void>((resolve) => {
      component.help.subscribe(() => {
        resolve();
      });
    });

    component.onHelpClick();
    await helpPromise;
    expect(true).toBe(true);
  });

  it('should show help tooltip on mouse enter', () => {
    component.showHelp();
    expect(component.showHelpTooltip).toBe(true);
  });

  it('should hide help tooltip on mouse leave', () => {
    component.showHelpTooltip = true;
    component.hideHelp();
    expect(component.showHelpTooltip).toBe(false);
  });

  it('should trigger file input click on import button click', () => {
    const clickSpy = vi.spyOn(component.fileInput.nativeElement, 'click');
    component.onImportClick();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should reset file input after file selection', () => {
    const file = new File(['test'], 'test.geojson', { type: 'application/json' });
    const input = component.fileInput.nativeElement;

    // Create a FileList-like object
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
    } as any;
    
    Object.defineProperty(input, 'files', {
      value: fileList,
      writable: false,
    });

    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);

    expect(input.value).toBe('');
  });
});
