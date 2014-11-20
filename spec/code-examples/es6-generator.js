function* argumentsGenerator() {
  for (let i = 0; i < arguments.length; i += 1) {
    yield arguments[i];
  }
}

var tmp = argumentsGenerator();
