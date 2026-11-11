export type TErrorSources = {
  path: string | number;
  message: string;
}[];

export type TGeneracErrorResponse = {
  statusCode: number;
  message: string;
  errorSources: TErrorSources;
};
