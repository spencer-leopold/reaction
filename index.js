if (!this.window) {
  var Server = require('./server/server')

  exports.Server = Server

  exports.attachApp = function(options, serverInstance) {
    return new Server(options, serverInstance);
  };
}
