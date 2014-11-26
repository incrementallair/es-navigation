'use strict';

import {parseBuffer} from './cache';
import util from './util';
import fs from 'fs';
import resolveModulePath from './resolve';

export {findSymbolDefinition};

// Returns location of a given symbol's definition,
//  given a base path and symbol name.
// Params:
//  namespace: are we looking for a namespace object?
//  scope: which scope to search,
//  isRoot: are we in the root file
// returns {path, loc} / throws error
// need an option to pass  in a custom resolver, for now do naive
function findSymbolDefinition(symbol, path, namespace=null, isRoot=true, scope=null) {
  //assume global scope if none given
  if (!scope) {
    try {
      let buffer = fs.readFileSync(path);
      scope = parseBuffer(buffer, path)[0];
    } catch(error) {
      console.error("Couldn't read file at path: " + path);
      return null;
    }
  }

  //if in root, we check definitions and imports
  if (isRoot) {
    //we can't check definitions if looking in a namespace, as definitions
    // might have same name as namespace variables.
    if (!namespace) {
      for (let sym of scope.definedSymbols)
        if (sym.localName == symbol)
          return { path: path, loc: sym.location };
    }

    for (let sym of scope.importedSymbols) {
      //if searching for a property, check namespace rather than symbol itself
      if (namespace) {
        if (sym.localName == namespace)
          return findInModule(symbol, path, sym.moduleRequest);
      } else {
        if (sym.localName == symbol)
          return findInModule(sym.importName, path, sym.moduleRequest);
      }
    }

  //not in root, so cannot check definitions directly
  //we need to check exports and map them to definitions, imports
  } else {
    for (let sym of scope.exportedSymbols) {
      //batch export - attempt to recurse through
      if (sym.importName == "*") {
        let result = findInModule(symbol, path, sym.moduleRequest);
        if (result) return result;
      }

      //one of the export symbols matches what we want
      if (sym.exportName == symbol) {
        //found a match - if declared at export, just return that
        if (sym.type == "exportDeclaration")
          return { path: path, loc: sym.location };

        //if defined in another module, find it there
        if (sym.moduleRequest) {
          return findInModule(symbol, path, sym.moduleRequest);
        } else {
          for (let def of scope.definedSymbols)
            if (def.localName == symbol)
              return { path: path, loc: def.location };
          console.error("Exported undefined symbol: " + symbol + " in " + path);
          return null;
        }
      }
    }
  }

  //couldn't find symbol, die
  console.error("Unable to resolve " + symbol + " in " + path);
  return null;

  //findSymbolDefinition INTERNAL
  function findInModule(symbol, basePath, moduleRequest) {
    try {
      return findSymbolDefinition(symbol, moduleRequest, null, false);
    } catch(error) {
      console.error("Couldn't find " + symbol + " in " + moduleRequest);
      return null;
    }
  }
}
