export const isFunction = (supposedFunction: any): boolean =>
  typeof supposedFunction === 'function';
export const isObjectLiteral = (supposedObjectLiteral: any): boolean =>
  typeof supposedObjectLiteral === 'object' &&
  supposedObjectLiteral !== null &&
  !Array.isArray(supposedObjectLiteral);
export const isThenable = (supposedThenable: any): boolean =>
  isObjectLiteral(supposedThenable) && isFunction(supposedThenable.then);
