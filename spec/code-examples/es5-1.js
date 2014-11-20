var i;

for (i = 0; i < 3; i++) {
  function inc() {
    var tmp = 4;

    function test() {
      tmp = 3;
      i = 5;
    }
  }
}
