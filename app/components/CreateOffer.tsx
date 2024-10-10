"use client";

import { useState, useRef, useEffect } from "react";
import { getAudioStream } from "../utils/getMediaStream";
import { encryptData, decryptData } from "../utils/encryption";
import SimplePeer from "simple-peer";
import { usePeer } from "../context/PeerContext";
import { v4 as uuidv4 } from "uuid";
import OrbitDB from "orbit-db";
import IPFS from "ipfs";

// Function to generate a random password
const generateRandomPassword = (length: number = 16) => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
  return Array.from(crypto.getRandomValues(new Uint32Array(length)))
    .map((x) => charset[x % charset.length])
    .join("");
};

const CreateOffer = () => {
  const { peers, addPeer } = usePeer();
  const [offerURLs, setOfferURLs] = useState<string[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioDestination = useRef<MediaStreamAudioDestinationNode | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [offerMap, setOfferMap] = useState<Record<string, any>>({});
  const [orbitdb, setOrbitdb] = useState<any>(null);
  const [offersDb, setOffersDb] = useState<any>(null);

  useEffect(() => {
    const initOrbitDB = async () => {
      const ipfs = await IPFS.create();
      const orbit = await OrbitDB.createInstance(ipfs);
      setOrbitdb(orbit);
      const offers = await orbit.keyvalue("offers");
      setOffersDb(offers);
    };
    initOrbitDB();
  }, []);

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

  const createOffer = async () => {
    const stream = await getAudioStream();
    setLocalStream(stream);

    const newPeer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    newPeer.on("signal", async (data) => {
      const offerId = uuidv4().slice(0, 8); // generate a unique hash to be the id in orbit
      const password = generateRandomPassword();
      const encryptedSignal = encryptData(JSON.stringify(data), password);

      // Store in OrbitDB
      await offersDb.put(offerId, encryptedSignal);

      const url = `${window.location.origin}/connect/$${
        offersDb.address
      }?pwd=${encodeURIComponent(password)}`;
      setOfferURLs((prev) => [...prev, url]);
    });

    newPeer.on("stream", (remoteStream) => {
      addRemoteStream(remoteStream);
    });

    addPeer(newPeer);
  };

  const addRemoteStream = (remoteStream: MediaStream) => {
    if (audioContext.current && audioDestination.current) {
      const source = audioContext.current.createMediaStreamSource(remoteStream);
      source.connect(audioDestination.current);
    }
  };

  const handleAnswerInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswerInput(event.target.value);
  };

  const finalizeConnection = () => {
    const urlParams = new URLSearchParams(answerInput.split("?")[1]);
    const encryptedSignal = urlParams.get("signal");
    const password = urlParams.get("pwd");
    if (encryptedSignal && password) {
      const signalData = decryptData(encryptedSignal, password);
      const lastPeer = peers[peers.length - 1];
      if (lastPeer) {
        lastPeer.signal(signalData);
      }
    }
    setAnswerInput("");
  };

  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  function copyToClipboard(url: string): void {
    navigator.clipboard.writeText(url);
  }

  return (
    <div>
      <h2>Create Offer</h2>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-md"
        onClick={createOffer}
      >
        Create Offer
      </button>
      {offerURLs.length > 0 && (
        <div>
          <p>Share these URLs with your peers:</p>
          {offerURLs.map((url, index) => (
            <>
              <button
                id="copy-button"
                className="bg-green-500 text-white px-4 py-2 rounded-md"
                onClick={() => copyToClipboard(url)}
              >
                Copy
              </button>
              <textarea
                key={index}
                value={url}
                readOnly
                rows={3}
                style={{ width: "100%", marginBottom: "10px" }}
              />
            </>
          ))}
          <h3>Your Audio:</h3>
          <audio ref={localAudioRef} controls autoPlay />
          <h3>Channel Audio (All Peers):</h3>
          <audio ref={remoteAudioRef} controls autoPlay />
          <h3>Finalize Connection:</h3>
          <textarea
            value={answerInput}
            onChange={handleAnswerInput}
            placeholder="Paste the answer URL here"
            rows={3}
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md"
            onClick={finalizeConnection}
          >
            Finalize Connection
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateOffer;
