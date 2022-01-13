import { CustomError } from "ts-custom-error";

type FieldErrors = Record<string, string | undefined>;

export class ValidationError extends CustomError {
  constructor(
    message?: string,
    public fieldErrors: FieldErrors = {},
    public fields: FieldErrors = {},
    public error: boolean = true
  ) {
    super(message);
    this.fieldErrors = fieldErrors;
    this.fields = fields;
    this.error = error;
  }
}

export const validateData = <K extends string | number, T>(
  data: Record<K, T>,
  schema: Record<K, (value: T) => undefined | string>,
  message?: string
) => {
  type Errors = Record<K, string | undefined>;

  let hasError = false;
  const keys = Object.keys(data);
  const errors: Errors = {} as Errors;

  keys.forEach((key) => {
    const validationResponse = schema[key as K](data[key as K] as T);
    errors[key as K] = validationResponse;
    if (validationResponse) {
      hasError = true;
    }
  });

  return validationError(
    message || hasError ? "Form validation failed" : "",
    errors,
    data as unknown as FieldErrors,
    hasError
  );
};

export const validationError = (
  message?: string,
  fieldErrors?: FieldErrors,
  fields?: FieldErrors,
  error?: boolean
) => {
  return new ValidationError(message, fieldErrors, fields, error);
};
