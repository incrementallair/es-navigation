//Currently supported ES6 import syntax
import def from "mod"; //get default
import * as ns from "mod";
import {foo} from "mod";
import {bar as qux} from "mod";

def.bam();
foo();
qux();

ns.bar();
ns.bar();
