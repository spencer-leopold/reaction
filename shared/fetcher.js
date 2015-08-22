//
// @TODO: Need a better way to signal we want to skip
// sending to API and instead load data from endpoint
// on current server
//

var Promise = require('when');
var Request = require('superagent');
var MemoryStore = require('./memory_store');
var memoryStore = new MemoryStore();
var _ = require('./lodash.custom');
var isClient = (typeof document !== 'undefined');

function ComponentFetcher(options) {
  this.options = options || {};
  this._cache = {};
  this.api = 'default';
}

ComponentFetcher.prototype.setApi = function(api) {
  this.api = (typeof api === 'undefined') ? 'default' : api;
}

ComponentFetcher.prototype.getApi = function(api) {
  return this.api;
}

ComponentFetcher.prototype.setBaseUrl = function(url) {
  this.options.baseUrl = url;
}

ComponentFetcher.prototype.parseAndFetch = function(info) {
  this.setApi(info.api);

  var method = info.method || 'get';
  var apiPath = this.options.apiPath || '/api';
  var url = this.formatUrl(info.url);

  var data = info.data || {};
  var headers = info.headers || {};
  var cache = (typeof info.cache === 'undefined') ? true : info.cache;

  if (!!info.api) {
    headers.api = info.api;
  }

  return this.handleRequest(method, url, data, headers, cache);
}

ComponentFetcher.prototype.thunkCallback = function(resolve, reject) {
  return function(err, res) {
    if (err) {
      return reject(err);
    }
    return resolve(res);
  }
};

ComponentFetcher.prototype.thunkExecute = function(thunk) {
  var _this = this;
  return Promise.promise(function(resolve, reject) {
    var callback = _this.thunkCallback(resolve, reject);
    return thunk(callback);
  });
};

ComponentFetcher.prototype.fetchData = function(routes, params, query) {
  var _this = this;
  var data = {};

  return Promise.all([
    _this.fetchRouteData(routes, params, query, data),
    _this.fetchPrefetchData(routes, params, query, data)
  ]).then(function() {
    return data;
  });
}

ComponentFetcher.prototype.fetchRouteData = function(routes, params, query, data) {
  var _this = this;

  return Promise.all(routes
    .filter(function(route) {
      return route.handler.fetchData;
    })
    .map(function(route) {
      var info = route.handler.fetchData(params, query);

      // if info is a Promise, execute if and 
      // set data to the passed in param
      if (typeof info.then === 'function') {
        return info.then(function(d) {
          return data[route.name] = d;
        });
      }
      else if (typeof info === 'function') {
        return _this.thunkExecute(info).then(function(d) {
          return data[route.name] = d;
        });
      }
      else {
        return _this.parseAndFetch(info).then(function(d) {
          return data[route.name] = d;
        });
      }
    })
  ).then(function() {
    return data;
  });
}

ComponentFetcher.prototype.fetchPrefetchData = function(routes, params, query, data) {
  var _this = this;

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

          // if info is a Promise, execute if and 
          // set data to the passed in param
          if (typeof info.then === 'function') {
            return info.then(function(d) {
              return data[name] = d;
            });
          }
          else if (typeof info === 'function') {
            return _this.thunkExecute(info).then(function(d) {
              return data[name] = d;
            });
          }
          else {
            return _this.parseAndFetch(info).then(function(d) {
              return data[name] = d;
            });
          }
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
  var apiPath, api = this.getApi();

  if (url.charAt(0) === '/') {
    if (!!api) {
      if (isClient) {
        apiPath = window.ReactionRouter.options.apiPath;
        // If apiPath is empty, Reaction is only being
        // used on the client - outside of Node
        if (apiPath !== '') {
          apiPath = window.ReactionRouter.options.apiPath || '/api';
        }
      }
      else {
        apiPath = this.options.apiPath || '/api';
      }

      if (apiPath !== '') {
        url = apiPath + '/-' + url;
      }
    }

    if (this.options.baseUrl) {
      url = this.options.baseUrl + url;
    }
  }

  return url;
}

ComponentFetcher.prototype.handleRequest = function(method, url, data, headers, cacheResponse) {
  var method = method.toLowerCase();
  var allHeaders = { api: this.getApi() };
  var cacheUrl = url;
  var ttlSec = 900;
  var paramValue;

  // if sending params, add them to the cacheUrl
  if (method === 'get' && data && typeof data === 'object') {
    cacheUrl += '?';
    // Note: we don't care that all cacheUrls with params
    // will end with an =;
    for (var param in data) {
      if (data.hasOwnProperty(param)) {
        paramValue = data[param];
        cacheUrl += param + '=' + paramValue;
      }
    }
  }

  if (method === 'get' && !!cacheResponse && memoryStore.get(cacheUrl)) {
    return Promise.resolve(memoryStore.get(cacheUrl));
  }

  return Promise.promise(function(resolve, reject) {
    var request = Request[method](url);

    if (data && typeof data === 'object') {
      if (method === 'get') {
        request.query(data);
      }
      else {
        request.send(data);
      }
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
        var body = res.body;

        if (method === 'get' && !!cacheResponse) {
          // Allow changing of cache limit
          if (typeof cacheResponse === 'number') {
            ttlSec = cacheResponse;
          }
          memoryStore.set(cacheUrl, body, ttlSec);
        }

        resolve(body);
      }
    });
  });
}

function fetcher(options) {
  var f = new ComponentFetcher(options);
  f.setApi(this._api || 'default');
  return f;
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
  var f = fetcher();
  url = f.formatUrl(url);
  this._api = 'default';

  headers = headers || {};

  if (typeof headers === 'boolean') {
    return f.handleRequest('get', url, {}, {}, headers);
  }

  return f.handleRequest('get', url, {}, headers, cache);
}

fetcher.del = function(url, headers) {
  var f = fetcher();
  url = f.formatUrl(url);
  this._api = 'default';

  headers = headers || {};

  return f.handleRequest('del', url, {}, headers);
}


fetcher.head = function(url, data, headers) {
  var f = fetcher();
  url = f.formatUrl(url);
  this._api = 'default';

  headers = headers || {};

  return f.handleRequest('head', url, data, headers);
}

fetcher.patch = function(url, data, headers) {
  var f = fetcher();
  url = f.formatUrl(url);
  this._api = 'default';

  headers = headers || {};

  return f.handleRequest('patch', url, data, headers);
}

fetcher.post = function(url, data, headers) {
  var f = fetcher();
  url = f.formatUrl(url);
  this._api = 'default';

  headers = headers || {};

  return f.handleRequest('post', url, data, headers);
}

fetcher.put = function(url, data, headers) {
  var f = fetcher();
  url = f.formatUrl(url);
  this._api = 'default';

  headers = headers || {};

  return f.handleRequest('put', url, data, headers);
}

module.exports = fetcher;
