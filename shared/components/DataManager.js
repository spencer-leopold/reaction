'use strict';

var React = require('react');
var ReactPropTypes = require('react').PropTypes;
var Events = require('../events').Dispatcher;
var state = {};

var DataManager = React.createClass({

  displayName: 'DataManager',

  statics: {

    getCurrentState: function getCurrentState() {
      return state;
    },

    updateHandlerState: function updateHandlerState(name, data) {
      state[name] = data;
      return state;
    },

    getHandlerState: function getHandlerState(name) {
      return state[name];
    }

  },

  childContextTypes: {
    dataManager: ReactPropTypes.func
  },

  updateState: function updateState(evt, key, val) {
    var stateObj = function() {
      var returnObj = {};
      returnObj[key] = val;
      state[key] = val;
      return returnObj;
    };

    this.setState(stateObj);
  },

  componentDidMount: function componentDidMount() {
    Events.on('component:fetchData:finish', this.updateState, this);
  },

  getChildContext: function getChildContext() {
    return {
      dataManager: DataManager
    };
  },

  getInitialState: function getInitialState() {
    return state = this.props.data;
  },

  componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (!!nextProps.data) {
      this.setState(state = nextProps.data);
    }
  },

  render: function render() {
    return this.props.handler ? React.createElement(this.props.handler, state) : null;
  }

});

module.exports = DataManager;
