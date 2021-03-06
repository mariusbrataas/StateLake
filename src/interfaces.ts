export interface IBase {
  [key: string]: any;
}

type Primitives = boolean | string | number | bigint;

export type Keys<T> = T extends Primitives
  ? never
  : keyof T & (T extends any[] ? number : string);

export type IKeys<T> = keyof T;

export type SetStateReturn<T> = (arg?: T) => void;
export type UseStateReturn<T> = (arg?: T) => [T, SetStateReturn<T>];

export interface INode<T> {
  branches?: T extends any[]
    ? INode<IKeys<T>>[]
    : { [key in IKeys<T>]: INode<T[key]> };
  hooks?: ((state: T) => void)[];
  identifier: string;
  update?: (arg: T) => void;
}
