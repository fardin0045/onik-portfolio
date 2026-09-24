import { badRequest, HttpError } from '../utils/httpError.js';

/** Converts a ZodError into `{ field.path: message }`. */
export function zodFieldErrors(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpError(422, 'Validation failed', zodFieldErrors(result.error));
  return result.data;
}

/** Express middleware: validates req.body and replaces it with the parsed (clean) value. */
export const validateBody = (schema) => (req, _res, next) => {
  req.body = parseOrThrow(schema, req.body ?? {});
  next();
};

export const assertObjectId = (id) => {
  if (!/^[a-f\d]{24}$/i.test(String(id))) throw badRequest('Invalid id');
  return id;
};
