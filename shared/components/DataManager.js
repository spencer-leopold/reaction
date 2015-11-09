'use strict';

var React = require('react');
var ReactPropTypes = require('react').PropTypes;
var Events = require('../events').Dispatcher;
var state = {};
var previousState = {};

var DataManager = React.createClass({

  displayName: 'DataManager',

  statics: {

    getCurrentState: function getCurrentState() {
      return state;
    },

    getPreviousState: function getPreviousState() {
      return previousState;
    },

    setComponentState: function setComponentState(name, data) {
      previousState[name] = state[name];
      state[name] = data;
      return state;
    },

    getComponentState: function getComponentState(name) {
      return state[name];
    },

    getComponentPreviousState: function getComponentPreviousState(name) {
      return previousState[name];
    }

  },

  getInitialState: function getInitialState() {
    //
    // Set state inside and outside react
    // so we can access it from static methods
    // passed through context.
    //
    return state = this.props.data;
  },

  updateState: function updateState(evt, key, val) {
    //
    // Prevents unnecessary state updates.
    // Only update if key isn't set or
    // current value does not equal
    // next value.
    //
    if (!state[key] || state[key] !== val) {
      previousState[key] = state[key];

      var stateObj = function() {
        var returnObj = {};
        returnObj[key] = val;
        state[key] = val;
        return returnObj;
      };

      this.setState(stateObj);
    }
  },

  componentDidMount: function componentDidMount() {
    Events.on('component:fetchData:finish', this.updateState, this);
  },

  componentWillUnmount: function componentWillUnmount() {
    Events.remove('component:fetchData:finish', this.updateState, this);
  },

  childContextTypes: {
    dataManager: ReactPropTypes.func
  },

  getChildContext: function getChildContext() {
    return {
      dataManager: DataManager
    };
  },

  // componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
  //   if (!!nextProps.data) {
  //     this.setState(state = nextProps.data);
  //   }
  // },

  render: function render() {
    return this.props.handler ? React.createElement(this.props.handler, state) : null;
  }

});

module.exports = DataManager;
