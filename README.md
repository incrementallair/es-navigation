# Atom Symbol Navigation

Provides keybindings for scope-sensitive symbol navigation in Javascript files. Supports [ES6](https://people.mozilla.org/~jorendorff/es6-draft.html) block scopes and arrow functions.

## Usage

By default the following keybindings are provided:
* <kbd>Ctrl-Alt-N</kbd> : Jump to next match of symbol at cursor.
* <kbd>Ctrl-Alt-P</kbd> : Jump to previous match of symbol at cursor.
* <kbd>Ctrl-Alt-D</kbd> : Select all matches of symbol at cursor.

Matching is scope-sensitive - two variables defined in different scopes but sharing a name are recognized as being different and not matched.
