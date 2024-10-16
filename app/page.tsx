"use client";

import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";

export default function Home() {
  const [peerId, setPeerId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerInstance = useRef<Peer | null>(null);

  useEffect(() => {
    //   // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //   // @ts-expect-error
    //   const newPeer = new Peer(undefined, {
    //     host: "https://9000-peers-peerjsserver-q6xgn89im2s.ws-us116.gitpod.io",
    //     secure: true,
    //     port: 443,
    //   });
    const peer = new Peer();

    peer.on("open", (id) => {
      setPeerId(id);
    });

    peer.on("call", (call) => {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          call.answer(stream);
          call.on("stream", (remoteStream) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              remoteAudioRef.current
                .play()
                .catch((e) => console.error("Error playing remote audio:", e));
            }
          });
        })
        .catch((err) => console.error("Error accessing audio:", err));
    });

    peerInstance.current = peer;

    return () => peer.destroy();
  }, []);

  const callPeer = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
          localAudioRef.current
            .play()
            .catch((e) => console.error("Error playing local audio:", e));
        }

        const call = peerInstance.current?.call(remoteId, stream);
        if (call) {
          call.on("stream", (remoteStream) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = remoteStream;
              remoteAudioRef.current
                .play()
                .catch((e) => console.error("Error playing remote audio:", e));
            } else {
              console.error("Remote audio element not initialized");
            }
          });
        } else {
          console.error("Failed to create call");
        }
      })
      .catch((err) => console.error("Error accessing audio:", err));
  };

  return (
    <div>
      <h1>Audio Streaming with PeerJS</h1>
      <p>Your Peer ID: {peerId}</p>
      <input
        type="text"
        placeholder="ID do Peer Remoto"
        value={remoteId}
        onChange={(e) => setRemoteId(e.target.value)}
      />
      <button onClick={callPeer}>Call Peer</button>
      <div>
        <h2>Local</h2>
        <audio ref={localAudioRef} controls />
      </div>
      <div>
        <h2>Remoto</h2>
        <audio ref={remoteAudioRef} controls />
      </div>
    </div>
  );
}
