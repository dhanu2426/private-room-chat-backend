// src/Chat.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [userJoined, setUserJoined] = useState(false);

  // Replace with your backend URL (Render or localhost)
  const serverURL = 'https://private-room-chat-backend-3.onrender.com'; // For Render
  // const serverURL = 'http://localhost:5005'; // For local development

  useEffect(() => {
    // Establish the socket connection when the component mounts
    const socketConnection = io(serverURL);
    setSocket(socketConnection);

    // Listen for incoming messages
    socketConnection.on('receive-message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Clean up the connection when the component unmounts
    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Join a room
  const handleJoinRoom = () => {
    if (socket && roomId && username) {
      socket.emit('join-room', { roomId, username, secret: 'mySecret' });
      setUserJoined(true);
    }
  };

  // Send a message
  const handleSendMessage = () => {
    if (socket && message) {
      socket.emit('send-message', { roomId, message, secret: 'mySecret' });
      setMessage('');
    }
  };

  return (
    <div>
      <h1>Private Room Chat</h1>

      {/* If the user is not in a room, show the room join form */}
      {!userJoined ? (
        <div>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="text"
            placeholder="Enter room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <h3>You're in room: {roomId}</h3>

          {/* Input for typing a message */}
          <input
            type="text"
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={handleSendMessage}>Send</button>

          {/* Displaying received messages */}
          <div>
            <h2>Messages:</h2>
            <ul>
              {messages.map((msg, index) => (
                <li key={index}>
                  <strong>{msg.username}:</strong> {msg.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
