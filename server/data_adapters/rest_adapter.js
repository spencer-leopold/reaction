var request = require('request');
var qs = require('qs2');
var _ = require('../../shared/lodash.custom');

function RestAdapter(options) {
  this.options = options;
}

RestAdapter.prototype.request = function(req, res, callback) {
  var requestUrl = this.processUrl(req);

  var api = {
    url: requestUrl,
    method: req.method,
    headers: req.headers,
    json: req.body || req.payload,
    params: req.params
  };

  delete api.headers['accept-encoding'];

  if (req.method === 'GET') {
    delete api.json;
  }

  request(api, function (err, response, body) {
    if (err) {
      return callback(err);
    }

    try {
      body = JSON.parse(body);
    }
    catch (e) {
      console.log(e);
    }

    return callback(body);
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
    var diff = apiConfig.apiPrefix;
    var matches = url.split('/');

    for (var i = 0; i < matches.length; i++) {
      var re = new RegExp('(' + matches[i] + '\/' + '|' + matches[i] + ')', 'g');
      diff = diff.replace(re, '');
    }

    if (diff.charAt(0) !== '/') {
      diff = '/' + diff;
    }

    if (diff === '/' && url.charAt(0) === '/') {
      diff = '';
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
