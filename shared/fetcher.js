//
// @TODO: Allow dynamic route params that are
// auto-replaced using the sent data
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

ComponentFetcher.prototype.fetchDataExec = function(info, data, component) {
  var name, keys, initialData;

  // If we're on the client, just resolve
  // and fetch after component renders.
  if (isClient) {
    return Promise.resolve(data);
  }

  if (component.initialData && typeof component.intialData === 'function') {
    initialData = component.initialData();
    keys = Object.keys(initialData);
    name = keys[0];
  }
  else {
    name = component.name.charAt(0).toLowerCase() + component.name.substring(1);
  }

  // if info is a Promise, execute if and 
  // set data to the passed in param
  if (!!info.then && typeof info.then === 'function') {
    return info.then(function(d) {
      return data[name] = d;
    });
  }
  else if (typeof info === 'function') {
    return this.thunkExecute(info).then(function(d) {
      return data[name] = d;
    });
  }
  else {
    return this.parseAndFetch(info).then(function(d) {
      return data[name] = d;
    });
  }
}

ComponentFetcher.prototype.fetchData = function(routes, params, query) {
  var _this = this;
  var data = {};

  return Promise.all([
    _this.fetchFromRoute(routes, params, query, data),
    _this.fetchFromPrefetchRoute(routes, params, query, data),
    _this.fetchFromPrefetchComponents(routes, params, query, data)
  ]).then(function() {
    return data;
  });
}

ComponentFetcher.prototype.fetchFromRoute = function(routes, params, query, data) {
  var _this = this;

  return Promise.all(routes
    .filter(function(route) {
      return route.handler.fetchData;
    })
    .map(function(route) {
      var info = route.handler.fetchData(params, query);
      return _this.fetchDataExec(info, data, route.handler);
    })
  ).then(function() {
    return data;
  });
}

ComponentFetcher.prototype.fetchFromPrefetchRoute = function(routes, params, query, data) {
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
          var info = component.fetchData(params, query);
          return _this.fetchDataExec(info, data, component);
        })
      ).then(function() {
        return data;
      });
    })
  ).then(function() {
    return data;
  });
}

ComponentFetcher.prototype.fetchFromPrefetchComponents = function(routes, params, query, data) {
  var _this = this;

  return Promise.all(routes
    .filter(function(route) {
      return route.handler.prefetchComponents;
    })
    .map(function(route) {
      var components = route.handler.prefetchComponents();
      return Promise.all(Object.keys(components)
        .filter(function(name) {
          return components[name].fetchData;
        })
        .map(function(name) {
          var component = components[name];
          var info = component.fetchData(params, query);
          return _this.fetchDataExec(info, data, component);
        })
      ).then(function() {
        return data;
      });
    })
  ).then(function() {
    return data;
  });
}

ComponentFetcher.prototype.extractDomain = function(url) {
  var baseUrl;

  if (~url.indexOf('://')) {
    baseUrl = url.split('/')[2];
  }
  else {
    baseUrl = url.split('/')[0];
  }

  return baseUrl;
}

ComponentFetcher.prototype.isAbsoluteUrl = function(url) {
  var firstPathIdx, domain;

  if (~url.indexOf('://')) {
    return true;
  }

  if (url.charAt(0) === '/') {
    return false;
  }

  // shouldn't get to this point unless the user
  // enters an invalid url, but check regardless
  firstPathIdx = url.indexOf('/');
  domain = url.substr(0, firstPathIdx);

  if (!domain.indexOf('.')) {
    return true;
  }

  return false;
}

ComponentFetcher.prototype.replaceSegments = function(url, data) {
  var matches;
  var baseUrl = (!!this.options.baseUrl) ? this.options.baseUrl : this.extractDomain(url);
  var dynamicRe = /\:([^\/\s]*)/g;

  // remove domain before finding matches
  url = url.replace(baseUrl, '');
  matches = url.match(dynamicRe);

  if (matches && matches.length) {
    matches.forEach(function(match) {
      var matchKey = match.replace(':', '');

      if (~url.indexOf(match)) {
        url = url.replace(match, data[matchKey]);
        delete data[matchKey];
      }
    });
  }

  return baseUrl + url;
}

ComponentFetcher.prototype.formatUrl = function(url) {
  var apiPath, apiConfig, appOptions = false, api = this.getApi();

  if (isClient) {
    appOptions = window.ReactionRouter.options;
  }

  if (url.charAt(0) === '/') {
    if (!!api) {
      if (appOptions) {
        apiPath = appOptions.apiPath;
        // If apiPath is empty, Reaction is only being
        // used on the client - outside of Node
        if (apiPath !== '') {
          apiPath = appOptions.apiPath || '/api';
        }
      }
      else {
        apiPath = this.options.apiPath || '/api';
      }

      if (apiPath !== '') {
        url = apiPath + '/-' + url;
      }
      else {
        if (appOptions && !!appOptions.api) {
          apiConfig = appOptions.api[api] || appOptions.api['default'] || appOptions.api;

          // Check if theres an apiPrefix and the url doesn't already contain it
          if (!!apiConfig.prefix && url.indexOf(apiConfig.prefix) === -1) {
            url = apiConfig.prefix + url;
          }
        }
      }
    }
  }

  if (!this.isAbsoluteUrl(url)) {
    if (this.options.baseUrl) {
      var baseUrl = this.options.baseUrl;
      var sep = '/';

      if (baseUrl.charAt(baseUrl.length) === '/' || url.charAt(0) === '/') {
        sep = '';
      }

      url = this.options.baseUrl + sep + url;
    }
  }

  return url;
}

ComponentFetcher.prototype.handleRequest = function(method, url, data, headers, cacheResponse) {
  var method = method.toLowerCase();
  var allHeaders = { api: this.getApi() };
  var ttlSec = 900;
  var paramValue, cacheUrl;

  cacheUrl = url = this.replaceSegments(url, data);

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
  }).catch(function(e) {
    console.log(e);
    console.log('offending url: %s', url);
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
