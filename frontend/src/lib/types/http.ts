export interface RequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface InterceptorRequest {
  url: string;
  config: RequestConfig;
}

export interface InterceptorResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  config: RequestConfig;
}

export type RequestInterceptor = (
  request: InterceptorRequest
) => InterceptorRequest | Promise<InterceptorRequest>;

export type ResponseInterceptor = <T>(
  response: InterceptorResponse<T>
) => InterceptorResponse<T> | Promise<InterceptorResponse<T>>;
