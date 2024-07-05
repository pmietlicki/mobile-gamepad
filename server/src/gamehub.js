var config = require('../../config/config');
var GameController = require('./gamepad');

var gamehub = function() {

  this.gamepads = [];

  return {
    // disconnect input device from hub
    disconnect: function(inputId) {
      if (this.gamepads[inputId] !== undefined) {
        console.log(`Disconnecting gamepad with inputId: ${inputId}`);
        this.gamepads[inputId].disconnect();
        this.gamepads[inputId] = undefined;
      }
      return null;
    }.bind(this),

    // connect input device to hub
    connect: function(callback) {
      try {
        /// find free slot
        for (var i = 1; i <= config.padLimit; i++) {
          if (this.gamepads[i] === undefined) {
            console.log(`Connecting gamepad to slot: ${i}`);
            this.gamepads[i] = new GameController(i);
            this.gamepads[i].connect();
            return callback(i);
          }
        }
        // no available free slot
        console.warn('No available free slot for a new gamepad');
        return callback(-1);
      } catch (err) {
        console.log(err);
        return callback(500);
      }
    }.bind(this),

    // send event to the gamepad
    sendEvent: function(inputId, event) {
      if (this.gamepads[inputId]) {
        console.log(`Sending event to gamepad with inputId: ${inputId}`, event);
        this.gamepads[inputId].sendEvent(event);
      } else {
        console.warn(`No gamepad found for inputId: ${inputId}`);
      }
      return null;
    }.bind(this)
  }
};

module.exports = new gamehub();
