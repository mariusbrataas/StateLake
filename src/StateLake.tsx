import React, { useEffect, useMemo, useState } from 'react';

type EmptyPath = [any];

type ReturnOutputs<T> = {
  getBranch: StateLake<T>;
  setState: (new_state: T | ((prev_state: T) => T)) => void;
  useBranch: ReturnOutputs<T>['getBranch'];
  useState: [T, ReturnOutputs<T>['setState']];
  useEffect: (
    effect: (state: T, setState: ReturnOutputs<T>['setState']) => void
  ) => void;
  use: T;
  useKeys: [keys: string[], state: T];
};

type GetReturn<
  T,
  Return extends keyof ReturnOutputs<T>
> = ReturnOutputs<T>[Return];

type ShiftTuple<Arr extends any[]> = Arr extends [arg: any, ...rest: infer U]
  ? U
  : Arr;

type EnsurePath<T, Path extends any[]> = Path[0] extends undefined
  ? T
  : EnsurePath<NonNullable<T>[Path[0]], ShiftTuple<Path>>;

type CheckPrimitives<T, key> = T extends string | number | boolean
  ? never
  : key;

type Keys<T> = keyof NonNullable<T>;

interface Overloader<T, Return extends keyof ReturnOutputs<T>> {
  use(): GetReturn<EnsurePath<T, []>, Return>;
  use<K0 extends Keys<T>>(
    ...keys: [CheckPrimitives<T, K0>]
  ): GetReturn<EnsurePath<T, [K0]>, Return>;
  use<K0 extends Keys<T>, K1 extends Keys<EnsurePath<T, [K0]>>>(
    ...keys: [CheckPrimitives<T, K0>, CheckPrimitives<EnsurePath<T, [K0]>, K1>]
  ): GetReturn<EnsurePath<T, [K0, K1]>, Return>;
  use<
    K0 extends Keys<T>,
    K1 extends Keys<EnsurePath<T, [K0]>>,
    K2 extends Keys<EnsurePath<T, [K0, K1]>>
  >(
    ...keys: [
      CheckPrimitives<T, K0>,
      CheckPrimitives<EnsurePath<T, [K0]>, K1>,
      CheckPrimitives<EnsurePath<T, [K0, K1]>, K2>
    ]
  ): GetReturn<EnsurePath<T, [K0, K1, K2]>, Return>;
  use<
    K0 extends Keys<T>,
    K1 extends Keys<EnsurePath<T, [K0]>>,
    K2 extends Keys<EnsurePath<T, [K0, K1]>>,
    K3 extends Keys<EnsurePath<T, [K0, K1, K2]>>
  >(
    ...keys: [
      CheckPrimitives<T, K0>,
      CheckPrimitives<EnsurePath<T, [K0]>, K1>,
      CheckPrimitives<EnsurePath<T, [K0, K1]>, K2>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2]>, K3>
    ]
  ): GetReturn<EnsurePath<T, [K0, K1, K2, K3]>, Return>;
  use<
    K0 extends Keys<T>,
    K1 extends Keys<EnsurePath<T, [K0]>>,
    K2 extends Keys<EnsurePath<T, [K0, K1]>>,
    K3 extends Keys<EnsurePath<T, [K0, K1, K2]>>,
    K4 extends Keys<EnsurePath<T, [K0, K1, K2, K3]>>
  >(
    ...keys: [
      CheckPrimitives<T, K0>,
      CheckPrimitives<EnsurePath<T, [K0]>, K1>,
      CheckPrimitives<EnsurePath<T, [K0, K1]>, K2>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2]>, K3>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2, K3]>, K4>
    ]
  ): GetReturn<EnsurePath<T, [K0, K1, K2, K3, K4]>, Return>;
  use<
    K0 extends Keys<T>,
    K1 extends Keys<EnsurePath<T, [K0]>>,
    K2 extends Keys<EnsurePath<T, [K0, K1]>>,
    K3 extends Keys<EnsurePath<T, [K0, K1, K2]>>,
    K4 extends Keys<EnsurePath<T, [K0, K1, K2, K3]>>,
    K5 extends Keys<EnsurePath<T, [K0, K1, K2, K3, K4]>>
  >(
    ...keys: [
      CheckPrimitives<T, K0>,
      CheckPrimitives<EnsurePath<T, [K0]>, K1>,
      CheckPrimitives<EnsurePath<T, [K0, K1]>, K2>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2]>, K3>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2, K3]>, K4>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2, K3, K4]>, K5>
    ]
  ): GetReturn<EnsurePath<T, [K0, K1, K2, K3, K4, K5]>, Return>;
}

/**
 * Get overloaded use function
 */
type Overload<T, Return extends keyof ReturnOutputs<T>> = Overloader<
  T,
  Return
>['use'];

/**
 * Mapped component properties
 */
export type MappedComponentProps<T> = {
  branch: StateLake<T[keyof T]>;
  parent: StateLake<T>;
  idx: number;
  keys: string[];
};

/**
 * Check if argument is nullish (null or undefined)
 */
function nullish<T extends any>(arg: T) {
  return (arg === undefined || arg === null) as T extends undefined
    ? true
    : T extends null
    ? true
    : false;
}

/**
 * Default filter function, used in `.Map`
 */
function defaultFilter(value: any): boolean {
  return !nullish(value);
}

/**
 * Mapped branch
 */
function MappedBranch<T, Props>({
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
  Component: (props: Props & MappedComponentProps<T>) => JSX.Element;
  additionalProps: Omit<Props, keyof MappedComponentProps<T>>;
  keys: string[];
}) {
  // Branch
  const branch = parent.useBranch(id as any);

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
 * Efficiently map all sub-branches of a StateLake object, and pass the corresponding
 * branches to the given component.
 */
function MapBranch<T, P>({
  branch,
  Component,
  keys,
  sort,
  filter,
  ...props
}: {
  branch: StateLake<T>;
  Component: (props: any) => JSX.Element;
  keys?: string[];
  sort?: (
    value_a: T[keyof T],
    value_b: T[keyof T],
    key_a: string,
    key_b: string
  ) => -1 | 0 | 1;
  filter?: (value: T[keyof T], key: string, idx: number) => boolean;
} & Omit<P, keyof MappedComponentProps<T>>) {
  // Identifier - Helps prevent duplicate keys in the dom
  const identifier = useMemo(
    () => `${branch['id']}_${generateId()}`,
    [branch['id']]
  );

  // State
  const [stateKeys, state] = branch.useKeys();
  const selectedKeys = keys || stateKeys;

  // Filter
  const filt = useMemo<
    (value: T[keyof T], key: string, idx: number) => boolean
  >(
    () =>
      filter
        ? (value, key, idx) => defaultFilter(value) && filter(value, key, idx)
        : defaultFilter,
    [filter]
  );

  // Filter keys
  const filterKeys: () => [string[], string] = () => {
    if (state) {
      const filtered = selectedKeys.filter((key, idx) =>
        filt(state[key as keyof T], key, idx)
      );
      return [filtered, filtered.join('')];
    }
    return [[], ''];
  };
  const [filteredKeys, joinedFilteredKeys] = useMemo(filterKeys, [
    filt,
    selectedKeys.join('')
  ]);

  // Sort keys
  const sortKeys: () => [string[], string] = () => {
    if (sort) {
      const sorted = state
        ? filteredKeys.sort((keyA, keyB) =>
            sort(state[keyA as keyof T], state[keyB as keyof T], keyA, keyB)
          )
        : [];
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
          key={`${identifier}_${key}_${branch.getBranch(key as any)['id']}`}
          idx={idx}
          id={key}
          parent={branch}
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

/**
 * Counter.
 * Rather than storing the same state many times in multiple different hooks,
 * every hook stores the same number. This still triggers re-render with updated state.
 *
 * Note: For this utility I'm assuming the count won't ever exceed
 * the `Number.MAX_SAFE_INTEGER`.
 */
const counter = (function () {
  var count = Number.MIN_SAFE_INTEGER;
  return () => count++;
})();

/**
 * Generate a unique ID for this session.
 */
const generateId = () =>
  parseInt(counter().toString().split('').reverse().join('')).toString(36);

/**
 * Ensure branch exists.
 *
 * Recursively propagate through the state tree to retrieve the branch at the
 * given path. Missing branches will be created along the way.
 */
function ensureBranch<T>(
  branch: StateLake<T>,
  [prop, ...path]: string[]
): StateLake<any> {
  return prop === undefined
    ? branch
    : ensureBranch(
        (branch['branches'][prop as keyof T] ||
          (branch['branches'][prop as keyof T] = new StateLake(
            branch.state && (branch.state as NonNullable<T>)[prop as keyof T],
            branch,
            prop
          ))) as StateLake<NonNullable<T>[keyof T]>,
        path
      );
}

/**
 * Update the value of a branch.
 *
 * If the given branch is either being deleted, or not yet tracked by `this` branch, the current state object
 * will be updated.
 */
function updateBranchState<T>(
  parent: StateLake<T>,
  branch: StateLake<T[keyof T]>
) {
  // Helper variables
  const got_key = parent.state && branch?.key in parent.state;

  // Does the state need to re-attach to parent state object?
  var add_or_remove = false;

  // Handle add/remove branch
  if (branch.state === null) {
    // Remove branch?
    if (got_key) {
      // Ensure re-attachment
      add_or_remove = true;

      // Change state
      const { [branch.key as keyof T]: remove_state, ...new_state } =
        parent.state || {};
      changeState(parent, new_state as any);

      // Remove from branches
      const { [branch.key as keyof T]: remove_branch, ...new_branches } =
        parent['branches'];
      parent['branches'] = new_branches as StateLake<T>['branches'];
    }
  } else {
    // Add branch?
    if (!got_key) {
      // Ensure re-attachment
      add_or_remove = true;

      // Change state
      changeState(parent, {
        ...parent.state,
        [branch.key]: branch.state
      });
    }
  }

  // Update parent if branch is being added or removed, else mutate state
  if (add_or_remove) {
    // Update parent
    if (parent.parent) updateBranchState(parent.parent, parent);
  } else {
    // Mutate state object
    parent.state[branch.key as keyof T] = branch.state;
  }
}

/**
 * Change state.
 */
function changeState<T>(branch: StateLake<T>, new_state: T) {
  // Set current state
  branch['current_state'] = new_state;

  // Trigger hooks
  const count = counter();
  branch['hooks'].forEach(hook => hook(count));
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
function updateState<T>(
  branch: StateLake<T>,
  new_state: T,
  parent_updated?: boolean
) {
  // Should update?
  const do_update = parent_updated || new_state !== branch.state;

  // Update
  if (do_update) {
    // Change state
    changeState(branch, new_state);

    // Update parent state object
    if (branch.parent && !parent_updated)
      updateBranchState(branch.parent, branch);
  }

  // Recurse down branches
  if (!nullish(new_state))
    (Object.keys(branch['branches']) as (keyof T)[]).forEach(key => {
      const tmp_branch = branch['branches'][key];
      if (tmp_branch)
        updateState(
          tmp_branch,
          (key in new_state ? new_state[key] : null) as any,
          do_update
        );
    });
}

/**
 * StateLake class
 */
export class StateLake<T> {
  /**
   * Unique identifier
   */
  private id: string;

  /**
   * Current state
   */
  private current_state: T;

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
   * A list containing all hooks connected to this branch.
   */
  private hooks: ((state: number) => void)[];

  /**
   * References to all sub-branches of this branch.
   */
  private branches: {
    [key in keyof NonNullable<T>]?: StateLake<NonNullable<T>[key]>;
  };

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
    initial_state: T | (() => T),
    parent?: StateLake<T>['parent'],
    key?: StateLake<T>['key']
  ) {
    // Initialize parameter properties
    this.current_state =
      typeof initial_state === 'function'
        ? (initial_state as () => T)()
        : (initial_state as T);
    this.parent = parent;
    this.key = key || '';

    // Unique identifier
    this.id = generateId();

    // Hooks placeholder
    this.hooks = [];

    // Branches placeholer
    this.branches = {};
  }

  /**
   * The current state object of this branch.
   * If changes are made to the state object without using the StateLake api,
   * those changes won't be tracked by react.
   */
  public get state() {
    return this.current_state;
  }

  /**
   * Set the state of this branch. This will also propagate new state to any
   * sub-branches, as well as triggering relevant hooks.
   */
  public set state(new_state: T) {
    this.updateState(new_state);
  }

  /**
   * Reference to the StateLake-object at the top of the store.
   */
  public get top(): StateLake<any> {
    return this.parent?.top || this;
  }

  /**
   * Get keys
   *
   * Return all keys of the current state object.
   */
  public get keys(): string[] {
    return this.state && Object.keys(this.state);
  }

  /**
   * Update state
   */
  private updateState = (new_state: T | ((prev_state: T) => T)) =>
    updateState(
      this,
      typeof new_state === 'function'
        ? (new_state as (prev_state: T) => T)(this.state)
        : (new_state as T)
    );

  /**
   * Get branch.
   *
   * Returns a reference to a branch at the given path.
   * This is not a memoized reference, and thus it will be recalculated every
   * time this function is called.
   *
   * @param {String} path Relative path of branch
   */
  public getBranch: Overload<T, 'getBranch'> = (...path: string[]) => {
    return ensureBranch(this, path);
  };

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
  public setState: Overload<T, 'setState'> = (...path: string[]) =>
    (this.getBranch(...(path as EmptyPath)) as StateLake<any>).updateState;

  /**
   * Use branch.
   *
   * Return a memoized reference to the branch at the given path.
   * The reference will automatically update if the path is changed.
   *
   * @param {String} path Relative path of branch
   */
  public useBranch: Overload<T, 'useBranch'> = (...path: string[]) =>
    useMemo(
      () => this.getBranch(...(path as EmptyPath)) as any,
      [this.id, ...path]
    );

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
  public useState: Overload<T, 'useState'> = (...path: string[]) => {
    // Reference branch
    const branch = this.useBranch(...(path as EmptyPath)) as StateLake<any>;

    // Create hook
    const setState = useState(counter)[1];

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
    return [branch.state, branch.updateState] as [any, any];
  };

  /**
   * Shorthand for `const state = store.useState("my","path")[0];`
   *
   * @param {String} path Relative path of branch
   */
  public use: Overload<T, 'use'> = (...path: string[]) => {
    return this.useState(...(path as EmptyPath))[0] as any;
  };

  /**
   * Use effect
   *
   * Create an effect that will be triggered by changes to the state of the
   * branch at the given path.
   *
   * @param {String} path Relative path of branch
   */
  public useEffect: Overload<T, 'useEffect'> = (...path: string[]) => {
    // Current state
    const [state, setState] = this.useState(...(path as EmptyPath));

    // Return callback to create effect
    return (effect: (state: any, setState: (state: any) => void) => void) => {
      useEffect(() => effect(state, setState), [state]);
    };
  };

  /**
   * Use keys.
   *
   * Returns the current keys and state at the given path
   *
   * @param {String} path Relative path of branch
   */
  public useKeys: Overload<T, 'useKeys'> = (...path: string[]) => {
    // Current state
    const state = this.use(...(path as EmptyPath));

    // Return memoized keys
    return useMemo(() => [state ? Object.keys(state) : [], state], [state]) as [
      any,
      any
    ];
  };

  /**
   * Efficiently map all sub-branches of this branch, and pass the corresponding
   * branches to the given component.
   */
  public Map: <P>(
    props: {
      Component: (props: P & MappedComponentProps<T>) => JSX.Element;
      keys?: string[];
      sort?: (
        value_a: T[keyof T],
        value_b: T[keyof T],
        key_a: string,
        key_b: string
      ) => 0 | 1 | -1;
      filter?: (value: T[keyof T], key: string, idx: number) => boolean;
    } & Omit<P, keyof MappedComponentProps<T>>
  ) => JSX.Element = (props: any) => <MapBranch branch={this} {...props} />;
}
