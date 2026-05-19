// Enhanced API client with better error handling

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Tidak dapat terhubung ke server') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }

  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Terjadi kesalahan yang tidak diketahui';
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError || 
         (error instanceof Error && error.message.includes('fetch'));
}

export function isValidationError(error: unknown): boolean {
  return error instanceof ValidationError ||
         (error instanceof ApiError && error.status === 400);
}

export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && 
         (error.status === 401 || error.status === 403);
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function isServerError(error: unknown): boolean {
  return error instanceof ApiError && 
         error.status !== undefined && 
         error.status >= 500;
}
