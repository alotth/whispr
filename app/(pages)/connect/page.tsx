"use client";

// src/components/Connect.js
import React, { useEffect, useState, useRef } from "react";
import SimplePeer from "simple-peer";
import { decryptData, encryptData } from "../../utils/encryption";
import { getAudioStream } from "../../utils/getMediaStream";
import { usePeer } from "../../context/PeerContext";
import { useRouter } from "next/router";
import OrbitDB from "orbit-db";
import IPFS from "ipfs";

const Connect = () => {
  const router = useRouter();
  const { offerId, dbAddress, pwd } = router.query;
  const { addPeer } = usePeer();
  const [answerSignal, setAnswerSignal] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioDestination = useRef<MediaStreamAudioDestinationNode | null>(null);

  useEffect(() => {
    audioContext.current = new AudioContext();
    audioDestination.current =
      audioContext.current.createMediaStreamDestination();

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = audioDestination.current.stream;
    }

    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (offerId && dbAddress && pwd) {
      fetchOfferData(offerId as string, dbAddress as string, pwd as string);
    }
  }, [offerId, dbAddress, pwd]);

  const fetchOfferData = async (
    id: string,
    address: string,
    password: string
  ) => {
    const ipfs = await IPFS.create();
    const orbitdb = await OrbitDB.createInstance(ipfs);
    const offersDb = await orbitdb.keyvalue(address);
    await offersDb.load();

    const encryptedSignal = offersDb.get(id);
    if (encryptedSignal) {
      const signalData = decryptData(encryptedSignal, password);
      createAnswer(signalData);
    }
  };

  const createAnswer = (offerSignal: any) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
    });

    peer.on("signal", (data) => {
      setAnswerSignal(JSON.stringify(data));
    });

    peer.signal(offerSignal);
  };

  useEffect(() => {
    const handleSignal = async () => {
      const params = new URLSearchParams(window.location.search);
      const encryptedSignal = params.get("signal");

      if (encryptedSignal) {
        const signalData = decryptData(encryptedSignal);
        const stream = await getAudioStream();
        setLocalStream(stream);

        const peer = new SimplePeer({
          initiator: false,
          trickle: false,
          stream,
        });

        peer.on("signal", (data) => {
          const encryptedAnswer = encryptData(data);
          const url = `${window.location.origin}?signal=${encryptedAnswer}`;
          setAnswerURL(url);
        });

        peer.on("stream", (remoteStream) => {
          addRemoteStream(remoteStream);
        });

        peer.signal(signalData);
        addPeer(peer);
      }
    };

    handleSignal();
  }, [addPeer]);

  const addRemoteStream = (remoteStream: MediaStream) => {
    if (audioContext.current && audioDestination.current) {
      const source = audioContext.current.createMediaStreamSource(remoteStream);
      source.connect(audioDestination.current);
    }
  };

  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  return (
    <div>
      <h2>Connect</h2>
      {answerSignal ? (
        <div>
          <p>Send this URL back to the initiator:</p>
          <textarea
            value={answerSignal}
            readOnly
            rows={3}
            style={{ width: "100%" }}
          />
          <h3>Your Audio:</h3>
          <audio ref={localAudioRef} controls autoPlay />
          <h3>Channel Audio (All Peers):</h3>
          <audio ref={remoteAudioRef} controls autoPlay />
        </div>
      ) : (
        <p>Waiting for connection...</p>
      )}
    </div>
  );
};

export default Connect;
