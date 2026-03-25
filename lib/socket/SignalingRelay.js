function registerSignalingHandlers(io, socket) {
  socket.on('webrtc-offer', ({ targetSocketId, sdp }) => {
    io.to(targetSocketId).emit('webrtc-offer', { fromSocketId: socket.id, sdp });
  });

  socket.on('webrtc-answer', ({ targetSocketId, sdp }) => {
    io.to(targetSocketId).emit('webrtc-answer', { fromSocketId: socket.id, sdp });
  });

  socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('webrtc-ice-candidate', { fromSocketId: socket.id, candidate });
  });
}

module.exports = { registerSignalingHandlers };
