import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const joinRoom = () => {
    if (roomId && username) navigate(`/chat/${roomId}`, { state: { username } });
  };

  return (
    <div>
      <h1>Private Room Chat</h1>
      <input
        type="text"
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>
    </div>
  );
};

export default Home;
