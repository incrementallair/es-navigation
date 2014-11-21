# Atom Symbol Navigation

Provides keybindings for scope-sensitive symbol navigation in Javascript files. Supports [ES6](https://people.mozilla.org/~jorendorff/es6-draft.html) block scopes and arrow functions.

If installing as a symlink, be sure to run `npm install` in the root directory to pull in the correct dependencies.

## Usage

By default the following keybindings are provided:
* <kbd>Ctrl-Alt-N</kbd> : Jump to next match of symbol at cursor.
* <kbd>Ctrl-Alt-P</kbd> : Jump to previous match of symbol at cursor.
* <kbd>Ctrl-Alt-D</kbd> : Select all matches of symbol at cursor.

Matching is scope-sensitive - two variables defined in different scopes but sharing a name are recognized as being different and not matched.

Scope highlighting on usage of any of these keybindings can be turned on or off in the atom configuration screen.
