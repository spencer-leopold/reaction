var request = require('request');
var qs = require('qs2');
var _ = require('../../shared/lodash.custom');

function RestAdapter(options) {
  this.options = options;
}

RestAdapter.prototype.request = function(req, res, callback) {
  var requestUrl;

  if (typeof req.url === 'string') {
    requestUrl = req.url;
  }
  else {
    requestUrl = req.url.path;
  }

  requestUrl = this.processUrl(requestUrl);

  if (req.query && !_.isEmpty(req.query)) {
    requestUrl += '?' + qs.stringify(req.query);
  }

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


RestAdapter.prototype.processUrl = function(path) {
  var config, apiPath = '', url = path;
  var apiConfig = this.options;
  var sepIndex = path.indexOf('/-');

  if (~sepIndex) {
    apiPath = path.substr(sepIndex + 2, path.length - 1);
  }

  if (apiConfig && !!apiConfig.apiPrefix) {
    url = apiConfig.protocol + '://' + apiConfig.host + ':' + apiConfig.port + apiPath;
  }
  else {
    for (api in apiConfig) {
      if (apiConfig.hasOwnProperty(api)) {
        config = apiConfig[api];

        if (~apiPath.indexOf(config.apiPrefix)) {
          url = config.protocol + '://' + config.host + ':' + config.port + apiPath;
          break;
        }
      }
    }
  }

  return url;
}

module.exports = RestAdapter;
