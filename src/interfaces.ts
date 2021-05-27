/**
 * Get all available keys on type
 */
export type Keys<T, C> = C extends any[]
  ? never
  : C extends string
  ? never
  : keyof T;

/**
 * Basic state structure
 */
export interface IBase {
  [key: string]: any;
}

/**
 * Empty path type
 */
export type EmptyPath = [any, any];
