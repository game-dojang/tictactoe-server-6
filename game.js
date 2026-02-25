const { v4: uuidv4 } = require('uuid');

module.exports = function(server) {

    const io = require('socket.io')(server, {
        transports: ['websocket'],
    });

    // 방 정보를 저장할 배열
    var rooms = [];
    var socketRooms = new Map();

    io.on('connection', function(socket) {
        console.log('a user connected');

        if (rooms.length > 0) {
            var roomId = rooms.shift();
            socket.join(roomId);
            socket.emit('joinRoom', { roomId: roomId });
            socket.to(roomId).emit('startGame', { socketId: roomId });
            socketRooms.set(socket.id, roomId);
        } else {
            var roomId = uuidv4();
            socket.join(roomId);
            socket.emit('createRoom', { roomId: roomId });
            rooms.push(roomId);
            socketRooms.set(socket.id, roomId);
        }

        socket.on('leaveRoom', function(data) {
            // 특정 클라이언트가 방을 나갔을 때
            var roomId = data.roomId;
            socket.leave(roomId);
            socket.emit('exitRoom');
            socket.to(roomId).emit('endGame');

            // 방 만든 후 혼자 들어갔다가 나갈 때 방 정보 삭제
            const roomIdx = rooms.indexOf(roomId);
            if (roomIdx !== -1) {
                rooms.splice(roomIdx, 1);
                console.log('Room removed:', roomId);
            }

            socketRooms.delete(socket.id);
        });

        socket.on('disconnecting', function() {
            console.log('Disconnected: ' + socket.id + ', Reason: ' + reason);
        });

        socket.on('doPlayer', function(playerInfo) {
            var roomId = playerInfo.roomId;
            var cellIndex = playerInfo.position;

            console.log('doPlayer: ' + roomId + ', cellIndex: ' + cellIndex);
            socket.to(roomId).emit('doOpponent', { position: cellIndex });
        });
    });
}