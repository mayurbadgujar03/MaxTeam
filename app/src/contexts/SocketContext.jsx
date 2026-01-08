import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (socket?.connected) return;

    const apiUrl = import.meta.env.VITE_API_URL;
    let backendUrl = apiUrl || "http://localhost:8000";
    backendUrl = backendUrl.replace(/\/api(\/v1)?$/, "");

    const newSocket = io(backendUrl, {
      withCredentials: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    setSocket(newSocket);

    const handleConnect = () => {
      setIsConnected(true);
      if (user?._id) newSocket.emit("join_user", user._id);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (err) => {};

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("connect_error", handleConnectError);

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("connect_error", handleConnectError);
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, isLoading, user]);

  const joinProject = (projectId) => {
    if (socket && isConnected) socket.emit("join_project", projectId);
  };

  const joinUser = (userId) => {
    if (socket && isConnected) socket.emit("join_user", userId);
  };

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, joinProject, joinUser }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context)
    throw new Error("useSocket must be used within a SocketProvider");
  return context;
};
