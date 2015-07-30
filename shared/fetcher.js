//
// @TODO: Need a better way to signal we want to skip
// sending to API and instead load data from endpoint
// on current server
//

var Promise = require('when');
var Request = require('superagent');
var _ = require('./lodash.custom');
var isClient = (typeof document !== 'undefined');

function ComponentFetcher(options) {
  this.options = options || {};
  this._cache = {};
  this.api = 'default';
}

ComponentFetcher.prototype.setApi = function(api) {
  this.api = api || 'default';
  return this;
}

ComponentFetcher.prototype.setBaseUrl = function(url) {
  this.options.baseUrl = url;
  return this;
}

ComponentFetcher.prototype.parseAndFetch = function(info) {
  var api = (typeof info.api === 'undefined') ? 'default' : info.api;
  var method = info.method || 'get';
  var apiPath = this.options.apiPath || '/api';

  var url = this.formatUrl(info.url);

  var data = info.data || {};
  var headers = info.headers || {};
  var cache = (typeof info.cache === 'undefined') ? true : info.cache;

  if (api) {
    headers.api = api;
  }

  return this.handleRequest(method, url, data, headers, cache);
}

ComponentFetcher.prototype.fetchData = function(routes, params, query) {
  var self = this;
  var data = {};

  return Promise.all([
    self.fetchRouteData(routes, params, query, data),
    self.fetchPrefetchData(routes, params, query, data)
  ]).then(function() {
    return data;
  });
}

ComponentFetcher.prototype.fetchRouteData = function(routes, params, query, data) {
  var self = this;

  return Promise.all(routes
    .filter(function(route) {
      return route.handler.fetchData;
    })
    .map(function(route) {
      var info = route.handler.fetchData(params, query);

      return self.parseAndFetch(info).then(function(d) {
        return data[route.name] = d;
      });
    })
  ).then(function() {
    return data;
  });
}

ComponentFetcher.prototype.fetchPrefetchData = function(routes, params, query, data) {
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

          return self.parseAndFetch(info).then(function(d) {
            return data[route.name] = d;
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

ComponentFetcher.prototype.formatUrl = function(url) {
  var apiPath;

  if (url.charAt(0) === '/') {
    if (isClient) {
      apiPath = window.ReactionRouter.options.apiPath || '/api';
    }
    else {
      apiPath = this.options.apiPath || '/api';
    }

    url = apiPath + '/-' + url;

    if (this.options.baseUrl) {
      url = this.options.baseUrl + url;
    }
  }

  return url;
}

ComponentFetcher.prototype.handleRequest = function(method, url, data, headers, cacheResponse) {
  var self = this, allHeaders = { api: this.api };

  if (method === 'get' && this._cache[url] && cacheResponse) {
    return Promise.resolve(this._cache[url]);
  }

  return Promise.promise(function(resolve, reject) {
    var request = Request[method](url);

    if (data && typeof data === 'object') {
      request.send(data);
    }

    if (headers && typeof headers === 'object') {
      allHeaders = _.assign({}, allHeaders, headers);
    }

    request.set(allHeaders);

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
          self._cache[url] = data;
        }
      }
    });
  });
}

//
// @TODO: Extract these methods out in own module
// that returns a new instance of ComponentFetcher per call
//
function fetcher(options) {
  this._api = 'default';
  return new ComponentFetcher(options);
}

// Convenience method to change
// the API without having to
// send it as a header with the
// request
fetcher.api = function(api) {
  this._api = api;
  return this;
}

fetcher.get = function(url, headers, cache) {
  var f = fetcher().setApi(this._api);
  this._api = 'default';

  url = f.formatUrl(url);
  headers = headers || {};

  if (typeof headers === 'boolean') {
    return f.handleRequest('get', url, {}, {}, headers);
  }

  return f.handleRequest('get', url, {}, headers, cache);
}

fetcher.del = function(url, headers) {
  var f = fetcher().setApi(this._api);
  this._api = 'default';

  url = f.formatUrl(url);
  headers = headers || {};

  return f.handleRequest('del', url, {}, headers);
}


fetcher.head = function(url, data, headers) {
  var f = fetcher().setApi(this._api);
  this._api = 'default';

  url = f.formatUrl(url);
  headers = headers || {};

  return f.handleRequest('head', url, data, headers);
}

fetcher.patch = function(url, data, headers) {
  var f = fetcher().setApi(this._api);
  this._api = 'default';

  url = f.formatUrl(url);
  headers = headers || {};

  return f.handleRequest('patch', url, data, headers);
}

fetcher.post = function(url, data, headers) {
  var f = fetcher().setApi(this._api);
  this._api = 'default';

  url = f.formatUrl(url);
  headers = headers || {};

  return f.handleRequest('post', url, data, headers);
}

fetcher.put = function(url, data, headers) {
  var f = fetcher().setApi(this._api);
  this._api = 'default';

  url = f.formatUrl(url);
  headers = headers || {};

  return f.handleRequest('put', url, data, headers);
}

module.exports = fetcher;
