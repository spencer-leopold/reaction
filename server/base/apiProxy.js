var apiProxyPlugin = function(DataAdapter, apiPrefixes) {

  var serverFetcher = {
    register: function(server, options, next) {
      server.ext('onRequest', function(request, reply) {

        var matches = apiPrefixes
          .filter(function(apiPrefix) {
            return ~request.url.path.indexOf(apiPrefix);
          })
          .map(function(apiPrefix) {
            return apiPrefix;
          });

        if (matches.length) {
          DataAdapter.request(request, reply, reply);
        }
        else {
          reply.continue();
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

var apiProxyMiddleware = function(DataAdapter, apiPrefixes) {
  return function(req, res, next) {
    var matches = apiPrefixes
      .filter(function(apiPrefix) {
        return ~req.url.indexOf(apiPrefix);
      })
      .map(function(apiPrefix) {
        return apiPrefix;
      });

    if (matches.length) {
      DataAdapter.request(req, res, res.json);
    }
    else {
      next();
    }
  }
}

module.exports = function(options) {
  var RestAdapter = require('../data_adapters/rest_adapter');
  var DataAdapter = new RestAdapter(options);
  var apiPrefixes = [options.api.apiPrefix];

  if (options.type === 'plugin') {
    return apiProxyPlugin(DataAdapter, apiPrefixes);
  }
  else {
    return apiProxyMiddleware(DataAdapter, apiPrefixes);
  }
}
