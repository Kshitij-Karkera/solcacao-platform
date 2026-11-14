/** Zod request validation. Replaces req[source] with the parsed (typed, trimmed) value. */
import { HttpError } from "../utils/http.js";

export const validate =
  (schema, source = "body") =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new HttpError(400, "Validation failed", result.error.flatten().fieldErrors));
    }
    if (source === "query") req.validatedQuery = result.data;
    else req[source] = result.data;
    return next();
  };
