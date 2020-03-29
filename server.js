const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = "Nurse Joy's Bot";

// Run whenever any client connects
io.on('connection', socket => {
  // We can emit what we want, call it whatever we want and send any data we want
  // When a connection is made

  socket.on('joinRoom', ({ username, room }) => {
    // We use the socket id as the user id
    const user = userJoin(socket.id, username, room);
    // We actually have room functionality with socket.io
    socket.join(user.room);

    // socket.emit emits to just the user that is connecting
    // Welcome current user
    socket.emit(
      'message',
      formatMessage(botName, 'Welcome to the PokeCenter!')
    );

    //Broadcase when a user connects
    // socket.broadcase emits to ever one except the user that is conecting
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // If we want to emit to EVERY USER on a connection, we use io.emit

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );
      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
