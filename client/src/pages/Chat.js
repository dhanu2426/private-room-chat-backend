import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const Chat = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const { username } = location.state;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const secret = 'securesecret';

  useEffect(() => {
    socket.emit('join-room', { roomId, username, secret });
    socket.on('receive-message', (data) => setMessages((prev) => [...prev, data]));
    return () => socket.disconnect();
  }, [roomId, username]);

  const sendMessage = () => {
    socket.emit('send-message', { roomId, message, secret });
    setMessages((prev) => [...prev, { username, message }]);
    setMessage('');
  };

  return (
    <div>
      <h2>Room: {roomId}</h2>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.username}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chat;
