# Atom ES6 Navigation

An [Atom](https://atom.io) package providing simple scope-sensitive Javascript navigation utilities. Has support for navigating across [ES6](https://people.mozilla.org/~jorendorff/es6-draft.html) module boundaries.

## Installation
To install directly, clone the repository and `cd` into the base directory. From here, simply run `apm install` followed by `apm link`.

## Features

By default the following keybindings are provided:
* <kbd>Ctrl-Alt-N</kbd> : Jump to next match of symbol at cursor.
* <kbd>Ctrl-Alt-P</kbd> : Jump to previous match of symbol at cursor.
* <kbd>Ctrl-Alt-A</kbd> : Multi-select all matches of symbol at cursor.
* <kbd>Ctrl-Alt-D</kbd> : Jump to definition/import of symbol in current file.
* <kbd>Ctrl-Alt-0</kbd> : Jump to definition of symbol (possibly in another module).

Matching is scope-sensitive - two variables defined in different scopes but sharing a name are not matched, for instance. Navigation respects ES6 module syntax and can track definitions across module boundaries.

ES6 support and scope highlighting can be toggled in the configuration menu.

## Customising the Module Resolver
By default, a heuristic resolver is used to find module paths. This can be changed by setting the `moduleResolver` configuration option to a resolver of your choice. The custom resolver must export a `resolveModulePath(file, module)` method that takes two parameters:
* `file` : The path to the file importing the module.
* `module` : The module string, e.g. `./foo`.

`resolveModulePath` must return an ES6 Promise object that passes the resolved module path to the callback function, for example:
``` javascript
resolveModulePath(file, module) {
  return new Promise((resolve, reject) => {
    ...
    resolve(resolvedModulePath);
      or
    reject(error);
  });
}
```
