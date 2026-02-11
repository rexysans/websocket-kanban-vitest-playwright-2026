const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: "*",
    methods: ["GET", "POST"]
  } 
});

// In-memory task storage
let tasks = [];

// Helper function to validate task data
const validateTask = (task) => {
  if (!task.title || typeof task.title !== 'string') {
    return { valid: false, error: 'Title is required and must be a string' };
  }
  
  const validStatuses = ['todo', 'inProgress', 'done'];
  if (task.status && !validStatuses.includes(task.status)) {
    return { valid: false, error: 'Invalid status. Must be todo, inProgress, or done' };
  }
  
  const validPriorities = ['Low', 'Medium', 'High'];
  if (task.priority && !validPriorities.includes(task.priority)) {
    return { valid: false, error: 'Invalid priority. Must be Low, Medium, or High' };
  }
  
  const validCategories = ['Bug', 'Feature', 'Enhancement'];
  if (task.category && !validCategories.includes(task.category)) {
    return { valid: false, error: 'Invalid category. Must be Bug, Feature, or Enhancement' };
  }
  
  return { valid: true };
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send all current tasks to newly connected client
  socket.emit('tasks:synced', tasks);

  // Event: Create a new task
  socket.on('task:create', (taskData) => {
    try {
      const validation = validateTask(taskData);
      if (!validation.valid) {
        socket.emit('error', { message: validation.error });
        return;
      }

      const newTask = {
        id: uuidv4(),
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'Medium',
        category: taskData.category || 'Feature',
        attachments: taskData.attachments || [],
        createdAt: new Date().toISOString()
      };

      tasks.push(newTask);
      
      // Broadcast to all clients including sender
      io.emit('tasks:synced', tasks);
      console.log(`Task created: ${newTask.id} - ${newTask.title}`);
    } catch (error) {
      console.error('Error creating task:', error);
      socket.emit('error', { message: 'Failed to create task' });
    }
  });

  // Event: Update an existing task
  socket.on('task:update', (updateData) => {
    try {
      const { id, ...updates } = updateData;
      
      if (!id) {
        socket.emit('error', { message: 'Task ID is required' });
        return;
      }

      const taskIndex = tasks.findIndex(t => t.id === id);
      
      if (taskIndex === -1) {
        socket.emit('error', { message: 'Task not found' });
        return;
      }

      // Validate updates
      const updatedTask = { ...tasks[taskIndex], ...updates };
      const validation = validateTask(updatedTask);
      if (!validation.valid) {
        socket.emit('error', { message: validation.error });
        return;
      }

      tasks[taskIndex] = updatedTask;
      
      // Broadcast to all clients
      io.emit('tasks:synced', tasks);
      console.log(`Task updated: ${id}`);
    } catch (error) {
      console.error('Error updating task:', error);
      socket.emit('error', { message: 'Failed to update task' });
    }
  });

  // Event: Move task between columns (change status)
  socket.on('task:move', (moveData) => {
    try {
      const { id, status } = moveData;
      
      if (!id || !status) {
        socket.emit('error', { message: 'Task ID and status are required' });
        return;
      }

      const validStatuses = ['todo', 'inProgress', 'done'];
      if (!validStatuses.includes(status)) {
        socket.emit('error', { message: 'Invalid status' });
        return;
      }

      const taskIndex = tasks.findIndex(t => t.id === id);
      
      if (taskIndex === -1) {
        socket.emit('error', { message: 'Task not found' });
        return;
      }

      tasks[taskIndex].status = status;
      
      // Broadcast to all clients
      io.emit('tasks:synced', tasks);
      console.log(`Task moved: ${id} -> ${status}`);
    } catch (error) {
      console.error('Error moving task:', error);
      socket.emit('error', { message: 'Failed to move task' });
    }
  });

  // Event: Delete a task
  socket.on('task:delete', (taskId) => {
    try {
      if (!taskId) {
        socket.emit('error', { message: 'Task ID is required' });
        return;
      }

      const taskIndex = tasks.findIndex(t => t.id === taskId);
      
      if (taskIndex === -1) {
        socket.emit('error', { message: 'Task not found' });
        return;
      }

      tasks.splice(taskIndex, 1);
      
      // Broadcast to all clients
      io.emit('tasks:synced', tasks);
      console.log(`Task deleted: ${taskId}`);
    } catch (error) {
      console.error('Error deleting task:', error);
      socket.emit('error', { message: 'Failed to delete task' });
    }
  });

  // Event: Request task sync (useful for reconnections)
  socket.on('sync:tasks', () => {
    socket.emit('tasks:synced', tasks);
    console.log(`Tasks synced for client: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// REST endpoint to get tasks (for testing/debugging)
app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// REST endpoint to reset tasks (for testing)
app.post('/api/tasks/reset', (req, res) => {
  tasks = [];
  io.emit('tasks:synced', tasks);
  res.json({ message: 'Tasks reset successfully' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready for connections`);
});

module.exports = { app, server, io };
