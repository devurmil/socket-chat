import { useEffect, useState } from "react";
import socket from "./socket";

export default function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [privateTo, setPrivateTo] = useState("");
  const [privateMessages, setPrivateMessages] = useState([]);

  useEffect(() => {
    socket.on("users", setUsers);
    socket.on("typing", setTypingUser);
    socket.on("stopTyping", () => setTypingUser(""));

    socket.on("connect", () => {
      setMessages(prev => [
        ...prev,
        {user: "System", text: "Socket connected" }
      ]);
    });

    socket.on("message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("privateMessage", (data) => {
      setPrivateMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off("connect");
      socket.off("message");
      socket.off("users");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("privateMessage");
    } 
  }, []);

  const joinRoom = () => {
    console.log("JOIN CLICKED", username, room);
    socket.emit("join", { username, room });
    setMessages([]);
    setJoined(true);
  };

  const sendMessage = () => {
    socket.emit("sendMessage", message);
    setMessage("");
  };

  const sendPrivateMessage = () => {
    if (!privateTo || !message) return;

    socket.emit("privateMessage", {
      to: privateTo,
      text: message,
    });

    setPrivateMessages(prev => [
      ...prev,
      {from: "Me", text: message }
    ]);

    setMessage("");
  };

  if (!joined) {
    return (
      <div>
        <h2>Join Chat</h2>
        <input placeholder="Username" onChange={e => setUsername(e.target.value)} />
        <input placeholder="Room" onChange={e => setRoom(e.target.value)} />
        <button onClick={joinRoom}>Join</button>
      </div>
    );
  }

  const handleKeyDown = (event) => {
    // Check if the pressed key is "Enter"
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default behavior (like adding a newline in some cases)
      sendMessage();
    }
  }

  return (
    <div>
      <h2>Room: {room}</h2>
      <h4>Online Users</h4>
      <ul>
        {users.map((u, i) => <li key={i}>{u}</li>)}
      </ul>

      <h3>Private Chat</h3>
      <input
        placeHolder="Send to username"
        value={privateTo}
        onChange={(e) => setPrivateTo(e.target.value)}
      />

      <button onClick={sendPrivateMessage}>Send Private</button>
      
      <ul>
        {privateMessages.map((pm, i) => (
          <li key={i}>
            <b>{pm.from}</b>: {pm.text}
          </li>
        ))}
      </ul>
      
      {typingUser && <p>{typingUser} is typing...</p>}

      <ul>
        {Array.isArray(messages) &&
          messages
          .filter(m => m && m.text)
          .map((m, i) => (
            <li key={i}>
              <b>{m.user}</b>: {m.text}
            </li>
          ))}
      </ul>
      <input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          socket.emit("typing");
          setTimeout(() => socket.emit("stopTyping"), 2000);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
