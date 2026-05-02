const socketSetup = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client joins a room to watch a specific video's analysis status
    socket.on('watch_video', ({ video_id }) => {
      if (video_id) {
        socket.join(`video_${video_id}`);
        console.log(`Socket ${socket.id} watching video_${video_id}`);
      }
    });

    // Client leaves a video room
    socket.on('unwatch_video', ({ video_id }) => {
      if (video_id) {
        socket.leave(`video_${video_id}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketSetup;
