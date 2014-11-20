//https://github.com/JustinDrake/node-es6-examples

// ES5: Defensive declarations at the top to avoid hoisting surprises
function fibonacci(n) {
  var previous = 0;
  var current = 1;
  var i;
  var temp;

  for(i = 0; i < n; i += 1) {
    temp = previous;
    previous = current;
    current = temp + current;
  }

  return current;
}

// ES6: Variables are concealed within the appropriate block scope
function fibonacci(n) {
  let previous = 0;
  let current = 1;

  for(let i = 0; i < n; i += 1) { // Implicit block scope for the loop header
    let temp = previous;
    previous = current;
    current = temp + current;
  }

  return current;
}

// ES5: Reusing the same loop variable name is bad
var counter = 0;
for(var i = 0; i < 3; i += 1) {
  for(var i = 0; i < 3; i += 1) {
    counter += 1;
  }
}

// ES6: Reusing the same loop variable name is OK
counter = 0;
for(let i = 0; i < 3; i += 1) {
  for(let i = 0; i < 3; i += 1) {
    counter += 1;
  }
}
