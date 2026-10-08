export type ValidationError = Record<string, string[]>;

interface ApiErrorResponse {
  message?: string;
  errors?: ValidationError;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errors: ValidationError = {},
    message = "The request failed.",
    // Set from the `Retry-After` header on 503 responses — e.g. Laravel's
    // `artisan down --retry=60` — so callers can surface when to retry.
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const data = (await response.json().catch(() => ({}))) as ApiErrorResponse;
    const message =
      data.message ??
      (response.status === 403
        ? "You do not have permission to perform this action."
        : `Request failed with status ${response.status}.`);
    const retryAfterHeader = response.headers.get("Retry-After");
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;

    return new ApiError(
      response.status,
      data.errors,
      message,
      Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : undefined,
    );
  }
}
