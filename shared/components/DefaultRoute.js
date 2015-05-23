"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var React = require("react");
var invariant = require("react/lib/invariant");
var PropTypes = React.PropTypes;

var DefaultRoute = (function (_React$Component) {
  function DefaultRoute() {
    _classCallCheck(this, DefaultRoute);

    if (_React$Component != null) {
      _React$Component.apply(this, arguments);
    }
  }

  _inherits(DefaultRoute, _React$Component);

  _createClass(DefaultRoute, [{
    key: "render",
    value: function render() {
      invariant(false, "%s elements are for router configuration only and should not be rendered", this.constructor.name);
    }
  }]);

  return DefaultRoute;
})(React.Component);

DefaultRoute.propTypes = {
  name: PropTypes.string,
  handle: PropTypes.func,
  handler: PropTypes.string,
  ignoreScrollBehavior: PropTypes.bool
};

module.exports = DefaultRoute;
