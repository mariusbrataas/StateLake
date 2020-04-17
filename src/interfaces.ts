export interface IBase {
  [key: string]: any;
}

type Primitives = boolean | string | number | bigint;

export type IKeys<T> = T extends Primitives
  ? never
  : keyof T & (T extends any[] ? number : string);

export interface INode<T> {
  branches?: T extends any[]
    ? INode<IKeys<T>>[]
    : { [key in IKeys<T>]: INode<T[key]> };
  hooks?: ((state: T) => void)[];
  identifier: string;
  update?: (arg: T) => void;
}
