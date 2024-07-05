const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const gamehub = require('./src/gamehub');

app.use(express.static('./dist/public'));

app.get('/', function(req, res){
  res.render('index');
})

io.on('connection', function(socket) {
  console.log('gamepad connected');

  socket.on('disconnect', function() {
    if(socket.inputId !== undefined){
      console.log('goodbye input -> ' + socket.inputId);
      gamehub.disconnect(socket.inputId);
    }
    console.log('gamepad disconnected');
  });

  socket.on('hello', function() {
    gamehub.connect(function(inputId){
      if (inputId !== -1) {
        socket.inputId = inputId;
        console.log('hello input -> ' + socket.inputId);
        socket.emit('hello', {
          inputId: inputId
        });
      }
    });
  });

  socket.on('event', function(code) {
    if(socket.inputId !== undefined && code){
      gamehub.sendEvent(socket.inputId, code);
    }
  });

});

// Start the server on port provided by grunt-express-server
http.listen(process.env.PORT, function() {
    console.log('Express server listening on port ' + process.env.PORT);
});

module.exports = app;
