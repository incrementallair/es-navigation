# Atom Symbol Navigation

Provides keybindings for scope-sensitive symbol navigation in javascript files.

# Usage

By default the following keybindings are provided:
* <kbd>Ctrl-Alt-N</kbd> : Jump to next symbol at cursor in scope.
* <kbd>Ctrl-Alt-P</kbd> : Jump to previous symbol at cursor in scope.
* <kbd>Ctrl-Alt-D</kbd> : Select all matches of symbol at cursor in scope.

# Issues

This package makes use of [Escope](https://github.com/Constellation/escope) for scope analysis, which currently has only partial support for ES6 features. As a result, the scope analysis is occasionally wrong, for instance in something like:

```javascript
var tmp = 0;
for (let i = 0; i < 10; i++)
  for (let i = 0; i < 10; i++)
    tmp += i;
```

According to the ES6 specs, the different `i`'s are in different scopes, in contrast to ES5 variable declarations.
