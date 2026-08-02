const { ValidationError } = require('../utils/errors');

const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return next(
      new ValidationError('Validation Failed', {
        details: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      })
    );
  }

  req[property] = value;
  return next();
};

module.exports = { validate };
