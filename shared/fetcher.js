//
// @TODO: Need separate client/server fetch function
//
// @TODO: Need a better way to signal we want to skip
// sending to API and instead load data from endpoint
// on current server
//
// @TODO: May need to pass baseUrl in when calling fetchData,
// instead of relying on the instance property. Need to test
// it out with some concurrent users.
//

var Promise = require('when');
var Request = require('superagent');
var _ = require('./lodash.custom');

var METHODS = ['get', 'options', 'post', 'put', 'patch', 'delete'];

function Fetcher(options) {
  this.options = options || {};
  this.baseUrl = '';
  this.headers = {};
  this._cache = {};
}

Fetcher.prototype.setBaseUrl = function(url) {
  this.baseUrl = url;
}

Fetcher.prototype.setHeaderValue = function(key, val) {
  this.headers[key] = val;
}

Fetcher.prototype.removeHeaderValue = function(key) {
  delete this.headers[key];
}

Fetcher.prototype.fetchData = function(routes, params, query) {
  var data = {};
  var self = this;

  return Promise.all([self.fetchRouteData(routes, params, query, data), self.fetchPrefetchData(routes, params, query, data)]).then(function() {
    return data;
  });
}

Fetcher.prototype.fetchRouteData = function(routes, params, query, data) {
  var self = this;

  return Promise.all(routes
    .filter(function(route) {
      return route.handler.fetchData;
    })
    .map(function(route) {
      var info = route.handler.fetchData(params, query);

      var api = (typeof info.api === 'undefined') ? 'default' : info.api;
      var method = info.method || 'get';
      var apiPath = self.options.apiPath || '/api';
      var url = (api && info.url.charAt(0) === '/') ? apiPath + '/-' + info.url : info.url;

      var requestData = info.data || {};
      var headers = info.headers || {};
      var cache = (typeof info.cache === 'undefined') ? true : info.cache;

      if (api) {
        headers.api = api;
      }

      return self[method](url, requestData, headers, cache).then(function(d) {
        return data[route.name] = d;
      });
    })
  ).then(function() {
    return data;
  });
}

Fetcher.prototype.fetchPrefetchData = function(routes, params, query, data) {
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
          var name = component.name.charAt(0).toLowerCase() + component.name.substring(1);
          var info = component.fetchData(params, query);

          var api = (typeof info.api === 'undefined') ? 'default' : info.api;
          var method = info.method || 'get';
          var apiPath = self.options.apiPath || '/api';
          var url = (api && info.url.charAt(0) === '/') ? apiPath + '/-' + info.url : info.url;

          var requestData = info.data || {};
          var headers = info.headers || {};
          var cache = (typeof info.cache === 'undefined') ? true : info.cache;

          if (api) {
            headers.api = api;
          }

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

    if (url.charAt(0) === '/') {
      // if (typeof document !== 'undefined') {
      //   var apiPath = this.options.apiPath || '/api';
      //   url = apiPath + '/-' + url;
      // }

      if (this.baseUrl) {
        url = this.baseUrl + url;
      }
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
        if (err) {
          return reject(err);
        }

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
