/**
 * Propiedades adicionales permitidas en objetos
 * Restringe a tipos primitivos seguros
 */
export type AdditionalProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Resultado de una operación asincrónica
 */
export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: AppError;
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Error de la aplicación
 */
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  originalError?: Error;
}

/**
 * Error de validación
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Tipos de notificación disponibles
 */
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Notificación para mostrar al usuario
 */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  details?: string;
  duration?: number; // in milliseconds, 0 = no auto-dismiss
}
