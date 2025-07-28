/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview Advanced API utility functions for HTTP operations
 * @module @/lib/utils/api
 * @description Comprehensive API helpers including retry logic, request building,
 * response parsing, error handling, and performance monitoring
 */

/**
 * HTTP methods enumeration
 */
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
}

/**
 * API error class with enhanced information
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public statusText: string,
    public response?: any,
    public request?: any
  ) {
    super(`API Error ${statusCode}: ${statusText}`);
    this.name = "ApiError";
  }
}

/**
 * Request configuration interface
 */
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryDelayMultiplier?: number;
  maxRetryDelay?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (error: any, retryCount: number) => void;
}

/**
 * Build URL with query parameters
 * @param baseUrl - Base URL
 * @param params - Query parameters
 * @returns Complete URL with parameters
 */
export const buildUrl = (
  baseUrl: string,
  params?: Record<string, any>
): string => {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, String(item)));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  });

  return url.toString();
};

/**
 * Parse URL and extract components
 * @param url - URL to parse
 * @returns URL components
 */
export interface ParsedUrl {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: Record<string, string | string[]>;
}

export const parseUrl = (url: string): ParsedUrl => {
  const parsed = new URL(url);
  const params: Record<string, string | string[]> = {};

  parsed.searchParams.forEach((value, key) => {
    const existing = params[key];
    if (existing) {
      params[key] = Array.isArray(existing)
        ? [...existing, value]
        : [existing, value];
    } else {
      params[key] = value;
    }
  });

  return {
    protocol: parsed.protocol,
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: parsed.pathname,
    search: parsed.search,
    hash: parsed.hash,
    params,
  };
};

/**
 * Serialize object to form data
 * @param obj - Object to serialize
 * @param form - Existing FormData (optional)
 * @param namespace - Namespace for nested objects
 * @returns FormData instance
 */
export const objectToFormData = (
  obj: Record<string, any>,
  form?: FormData,
  namespace?: string
): FormData => {
  const formData = form || new FormData();

  Object.entries(obj).forEach(([key, value]) => {
    const formKey = namespace ? `${namespace}[${key}]` : key;

    if (value === undefined || value === null) {
      return;
    }

    if (value instanceof Date) {
      formData.append(formKey, value.toISOString());
    } else if (value instanceof File) {
      formData.append(formKey, value);
    } else if (value instanceof Blob) {
      formData.append(formKey, value);
    } else if (typeof value === "boolean") {
      formData.append(formKey, value ? "true" : "false");
    } else if (typeof value === "object" && !(value instanceof Array)) {
      objectToFormData(value, formData, formKey);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayKey = `${formKey}[${index}]`;
        if (typeof item === "object" && !(item instanceof File)) {
          objectToFormData(item, formData, arrayKey);
        } else {
          formData.append(arrayKey, item);
        }
      });
    } else {
      formData.append(formKey, String(value));
    }
  });

  return formData;
};

/**
 * Parse response based on content type
 * @param response - Fetch response
 * @returns Parsed response data
 */
export const parseResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get("content-type");

  if (!contentType) {
    return response.text();
  }

  if (contentType.includes("application/json")) {
    return response.json();
  }

  if (contentType.includes("text/")) {
    return response.text();
  }

  if (contentType.includes("multipart/form-data")) {
    return response.formData();
  }

  if (
    contentType.includes("application/octet-stream") ||
    contentType.includes("image/") ||
    contentType.includes("video/") ||
    contentType.includes("audio/")
  ) {
    return response.blob();
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await response.text();
    const params = new URLSearchParams(text);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Default to text
  return response.text();
};

/**
 * Create request with retry logic
 * @param url - Request URL
 * @param config - Request configuration
 * @param retryConfig - Retry configuration
 * @returns Response promise
 */
export const requestWithRetry = async (
  url: string,
  config: RequestConfig = {},
  retryConfig: RetryConfig = {}
): Promise<Response> => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryDelayMultiplier = 2,
    maxRetryDelay = 30000,
    retryCondition = (error) => {
      if (error instanceof ApiError) {
        return error.statusCode >= 500 || error.statusCode === 429;
      }
      return true;
    },
    onRetry,
  } = retryConfig;

  let lastError: any;
  let delay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: config.method || HttpMethod.GET,
        headers: config.headers,
        body:
          config.body instanceof FormData
            ? config.body
            : JSON.stringify(config.body),
        credentials: config.credentials,
        mode: config.mode,
        cache: config.cache,
        redirect: config.redirect,
        referrer: config.referrer,
        referrerPolicy: config.referrerPolicy,
        integrity: config.integrity,
        keepalive: config.keepalive,
        signal: config.signal,
      });

      if (!response.ok) {
        throw new ApiError(
          response.status,
          response.statusText,
          await parseResponse(response),
          config
        );
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries && retryCondition(error)) {
        onRetry?.(error, attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * retryDelayMultiplier, maxRetryDelay);
      } else {
        break;
      }
    }
  }

  throw lastError;
};

/**
 * Create abort controller with timeout
 * @param timeout - Timeout in milliseconds
 * @returns AbortController instance
 */
export const createTimeoutController = (timeout: number): AbortController => {
  const controller = new AbortController();

  setTimeout(() => {
    controller.abort();
  }, timeout);

  return controller;
};

/**
 * Batch API requests with concurrency control
 * @param requests - Array of request functions
 * @param options - Batch options
 * @returns Array of responses
 */
export interface BatchRequestOptions {
  concurrency?: number;
  throwOnError?: boolean;
  onProgress?: (completed: number, total: number) => void;
}

export const batchRequests = async <T>(
  requests: (() => Promise<T>)[],
  options: BatchRequestOptions = {}
): Promise<Array<{ success: boolean; data?: T; error?: any }>> => {
  const { concurrency = 5, throwOnError = false, onProgress } = options;

  const results: Array<{ success: boolean; data?: T; error?: any }> = [];
  let completed = 0;

  const executeRequest = async (request: () => Promise<T>) => {
    try {
      const data = await request();
      return { success: true, data };
    } catch (error) {
      if (throwOnError) throw error;
      return { success: false, error };
    } finally {
      completed++;
      onProgress?.(completed, requests.length);
    }
  };

  // Process in chunks
  for (let i = 0; i < requests.length; i += concurrency) {
    const chunk = requests.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(executeRequest));
    results.push(...chunkResults);
  }

  return results;
};

/**
 * Create request interceptor chain
 * @param interceptors - Array of interceptor functions
 * @returns Intercepted request function
 */
export type RequestInterceptor = (
  config: RequestConfig
) => RequestConfig | Promise<RequestConfig>;

export type ResponseInterceptor = (
  response: Response
) => Response | Promise<Response>;

export interface Interceptors {
  request?: RequestInterceptor[];
  response?: ResponseInterceptor[];
}

export const createInterceptedFetch = (
  interceptors: Interceptors
): typeof fetch => {
  return async (
    input: URL | RequestInfo,
    init?: RequestInit
  ): Promise<Response> => {
    let headers: Record<string, string> | undefined;

    if (init?.headers) {
      if (init.headers instanceof Headers) {
        headers = {};
        init.headers.forEach((value, key) => {
          headers![key] = value;
        });
      } else if (Array.isArray(init.headers)) {
        headers = {};
        init.headers.forEach(([key, value]) => {
          headers![key] = value;
        });
      } else {
        headers = init.headers as Record<string, string>;
      }
    }

    let config: RequestConfig = {
      method:
        init?.method &&
        Object.values(HttpMethod).includes(init.method as HttpMethod)
          ? (init.method as HttpMethod)
          : undefined,
      headers,
      body: init?.body,
      credentials: init?.credentials,
      mode: init?.mode,
      cache: init?.cache,
      redirect: init?.redirect,
      referrer: init?.referrer,
      referrerPolicy: init?.referrerPolicy,
      integrity: init?.integrity,
      keepalive: init?.keepalive,
      signal: init?.signal || undefined,
    };

    // Apply request interceptors
    if (interceptors.request) {
      for (const interceptor of interceptors.request) {
        config = await interceptor(config);
      }
    }

    let response = await fetch(input, config as RequestInit);

    // Apply response interceptors
    if (interceptors.response) {
      for (const interceptor of interceptors.response) {
        response = await interceptor(response);
      }
    }

    return response;
  };
};

/**
 * Calculate request metrics
 * @param request - Request function
 * @returns Request with metrics
 */
export interface RequestMetrics {
  duration: number;
  size: {
    request: number;
    response: number;
  };
  timestamp: number;
}

export const measureRequest = async <T>(
  request: () => Promise<T>
): Promise<{ data: T; metrics: RequestMetrics }> => {
  const startTime = performance.now();
  const timestamp = Date.now();

  const data = await request();
  const duration = performance.now() - startTime;

  // Note: Actual size calculation would require access to request/response objects
  const metrics: RequestMetrics = {
    duration,
    size: {
      request: 0, // Would need actual request size
      response: 0, // Would need actual response size
    },
    timestamp,
  };

  return { data, metrics };
};

/**
 * Create API client with base configuration
 * @param baseConfig - Base configuration
 * @returns API client functions
 */
export interface ApiClient {
  get: <T = any>(url: string, config?: RequestConfig) => Promise<T>;
  post: <T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ) => Promise<T>;
  put: <T = any>(url: string, data?: any, config?: RequestConfig) => Promise<T>;
  patch: <T = any>(
    url: string,
    data?: any,
    config?: RequestConfig
  ) => Promise<T>;
  delete: <T = any>(url: string, config?: RequestConfig) => Promise<T>;
}

export const createApiClient = (
  baseConfig: RequestConfig & { baseUrl?: string } = {}
): ApiClient => {
  const makeRequest = async <T>(
    url: string,
    config: RequestConfig
  ): Promise<T> => {
    const fullUrl = baseConfig.baseUrl ? `${baseConfig.baseUrl}${url}` : url;
    const mergedConfig = {
      ...baseConfig,
      ...config,
      headers: {
        ...baseConfig.headers,
        ...config.headers,
      },
    };

    const response = await requestWithRetry(fullUrl, mergedConfig);
    return parseResponse(response);
  };

  return {
    get: <T = any>(url: string, config?: RequestConfig) =>
      makeRequest<T>(url, { ...config, method: HttpMethod.GET }),

    post: <T = any>(url: string, data?: any, config?: RequestConfig) =>
      makeRequest<T>(url, { ...config, method: HttpMethod.POST, body: data }),

    put: <T = any>(url: string, data?: any, config?: RequestConfig) =>
      makeRequest<T>(url, { ...config, method: HttpMethod.PUT, body: data }),

    patch: <T = any>(url: string, data?: any, config?: RequestConfig) =>
      makeRequest<T>(url, { ...config, method: HttpMethod.PATCH, body: data }),

    delete: <T = any>(url: string, config?: RequestConfig) =>
      makeRequest<T>(url, { ...config, method: HttpMethod.DELETE }),
  };
};

/**
 * GraphQL query builder
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @returns Request body
 */
export const buildGraphQLQuery = (
  query: string,
  variables?: Record<string, any>
): string => {
  return JSON.stringify({
    query,
    variables: variables || {},
  });
};

/**
 * Parse GraphQL response
 * @param response - GraphQL response
 * @returns Parsed data or throws error
 */
export const parseGraphQLResponse = <T = any>(response: {
  data?: T;
  errors?: any[];
}): T => {
  if (response.errors && response.errors.length > 0) {
    const error = new Error(response.errors[0].message);
    (error as any).graphQLErrors = response.errors;
    throw error;
  }

  if (!response.data) {
    throw new Error("No data in GraphQL response");
  }

  return response.data;
};

/**
 * Create rate limiter
 * @param maxRequests - Maximum requests
 * @param windowMs - Time window in milliseconds
 * @returns Rate limiter function
 */
export const createRateLimiter = (
  maxRequests: number,
  windowMs: number
): ((fn: () => Promise<any>) => Promise<any>) => {
  const queue: Array<() => void> = [];
  const timestamps: number[] = [];

  const processQueue = () => {
    const now = Date.now();

    // Remove old timestamps
    while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
      timestamps.shift();
    }

    // Process queue
    while (queue.length > 0 && timestamps.length < maxRequests) {
      timestamps.push(now);
      const next = queue.shift();
      next?.();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      const execute = () => {
        fn().then(resolve).catch(reject);
      };

      queue.push(execute);
      processQueue();

      // Schedule next processing
      if (queue.length > 0) {
        setTimeout(processQueue, windowMs / maxRequests);
      }
    });
  };
};

/**
 * Convert headers object to Headers instance
 * @param headers - Headers object
 * @returns Headers instance
 */
export const createHeaders = (headers?: Record<string, string>): Headers => {
  const h = new Headers();

  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      h.append(key, value);
    });
  }

  return h;
};

/**
 * Extract filename from Content-Disposition header
 * @param contentDisposition - Content-Disposition header value
 * @returns Filename or null
 */
export const extractFilenameFromContentDisposition = (
  contentDisposition: string | null
): string | null => {
  if (!contentDisposition) return null;

  const filenameMatch = contentDisposition.match(
    /filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']+)['"]?;?/i
  );

  if (filenameMatch) {
    return decodeURIComponent(filenameMatch[1]);
  }

  return null;
};
