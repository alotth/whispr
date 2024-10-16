import { useEffect, useRef } from "react";
import { usePeer } from "../context/PeerContext";

const AudioStream = () => {
  const { peer, connections } = usePeer();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (audioRef.current) {
          audioRef.current.srcObject = stream;
          audioRef.current.play();
        }
        // Enviar o stream para todos os peers conectados
        connections.forEach((conn: { peer: string }) => {
          if (peer) {
            const call = peer.call(conn.peer, stream);
            call.on("stream", (remoteStream: MediaStream) => {
              // Lógica para reproduzir o stream remoto
              console.log("remoteStream", remoteStream);
            });
          } else {
            console.error("Peer não inicializado");
          }
        });
      })
      .catch((err) => console.error("Erro ao acessar áudio:", err));
  }, [peer, connections]);

  return <audio ref={audioRef} controls />;
};

export default AudioStream;
