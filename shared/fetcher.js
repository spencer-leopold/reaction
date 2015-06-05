var Promise = require('when');
var Request = require('superagent');
var _ = require('./lodash.custom');
var isServer = (typeof window === 'undefined');

var METHODS = ['get', 'options', 'post', 'put', 'patch', 'delete'];

function Fetcher() {
  this.baseUrl = '';
  this._cache = {};
  this.headers = {};
}

Fetcher.prototype.setBaseUrl = function(options) {
  var url;

  if (!options.host) {
    throw new Error('Host name must be provided');
  }

  url += options.protocol || 'http';
  url += '://' + options.host;

  if (options.port) {
    url += ':' + options.port;
  }
  
  this.baseUrl = url;
}

Fetcher.prototype.setHeaderValue = function(key, val) {
  this.headers[key] = val;
}

Fetcher.prototype.removeHeaderValue = function(key) {
  delete this.headers[key];
}

Fetcher.prototype.fetchData = function(routes, params) {
  var data = {};
  var self = this;

  return Promise.all([self.fetchRouteData(routes, params, data), self.fetchPrefetchData(routes, params, data)]).then(function() {
    return data;
  });
}

Fetcher.prototype.fetchRouteData = function(routes, params, data) {
  var self = this;

  return Promise.all(routes
    .filter(function(route) {
      return route.handler.fetchData;
    })
    .map(function(route) {
      var info = route.handler.fetchData(params);
      var method = info.method || 'get';
      var url = info.url;
      var requestData = info.data || {};
      var headers = info.headers || {};
      var cache = info.cache || true;

      return self[method](url, requestData, headers, cache).then(function(d) {
        return data[route.name] = d;
      });
    })
  ).then(function() {
    return data;
  });
}

Fetcher.prototype.fetchPrefetchData = function(routes, params, data) {
  var self = this;

  return Promise.all(routes
    .filter(function(route) {
      return route.prefetchHandlers;
    })
    .map(function(route) {
      return Promise.all(route.prefetchHandlers
        .filter(function(component) {
          return component.fetchData;
        })
        .map(function(component) {
          var name = component.name.toLowerCase();
          var info = component.fetchData(params);
          var method = info.method || 'get';
          var url = info.url;
          var requestData = info.data || {};
          var headers = info.headers || {};
          var cache = (typeof info.cache === 'undefined') ? true : false;

          return self[method](url, requestData, headers, cache).then(function(d) {
            return data[name] = d;
          });
        })
      ).then(function() {
        return data;
      });
    })
  ).then(function() {
    return data;
  });
}

METHODS.forEach(function(method) {
  Fetcher.prototype[method] = function(url, data, headers, cacheResponse) {
    var that = this;
    var request;

    if (isServer && url.charAt(0) === '/') {
      url = this.baseUrl + url;
    }

    if (method === 'get' && this._cache[url] && cacheResponse) {
      return Promise.resolve(this._cache[url]);
    }

    return Promise.promise(function(resolve, reject) {
      request = Request[method](url);

      if (data && typeof data === 'object') {
        request.send(data);
      }

      if (headers && typeof headers === 'object') {
        var allHeaders = _.assign({}, that.headers, headers);
        request.set(allHeaders);
      }
      else {
        if (that.headers) {
          request.set(that.headers);
        }
      }

      request.end(function(err, res) {
        if (res.status === 404) {
          reject(new Error('404 not found'));
        }
        else {
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

module.exports = Fetcher;
