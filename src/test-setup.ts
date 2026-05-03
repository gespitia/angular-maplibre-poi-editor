import 'zone.js';
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

/**
 * Interface for Jasmine-compatible spy function
 * Provides compatibility layer between Vitest and Jasmine APIs
 */
interface JasmineSpyFunction {
  and: {
    returnValue: (value: unknown) => JasmineSpyFunction;
    returnValues: (values: unknown[]) => JasmineSpyFunction;
    callFake: (fake: (...args: unknown[]) => unknown) => JasmineSpyFunction;
    throwError: (error: Error | string) => JasmineSpyFunction;
  };
  calls: {
    reset: () => void;
    count: () => number;
    all: () => unknown[][];
  };
  mockReturnValue: (value: unknown) => JasmineSpyFunction;
  mockReturnValueOnce: (value: unknown) => JasmineSpyFunction;
  mockImplementation: (fn: (...args: unknown[]) => unknown) => JasmineSpyFunction;
  mockClear: () => void;
  mock: {
    calls: unknown[][];
  };
  (...args: unknown[]): unknown;
}

/**
 * Interface for spy object created by createSpyObj
 * Maps method names to spy functions
 */
interface SpyObject {
  [key: string]: JasmineSpyFunction;
}

/**
 * Create a jasmine-compatible spy object factory
 * Provides Jasmine API compatibility for Vitest spy functions
 * @param name - Name of the spy object (for debugging)
 * @param methods - Array of method names to spy on
 * @returns Object with spy functions for each method
 */
function createSpyObj(name: string, methods: string[]): SpyObject {
  const obj: SpyObject = {};
  methods.forEach((method) => {
    const fn = vi.fn() as unknown as JasmineSpyFunction;
    fn.and = {
      returnValue: (value: unknown) => {
        fn.mockReturnValue(value);
        return fn;
      },
      returnValues: (values: unknown[]) => {
        fn.mockReturnValueOnce(values[0]);
        return fn;
      },
      callFake: (fake: (...args: unknown[]) => unknown) => {
        fn.mockImplementation(fake);
        return fn;
      },
      throwError: (error: Error | string) => {
        fn.mockImplementation(() => {
          throw error;
        });
        return fn;
      },
    };
    fn.calls = {
      reset: () => {
        fn.mockClear();
      },
      count: () => fn.mock.calls.length,
      all: () => fn.mock.calls,
    };
    obj[method] = fn;
  });
  return obj;
}

/**
 * Interface for global Jasmine object
 * Provides compatibility layer for Jasmine API
 */
interface GlobalJasmine {
  createSpyObj: (name: string, methods: string[]) => SpyObject;
}

// Make jasmine available globally for compatibility
(globalThis as unknown as { jasmine: GlobalJasmine }).jasmine = {
  createSpyObj,
};

// Add spyOn to global scope
(globalThis as unknown as { spyOn: typeof vi.spyOn }).spyOn = vi.spyOn;

/**
 * Interface for DataTransfer items collection
 */
interface DataTransferItems {
  add: (file: File) => void;
}

/**
 * Interface for DataTransfer polyfill
 */
interface DataTransferPolyfill {
  items: DataTransferItems;
  files: FileList;
}

// Polyfill DataTransfer for jsdom
if (typeof DataTransfer === 'undefined') {
  (globalThis as unknown as { DataTransfer: new () => DataTransferPolyfill }).DataTransfer = class DataTransfer implements DataTransferPolyfill {
    items: DataTransferItems = {
      add: (file: File) => {},
    };
    files: FileList = new FileList();
  };
}

/**
 * Interface for WebGL extension objects
 */
interface WebGLExtension {
  loseContext?: () => void;
  restoreContext?: () => void;
}

/**
 * Interface for mock WebGL context
 * Provides minimal WebGL API for testing MapLibre
 */
interface MockWebGLContext {
  getParameter: (param: number) => string | number | null;
  createProgram: () => object;
  createShader: () => object;
  shaderSource: () => void;
  compileShader: () => void;
  attachShader: () => void;
  linkProgram: () => void;
  useProgram: () => void;
  getAttribLocation: () => number;
  getUniformLocation: () => object;
  enableVertexAttribArray: () => void;
  vertexAttribPointer: () => void;
  uniform1i: () => void;
  uniform1f: () => void;
  uniform2f: () => void;
  uniform3f: () => void;
  uniform4f: () => void;
  uniformMatrix4fv: () => void;
  createBuffer: () => object;
  bindBuffer: () => void;
  bufferData: () => void;
  createTexture: () => object;
  bindTexture: () => void;
  texImage2D: () => void;
  texParameteri: () => void;
  createFramebuffer: () => object;
  bindFramebuffer: () => void;
  framebufferTexture2D: () => void;
  createRenderbuffer: () => object;
  bindRenderbuffer: () => void;
  renderbufferStorage: () => void;
  framebufferRenderbuffer: () => void;
  checkFramebufferStatus: () => number;
  viewport: () => void;
  clear: () => void;
  clearColor: () => void;
  drawArrays: () => void;
  drawElements: () => void;
  enable: () => void;
  disable: () => void;
  blendFunc: () => void;
  depthFunc: () => void;
  cullFace: () => void;
  pixelStorei: () => void;
  readPixels: () => void;
  getShaderParameter: () => boolean;
  getProgramParameter: () => boolean;
  getShaderInfoLog: () => string;
  getProgramInfoLog: () => string;
  isContextLost: () => boolean;
  getExtension: (name: string) => WebGLExtension | null;
  canvas: {
    width: number;
    height: number;
  };
}

// Mock WebGL context for MapLibre
const mockWebGLContext: MockWebGLContext = {
  getParameter: vi.fn((param: number) => {
    // Return appropriate values for common WebGL parameters
    if (param === 0x1f00) return 'WebGL'; // VENDOR
    if (param === 0x1f01) return 'Mock WebGL'; // RENDERER
    if (param === 0x1f02) return '1.0'; // VERSION
    if (param === 0x1f03) return 'WebGL GLSL ES 1.0'; // SHADING_LANGUAGE_VERSION
    if (param === 0x0d33) return 2048; // MAX_TEXTURE_SIZE
    if (param === 0x0d39) return 16; // MAX_VERTEX_ATTRIBS
    if (param === 0x0d3a) return 8; // MAX_VERTEX_UNIFORM_VECTORS
    if (param === 0x0d3b) return 8; // MAX_VARYING_VECTORS
    if (param === 0x0d3c) return 8; // MAX_FRAGMENT_UNIFORM_VECTORS
    if (param === 0x0d3d) return 8; // MAX_RENDERBUFFER_SIZE
    return null;
  }) as unknown as (param: number) => string | number | null,
  createProgram: vi.fn(() => ({})) as unknown as () => object,
  createShader: vi.fn(() => ({})) as unknown as () => object,
  shaderSource: vi.fn() as unknown as () => void,
  compileShader: vi.fn() as unknown as () => void,
  attachShader: vi.fn() as unknown as () => void,
  linkProgram: vi.fn() as unknown as () => void,
  useProgram: vi.fn() as unknown as () => void,
  getAttribLocation: vi.fn(() => 0) as unknown as () => number,
  getUniformLocation: vi.fn(() => ({})) as unknown as () => object,
  enableVertexAttribArray: vi.fn() as unknown as () => void,
  vertexAttribPointer: vi.fn() as unknown as () => void,
  uniform1i: vi.fn() as unknown as () => void,
  uniform1f: vi.fn() as unknown as () => void,
  uniform2f: vi.fn() as unknown as () => void,
  uniform3f: vi.fn() as unknown as () => void,
  uniform4f: vi.fn() as unknown as () => void,
  uniformMatrix4fv: vi.fn() as unknown as () => void,
  createBuffer: vi.fn(() => ({})) as unknown as () => object,
  bindBuffer: vi.fn() as unknown as () => void,
  bufferData: vi.fn() as unknown as () => void,
  createTexture: vi.fn(() => ({})) as unknown as () => object,
  bindTexture: vi.fn() as unknown as () => void,
  texImage2D: vi.fn() as unknown as () => void,
  texParameteri: vi.fn() as unknown as () => void,
  createFramebuffer: vi.fn(() => ({})) as unknown as () => object,
  bindFramebuffer: vi.fn() as unknown as () => void,
  framebufferTexture2D: vi.fn() as unknown as () => void,
  createRenderbuffer: vi.fn(() => ({})) as unknown as () => object,
  bindRenderbuffer: vi.fn() as unknown as () => void,
  renderbufferStorage: vi.fn() as unknown as () => void,
  framebufferRenderbuffer: vi.fn() as unknown as () => void,
  checkFramebufferStatus: vi.fn(() => 0x8cd5) as unknown as () => number, // FRAMEBUFFER_COMPLETE
  viewport: vi.fn() as unknown as () => void,
  clear: vi.fn() as unknown as () => void,
  clearColor: vi.fn() as unknown as () => void,
  drawArrays: vi.fn() as unknown as () => void,
  drawElements: vi.fn() as unknown as () => void,
  enable: vi.fn() as unknown as () => void,
  disable: vi.fn() as unknown as () => void,
  blendFunc: vi.fn() as unknown as () => void,
  depthFunc: vi.fn() as unknown as () => void,
  cullFace: vi.fn() as unknown as () => void,
  pixelStorei: vi.fn() as unknown as () => void,
  readPixels: vi.fn() as unknown as () => void,
  getShaderParameter: vi.fn(() => true) as unknown as () => boolean,
  getProgramParameter: vi.fn(() => true) as unknown as () => boolean,
  getShaderInfoLog: vi.fn(() => '') as unknown as () => string,
  getProgramInfoLog: vi.fn(() => '') as unknown as () => string,
  isContextLost: vi.fn(() => false) as unknown as () => boolean,
  getExtension: vi.fn((name: string) => {
    if (name === 'WEBGL_lose_context') {
      return { loseContext: vi.fn(), restoreContext: vi.fn() };
    }
    if (name === 'OES_texture_float') return {};
    if (name === 'OES_element_index_uint') return {};
    if (name === 'EXT_texture_filter_anisotropic') return {};
    return null;
  }) as unknown as (name: string) => WebGLExtension | null,
  canvas: {
    width: 800,
    height: 600,
  },
};

/**
 * Interface for getContext options
 */
interface CanvasContextOptions {
  [key: string]: unknown;
}

/**
 * Type for canvas context return value
 */
type CanvasContext = CanvasRenderingContext2D | WebGLRenderingContext | null;

// Mock HTMLCanvasElement.getContext
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  contextType: string,
  options?: CanvasContextOptions
): CanvasContext {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return mockWebGLContext as unknown as WebGLRenderingContext;
  }
  if (contextType === '2d') {
    return originalGetContext.call(this, contextType, options) as CanvasRenderingContext2D | null;
  }
  return null;
} as unknown as HTMLCanvasElement['getContext'];
