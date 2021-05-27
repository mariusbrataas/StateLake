import React, { useEffect, useMemo, useState } from 'react';
import { autoBind, extractIdComponents, generateId, nullish } from './utils';

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

/**
 * Mapped branch
 */
function MappedBranch<
  T extends IBase,
  P extends {
    branch: StateLake<T[Keys<T, T>]>;
    parent?: StateLake<T>;
  }
>({
  id,
  parent,
  Component,
  ...props
}: {
  id: string;
  parent: StateLake<T>;
  Component: (props: P) => JSX.Element;
}) {
  // Branch
  const branch = parent.useBranch(id as Keys<T, T>);

  // Render
  return <Component branch={branch} parent={parent} {...(props as any)} />;
}

/**
 * Map StateLake
 */
function MapStateLake<
  T extends IBase,
  P extends {
    branch: StateLake<T[Keys<T, T>]>;
    parent?: StateLake<T>;
  }
>({
  branch,
  Component,
  keys: propKeys,
  sort,
  ...props
}: {
  branch: StateLake<T>;
  Component: (props: P) => JSX.Element;
  keys?: string[];
  sort?: (
    value_a: T[Keys<T, T>],
    value_b: T[Keys<T, T>],
    key_a: string,
    key_b: string
  ) => -1 | 0 | 1;
} & Omit<P, 'branch' | 'parent'>) {
  // ID - Helps prevent duplicate keys in the dom
  const id = useMemo(
    () => `${branch.getId()}_${StateLake.generateId()}`,
    [branch]
  );

  // Keys
  const [stateKeys, state] = branch.useKeys();

  // Sorted keys
  const keys = propKeys || stateKeys;
  const sortedKeys = useMemo(
    () =>
      sort
        ? keys.sort((keyA, keyB) => sort(state[keyA], state[keyB], keyA, keyB))
        : keys,
    [sort, keys.length, keys.join('')]
  );

  // Memoized nodes
  return useMemo(
    () => (
      <>
        {sortedKeys.map(key =>
          state[key] === null ? undefined : (
            <MappedBranch
              key={`${id}_${key}`}
              id={key}
              parent={branch}
              Component={Component}
              {...props}
            />
          )
        )}
      </>
    ),
    [sortedKeys.length, sortedKeys.join(''), ...Object.values(props || {})]
  );
}

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
 * Return type of useInitialState
 */
export type UseInitialState<T extends IBase> = (
  initial_state: T
) => UseState<T>;

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
  private parent?: StateLake<any>;

  /**
   * The key used by the parent of this branch (if any) to reference this branch.
   */
  private key: string;

  /**
   * Reference to the StateLake-object at the top of the store.
   */
  private top: StateLake<any>;

  /**
   * Relative path from the top of the store to this branch.
   */
  private path: string[];

  /**
   * Unique id
   */
  private id: string;

  /**
   * A list containing all hooks connected to this branch.
   */
  private hooks: ((state: T) => void)[];

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

    // Initialize basic properties
    this.top = this.parent ? this.parent.top : this;
    this.path = [
      ...(this.parent?.getPath() || []),
      ...(this.key ? [this.key] : [])
    ];

    // Unique identifier
    this.id = StateLake.generateId();

    // Hooks
    this.hooks = [];

    // Branches
    this.branches = {};

    // Bind class methods
    autoBind(this);
  }

  /**
   * Create a memoized StateLake
   */
  public static useLake<T extends IBase>(state: T | (() => T)) {
    return useMemo(() => new StateLake(state), []);
  }

  /**
   * Efficiently map all sub-branches of a StateLake object, and pass the corresponding
   * branches to the given component.
   */
  public static Map = MapStateLake;

  /**
   * Generate a somewhat unique ID.
   *
   * The returned ID consists of the following three componens:
   *  * Timestamp   - stringified, reversed, and converted to a base 64 number.
   *  * Session ID  - 3 random tokens. 64^3 possible combinations.
   *  * Local count - Counter containing the number of times this function has been called, converted to base 36 number.
   *
   * This is not safe to use for database entries, but is useful for efficiently generating IDs that are unique
   * to the current session.
   *
   * Every StateLake branch will be assigned an ID generated by this function.
   */
  public static generateId = generateId;

  /**
   * Takes an ID created by `StateLake.generateId`, and returns its timestamp, session ID, and local count.
   */
  public static extractIdComponents = extractIdComponents;

  /**
   * Get key.
   *
   * Returns the key that the parent of this branch uses to refer to it.
   * If the branch is at the very top of the store, this will yield `undefined`.
   */
  public getKey() {
    return this.key;
  }

  /**
   * Get path.
   *
   * The path is a string array that represents the path from the top of the store,
   * down to this branch.
   */
  public getPath() {
    return this.path;
  }

  /**
   * Get the unique identifier of this branch
   */
  public getId() {
    return this.id;
  }

  /**
   * Get parent
   *
   * Returns the parent of this branch.
   * If the branch is at the very top of the store, this will yield `undefined`.
   */
  public getParent() {
    return this.parent;
  }

  /**
   * Get top
   *
   * Returns the top branch.
   * If the current branch is the top, `this` branch will be returned.
   */
  public getTop() {
    return this.top;
  }

  /**
   * Count the number of hooks in this branch and all sub-branches
   */
  public countHooks(): number {
    return Object.keys(this.branches).reduce(
      (total, key) =>
        total + (this.branches[key as Keys<T, T>]?.countHooks() || 0),
      this.hooks.length
    );
  }

  /**
   * Count the number of branches in this branch and all sub-branches
   */
  public countBranches(): number {
    return Object.keys(this.branches).reduce(
      (total, key) =>
        total + (this.branches[key as Keys<T, T>]?.countBranches() || 0),
      1
    );
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
   * Get keys
   *
   * Return all keys of the current state object.
   */
  public keys() {
    return Object.keys(this.state) as string[];
  }

  /**
   * Attach hook.
   */
  private attachHook(hook: StateLake<T>['hooks'][number]) {
    if (this.hooks.indexOf(hook) === -1) this.hooks.push(hook);
  }

  /**
   * Detach hook.
   */
  private detachHook(hook: StateLake<T>['hooks'][number]) {
    this.hooks = this.hooks.filter(test => test !== hook);
    if (this.parent && this.hooks.length === 0 && nullish(this.state))
      this.parent.detachBranch(this);
  }

  /**
   * Ensure branch exists.
   *
   * Recursively propagate through the state tree to retrieve the branch at the
   * given path. Missing branches will be created along the way.
   */
  private ensureBranch([prop, ...path]: string[]): StateLake<any> {
    if (prop === undefined) return this;
    return (
      (this.branches[prop as Keys<T, T>] =
        this.branches[prop as Keys<T, T>] ||
        new StateLake(this.state && this.state[prop], this, prop)) as StateLake<
        T[Keys<T, T>]
      >
    ).ensureBranch(path);
  }

  /**
   * Detach branch.
   *
   * Will be called by a child branch whenever that branch has it's last remaining
   * hook detached while it's state is undefined or null.
   */
  private detachBranch(branch: StateLake<T[Keys<T, T>]>) {
    const { [branch.getKey() as Keys<T, T>]: remove_branch, ...new_branches } =
      this.branches;
    this.branches = new_branches as StateLake<T>['branches'];
  }

  /**
   * Trigger all hooks.
   */
  private triggerHooks() {
    this.hooks.forEach(hook => hook(this.state));
  }

  /**
   * Change state and update timestamp
   */
  private changeState(state: T) {
    // Set current state
    this.state = state;

    // Trigger hooks
    this.triggerHooks();
  }

  /**
   * Update the value of a branch.
   *
   * If the given branch is not yet tracked by `this` branch, the current state object
   * will be updated, and hooks will be triggered.
   */
  private updateBranchState(branch: StateLake<T[Keys<T, T>]>) {
    // Helper variables
    const got_key = this.state && branch?.getKey() in this.state;
    const branch_state = branch.getState();

    // Does the state need to re-attach to parent state object?
    var add_or_remove = false;

    // Handle add/remove branch
    if (branch_state === null) {
      // Remove branch?
      if (got_key) {
        // Ensure re-attachment
        add_or_remove = true;

        // Change state
        const { [branch.getKey()]: remove_state, ...new_state } =
          this.getState();
        this.changeState(new_state as any);

        // Remove from branches
        this.detachBranch(branch);
      }
    } else {
      // Add branch?
      if (!got_key) {
        // Ensure re-attachment
        add_or_remove = true;

        // Change state
        this.changeState({
          ...this.state,
          [branch.getKey()]: branch.getState()
        });
      }
    }

    // Update parent if branch is being added or removed, else mutate state
    if (add_or_remove) {
      // Update parent
      if (this.parent) this.parent.updateBranchState(this);
    } else {
      // Mutate state object
      this.state[branch.getKey() as Keys<T, T>] = branch.getState();
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
  public getBranch<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>,
    K4 extends Keys<
      T[K0][K1][K2][K3],
      T | T[K0] | T[K0][K1] | T[K0][K1][K2] | T[K0][K1][K2][K3]
    >
  >(k0: K0, k1: K1, k2: K2, k3: K3, k4: K4): GetBranch<T[K0][K1][K2][K3][K4]>;
  public getBranch(...path: string[]) {
    return this.ensureBranch(path);
  }

  /**
   * Set state.
   *
   * Returns a function for updating the state at the given path.
   * This function can be called directly, and will be typesafe.
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
  public setState<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>,
    K4 extends Keys<
      T[K0][K1][K2][K3],
      T | T[K0] | T[K0][K1] | T[K0][K1][K2] | T[K0][K1][K2][K3]
    >
  >(k0: K0, k1: K1, k2: K2, k3: K3, k4: K4): SetState<T[K0][K1][K2][K3][K4]>;
  public setState(...path: string[]) {
    return this.getBranch(...(path as EmptyPath)).updateState;
  }

  /**
   * Use branch.
   *
   * Return a memoized reference to the branch at the given path.
   * The reference will automatically update if the path is changed.
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
  public useBranch<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>,
    K4 extends Keys<
      T[K0][K1][K2][K3],
      T | T[K0] | T[K0][K1] | T[K0][K1][K2] | T[K0][K1][K2][K3]
    >
  >(k0: K0, k1: K1, k2: K2, k3: K3, k4: K4): UseBranch<T[K0][K1][K2][K3][K4]>;
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
  public useState<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>,
    K4 extends Keys<
      T[K0][K1][K2][K3],
      T | T[K0] | T[K0][K1] | T[K0][K1][K2] | T[K0][K1][K2][K3]
    >
  >(k0: K0, k1: K1, k2: K2, k3: K3, k4: K4): UseState<T[K0][K1][K2][K3][K4]>;
  public useState(...path: string[]) {
    // Reference branch
    const branch = this.useBranch(...(path as EmptyPath));

    // Create hook
    const [state, setState] = useState(branch.state);

    // Register hook
    useEffect(() => {
      // Attach hook
      branch.attachHook(setState);

      // Update state on branch change
      if (branch.state !== state) setState(branch.state);

      // Detach hook on component unmount
      return function cleanup() {
        branch.detachHook(setState);
      };
    }, [branch.id, setState]);

    // Return
    return [state, branch.updateState, branch];
  }

  /**
   * Use initial state.
   *
   * Works the same way as `store.useState`, but allows for setting an initial state.
   *
   * @example
   * const [car, setCar] = store.useInitialState("car")({
   *   brand: "Ferrari",
   *   year: 1962
   * });
   */
  public useInitialState(): UseInitialState<T>;
  public useInitialState<K0 extends Keys<T, T>>(k0: K0): UseInitialState<T[K0]>;
  public useInitialState<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>
  >(k0: K0, k1: K1): UseInitialState<T[K0][K1]>;
  public useInitialState<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>
  >(k0: K0, k1: K1, k2: K2): UseInitialState<T[K0][K1][K2]>;
  public useInitialState<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>
  >(k0: K0, k1: K1, k2: K2, k3: K3): UseInitialState<T[K0][K1][K2][K3]>;
  public useInitialState<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>,
    K4 extends Keys<
      T[K0][K1][K2][K3],
      T | T[K0] | T[K0][K1] | T[K0][K1][K2] | T[K0][K1][K2][K3]
    >
  >(
    k0: K0,
    k1: K1,
    k2: K2,
    k3: K3,
    k4: K4
  ): UseInitialState<T[K0][K1][K2][K3][K4]>;
  public useInitialState(...path: string[]) {
    // Create hook
    const [state, setState] = this.useState(...(path as EmptyPath));

    // Return function to set current state
    return (initial_state: any) => {
      return [state === undefined ? initial_state : state, setState];
    };
  }

  /**
   * Use effect
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
  public useEffect<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>,
    K4 extends Keys<
      T[K0][K1][K2][K3],
      T | T[K0] | T[K0][K1] | T[K0][K1][K2] | T[K0][K1][K2][K3]
    >
  >(k0: K0, k1: K1, k2: K2, k3: K3, k4: K4): UseEffect<T[K0][K1][K2][K3][K4]>;
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
  public useKeys<
    K0 extends Keys<T, T>,
    K1 extends Keys<T[K0], T | T[K0]>,
    K2 extends Keys<T[K0][K1], T | T[K0] | T[K0][K1]>,
    K3 extends Keys<T[K0][K1][K2], T | T[K0] | T[K0][K1] | T[K0][K1][K2]>,
    K4 extends Keys<
      T[K0][K1][K2][K3],
      T | T[K0] | T[K0][K1] | T[K0][K1][K2] | T[K0][K1][K2][K3]
    >
  >(k0: K0, k1: K1, k2: K2, k3: K3, k4: K4): UseKeys<T[K0][K1][K2][K3][K4]>;
  public useKeys(...path: string[]) {
    // Current state
    const [state, _setState, branch] = this.useState(...(path as EmptyPath));

    // Return memoized keys
    return useMemo(() => [Object.keys(state || {}), state, branch], [state]);
  }
}
