import tools from 'es-parse-tools';
import fs from 'fs';
import {asyncForEach} from './util';

// Returns location of a given symbol's definition,
//  given a base path and symbol name.
// Params:
//  namespace: are we looking for a namespace object?
//  scope: which scope to search,
//  isRoot: are we in the root file
// returns {path, loc} / throws error
// need an option to pass  in a custom resolver, for now do naive
export function findSymbolDefinition(symbol, path, namespace, isRoot, _scope, callback) {
  if (path == "notFound") return null;

  tools.parseUri(path, (error, scopes) => {
    //assume global scope if we aren't given one already
    let scope = _scope || scopes[0];

    //if in root, we check definitions and imports
    if (isRoot) {
      //we can't check definitions if looking in a namespace, as definitions
      // might have same name as namespace variables.
      if (!namespace) {
        for (let sym of scope.definedSymbols)
          if (sym.localName == symbol)
            return callback(null, { path: path, loc: sym.location });
      }

      for (let sym of scope.importedSymbols) {
        //if searching for a property, check namespace rather than symbol itself
        if (namespace) {
          if (sym.localName == namespace)
            return findInModule(symbol, path, sym.moduleRequest, callback);
        } else {
          if (sym.localName == symbol)
            return findInModule(sym.importName, path, sym.moduleRequest, callback);
        }
      }

    //not in root, so cannot check definitions directly
    //we need to check exports and map them to definitions, imports
    } else {
//      for (let sym of scope.exportedSymbols) {
      asyncForEach(scope.exportedSymbols, callback, (sym, _callback) => {
        ((cb) => {
          //batch export - attempt to recurse through
          if (sym.importName == "*") {
            findInModule(symbol, path, sym.moduleRequest, (error, result) => {
              if (result) cb(null, result);
              return cb(null, null);
            });
          }
          return cb(null, null);
        })((error, result) => {
          if (result) return _callback(null, result);

          //one of the export symbols matches what we want
          if (sym.exportName == symbol) {
            //found a match - if declared at export, just return that
            if (sym.type == "exportDeclaration")
              return _callback(null, { path: path, loc: sym.location });

            //if defined in another module, find it there
            if (sym.moduleRequest) {
              return findInModule(sym.localName, path, sym.moduleRequest, _callback);
            } else {
              for (let def of scope.definedSymbols) {
                if (def.localName == sym.localName)
                  return _callback(null, { path: path, loc: def.location });
              }

              console.warn("Exported undefined symbol: " + symbol + " in module " + path);
              return _callback(null, null);
            }
          }

          return _callback(null, null);
        });
      });
    }
  });
  //
  // //couldn't find symbol, die
  // console.warn("Unable to find definition of " + symbol + " in module " + path);
  // return null;
  callback(null, null);
}

//find symbol in given module. Recursion function for findSymbolDefinition.
function findInModule(symbol, basePath, moduleRequest, callback) {
    findSymbolDefinition(symbol, moduleRequest, null, false, null, callback);
}
