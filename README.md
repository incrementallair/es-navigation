# Ecmascript Symbol Navigation

Provides keybindings for scope-sensitive symbol navigation in Javascript files. Supports [ES6](https://people.mozilla.org/~jorendorff/es6-draft.html) block scopes.

If installing as an atom link, be sure to run `apm install` in the root directory to pull in the correct dependencies.

## Usage

By default the following keybindings are provided:
* <kbd>Ctrl-Alt-N</kbd> : Jump to next match of symbol at cursor.
* <kbd>Ctrl-Alt-P</kbd> : Jump to previous match of symbol at cursor.
* <kbd>Ctrl-Alt-A</kbd> : Multi-select all matches of symbol at cursor.
* <kbd>Ctrl-Alt-D</kbd> : Jump to definition/import of symbol in current file.
* <kbd>Ctrl-Alt-0</kbd> : Jump to definition of symbol (possibly in another module).

Matching is scope-sensitive - two variables defined in different scopes but sharing a name are not matched, for instance.

ES6 support and scope highlighting can be turned on and off in the configuration menu.

## Customising the Module Resolver
By default, an implementation of the Node.js resolver is used to find module paths. This can be changed by setting the `moduleResolver` configuration option to a resolver of your choice. The custom resolver must export a `resolveModulePath(file, module)` method that takes two parameters:
* `file` : The path to the file importing the module.
* `module` : The module string, e.g. `./foo`.

Currently only synchronous module resolvers are supported.
