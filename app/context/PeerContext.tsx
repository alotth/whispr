"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import Peer, { DataConnection, MediaConnection } from "peerjs";

interface PeerContextType {
  peer: Peer | null;
  connections: DataConnection[];
  mediaConnections: MediaConnection[];
  remoteStreams: MediaStream[];
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

interface PeerProviderProps {
  children: ReactNode;
}

export const PeerProvider: React.FC<PeerProviderProps> = ({ children }) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mediaConnections, setMediaConnections] = useState<MediaConnection[]>(
    []
  );
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);

  useEffect(() => {
    //const walletAddress = obterEnderecoCarteira(); // Implemente essa função conforme necessário

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const newPeer = new Peer(undefined, {
      host: "https://9000-peers-peerjsserver-q6xgn89im2s.ws-us116.gitpod.io",
      secure: true,
      port: 443,
    });

    setPeer(newPeer);

    newPeer.on("open", (id: string) => {
      console.log("Meu ID Peer:", id);
    });

    newPeer.on("connection", (conn: DataConnection) => {
      setConnections((prev) => [...prev, conn]);

      conn.on("data", (data: unknown) => {
        console.log("Dados recebidos:", data);
      });
    });

    newPeer.on("call", (call: MediaConnection) => {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream: MediaStream) => {
          call.answer(stream);
          call.on("stream", (remoteStream: MediaStream) => {
            setRemoteStreams((prev) => [...prev, remoteStream]);
          });
        })
        .catch((err: Error) => console.error("Erro ao acessar áudio:", err));
    });

    return () => {
      newPeer.destroy();
    };
  }, []);

  return (
    <PeerContext.Provider
      value={{ peer, connections, mediaConnections, remoteStreams }}
    >
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = (): PeerContextType => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error("usePeer deve ser usado dentro de um PeerProvider");
  }
  return context;
};
