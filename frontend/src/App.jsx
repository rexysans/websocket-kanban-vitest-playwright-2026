import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import KanbanBoard from "./components/KanbanBoard";
import TaskProgressChart from "./components/TaskProgressChart";

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [tasks, setTasks] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setLoading(false);
      setError(null);
      newSocket.emit('sync:tasks');
    });

    newSocket.on('tasks:synced', (syncedTasks) => {
      console.log('📋 Tasks synced:', syncedTasks.length);
      setTasks(syncedTasks);
    });

    newSocket.on('error', (errorData) => {
      console.error('❌ Server error:', errorData);
      setError(errorData.message);
    });

    newSocket.on('disconnect', () => {
      console.log('⚠️ Disconnected from server');
      setLoading(true);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err);
      setError('Failed to connect to server. Make sure the backend is running on port 5000.');
      setLoading(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <div className="App">
      <h1>⚡ Real-time Kanban Board</h1>
      <TaskProgressChart tasks={tasks} />
      <KanbanBoard 
        socket={socket}
        tasks={tasks}
        loading={loading}
        error={error}
      />
    </div>
  );
}

export default App;
