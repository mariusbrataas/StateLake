# StateLake

A StateLake is a state container for React, built on top of the [React hooks api](https://reactjs.org/docs/hooks-intro.html).

It's been designed to seamlessly replace normal React hooks and states wherever you need to share state among multiple components.

```tsx
// Normal React hooks
const [color, setColor] = React.useState('blue');

// StateLake hooks
const [color, setColor] = store.useState('color')('blue');
```

Running on top of hooks, StateLakes are lightweight, easy to use, and integrates really well with TypeScript and IntelliSense.

By using TypeScript you'll also get type-safe states in every step of the process.

> **Note**: This project is still being tested, and may still have some bugs. If you find a problem, please **[create a new issue](https://github.com/mariusbrataas/StateLake/issues)**, and feel free to **[contribute](https://github.com/mariusbrataas/StateLake/blob/master/CONTRIBUTE.md)**. Thanks!

[![build](https://img.shields.io/github/workflow/status/mariusbrataas/StateLake/npm-publish/master?style=flat-square)](https://github.com/mariusbrataas/StateLake) [![npm-version](https://img.shields.io/npm/v/statelake?label=npm%20version&style=flat-square)](https://www.npmjs.com/package/statelake) [![downloads](https://img.shields.io/npm/dw/statelake?style=flat-square)](https://www.npmjs.com/package/statelake)

## Getting started

### Prerequisites

You'll need [React v16.0.8](https://github.com/facebook/react/blob/master/CHANGELOG.md#1680-february-6-2019) or higher. This library utilizes [React hooks](https://reactjs.org/docs/hooks-intro.html), but does not install this dependency on it's own.

### Installation

```
npm install statelake
```

### Usage

```tsx
import StateLake from 'statelake';

/**
 * Recommended, not necessary:
 * Start by creating an interface to describe the shape of your store.
 *
 * This will enable IntelliSense and type checking to work with your entire store,
 * so you don't have to input your types anywhere else.
 *
 * This example is used in an example project on CodeSandbox:
 * https://codesandbox.io/s/statelake-example-0ptc5
 */
interface IStore {
  show_sidebar: boolean;
  current_note: string;
  notes: {
    [note_id: string]: {
      title: string;
      body: string;
      timestamp: number;
    };
  };
}

/**
 * Initialize the store.
 * By providing the store interface this way you'll get IntelliSense working with
 * you all the way.
 */
const store = new StateLake<IStore>({
  show_sidebar: false,
  current_note: '',
  notes: {}
});

/**
 * The following function is only responsible for showing or hiding the sidebar.
 * It therefore only needs to connect to the "show_sidebar"-property in our store.
 *
 * Try typing this yourself. You'll see how IntelliSense is able to suggest properties
 * for you, and ensures that you provide the correct input.
 *
 * An example: The "show_sidebar"-property will only accept a boolean value.
 */
function ShowSidebarButton() {
  // Lake states
  const [show, setShow] = store.useState('show_sidebar')(false);

  // Render
  return (
    <button onClick={() => setShow(!show)}>
      {show ? 'Hide sidebar' : 'Show sidebar'}
    </button>
  );
}

/**
 * The next function will render a note, and enable the user to edit it.
 */
function Note({ id }: { id: string }) {
  // Lake states
  const [title, setTitle] = store.useState('notes', id, 'title')();
  const [body, setBody] = store.useState('notes', id, 'body')();

  // Render
  return (
    <div>
      <input value={title} onChange={e => setTitle(e.target.value)} />
      <textarea value={body} onChange={e => setBody(e.target.value)} />
    </div>
  );
}

/**
 * The Note-function can also attach to the store a bit higher up in the hierarchy:
 */
function Note({ id }: { id: string }) {
  // Lake states
  const [note, setNote] = store.useState('notes', id)();

  // Render
  return (
    <div>
      <input
        value={note.title}
        onChange={e => setNote({ ...note, title: e.target.value })}
      />
      <textarea
        value={note.body}
        onChange={e => setNote({ ...note, body: e.target.value })}
      />
    </div>
  );
}
```

### Examples

Here are some examples in CodeSandbox.

- **[Notebook app](https://0ptc5.csb.app/)**: [Sandbox](https://codesandbox.io/s/statelake-example-0ptc5?file=/src/App.tsx)
