var Promise = require('bluebird');
var Request = require('superagent');
var _ = require('lodash');
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

  var fetchData = routes
    .filter(function(route) {
      return route.handler.fetchData;
    })
    .map(function(route) {
      return route.handler.fetchData(params).then(function(d) {
        return data[route.name] = d;
      });
    });

  var self = this;

  return Promise.all([fetchData, self.preFetch(routes, params, data)]).then(function() {
    return data;
  });
}

Fetcher.prototype.preFetch = function(routes, params, data) {
  var components = [];
  var childComponents = routes
    .filter(function(route) {
      return route.prefetchHandlers;
    })
    .map(function(route) {
      return _.forEach(route.prefetchHandlers, function(component) {
        components.push(component);
      });
    });

  return Promise.all(components
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
}

METHODS.forEach(function(method) {
  Fetcher.prototype[method] = function(url, data, headers) {
    var that = this;
    var request;

    if (isServer && url.charAt(0) === '/') {
      url = this.baseUrl + url;
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
        var allHeaders = _.extend({}, that.headers, headers);
        request.set(allHeaders);
      }
      else {
        if (that.headers) {
          request.set(that.headers);
        }
      }

      request.end(function(err, res) {
        if (res.status === 404) {
          reject(new Error('not found'));
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
