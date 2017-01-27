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
  function ReactionComponent(props, context, shouldAutoBind) {
    var autoBind;

    if (typeof shouldAutoBind === 'undefined') {
      autoBind = true;
    }

    _classCallCheck(this, ReactionComponent);

    _get(Object.getPrototypeOf(ReactionComponent.prototype), 'constructor', this).call(this, props);

    // Autobind class methods so you don't have to bind 'this' whenever you put
    // callbacks in props.
    if (autoBind) {
      var proto = this.constructor.prototype;
      var methods = Object.getOwnPropertyNames(proto).filter(function(method) {
        return method !== 'constructor' && typeof proto[method] === 'function';
      });

      methods.forEach((function (method) {
        this[method] = this[method].bind(this);
      }).bind(this));
    }

    // this.componentDataKey = false;
    // // Set fallback value type when props[dataKey] is not set
    // var dataType = [];
    //
    // if (!!this.constructor.initialData && typeof this.constructor.initialData === 'function') {
    //   var initialData = this.constructor.initialData();
    //   for (var key in initialData) {
    //     if (initialData.hasOwnProperty(key)) {
    //       dataType = initialData[key];
    //       this.componentDataKey = key;
    //     }
    //   }
    // }

    // if (!!this.componentDataKey) {
    //   this.state = {};
    //   this.state[this.componentDataKey] = props[this.componentDataKey] || dataType;
    // }
  }

  _inherits(ReactionComponent, _React$Component);

  _createClass(ReactionComponent, [{
  //   key: 'hydrate',
  //   value: function hydrate(dataKey) {
  //     var _this = this;
  //
  //     //
  //     // default state key
  //     //
  //     if (!dataKey) {
  //       dataKey = 'data';
  //     }
  //
  //     if (!this.constructor.fetchData || typeof this.constructor.fetchData !== 'function') {
  //       throw new Error('`hydrate` called on component without a fetchData method');
  //     }
  //
  //     var info = this.constructor.fetchData(this.context.router.getCurrentParams(), this.context.router.getCurrentQuery());
  //
  //     if (!!dataKey && typeof dataKey === 'string') {
  //       return fetcher(this.props).fetchDataExec(info).then(function(res) {
  //
  //         var stateObj = function() {
  //           var returnObj = {};
  //           returnObj[dataKey] = res;
  //           return returnObj;
  //         };
  //
  //         _this.setState(stateObj);
  //       }).catch(console.log.bind(console));
  //     }
  //
  //     return fetcher(this.props).fetchDataExec(info);
  //   }
  // }, {
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
    key: 'hydrate',
    value: function hydrate(componentName, data, appendData) {
      var additionalProps = {};

      if (typeof componentName !== 'string' && typeof data === 'boolean') {
        appendData = data;
      }
      else {
        appendData = typeof appendData === 'undefined' ? false : appendData;
      }

      if (typeof componentName === 'object') {
        additionalProps = componentName
      }

      // Default to current component componentName can also be an object of
      // additional props to pass to fetchData.
      if (!componentName || typeof componentName === 'object') {
        componentName = this.constructor.name;
      }

      if (typeof data !== 'object' && !!this.constructor.fetchData && typeof this.constructor.fetchData === 'function') {
        var info = this.constructor.fetchData(this.context.router.getCurrentParams(), this.context.router.getCurrentQuery(), additionalProps);

        return fetcher(this.props).fetchDataExec(info).then(function(res) {

          if (res) {
            Events.trigger('component:fetchData:finish', componentName, res, appendData);
          }
        }).catch(console.log.bind(console));
      }

      // If data is passed in, just update the component with that instead
      // of trying to call fetchData.
      Events.trigger('component:fetchData:finish', componentName, data);
    }
  }, {
    key: 'getData',
    value: function getData(componentName) {
      // Default to current component.
      if (!componentName) {
        componentName = this.constructor.name;
        // if (componentName === '_class' && this._reactInternalInstance && this._reactInternalInstance._rootNodeID) {
        //   componentName = this._reactInternalInstance._rootNodeID;
        // }
      }

      return this.context.dataManager.getComponentState(componentName);
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      // Attach event listener for this component.
      if (!!this.constructor.fetchData && typeof this.constructor.fetchData === 'function') {
        Events.on('route:fetchData:finish', this.hydrate, this);
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      // Remove event listener for this component.
      if (!!this.constructor.fetchData && typeof this.constructor.fetchData === 'function') {
        Events.remove('route:fetchData:finish', this.hydrate, this);
      }
    }
  }, {
    key: 'compareState',
    value: function compareState(prev, state) {
      if (!!prev && !!state) {

        for (var i = 0; i < prev.length; ++i) {
          if (prev[i] !== state[i]) {
            // States don't match.
            return true;
          }
        }
      }

      // States don't match.
      return true;
    }
  }, {
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(componentName) {
      if (typeof componentName !== 'string') {
        componentName = this.constructor.name;
      }

      var prev = this.context.dataManager.getComponentPreviousState(componentName);
      var state = this.context.dataManager.getComponentState(componentName);
      var shouldUpdate = this.compareState(prev, state);

      // Previous state matches current state so we shouldn't update.
      if (!shouldUpdate) {
        return false;
      }

      // Previous state is different than current state. Component should
      // update and we set the previous state to the current state.
      this.context.dataManager.setComponentState(componentName, state);
      return true;
    }
  }]);

  return ReactionComponent;
})(React.Component);

ReactionComponent.contextTypes = {
  router: React.PropTypes.func,
  dataManager: React.PropTypes.func
};

module.exports = ReactionComponent;
