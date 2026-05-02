import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin;
let socketInstance = null;

const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socketInstance;
};

/**
 * Hook to watch a video's analysis status via Socket.IO
 * @param {string|null} videoId - The video_id to watch
 * @param {function} onComplete - Called when analysis_complete fires
 * @param {function} onFailed - Called when analysis_failed fires
 */
export const useVideoSocket = (videoId, onComplete, onFailed) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!videoId) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.emit('watch_video', { video_id: videoId });

    socket.on('analysis_complete', (data) => {
      if (data.video_id === videoId) {
        onComplete && onComplete(data);
      }
    });

    socket.on('analysis_failed', (data) => {
      if (data.video_id === videoId) {
        onFailed && onFailed(data);
      }
    });

    return () => {
      socket.emit('unwatch_video', { video_id: videoId });
      socket.off('analysis_complete');
      socket.off('analysis_failed');
    };
  }, [videoId]);
};

export default getSocket;
