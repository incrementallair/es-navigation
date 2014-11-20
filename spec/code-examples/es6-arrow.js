var simple = a => a > 15 ? 15 : a;
simple(16); // 15
simple(10); // 10

var complex = (a, b) => {
    if (a > b) {
        return a;
    } else {
        return b;
    }
}
