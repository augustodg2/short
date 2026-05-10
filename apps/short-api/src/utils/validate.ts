import { ZodType } from "zod";

export class ValidationError extends Error {
  constructor(message: string = "Validation error", options?: ErrorOptions) {
    super(message, options);
    this.name = "ValidationError";
  }
}

export function validate<T>(data: unknown, schema: ZodType<T>): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError(result.error.issues[0].message);
  }

  return result.data;
}
