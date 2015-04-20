var Router = require('./router');

function Server(options, serverInstance) {
  this.server = serverInstance;
  this.router = new Router(options, this.server);
  this.router.bind('route:add', this.logit);
  this.router.buildRoutes();
  this.router.getHandler();
}

Server.prototype.logit = function(options) {
  console.log('asdasd');
}

module.exports = Server;
