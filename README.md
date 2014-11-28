# Atom ES6 Navigation

ES6 Navigation is an [Atom](https://atom.io) package providing simple scope-sensitive Javascript navigation utilities with an eye to the future, providing support for navigating within and across [ES6](https://people.mozilla.org/~jorendorff/es6-draft.html) module boundaries.

Why ES6? Javascript is known for its idiosyncrasies - among them a lack of block scoping and no native syntax for modularising code. ES6 provides solutions for these problems and introduces a host of new language features. Though there are ways and means of developing in ES6 today - Google's Traceur, 6to5, JSPM, ES6 polyfills, etcetera - there are currently few tools available to ease the job. ES6 Navigation is a small building block in this direction.

ES6 Navigation uses [escope](https://github.com/estools/escope)  and Facebook's [esprima](https://github.com/facebook/esprima) fork behind the scenes to parse source files.

## Features
By default the following keybindings are provided:
* <kbd>Ctrl-Alt-N</kbd> : Jump to next match of symbol.
* <kbd>Ctrl-Alt-P</kbd> : Jump to previous match of symbol.
* <kbd>Ctrl-Alt-A</kbd> : Multi-select all matches of symbol.
* <kbd>Ctrl-Alt-D</kbd> : Toggle between import/definition of symbol.

Matching is scope-sensitive - two variables defined in different scopes but sharing a name are not matched, for instance. Navigation respects ES6 module syntax and can track definitions across module boundaries.

ES6 support and scope highlighting can be toggled in the configuration menu.

## Installation
To install directly, clone the repository and `cd` into the base directory. From here, simply run `apm install` followed by `apm link`.

## Troubleshooting

If the `status-bar` package is installed, issues will be shown on the status bar. More detail can be seen in the console warnings.

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
