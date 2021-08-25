import React, { useEffect, useMemo, useState } from 'react';
import { autoBind, generateId, nullish } from './utils';

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
 * Mapped component properties
 */
export type MappedComponentProps<T extends IBase> = {
  branch: StateLake<T[Keys<T, T>]>;
  parent: StateLake<T>;
  idx: number;
  keys: string[];
};

/**
 * Empty path type
 */
type EmptyPath = [any, any];

/**
 * Return type of getBranch
 */
export type GetBranch<T extends IBase> = StateLake<T>;

/**
 * Return type of setState
 */
export type SetState<T extends IBase> = (state: T) => void;

/**
 * Return type of useBranch
 */
export type UseBranch<T extends IBase> = StateLake<T>;

/**
 * Return type of useState
 */
export type UseState<T extends IBase> = [T, SetState<T>, StateLake<T>];

/**
 * Return type of useEffect
 */
export type UseEffect<T extends IBase> = (
  effect: (state: T, setState: SetState<T>, branch: StateLake<T>) => void
) => void;

/**
 * Return type of useKeys
 */
export type UseKeys<T extends IBase> = [string[], T, StateLake<T>];

/**
 * Default filter function, used in `.Map`
 */
function defaultFilter(value: any): boolean {
  return !nullish(value);
}

/**
 * Mapped branch
 */
function MappedBranch<T extends IBase, P>({
  idx,
  id,
  parent,
  Component,
  additionalProps,
  keys
}: {
  idx: number;
  id: string;
  parent: StateLake<T>;
  Component: (props: P & MappedComponentProps<T>) => JSX.Element;
  additionalProps: Omit<P, keyof MappedComponentProps<T>>;
  keys: string[];
}) {
  // Branch
  const branch = parent.useBranch(id as Keys<T, T>);

  // Render
  return (
    <Component
      branch={branch}
      parent={parent}
      idx={idx}
      keys={keys}
      {...(additionalProps as any)}
    />
  );
}

/**
 * Counter.
 * Rather than storing the same state many times in multiple different hooks,
 * every hook stores a copy of the same number.
 */
const counter = (function () {
  var count = 0;
  return () =>
    count < Number.MAX_SAFE_INTEGER
      ? (count += 1)
      : (count = Number.MIN_SAFE_INTEGER);
})();

/**
 * StateLake class
 */
export class StateLake<T extends IBase> {
  /**
   * Current state
   */
  private state: T;

  /**
   * Reference to parent of this branch (if any).
   */
  public readonly parent?: StateLake<any>;

  /**
   * The key used by the parent of this branch (if any) to reference this branch.
   * If the branch is at the very top of the store, this will be `undefined`.
   */
  public readonly key: string;

  /**
   * Unique id
   */
  private id: string;

  /**
   * A list containing all hooks connected to this branch.
   */
  private hooks: ((state: number) => void)[];

  /**
   * References to all sub-branches of this branch.
   */
  private branches: { [key in Keys<T, T>]?: StateLake<T[key]> };

  /**
   * Initialize a new StateLake.
   *
   * An initial state object needs to be provided, but `parent` and `key`
   * should not be provided unless the new StateLake is to be connected to an
   * existing StateLake.
   *
   * @param state
   * @param parent
   * @param key
   */
  constructor(
    state: T | (() => T),
    parent?: StateLake<T>['parent'],
    key?: StateLake<T>['key']
  ) {
    // Initialize parameter properties
    this.state =
      state && typeof state === 'function'
        ? (state as () => T)()
        : (state as T);
    this.parent = parent;
    this.key = key || '';

    // Unique identifier
    this.id = generateId();

    // Hooks
    this.hooks = [];

    // Branches
    this.branches = {};

    // Bind class methods
    autoBind(this, StateLake.prototype);
  }

  /**
   * Create a memoized StateLake
   */
  public static useLake<T extends IBase>(state: T | (() => T)) {
    return useMemo(() => new StateLake(state), []);
  }

  /**
   * Reference to the StateLake-object at the top of the store.
   */
  public top(): StateLake<any> {
    return this.parent?.top() || this;
  }

  /**
   * Get state
   *
   * Returns the current state object of this branch.
   * If changes are made to the state object without using the StateLake api,
   * those changes won't be tracked by react.
   */
  public getState() {
    return this.state;
  }

  /**
   * Change state.
   */
  private changeState(state: T) {
    // Set current state
    this.state = state;

    // Trigger hooks
    const count = counter();
    this.hooks.forEach(hook => hook(count));
  }

  /**
   * Get keys
   *
   * Return all keys of the current state object.
   */
  public keys(): string[] {
    return Object.keys(this.state);
  }

  /**
   * Ensure branch exists.
   *
   * Recursively propagate through the state tree to retrieve the branch at the
   * given path. Missing branches will be created along the way.
   */
  private ensureBranch([prop, ...path]: string[]): StateLake<any> {
    return prop === undefined
      ? this
      : (
          (this.branches[prop as Keys<T, T>] ||
            (this.branches[prop as Keys<T, T>] = new StateLake(
              this.state && this.state[prop],
              this,
              prop
            ))) as StateLake<T[Keys<T, T>]>
        ).ensureBranch(path);
  }

  /**
   * Update the value of a branch.
   *
   * If the given branch is either being deleted, or not yet tracked by `this` branch, the current state object
   * will be updated.
   */
  private updateBranchState(branch: StateLake<T[Keys<T, T>]>) {
    // Helper variables
    const got_key = this.state && branch?.key in this.state;

    // Does the state need to re-attach to parent state object?
    var add_or_remove = false;

    // Handle add/remove branch
    if (branch.state === null) {
      // Remove branch?
      if (got_key) {
        // Ensure re-attachment
        add_or_remove = true;

        // Change state
        const { [branch.key]: remove_state, ...new_state } = this.state;
        this.changeState(new_state as any);

        // Remove from branches
        const { [branch.key as Keys<T, T>]: remove_branch, ...new_branches } =
          this.branches;
        this.branches = new_branches as StateLake<T>['branches'];
      }
    } else {
      // Add branch?
      if (!got_key) {
        // Ensure re-attachment
        add_or_remove = true;

        // Change state
        this.changeState({
          ...this.state,
          [branch.key]: branch.state
        });
      }
    }

    // Update parent if branch is being added or removed, else mutate state
    if (add_or_remove) {
      // Update parent
      if (this.parent) this.parent.updateBranchState(this);
    } else {
      // Mutate state object
      this.state[branch.key as Keys<T, T>] = branch.state;
    }
  }

  /**
   * Update state.
   *
   * Things that happen here:
   * 1. The current state object needs to be replaced.
   * 2. The parent needs to get a reference to the new state object.
   * 3. Any sub-branches needs to be notified about the change in order to
   * re-attach to the current state object, as well as triggering their own hooks.
   */
  protected updateState(state: T, parent_updated?: boolean) {
    // Should update?
    const do_update = parent_updated || state !== this.state;

    // Update
    if (do_update) {
      // Change state
      this.changeState(state);

      // Update parent state object
      if (this.parent && !parent_updated) this.parent.updateBranchState(this);
    }

    // Recurse down branches
    if (!nullish(state))
      Object.keys(this.branches).forEach(key =>
        this.branches[key as Keys<T, T>]?.updateState(
          key in state ? state?.[key] : null,
          do_update
        )
      );
  }

  /**
   * Delete branch.
   *
   * This will not actually delete StateLake-objects, but they will be detached
   * from the state tree. Unless the user keeps some reference to them, they should
   * be collected by the garbage collector.
   */
  public delete() {
    this.updateState(null as any);
  }

  /**
   * Get branch.
   *
   * Returns a reference to a branch at the given path.
   * This is not a memoized reference, and thus it will be recalculated every
   * time this function is called.
   *
   * @param {String} path Relative path of branch
   */
  public getBranch(): GetBranch<T>;
  public getBranch<K0 extends Keys<T, T>>(k0: K0): GetBranch<T[K0]>;
  public getBranch<K0 extends Keys<T, T>, K1 extends Keys<T[K0], T | T[K0]>>(
    k0: K0,
    k1: K1
  ): GetBranch<T[K0][K1]>;
  public getBranch<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>
  >(k0: K0, k1: K1, k2: K2): GetBranch<T[K0][K1][K2]>;
  public getBranch<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>
  >(k0: K0, k1: K1, k2: K2, k3: K3): GetBranch<T[K0][K1][K2][K3]>;
  public getBranch(...path: string[]) {
    return this.ensureBranch(path);
  }

  /**
   * Set state.
   *
   * Returns a function for updating the state at the given path.
   * This function can be called directly, and will be typesafe.
   *
   * @param {String} path Relative path of branch
   *
   * @example
   * // Set state directly
   * store.setState("car")({
   *   brand: "Ferrari",
   *   year: 1962
   * });
   *
   * // ..or like so:
   * const setState = store.setState("car");
   * setState({
   *   brand: "Ferrari",
   *   year: 1962
   * });
   */
  public setState(): SetState<T>;
  public setState<K0 extends Keys<T, T>>(k0: K0): SetState<T[K0]>;
  public setState<K0 extends Keys<T, T>, K1 extends Keys<T[K0], T | T[K0]>>(
    k0: K0,
    k1: K1
  ): SetState<T[K0][K1]>;
  public setState<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>
  >(k0: K0, k1: K1, k2: K2): SetState<T[K0][K1][K2]>;
  public setState<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>
  >(k0: K0, k1: K1, k2: K2, k3: K3): SetState<T[K0][K1][K2][K3]>;
  public setState(...path: string[]) {
    return this.getBranch(...(path as EmptyPath)).updateState;
  }

  /**
   * Use branch.
   *
   * Return a memoized reference to the branch at the given path.
   * The reference will automatically update if the path is changed.
   *
   * @param {String} path Relative path of branch
   */
  public useBranch(): UseBranch<T>;
  public useBranch<K0 extends Keys<T, T>>(k0: K0): UseBranch<T[K0]>;
  public useBranch<K0 extends Keys<T, T>, K1 extends Keys<T[K0], T | T[K0]>>(
    k0: K0,
    k1: K1
  ): UseBranch<T[K0][K1]>;
  public useBranch<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>
  >(k0: K0, k1: K1, k2: K2): UseBranch<T[K0][K1][K2]>;
  public useBranch<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>
  >(k0: K0, k1: K1, k2: K2, k3: K3): UseBranch<T[K0][K1][K2][K3]>;
  public useBranch(...path: string[]) {
    return useMemo(
      () => this.getBranch(...(path as EmptyPath)),
      [this.id, ...path]
    );
  }

  /**
   * Use state.
   *
   * Works similarly to `React.useState`, but allows many different components
   * to connect to a shared state. This state will also be accessible from anywhere else in the store.
   *
   * @param {String} path Relative path of branch
   *
   * @example
   * const [car, setCar] = store.useState("car");
   */
  public useState(): UseState<T>;
  public useState<K0 extends Keys<T, T>>(k0: K0): UseState<T[K0]>;
  public useState<K0 extends Keys<T, T>, K1 extends Keys<T[K0], T | T[K0]>>(
    k0: K0,
    k1: K1
  ): UseState<T[K0][K1]>;
  public useState<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>
  >(k0: K0, k1: K1, k2: K2): UseState<T[K0][K1][K2]>;
  public useState<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>
  >(k0: K0, k1: K1, k2: K2, k3: K3): UseState<T[K0][K1][K2][K3]>;
  public useState(...path: string[]) {
    // Reference branch
    const branch = this.useBranch(...(path as EmptyPath));

    // Create hook
    const setState = useState(branch.state)[1];

    // Register hook
    useEffect(() => {
      // Attach hook
      if (branch.hooks.indexOf(setState) === -1) branch.hooks.push(setState);

      // Detach hook on component unmount
      return function cleanup() {
        branch.hooks = branch.hooks.filter(test => test !== setState);
      };
    }, [branch.id, setState]);

    // Return
    return [branch.state, branch.updateState, branch];
  }

  /**
   * Use effect
   *
   * Create an effect that will be triggered by changes to the state of the
   * branch at the given path.
   *
   * @param {String} path Relative path of branch
   */
  public useEffect(): UseEffect<T>;
  public useEffect<K0 extends Keys<T, T>>(k0: K0): UseEffect<T[K0]>;
  public useEffect<K0 extends Keys<T, T>, K1 extends Keys<T[K0], T | T[K0]>>(
    k0: K0,
    k1: K1
  ): UseEffect<T[K0][K1]>;
  public useEffect<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>
  >(k0: K0, k1: K1, k2: K2): UseEffect<T[K0][K1][K2]>;
  public useEffect<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>
  >(k0: K0, k1: K1, k2: K2, k3: K3): UseEffect<T[K0][K1][K2][K3]>;
  public useEffect(...path: string[]) {
    // Current state
    const [state, setState, branch] = this.useState(...(path as EmptyPath));

    // Return callback to create effect
    return (
      effect: (
        state: any,
        setState: (state: any) => void,
        branch: StateLake<any>
      ) => void
    ) => {
      useEffect(() => effect(state, setState, branch), [state]);
    };
  }

  /**
   * Use keys.
   *
   * Returns the current keys and state at the given path
   *
   * @param {String} path Relative path of branch
   */
  public useKeys(): UseKeys<T>;
  public useKeys<K0 extends Keys<T, T>>(k0: K0): UseKeys<T[K0]>;
  public useKeys<K0 extends Keys<T, T>, K1 extends Keys<T[K0], T | T[K0]>>(
    k0: K0,
    k1: K1
  ): UseKeys<T[K0][K1]>;
  public useKeys<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>
  >(k0: K0, k1: K1, k2: K2): UseKeys<T[K0][K1][K2]>;
  public useKeys<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>
  >(k0: K0, k1: K1, k2: K2, k3: K3): UseKeys<T[K0][K1][K2][K3]>;
  public useKeys(...path: string[]) {
    // Current state
    const [state, _setState, branch] = this.useState(...(path as EmptyPath));

    // Return memoized keys
    return useMemo(
      () => [state ? Object.keys(state) : [], state, branch],
      [state]
    );
  }

  /**
   * Efficiently map all sub-branches of a StateLake object, and pass the corresponding
   * branches to the given component.
   */
  public Map<P>({
    Component,
    keys,
    sort,
    filter,
    ...props
  }: {
    Component: (props: P & MappedComponentProps<T>) => JSX.Element;
    keys?: string[];
    sort?: (
      value_a: T[Keys<T, T>],
      value_b: T[Keys<T, T>],
      key_a: string,
      key_b: string
    ) => -1 | 0 | 1;
    filter?: (value: T[Keys<T, T>], key: string, idx: number) => boolean;
  } & Omit<P, keyof MappedComponentProps<T>>) {
    // Identifier - Helps prevent duplicate keys in the dom
    const identifier = useMemo(() => `${this.id}_${generateId()}`, [this.id]);

    // State
    const [stateKeys, state] = this.useKeys();
    const selectedKeys = keys || stateKeys;

    // Filter
    const filt = useMemo<
      (value: T[Keys<T, T>], key: string, idx: number) => boolean
    >(
      () =>
        filter
          ? (value, key, idx) => defaultFilter(value) && filter(value, key, idx)
          : defaultFilter,
      [filter]
    );

    // Filter keys
    const filterKeys: () => [string[], string] = () => {
      const filtered = selectedKeys.filter((key, idx) =>
        filt(state[key], key, idx)
      );
      return [filtered, filtered.join('')];
    };
    const [filteredKeys, joinedFilteredKeys] = useMemo(filterKeys, [
      filt,
      selectedKeys.join('')
    ]);

    // Sort keys
    const sortKeys: () => [string[], string] = () => {
      if (sort) {
        const sorted = sort
          ? filteredKeys.sort((keyA, keyB) =>
              sort(state[keyA], state[keyB], keyA, keyB)
            )
          : filteredKeys;
        return [sorted, sorted.join('')];
      }
      return [filteredKeys, joinedFilteredKeys];
    };
    const [sortedKeys, joinedSortedKeys] = useMemo(sortKeys, [
      sort,
      joinedFilteredKeys
    ]);

    // Helper: Create nodes
    const createNodes = () => (
      <>
        {sortedKeys.map((key, idx, keys) => (
          <MappedBranch
            key={`${identifier}_${key}`}
            idx={idx}
            id={key}
            parent={this}
            Component={Component}
            keys={keys}
            additionalProps={props as any}
          />
        ))}
      </>
    );

    // Memoized nodes
    return useMemo(createNodes, [
      identifier,
      Component,
      joinedSortedKeys,
      ...Object.values(props || {})
    ]);
  }
}
