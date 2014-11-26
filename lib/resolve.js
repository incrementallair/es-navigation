'use strict';

import fs from 'fs';
import path from 'path';
import resolve from 'resolve';

export {resolveModulePath};

//Resolve given module string from base path.
//We do this as follows:
//If a relative path resolve, just check it straight.
//Else:
// backtrack directories until we can resolve the given path.
// if we can't at all, fail.
//We try a variety of common paths along the way - /lib /src /build etc
function resolveModulePath(basePath, moduleString) {
    try {
    var failsafeMax = 20;
    var basedir = path.dirname(basePath);

    if (path.extname(moduleString) === "") moduleString += ".js";

    var basemod, remmod;
    var splitModule = moduleString.split(path.sep);
    if (splitModule.length == 1 || splitModule[0] == '.') {
      if (splitModule[0] == '.') failsafeMax = 2;
      basemod = moduleString;
      remmod = "";
    } else {
      basemod = splitModule[0];
      remmod = splitModule.splice(1).join(path.sep);
    }

    //Keep backtracking until we hit rock bottom
    var failsafe = 0;
    while(basedir != path.sep && failsafe++ < failsafeMax) {
      for (let dir of ["", "lib/", "src/", "build/"]) {
        var attempt = path.join(basedir, basemod, dir, remmod);

        if (fs.existsSync(attempt)) return attempt;
      }

      basedir = path.join(basedir, "..");
    }
  } catch(error) {
    throw error;
  }

  throw new Error("Couldn't resolve " + moduleString);
}
