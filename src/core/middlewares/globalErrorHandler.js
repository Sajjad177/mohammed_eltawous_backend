import { sendResponse } from '../../utility/sendResponse.js';

export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  sendResponse(res, {
    statusCode,
    message: err.message || 'Something went wrong',
    errors: err.errors
  });

  next();
};
