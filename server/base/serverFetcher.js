var url = require('url');

var fetcherPlugin = function(callback) {
  var serverFetcher = {
    register: function(server, options, next) {
      server.ext('onPreHandler', function(request, reply) {
        var baseUrl = server.info.protocol + '://' + server.info.host + ':' + server.info.port;
        var next = reply.continue.bind(reply);
        callback(request, baseUrl, request.route.path, reply.continue, reply);
      });

      next();
    }
  }

  serverFetcher.register.attributes = {
    name: 'ServerFetcher',
    version: '1.0.0'
  }

  return serverFetcher;
}

var fetcherMiddleware = function(callback) {
  return function(req, res, next) {
    var host = req.headers.host;
    if (host.indexOf('http://') === -1) {
      host = 'http://'+host;
    }
    var info = url.parse(host);
    var baseUrl = info.protocol + '//' + info.hostname + ':' + info.port;

    var path;
    if (typeof req.url === 'string') {
      path = req.url;
    }
    else {
      path = req.url.path;
    }

    callback(req, baseUrl, path, next);
  }
}

module.exports = function(options) {
  var renderRouteData = require('../base/renderRouteData')(options);

  if (options.type === 'plugin') {
    return fetcherPlugin(renderRouteData);
  }
  else {
    return fetcherMiddleware(renderRouteData);
  }
}
