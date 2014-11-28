# Atom ES6 Navigation

ES6 Navigation is an [Atom](https://atom.io) package providing simple scope-sensitive Javascript navigation utilities, in particular for ES6 Module binding navigation within and between module files.

When writing modules with ES6 module syntax, it can often be frustrating jumping between module files and instances of an import binding. The idea was to bring this control through simple key bindings using scope and module analysis.

## Features
By default the following keybindings are provided:
* <kbd>Ctrl-Alt-N</kbd> : Jump to next match of symbol.
* <kbd>Ctrl-Alt-P</kbd> : Jump to previous match of symbol.
* <kbd>Ctrl-Alt-A</kbd> : Multi-select all matches of symbol. Useful for bulk-renaming variables or ES6 exports.
* <kbd>Ctrl-Alt-D</kbd> : Cycle symbol definition. Jumps between the current position and its definition. The definition can within the same file or an ES6 import binding to another file.

Matching is scope-sensitive - two variables defined in different scopes but sharing a name are not matched, for instance.

Scope highlighting and other features can be toggled in the configuration menu.

## License

MIT
