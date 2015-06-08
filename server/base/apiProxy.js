var apiProxyPlugin = function(dataAdapter) {

  var serverFetcher = {
    register: function(server, options, next) {
      server.route({
        method: '*',
        path: '/{p*}',
        handler: function(request, reply) {
          dataAdapter.request(request, reply, reply);
        }
      });

      next();
    }
  }

  serverFetcher.register.attributes = {
    name: 'ApiProxy',
    version: '1.0.0'
  }

  return serverFetcher;
}

var apiProxyMiddleware = function(dataAdapter) {
  return function(req, res, next) {
    dataAdapter.request(req, res, res.json);
  }
}

module.exports = function(options) {
  var dataAdapter = new options.dataAdapter(options.api);

  if (options.type === 'plugin') {
    return apiProxyPlugin(dataAdapter);
  }
  else {
    return apiProxyMiddleware(dataAdapter);
  }
}
