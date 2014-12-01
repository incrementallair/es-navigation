# Atom ES Navigation

*ES Navigation* is an [Atom](https://atom.io) provides keyboard shortcuts for jumping between scoped bindings in JavaScript, including between separate ES6 module files.

When writing modular code, it can be frustrating navigating between separate module files - using these shortcuts easily jump straight to the ES6 module definition of any imported binding.

![Usage Gif](https://raw.githubusercontent.com/incrementallair/es-navigation/master/es-navigate-demo.gif)

## Features
By default the following keybindings are provided:
* <kbd>Ctrl-Alt-D</kbd> : Jump to binding definition. Cycles between the current binding and its definition. The definition can be within the same file or an imported ES6 module binding in another file, which will be opened in a new tab. Running <kbd>Ctrl-Alt-D</kbd> again returns to the original position.
* <kbd>Ctrl-Alt-N</kbd> : Jump to next match of binding.
* <kbd>Ctrl-Alt-P</kbd> : Jump to previous match of binding.
* <kbd>Ctrl-Alt-A</kbd> : Multi-select all matches of binding. Useful for bulk-renaming variables or ES6 export names.

## Customising the Module Resolver

By default, a heuristic module resolver is used that guessed the baseURL for packages.

[See the wiki](https://github.com/incrementallair/es-navigation/wiki/Customising-the-Module-Resolver) for setting up a custom resolver.

## License

MIT
