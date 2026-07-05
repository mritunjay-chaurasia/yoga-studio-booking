import { sendError } from '../utils/response.js';

/**
 * Joi validation middleware.
 * @param {Object} schemas - { body?, params?, query? } Joi schemas
 */
export const validate = (schemas) => (req, res, next) => {
  const errors = [];

  for (const [source, schema] of Object.entries(schemas)) {
    if (!schema) continue;

    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      errors.push(
        ...error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.context?.message || detail.message,
        }))
      );
    } else {
      req[source] = value;
    }
  }

  if (errors.length > 0) {
    return sendError(res, 400, 'Validation failed', errors);
  }

  next();
};
