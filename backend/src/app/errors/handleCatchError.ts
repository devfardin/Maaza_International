import mongoose from 'mongoose';
import { TErrorSources, TGeneracErrorResponse } from '../interface/error';

const handleCatchError = (
  error: mongoose.Error.CastError,
): TGeneracErrorResponse => {
  const statusCode = 400;
  const errorSources: TErrorSources = [
    {
      path: error.path,
      message: error?.message,
    },
  ];
  return {
    statusCode,
    message: 'Invalid ID',
    errorSources,
  };
};
export default handleCatchError;