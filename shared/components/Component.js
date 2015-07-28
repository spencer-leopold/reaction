"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var React = require('react');
var ReactRouter = require('react-router');
var fetcher = require('../fetcher');

var ReactionComponent = (function (_React$Component) {
  function ReactionComponent(props) {
    _classCallCheck(this, ReactionComponent);

    _get(Object.getPrototypeOf(ReactionComponent.prototype), 'constructor', this).call(this, props);

    var methods = Object.getOwnPropertyNames(this.constructor.prototype).filter(function (method) {
      return typeof method === 'function';
    });

    methods.forEach((function (method) {
      this[method] = this[method].bind(this);
    }).bind(this));
  }

  _inherits(ReactionComponent, _React$Component);

  _createClass(ReactionComponent, [{
    key: 'fetch',
    value: function fetch() {
      if (!arguments.length || arguments.length === 1 && typeof arguments[0] === 'boolean') {
        var info = this.constructor.fetchData(this.context.router.getCurrentParams(), this.context.router.getCurrentQuery());
        console.log(this.props);
        return fetcher(this.props).parseAndFetch(info);
      }
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
  }]);

  return ReactionComponent;
})(React.Component);

ReactionComponent.contextTypes = {
  router: React.PropTypes.func
};

module.exports = ReactionComponent;
