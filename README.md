# Atom ES6 Navigation

ES6 Navigation is an [Atom](https://atom.io) package providing simple scope-sensitive Javascript navigation utilities, in particular for navigating scoped bindings including between ES6 module files.

When writing modules with ES6 module syntax, it can often be frustrating jumping between module files and instances of an import binding. The idea was to bring this control through simple key bindings using scope and module analysis.

## Features
By default the following keybindings are provided:
* <kbd>Ctrl-Alt-D</kbd> : Jump to binding definition. Cycles between the current binding and its definition. The definition can be within the same file or an imported ES6 module binding in another file, which will be opened in a new tab. Running <kbd>Ctrl-Alt-D</kbd> again returns to the original position.
* <kbd>Ctrl-Alt-N</kbd> : Jump to next match of binding.
* <kbd>Ctrl-Alt-P</kbd> : Jump to previous match of binding.
* <kbd>Ctrl-Alt-A</kbd> : Multi-select all matches of binding. Useful for bulk-renaming variables or ES6 export names.

## License

MIT
