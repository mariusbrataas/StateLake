# StateLake

A StateLake is a state container for React, built on top of the [React hooks api](https://reactjs.org/docs/hooks-intro.html).

It's been designed to seamlessly replace normal React hooks and states wherever you need to share state among multiple components.

```tsx
// Normal React hooks
const [state, setState] = React.useState();

// StateLake hooks
const [state, setState] = store.useState();
```

Running on top of hooks, StateLakes are lightweight, easy to use, and integrates really well with TypeScript and IntelliSense.

By using TypeScript you'll also get type-safe states in every step of the process.

> **Note**: This project is still being tested, and may still have some bugs. If you find a problem, please **[create a new issue](https://github.com/mariusbrataas/StateLake/issues)**, and feel free to **[contribute](https://github.com/mariusbrataas/StateLake/blob/master/CONTRIBUTE.md)**. Thanks!

[![npm-version](https://img.shields.io/npm/v/statelake?label=npm%20version&style=flat-square)](https://www.npmjs.com/package/statelake) [![downloads](https://img.shields.io/npm/dw/statelake?style=flat-square)](https://www.npmjs.com/package/statelake)

## Getting started

### Prerequisites

You'll need [React v16.8](https://github.com/facebook/react/blob/master/CHANGELOG.md#1680-february-6-2019) or higher. This library utilizes [React hooks](https://reactjs.org/docs/hooks-intro.html), but does not install this dependency on it's own.

### Installation

```
npm install statelake
```

### Usage

```tsx
import { StateLake } from 'statelake';

/**
 * Recommended, not necessary:
 * Start by creating an interface to describe the shape of your store.
 *
 * This will enable IntelliSense and type checking to work with your entire store,
 * so you don't have to input your types anywhere else.
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
 * By providing the store interface this way you'll get IntelliSense
 * working with you all the way.
 */
const store = new StateLake<IStore>({
  show_sidebar: false,
  current_note: '',
  notes: {}
});

/**
 * Now let's create a buton and connect it to the "show_sidebar"
 * property in our store.
 */
function ShowSidebarButton() {
  // Lake states
  const [show, setShow] = store.useState('show_sidebar');

  // Toggle show/hide sidebar
  const toggleSidebar = () => setShow(!show);

  // Render
  return (
    <button onClick={toggleSidebar}>
      {show ? 'Hide sidebar' : 'Show sidebar'}
    </button>
  );
}

/**
 * Render a note that the user can edit
 */
function Note({ id }: { id: string }) {
  // Reference the branch this node will use
  const branch = store.useBranch('notes', id);

  // Lake states
  const [title, setTitle] = branch.useState('title');
  const [body, setBody] = branch.useState('body');

  // Alternatively, you can connect to the state like this:
  // const [title, setTitle] = store.useState('notes', id, 'title');
  // const [body, setBody] = store.useState('notes', id, 'body');

  // Render
  return (
    <div>
      <input value={title} onChange={e => setTitle(e.target.value)} />
      <textarea value={body} onChange={e => setBody(e.target.value)} />
    </div>
  );
}

/**
 * The Note-function may also connect to the state a
 * bit higher up in the hierarchy:
 */
function Note({ id }: { id: string }) {
  // Lake states
  const [note, setNote] = store.useState('notes', id);

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
