"use client";

import React, { createContext, useState, ReactNode, useContext } from "react";
import SimplePeer from "simple-peer";

interface PeerContextType {
  peers: SimplePeer.Instance[];
  addPeer: (peer: SimplePeer.Instance) => void;
}

export const PeerContext = createContext<PeerContextType | undefined>(undefined);

export const PeerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [peers, setPeers] = useState<SimplePeer.Instance[]>([]);

  const addPeer = (peer: SimplePeer.Instance) => {
    setPeers(prevPeers => [...prevPeers, peer]);
  };

  return (
    <PeerContext.Provider value={{ peers, addPeer }}>
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error("usePeer must be used within a PeerProvider");
  }
  return context;
};
