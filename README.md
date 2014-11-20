# Atom Symbol Navigation

Scope-sensitive javascript symbol navigation at the press of a button.

# Some Issues

Currently only jumps between variables being defined or used explicitly, ignoring things like:
> var i; <br>
> i = 5;

Also, escope does not have full support for ES6 block scopes yet,
meaning things like this break:
>for (let i = 0; i < 3; i++) <br>
>for (let i = 0; i < 3; i++) <br>
>   ...
