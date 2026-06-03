import { createContext, useContext } from "react";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  // WebSockets disabled in favor of REST + React Query polling
  const socket = null;
  const isConnected = false;

  const joinProject = (projectId) => {
    // No-op (Sockets disabled)
  };

  const joinUser = (userId) => {
    // No-op (Sockets disabled)
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
