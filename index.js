if (!this.window) {

  exports.attachApp = function(options, serverInstance) {
    var Server;

    if (serverInstance.response) {
      Server = require('./server/expressServer');
    }
    else {
      Server = require('./server/hapiServer');
    }

    return new Server(options, serverInstance);
  };
}
