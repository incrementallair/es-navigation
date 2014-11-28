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
  return new Promise((resolve, reject) => {
    try {
      var failsafeMax = 10; //backtrack limit
      var basedir = path.dirname(basePath);
      var baseext = path.extname(basePath);

      if (path.extname(moduleString) != baseext) moduleString += baseext;

      var basemod, remmod; //base dir and remainder of given module string.
      var splitModule = moduleString.split(path.sep);

      if (splitModule.length == 1 || splitModule[0] == '.') {
        if (splitModule[0] == '.') failsafeMax = 1; //don't backtrack for relative paths
        basemod = moduleString;
        remmod = "";
      } else {
        basemod = splitModule[0];
        remmod = splitModule.splice(1).join(path.sep);
      }

      //Keep backtracking until we can't any more
      var failsafe = 0;
      while(basedir != path.sep && failsafe++ <= failsafeMax) {
        //Check for a package.json in the possible base module dir.
        //This might specify a directory.lib object which can tell us where the lib is.
        let libs = [""], packageJson = {};
        let packagePath = path.join(basedir, basemod, "package.json");
        if (fs.existsSync(packagePath))
          packageJson = JSON.parse(fs.readFileSync(packagePath));
        if (packageJson.directories) {
          if (packageJson.directories.dist) libs.push(packageJson.directories.dist);
          if (packageJson.directories.lib) libs.push(packageJson.directories.lib);
        }

        //See if we can find the file in this thing.
        for (let lib of libs) {
          let attempt = path.join(basedir, basemod, lib, remmod);
          if (fs.existsSync(attempt)) return resolve(attempt);
        }

        //backtrack
        basedir = path.join(basedir, "..");
      }
    } catch(error) {
      return reject(error);
    }

    return reject(moduleString + " not found from " + basePath + ".");
  });
}
