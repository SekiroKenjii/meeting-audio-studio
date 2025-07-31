export type ErrorType = "network" | "server" | "unknown";

export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: any;
  originalError?: Error;
}

export type ErrorInterceptor = (error: ApiError) => Promise<never> | ApiError;
