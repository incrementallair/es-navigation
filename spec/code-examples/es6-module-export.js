//Currently supported ES6 export syntax
export var v;
export default function f(){};
export default function(){};
export default 42;
export default class c {};
export {x};
export {v as x};
export {foo} from "mod";
export {bar as bar2} from "mod";
export * from "mod";
