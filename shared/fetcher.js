var Promise = require('bluebird');
var request = require('superagent');
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
      return route.handler.fetchData(params).then(function(d) {
        return data[route.name] = d;
      });
    })
  ).then(function() {
    return data;
  });
}

METHODS.forEach(function(method) {
  Fetcher.prototype[method] = function(url) {
    var that = this;
    if (isServer && url.charAt(0) === '/') {
      options = this.options;
      var host = options.protocol + '://' + options.host + ':' +options.port;
      url = host + url;
    }

    if (this._cache[url]) {
      return Promise.resolve(this._cache[url]);
    }

    return new Promise(function(resolve, reject) {
      request[method](url).end(function(err, res) {
        if (res.status === 404) {
          reject(new Error('not found'));
        } else {
          var data = res.body;
          resolve(data);
          that._cache[url] = data;
        }
      });
    });
  }
});

Fetcher.prototype.fetch = function(options) {
  if (typeof options === 'string') {
    return this.get(options);
  }

  var method = options.method || 'get';
  return this[method](options.url);
}

var F = (function() {
  var instance;

  function createInstance(options) {
    var fetcher = new Fetcher(options);
    return fetcher;
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
