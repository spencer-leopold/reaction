var Promise = require('bluebird');
var Request = require('superagent');
var isServer = (typeof window === 'undefined');

var METHODS = ['get', 'post', 'put', 'patch', 'delete'];

function Fetcher(options) {
  this.options = options || {};
  this._cache = {};
}

Fetcher.prototype.fetchData = function(routes, params) {
  var data = {};

  return Promise.all(routes
    .filter(function(route) {
      return route.handler.fetchData;
    })
    .map(function(route) {
      return new Promise(function(resolve, reject) {
        return route.handler.fetchData(resolve, params);
      }).then(function(d) {
        return data[route.name] = d;
      });
    })
  ).then(function() {
    return data;
  });
}

METHODS.forEach(function(method) {
  Fetcher.prototype[method] = function(url, data, headers) {
    var that = this;
    var request;

    if (isServer && url.charAt(0) === '/') {
      options = this.options;
      var host = options.protocol + '://' + options.host + ':' +options.port;
      url = host + url;
    }

    if (method === 'get' && this._cache[url]) {
      return Promise.resolve(this._cache[url]);
    }

    return new Promise(function(resolve, reject) {
      request = Request[method](url);

      if (data && typeof data === 'object') {
        request.send(data);
      }

      if (headers && typeof headers === 'object') {
        request.set(headers);
      }

      request.end(function(err, res) {
        if (res.status === 404) {
          reject(new Error('not found'));
        } else {
          var data = res.body;
          resolve(data);

          if (method === 'get') {
            that._cache[url] = data;
          }
        }
      });
    });
  }
});

var F = (function() {
  var instance;

  function createInstance(options) {
    return new Fetcher(options);
  }
 
  return {
    getInstance: function (options) {
      if (!instance) {
        instance = createInstance(options);
      }
      return instance;
    }
  };

})();

module.exports = function(options) {
  return F.getInstance(options);
}
