import React from "react";
import KanbanBoard from "./components/KanbanBoard";
import TaskProgressChart from "./components/TaskProgressChart";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = 'http://localhost:5000';

function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    socket.on('tasks:synced', (syncedTasks) => {
      setTasks(syncedTasks);
    });

    socket.emit('sync:tasks');

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="App">
      <h1>⚡ Real-time Kanban Board</h1>
      <TaskProgressChart tasks={tasks} />
      <KanbanBoard />
    </div>
  );
}

export default App;
