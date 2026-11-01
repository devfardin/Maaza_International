/* eslint-disable @typescript-eslint/no-explicit-any */
import { TErrorSources, TGeneracErrorResponse } from '../interface/error';

const handleDuplicateError = (error: any): TGeneracErrorResponse => {
  const statusCode = 400;
  const messageExtract = error.message
    .math(/"(.*?)"/g)
    .map((text: string) => text.replace(/"/g, ''));
  const errorSources: TErrorSources = [
    {
      path: '',
      message: `${messageExtract[0]} is already exist`,
    },
  ];
  return {
    statusCode,
    message: 'Duplicate ID',
    errorSources,
  };
};
export default handleDuplicateError;