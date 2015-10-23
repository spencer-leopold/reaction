"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var React = require('react');
var ReactRouter = require('react-router');
var fetcher = require('../fetcher');
var Events = require('../events').Dispatcher;

var ReactionComponent = (function (_React$Component) {
  function ReactionComponent(props, shouldAutoBind, dataKey) {
    var autoBind;

    if (typeof shouldAutoBind === 'undefined') {
      autoBind = true;
    }

    if (typeof shouldAutoBind === 'string') {
      if (typeof dataKey === 'undefined') {
        dataKey = shouldAutoBind;
        autoBind = true;
      }
      else {
        autoBind = !!shouldAutoBind;
      }
    }

    _classCallCheck(this, ReactionComponent);

    _get(Object.getPrototypeOf(ReactionComponent.prototype), 'constructor', this).call(this, props);

    if (autoBind) {
      var proto = this.constructor.prototype;
      var methods = Object.getOwnPropertyNames(proto).filter(function(method) {
        return method !== 'constructor' && typeof proto[method] === 'function';
      });

      methods.forEach((function (method) {
        this[method] = this[method].bind(this);
      }).bind(this));
    }

    if (!!this.constructor.name) {
      var name = this.constructor.name;
      this.componentDataKey = name.charAt(0).toLowerCase() + name.substring(1);
    }

    if (!!dataKey) {
      this.componentDataKey = dataKey;
    }

    if (!!this.componentDataKey) {
      this.state = {};
      this.state[this.componentDataKey] = props[this.componentDataKey];
    }
  }

  _inherits(ReactionComponent, _React$Component);

  _createClass(ReactionComponent, [{
    key: 'hydrate',
    value: function hydrate(dataKey) {
      var _this = this;
      var info = this.constructor.fetchData(this.context.router.getCurrentParams(), this.context.router.getCurrentQuery());

      if (!!dataKey && typeof dataKey === 'string') {
        return fetcher(this.props).parseAndFetch(info).then(function(res) {

          var stateObj = function() {
            var returnObj = {};
            returnObj[dataKey] = res;
            return returnObj;
          };

          _this.setState(stateObj);
        }).catch(console.log.bind(console));
      }

      return fetcher(this.props).parseAndFetch(info);
    }
  }, {
    key: 'fetcher',
    get: function () {
      return {
        api: function api() {
          return fetcher.api.apply(fetcher, arguments);
        },
        get: function get() {
          return fetcher.get.apply(fetcher, arguments);
        },
        head: function head() {
          return fetcher.head.apply(fetcher, arguments);
        },
        del: function del() {
          return fetcher.del.apply(fetcher, arguments);
        },
        patch: function patch() {
          return fetcher.patch.apply(fetcher, arguments);
        },
        post: function post() {
          return fetcher.post.apply(fetcher, arguments);
        },
        put: function put() {
          return fetcher.put.apply(fetcher, arguments);
        }
      };
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      if (!!this.componentDataKey) {
        var _this = this;
        var dataKey = this.componentDataKey;

        if (this.state && this.state[dataKey]) {
          Events.on('route:fetchData:finish', function() {
            _this.hydrate(dataKey);
          });
        }
      }
    }
  }]);

  return ReactionComponent;
})(React.Component);

ReactionComponent.contextTypes = {
  router: React.PropTypes.func
};

module.exports = ReactionComponent;
