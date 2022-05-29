import React, { useEffect, useMemo, useState } from 'react';

/**
 * Empty path, used for referencing sub branches
 */
type EmptyPath = [any];

/**
 * Dispatch state update
 */
export type SetState<T> = (new_state: T | ((previous_state?: T) => T)) => T;

/**
 * Outputs of overloaded methods
 */
type ReturnOutputs<T> = {
  getBranch: StateLake<T>;
  setState: SetState<T>;
  useBranch: StateLake<T>;
  useState: [T, SetState<T>];
  useEffect: (
    effect: (state: T, setState: SetState<T>) => void | (() => void)
  ) => void;
  use: T;
  useKeys: [keys: string[], state: T, setState: SetState<T>];
};

/**
 * Allowed output keys
 */
type ReturnKeys = keyof ReturnOutputs<any>;

/**
 * Shorthand for getting the output of a given method
 */
type GetReturn<T, Return extends ReturnKeys> = ReturnOutputs<T>[Return];

/**
 * Shift an array of string literals
 */
type ShiftTuple<Arr extends any[]> = Arr extends [arg: any, ...rest: infer U]
  ? U
  : Arr;

/**
 * Create a new version of the given type in which all ancestors of a given path
 * is guaranteed to exists
 */
type EnsurePath<T, Path extends any[]> = Path[0] extends undefined
  ? T
  : EnsurePath<NonNullable<T>[Path[0]], ShiftTuple<Path>>;

/**
 * Return never if the given type is primitive, else return the given key
 */
type CheckPrimitives<T, key> = T extends string | number | boolean
  ? never
  : key;

/**
 * Shorthand for getting the available keys of a type
 */
type Keys<T> = keyof NonNullable<T>;

/**
 * Path overloader.
 *
 * `f` is overloaded with all different paths that exists in a nested object type.
 * Returns the function with overloaded parameters, as well as it's return type at
 * the given path.
 */
interface Overloader<T, Return extends ReturnKeys> {
  f(): GetReturn<EnsurePath<T, []>, Return>;
  f<K0 extends Keys<T>>(
    ...key: [CheckPrimitives<T, K0>]
  ): GetReturn<EnsurePath<T, [K0]>, Return>;
  f<K0 extends Keys<T>, K1 extends Keys<EnsurePath<T, [K0]>>>(
    ...key: [CheckPrimitives<T, K0>, CheckPrimitives<EnsurePath<T, [K0]>, K1>]
  ): GetReturn<EnsurePath<T, [K0, K1]>, Return>;
  f<
    K0 extends Keys<T>,
    K1 extends Keys<EnsurePath<T, [K0]>>,
    K2 extends Keys<EnsurePath<T, [K0, K1]>>
  >(
    ...key: [
      CheckPrimitives<T, K0>,
      CheckPrimitives<EnsurePath<T, [K0]>, K1>,
      CheckPrimitives<EnsurePath<T, [K0, K1]>, K2>
    ]
  ): GetReturn<EnsurePath<T, [K0, K1, K2]>, Return>;
  f<
    K0 extends Keys<T>,
    K1 extends Keys<EnsurePath<T, [K0]>>,
    K2 extends Keys<EnsurePath<T, [K0, K1]>>,
    K3 extends Keys<EnsurePath<T, [K0, K1, K2]>>
  >(
    ...key: [
      CheckPrimitives<T, K0>,
      CheckPrimitives<EnsurePath<T, [K0]>, K1>,
      CheckPrimitives<EnsurePath<T, [K0, K1]>, K2>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2]>, K3>
    ]
  ): GetReturn<EnsurePath<T, [K0, K1, K2, K3]>, Return>;
  f<
    K0 extends Keys<T>,
    K1 extends Keys<EnsurePath<T, [K0]>>,
    K2 extends Keys<EnsurePath<T, [K0, K1]>>,
    K3 extends Keys<EnsurePath<T, [K0, K1, K2]>>,
    K4 extends Keys<EnsurePath<T, [K0, K1, K2, K3]>>
  >(
    ...key: [
      CheckPrimitives<T, K0>,
      CheckPrimitives<EnsurePath<T, [K0]>, K1>,
      CheckPrimitives<EnsurePath<T, [K0, K1]>, K2>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2]>, K3>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2, K3]>, K4>
    ]
  ): GetReturn<EnsurePath<T, [K0, K1, K2, K3, K4]>, Return>;
  f<
    K0 extends Keys<T>,
    K1 extends Keys<EnsurePath<T, [K0]>>,
    K2 extends Keys<EnsurePath<T, [K0, K1]>>,
    K3 extends Keys<EnsurePath<T, [K0, K1, K2]>>,
    K4 extends Keys<EnsurePath<T, [K0, K1, K2, K3]>>,
    K5 extends Keys<EnsurePath<T, [K0, K1, K2, K3, K4]>>
  >(
    ...key: [
      CheckPrimitives<T, K0>,
      CheckPrimitives<EnsurePath<T, [K0]>, K1>,
      CheckPrimitives<EnsurePath<T, [K0, K1]>, K2>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2]>, K3>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2, K3]>, K4>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2, K3, K4]>, K5>
    ]
  ): GetReturn<EnsurePath<T, [K0, K1, K2, K3, K4, K5]>, Return>;
  f<
    K0 extends Keys<T>,
    K1 extends Keys<EnsurePath<T, [K0]>>,
    K2 extends Keys<EnsurePath<T, [K0, K1]>>,
    K3 extends Keys<EnsurePath<T, [K0, K1, K2]>>,
    K4 extends Keys<EnsurePath<T, [K0, K1, K2, K3]>>,
    K5 extends Keys<EnsurePath<T, [K0, K1, K2, K3, K4]>>,
    K6 extends Keys<EnsurePath<T, [K0, K1, K2, K3, K4, K5]>>
  >(
    ...key: [
      CheckPrimitives<T, K0>,
      CheckPrimitives<EnsurePath<T, [K0]>, K1>,
      CheckPrimitives<EnsurePath<T, [K0, K1]>, K2>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2]>, K3>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2, K3]>, K4>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2, K3, K4]>, K5>,
      CheckPrimitives<EnsurePath<T, [K0, K1, K2, K3, K4, K5]>, K6>
    ]
  ): GetReturn<EnsurePath<T, [K0, K1, K2, K3, K4, K5, K6]>, Return>;
}

/**
 * Get overloaded function
 */
type Overload<T, Return extends ReturnKeys> = Overloader<T, Return>['f'];

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
 * Counter.
 * Rather than storing the same state many times in multiple different hooks,
 * every hook stores the same number. This still triggers re-render with updated state.
 *
 * Note: For this utility, an assumption has been made that the count won't ever
 * exceed the `Number.MAX_SAFE_INTEGER`.
 */
const counter = (function () {
  var count = -(2 ** 31 - 1);
  return () => count++;
})();

/**
 * Mapped component properties
 */
type MapProps<T = any> = {
  branch: StateLake<T[keyof T]>;
  parent: StateLake<T>;
  idx: number;
  keys: string[];
};

/**
 * Mapped branch properties
 */
type MapBranchProps<T, Props> = {
  parent: StateLake<T>;
  Component: (props: Props & MapProps<T>) => JSX.Element;
  keys?: string[];
} & Omit<Props, keyof MapProps<T>>;

/**
 * StateLake class
 */
export class StateLake<T = any> {
  /**
   * Ensure branch exists.
   *
   * Recursively propagate through the state tree to retrieve the branch at the
   * given path. Missing branches will be created along the way.
   */
  private static ensureBranch<T>(
    branch: StateLake<T>,
    path: string[]
  ): StateLake {
    const prop = path[0] as keyof T | undefined;
    return prop === undefined
      ? branch
      : StateLake.ensureBranch(
          branch.branches[prop] ||
            (branch.branches[prop] = new StateLake(
              branch.state?.[prop] as NonNullable<T>[keyof T],
              branch,
              prop as string
            )),
          path.slice(1)
        );
  }

  /**
   * Change state.
   */
  private static changeState<T>(branch: StateLake<T>, new_state: T) {
    // Set current state
    branch.current_state = new_state;

    // Trigger hooks
    const count = counter();
    branch.hooks.forEach(hook => hook(count));
  }

  /**
   * Update the parent of a given branch.
   *
   * If the given branch is either being deleted, or not yet tracked by `this` branch, the current state object
   * will be updated.
   */
  private static updateParentState<T>(branch: StateLake<T>) {
    // Get parent, or return if it doesn't exists
    const parent = branch.parent as StateLake<any>;
    if (!parent) return;

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
        const { [branch.key]: remove_state, ...new_state } = parent.state || {};
        StateLake.changeState(parent, new_state);

        // Remove from branches
        const { [branch.key]: remove_branch, ...new_branches } =
          parent.branches;
        parent.branches = new_branches;
      }
    } else {
      // Add branch?
      if (!got_key) {
        // Ensure re-attachment
        add_or_remove = true;

        // Change state
        StateLake.changeState(parent, {
          ...parent.state,
          [branch.key]: branch.state
        });
      }
    }

    // Update parent if branch is being added or removed, else mutate state
    if (add_or_remove) {
      StateLake.updateParentState(parent);
    } else {
      parent.state[branch.key] = branch.state;
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
  private static updateState<T>(
    branch: StateLake<T>,
    new_state: T,
    parent_updated?: boolean
  ) {
    // Should update?
    const do_update = parent_updated || new_state !== branch.state;

    // Update state and notify parent
    if (do_update) {
      StateLake.changeState(branch, new_state);
      if (!parent_updated) StateLake.updateParentState(branch);
    }

    // Recurse down branches
    if (!nullish(new_state))
      (Object.keys(branch.branches) as (keyof T)[]).forEach(key => {
        const sub_branch = branch.branches[key];
        if (sub_branch)
          StateLake.updateState(
            sub_branch,
            (key in new_state ? new_state[key] : null) as any,
            do_update
          );
      });

    // Return the newest state
    return branch.state;
  }

  /**
   * Logic for `StateLake.updateState`
   */
  private static handleUpdateState<T>(
    branch: StateLake<T>,
    new_state: Parameters<SetState<T>>[0]
  ) {
    return StateLake.updateState(
      branch,
      typeof new_state === 'function'
        ? (new_state as (prev_state: T) => T)(branch.state)
        : (new_state as T)
    );
  }

  /**
   * Logic for `StateLake.useState`
   */
  private static useStateHandler<T>(branch: StateLake<T>) {
    // Create hook
    const setState = useState(counter)[1];

    // Register hook
    useEffect(() => {
      // Attach hook
      branch.hooks.push(setState);

      // Detach hook on component unmount
      return function () {
        branch.hooks = branch.hooks.filter(test => test !== setState);
      };
    }, [branch.id, setState]);

    // Return
    return [branch.state, branch.updateState] as ReturnOutputs<T>['useState'];
  }

  /**
   * Mapped branch
   */
  private static MappedBranch<T, Props>({
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
    Component: React.ComponentType<Props & MapProps<T>>;
    additionalProps: Omit<Props, keyof MapProps<T>>;
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
  private static MapBranch<T, P>({
    parent,
    Component,
    keys,
    ...props
  }: MapBranchProps<T, P>) {
    // Identifier - Helps prevent duplicate keys in the dom
    const identifier = useMemo(
      () => `${parent.id}_${counter().toString(36)}`,
      [parent.id]
    );

    // Keys
    const stateKeys = parent.useKeys()[0];
    const selectedKeys = keys || stateKeys;

    // Memoized child nodes
    return useMemo(
      () => (
        <>
          {selectedKeys.map((key: any, idx) => (
            <StateLake.MappedBranch
              key={`${identifier}_${key}_${parent.getBranch(key).id}`}
              idx={idx}
              id={key}
              parent={parent}
              Component={Component}
              keys={selectedKeys}
              additionalProps={props as any}
            />
          ))}
        </>
      ),
      [identifier, Component, selectedKeys, ...Object.values(props)]
    );
  }

  /**
   * Unique identifier
   */
  private readonly id: string = counter().toString(36);

  /**
   * Current state
   */
  private current_state: T;

  /**
   * A list containing all hooks connected to this branch.
   */
  private hooks: ((state: number) => void)[] = [];

  /**
   * References to all sub-branches of this branch.
   */
  private branches: {
    [key in Keys<T>]?: StateLake<NonNullable<T>[key]>;
  } = {};

  /**
   * Initialize a new StateLake.
   *
   * An initial state object needs to be provided.
   *
   * @param initial_state
   */
  constructor(
    initial_state: T | (() => T),

    /**
     * Reference to parent of this branch (if any).
     * - Do not provide this parameter to the constructor.
     */
    readonly parent?: StateLake<any>,

    /**
     * The key used by the parent of this branch (if any) to reference this branch.
     * If the branch is at the very top of the store, this will be `""`.
     * - Do not provide this parameter to the constructor.
     */
    readonly key = ''
  ) {
    this.current_state =
      typeof initial_state === 'function'
        ? (initial_state as () => T)()
        : (initial_state as T);
  }

  /**
   * The current state object of this branch.
   * If changes are made to the state object without using the StateLake api,
   * those changes won't be tracked by react.
   */
  get state() {
    return this.current_state;
  }

  /**
   * Set the current state and update all connected components
   */
  set state(new_state: T) {
    this.updateState(new_state);
  }

  /**
   * Reference to the StateLake-object at the top of the store.
   */
  get top(): StateLake<any> {
    return this.parent?.top || this;
  }

  /**
   * Full path from the top of the store to this branch.
   */
  get path(): string[] {
    return this.parent ? [...this.parent.path, this.key] : [];
  }

  /**
   * Get keys
   *
   * Return all keys of the current state object.
   */
  get keys(): string[] {
    return this.state ? Object.keys(this.state) : [];
  }

  /**
   * Update state
   */
  private updateState: SetState<T> = new_state =>
    StateLake.handleUpdateState(this, new_state);

  /**
   * Delete branch.
   *
   * This will not actually delete StateLake-objects, but they will be detached
   * from the state tree. Unless the user keeps some reference to them, they should
   * be collected by the garbage collector.
   */
  delete = () => {
    StateLake.updateState(this as any, null);
  };

  /**
   * Get branch.
   *
   * Returns a reference to a branch at the given path.
   * This is not a memoized reference, and thus it will be recalculated every
   * time this function is called.
   *
   * @param {String} path Relative path of branch
   */
  getBranch: Overload<T, 'getBranch'> = (...path: string[]) =>
    StateLake.ensureBranch(this, path);

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
  setState: Overload<T, 'setState'> = (...path: string[]) =>
    StateLake.ensureBranch(this, path).updateState;

  /**
   * Use branch.
   *
   * Return a memoized reference to the branch at the given path.
   * The reference will automatically update if the path is changed.
   *
   * @param {String} path Relative path of branch
   */
  useBranch: Overload<T, 'useBranch'> = (...path: string[]) =>
    useMemo(() => StateLake.ensureBranch(this, path), [this.id, ...path]);

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
  useState: Overload<T, 'useState'> = (...path: string[]) =>
    StateLake.useStateHandler(
      this.useBranch(...(path as EmptyPath)) as StateLake<any>
    );

  /**
   * Shorthand for `const state = store.useState("my","path")[0];`
   *
   * @param {String} path Relative path of branch
   */
  use: Overload<T, 'use'> = (...path: string[]) =>
    this.useState(...(path as EmptyPath))[0] as any;

  /**
   * Use effect
   *
   * Create an effect that will be triggered by changes to the state of the
   * branch at the given path.
   *
   * @param {String} path Relative path of branch
   */
  useEffect: Overload<T, 'useEffect'> = (...path: string[]) => {
    // Current state
    const [state, setState] = this.useState(...(path as EmptyPath));

    // Return callback to create effect
    return (
      effect: (state: any, setState: SetState<any>) => void | (() => void)
    ) => {
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
  useKeys: Overload<T, 'useKeys'> = (...path: string[]) => {
    // Current state
    const [state, setState] = this.useState(...(path as EmptyPath));

    // Return memoized keys
    return useMemo(
      () => [state ? Object.keys(state) : [], state, setState],
      [state, setState]
    ) as ReturnOutputs<any>['useKeys'];
  };

  /**
   * Efficiently map all sub-branches of this branch, and pass the corresponding
   * branches to the given component.
   */
  Map = <
    K extends Path extends keyof T ? T[Path] : T,
    Props extends Partial<MapProps<K>>,
    Path extends keyof T | undefined = undefined
  >({
    path,
    ...rest
  }: {
    path?: Path;
    Component: React.ComponentType<MapProps<K> & Props>;
    keys?: string[];
  } & Omit<Props, keyof MapProps>) => {
    // Get parent branch (will default to this branch if path is undefined)
    const parent = this.useBranch(path as any);

    // Render
    return <StateLake.MapBranch parent={parent} {...(rest as any)} />;
  };
}

export default StateLake;
