// React
import { useState, useRef } from "react";

// Local tools
import { IBase, IKeys, INode } from "./interfaces";
import { is, generateID, generateIdentifier } from "./utils";

export class StateLake<T extends IBase> {
  // Properties
  public state: T;
  private nodes: INode<T>;
  private onChangeCallback: ((arg: string) => void) | undefined;

  // Constructor
  constructor(initialState: T) {
    this.state = initialState;
    this.nodes = { identifier: generateIdentifier() };
    this.onChangeCallback = undefined;
  }

  public onChange(callback: (arg: string) => void) {
    this.onChangeCallback = callback;
  }

  /**
   * Utility method for generating new IDs
   */
  public generateID() {
    return generateID();
  }

  /**
   * Ensure the node exists and is attached to the state object
   */
  private ensureNode(
    path: string[],
    prop: string
  ): [any, INode<any>, INode<any>] {
    var [parent_state, parent_node]: [any, INode<any>] = [
      undefined,
      { identifier: generateIdentifier() },
    ];

    // Traverse tree down to referenced node
    (path || []).concat(prop).reduce(
      (
        [tmp_parent_state, tmp_node, tmp_path]: [any, INode<any>, string[]],
        tmp_prop: string
      ) => {
        // Save parent state and parent node for later
        if (tmp_prop === prop) {
          [parent_state, parent_node] = [tmp_parent_state, tmp_node];
        }

        // Make sure node got branches
        if (tmp_node.branches === undefined) tmp_node.branches = {};
        if (tmp_node.branches[tmp_prop] === undefined)
          tmp_node.branches[tmp_prop] = {};

        // Reference node
        var node: INode<any> = tmp_node.branches[tmp_prop];

        // Update state
        tmp_node.branches[tmp_prop].update = (
          arg: any,
          new_parent_state?: any
        ) => {
          // Attach new parent
          if (new_parent_state !== undefined)
            tmp_parent_state = new_parent_state;

          // Should update?
          if (
            !(
              new_parent_state === undefined &&
              is(arg, tmp_parent_state[tmp_prop])
            )
          ) {
            // Update state
            tmp_parent_state[tmp_prop] = arg;

            // New identifier
            node.identifier = generateIdentifier();

            // Trigger all hooks
            const hooks = node.hooks || [];
            node.hooks = [];
            hooks.forEach((callback) => callback(tmp_parent_state[tmp_prop]));

            // Cleanup branches and recurse down tree
            node.branches = Object.keys(node.branches || {})
              .filter((key) => key in arg)
              .reduce((current, key) => {
                if (node.branches && node.branches[key].update) {
                  node.branches[key].update(
                    arg[key],
                    tmp_parent_state[tmp_prop]
                  );
                  return { ...current, [key]: node.branches[key] };
                }
                return current;
              }, {});

            // Trigger optional onChange callback
            if (!new_parent_state && this.onChangeCallback)
              this.onChangeCallback(
                (tmp_path || []).concat(tmp_prop).join(".")
              );
          }
        };
        return [
          tmp_parent_state[tmp_prop],
          tmp_node.branches[tmp_prop],
          tmp_path.concat(tmp_prop),
        ];
      },
      [this.state, this.nodes, []]
    );

    // Ensure prop exists on parent node
    if (parent_node.branches === undefined) parent_node.branches = {};
    if (parent_node.branches[prop] === undefined)
      parent_node.branches[prop] = {};
    if (parent_node.branches[prop].hooks === undefined)
      parent_node.branches[prop].hooks = [];

    // Return parent state & node
    return [parent_state, parent_node.branches[prop], parent_node];
  }

  // delete
  public delete<K0 extends IKeys<T>>(k0: K0): void;
  public delete<K0 extends IKeys<T>, K1 extends IKeys<T[K0]>>(
    k0: K0,
    k1: K1
  ): void;
  public delete<
    K0 extends IKeys<T>,
    K1 extends IKeys<T[K0]>,
    K2 extends IKeys<T[K0][K1]>
  >(k0: K0, k1: K1, k2: K2): void;
  public delete<
    K0 extends IKeys<T>,
    K1 extends IKeys<T[K0]>,
    K2 extends IKeys<T[K0][K1]>,
    K3 extends IKeys<T[K0][K1][K2]>
  >(k0: K0, k1: K1, k2: K2, k3: K3): void;
  public delete(...args: any[]) {
    // Prop and path
    const path = args.slice(0, -1);
    const prop = args.slice(-1)[0];

    // Get references
    const [parent_state, , parent_node] = this.ensureNode(path, prop);

    // Delete
    if (parent_state[prop]) delete parent_state[prop];
    if (parent_node.branches) delete parent_node.branches[prop];
    if (parent_node.update) parent_node.update(parent_state);
  }

  // setState
  public setState<K0 extends IKeys<T>>(k0: K0): (arg?: T[K0]) => void;
  public setState<K0 extends IKeys<T>, K1 extends IKeys<T[K0]>>(
    k0: K0,
    k1: K1
  ): (arg?: T[K0][K1]) => void;
  public setState<
    K0 extends IKeys<T>,
    K1 extends IKeys<T[K0]>,
    K2 extends IKeys<T[K0][K1]>
  >(k0: K0, k1: K1, k2: K2): (arg?: T[K0][K1][K2]) => void;
  public setState<
    K0 extends IKeys<T>,
    K1 extends IKeys<T[K0]>,
    K2 extends IKeys<T[K0][K1]>,
    K3 extends IKeys<T[K0][K1][K2]>
  >(k0: K0, k1: K1, k2: K2, k3: K3): (arg?: T[K0][K1][K2][K3]) => void;
  public setState(...args: any[]) {
    // Prop and path
    const path = args.slice(0, -1);
    const prop = args.slice(-1)[0];

    // Get references
    const [, subscriber] = this.ensureNode(path, prop);

    // Return update func
    return subscriber.update;
  }

  // useState
  public useState<K0 extends IKeys<T>>(
    k0: K0
  ): (initialState?: T[K0]) => [T[K0], (arg: T[K0]) => void];
  public useState<K0 extends IKeys<T>, K1 extends IKeys<T[K0]>>(
    k0: K0,
    k1: K1
  ): (initialState?: T[K0][K1]) => [T[K0][K1], (arg: T[K0][K1]) => void];
  public useState<
    K0 extends IKeys<T>,
    K1 extends IKeys<T[K0]>,
    K2 extends IKeys<T[K0][K1]>
  >(
    k0: K0,
    k1: K1,
    k2: K2
  ): (
    initialState?: T[K0][K1][K2]
  ) => [T[K0][K1][K2], (arg: T[K0][K1][K2]) => void];
  public useState<
    K0 extends IKeys<T>,
    K1 extends IKeys<T[K0]>,
    K2 extends IKeys<T[K0][K1]>,
    K3 extends IKeys<T[K0][K1][K2]>
  >(
    k0: K0,
    k1: K1,
    k2: K2,
    k3: K3
  ): (
    initialState?: T[K0][K1][K2][K3]
  ) => [T[K0][K1][K2][K3], (arg: T[K0][K1][K2][K3]) => void];
  public useState(...args: any[]) {
    // Keep a reference to already created parent and subscriber
    const state_ref = useRef<any>(null);
    const node_ref = useRef<INode<any>>({ identifier: "" });
    const identifier_ref = useRef<string | null>(null);

    // Prop
    const prop = args.slice(-1)[0];

    // Traverse tree down to parent of referenced node
    if (!(state_ref.current && node_ref.current))
      [state_ref.current, node_ref.current] = this.ensureNode(
        args.slice(0, -1),
        prop
      );

    // Return useState middleware
    return (initialState: any) => {
      // Initialize hook
      const [state, setState] = useState(
        state_ref.current[prop] === undefined
          ? initialState
          : state_ref.current[prop]
      );

      // Add hook
      if (
        identifier_ref.current !==
        (node_ref.current && node_ref.current.identifier)
      ) {
        identifier_ref.current = node_ref.current?.identifier;
        if (node_ref.current && node_ref.current.hooks)
          node_ref.current.hooks.push(setState);
      }

      // Return state and state updater
      return [state, node_ref.current.update];
    };
  }
}
