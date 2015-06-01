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
  this.baseUrl = options.protocol + '://' + options.host + ':' +options.port;
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

Fetcher.prototype.fetchPrefetchData = function(routes, params, data) {
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
          return component.fetchData(params).then(function(d) {
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
  Fetcher.prototype[method] = function(url, data, headers, freshFetch) {
    var that = this;
    var request;

    if (isServer && url.charAt(0) === '/') {
      url = this.baseUrl + url;
    }

    if (method === 'get' && this._cache[url] && !freshFetch) {
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

module.exports = new Fetcher();
