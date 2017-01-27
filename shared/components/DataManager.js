'use strict';

var React = require('react');
var ReactPropTypes = require('react').PropTypes;
var Events = require('../events').Dispatcher;
var state = {};
var previousState = {};

function isEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return true;
}

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
      state.fetching = false;
      return state;
    },

    getComponentState: function getComponentState(name) {
      var data = state[name];
      return isEmpty(data) ? false : data;
    },

    getComponentPreviousState: function getComponentPreviousState(name) {
      var data = previousState[name];
      return isEmpty(data) ? false : data;
    }

  },

  getInitialState: function getInitialState() {
    // Set state inside and outside react so we can access it from static
    // methods passed through context.
    return state = this.props.data;
  },

  updateState: function updateState(evt, key, val, append) {
    // Prevents unnecessary state updates. Only update if key isn't set or
    // current value does not equal next value.
    if (!state[key] || state[key] !== val) {
      previousState[key] = state[key];

      var stateObj = function() {
        var returnObj = {};

        if (!!append && !!state[key]) {
          state[key] = state[key].concat(val);
        }
        else {
          state[key] = val;
        }

        returnObj[key] = state[key];
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
    return this.props.handler ? React.createElement(this.props.handler, {fetching: state.fetching}) : null;
  }

});

module.exports = DataManager;
