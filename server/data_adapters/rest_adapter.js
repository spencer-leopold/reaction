var request = require('request');
var qs = require('qs2');
var debug = require('debug')('reaction');
var _ = require('../../shared/lodash.custom');

function RestAdapter(options) {
  this.options = options;
}

RestAdapter.prototype.request = function(req, callback) {
  var requestUrl = this.processUrl(req);

  var api = {
    url: requestUrl,
    method: req.method || 'get',
    headers: req.headers || {},
    json: req.body || req.payload || {},
    params: req.params || {}
  };

  delete api.headers['accept-encoding'];

  if (req.method === 'GET') {
    delete api.json;
  }

  debug("RestAdapter request: %s from %s", api.method.toUpperCase(), api.url);

  var start = new Date().getTime(), end;
  request(api, function (err, response, body) {
    if (err) {
      return callback(null, err);
    }

    try {
      body = JSON.parse(body);
    }
    catch (e) {
      console.log(e);
    }

    end = new Date().getTime();
    debug("api request finished in %s seconds", (end - start) / 1000);
    return callback(null, body);
  });
}

RestAdapter.prototype.processUrl = function(req) {
  var config, url, endPoint = false, apiMatch = false;

  if (typeof req.url === 'string') {
    url = req.url;
  }
  else {
    url = req.url.path;
  }

  var sepIndex = url.indexOf('/-');

  if (~sepIndex) {
    endPoint = url.substr(sepIndex + 2, url.length - 1);
  }

  var api = req.headers.api || 'default';
  var apiConfig = this.options[api] || this.options['default'] || this.options;

  // @TODO: TEST THIS HEAVILY
  // if we don't have an endPoint that means an absolute
  // path to the API was used, so we need to diff the
  // url and the apiPrefix to figure out the correct
  // path to API Endpoint, since some servers strip
  // the mountPath from the url.
  // (e.g /api/1.0/users would come through as /1.0/users)
  if (apiConfig && apiConfig.apiPrefix && !endPoint) {
    // strip leading slash from url so the diff
    // preserves the apiPrefixes leading slash
    if (url.charAt(0) === '/') {
      url = url.substr(1);
    }

    var apiPrefix = apiConfig.apiPrefix;
    var count = 0;
    var diff = '';

    for (var i = 0; i < apiPrefix.length; i++) {
      if (apiPrefix[i] !== url[count]) {
        diff += apiPrefix[i];
      }
      else {
        count++;
      }
    }

    endPoint = diff + url;
  }

  if (apiConfig && apiConfig.apiPrefix && ~endPoint.indexOf(apiConfig.apiPrefix)) {
    url = apiConfig.protocol + '://' + apiConfig.host + ':' + apiConfig.port + endPoint;
  }
  else {
    var protocol = '';
    var host = req.headers.host;

    if (host.indexOf('https://') === -1) {
      protocol = 'http://';
    }

    url = protocol + req.headers.host + endPoint;
  }

  // Append query string to end of url
  if (req.query && !_.isEmpty(req.query) && url.indexOf('?') === -1) {
    url += '?' + qs.stringify(req.query);
  }

  return url;
}

module.exports = RestAdapter;
