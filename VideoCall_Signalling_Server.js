const request = require('request');

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});
const port = process.env.PORT;


// Connect WebRTC with Socket

io.on('connection', (socket) => {
  console.log(`Client ${socket.id} connected`);

  // new try
  const checkClients = (roomId) => {
    //this is an ES6 Set of all client ids in the room
    const clients = io.sockets.adapter.rooms.get(roomId);
    //to get the number of clients in this room
    const numClients = clients ? clients.size : 0;
    return numClients;
  }

  socket.on('join', (roomId) => {
    socket.join(roomId);
    console.log('join the call !');

    const num = checkClients(roomId);
    console.log('joined clients number : ' + num);

    if (num > 1) {
      socket.to(roomId).emit('start');
    }
  });

  socket.on('offer', (offer, roomId) => {
    console.log(`Client ${socket.id} send offer`);
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (answer, roomId) => {
    console.log(`Client ${socket.id} send answer`);
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('candidate', (candidate, roomId) => {
    console.log(`Client ${socket.id} send candidate`);
    socket.to(roomId).emit('candidate', candidate);
  });

  socket.on('disconnect', (roomId) => {
    console.log(`Client ${socket.id} disconnected`);

    const num = checkClients(roomId);
    if (num <= 1) {
      // db에서 room 삭제 요청
      const options = {
        uri: process.env.DB_HANDLER_SERVER_URI,
        method: 'POST',
        body: {
          roomId: roomId
        },
        json: true
      }
      request.post(options, (err, res, body) => {
        //...
        // console.log('res : %o',res);
      });
    }

    // 소켓에서 room 나가기
    socket.leave(roomId);


  });
});

server.listen(port, () => {
  console.log(`Socket Server running on port ${port}`);
});

