export function extractErrorInfo(error: unknown): { message: string; code?: string | number } {
  if (!error) return { message: 'Unknown error occurred.' };
  if (typeof error === 'string') return { message: error };
  if (error instanceof Error) {
    // Custom ApiError
    const anyErr = error as any;
    return {
      message: anyErr.message || 'An error occurred.',
      code: anyErr.status || anyErr.code,
    };
  }
  if (typeof error === 'object') {
    const anyErr = error as any;
    return {
      message: anyErr.message || anyErr.error || 'An error occurred.',
      code: anyErr.status || anyErr.code,
    };
  }
  return { message: 'An unknown error occurred.' };
} 