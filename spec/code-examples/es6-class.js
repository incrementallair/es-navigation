class Model {
  constructor(properties) {
    this.properties = properties;
  }

  toObject() {
    return this.properties;
  }
}

var jack = new Model({
  name: 'jack'
});

var view = new View({
  model: jack,
  template: 'Hello, <%= name %>'
});

console.log(view.render());
