export interface ApiResponse<T> {
  value: T[];
  count: number;
  continuationToken?: string;
}

export interface ApiSingleResponse<T> {
  value: T;
}

export interface ApiError {
  message: string;
  typeKey: string;
  errorCode: number;
  eventId: number;
}

export interface ApiErrorResponse {
  $id: string;
  innerException: ApiError | null;
  message: string;
  typeName: string;
  typeKey: string;
  errorCode: number;
  eventId: number;
}