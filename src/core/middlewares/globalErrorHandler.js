import { sendResponse } from '../../utility/sendResponse.js';

export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (res.headersSent) {
    return next(err);
  }

  return sendResponse(res, {
    statusCode,
    message: err.message || 'Something went wrong',
    errors: err.errors || err.details
  });
};
