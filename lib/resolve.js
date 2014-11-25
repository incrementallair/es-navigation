'use strict';

import path from 'path';
import resolve from 'resolve';

export {resolveModulePath};

//Resolve given module string from base path.
//Currently uses an external implementation of the node module
// resolution algorithm.
//basePath = the full path to the module doing the resolving
//moduleString = the module to be resolved
function resolveModulePath(basePath, moduleString) {
  let basedir = path.dirname(basePath);

  try {
    return resolve.sync(moduleString, { basedir: basedir, extensions: ['.js', '.es6'] });
  } catch(error) {
    throw error;
  }
}
