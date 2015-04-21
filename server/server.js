var Router = require('./router');

function Server(options, serverInstance) {
  var server = serverInstance.connection({ port: options.port, labels: options.appName });
  this.server = server.select(options.appName);
  this.router = new Router(options, this.server);
  this.router.bind('route:add', this.logit);
  this.router.buildRoutes();
  this.router.getHandler();
}

Server.prototype.logit = function(options) {
  // console.log('asdasd');
}

module.exports = Server;
