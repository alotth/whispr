import socket
import threading
import pyaudio
from Crypto.Cipher import AES
from Crypto.Util import Counter
import base64
import sys

# Client Configuration
SERVER_HOST = '127.0.0.1'  # Change to server's IP if running remotely
SERVER_PORT = 3001
BUFFER_SIZE = 4096
CHANNEL_NAME = 'general'  # Default channel name

# AES Configuration
AES_KEY = b'1234567890123456'  # 16-byte key for AES-128
# Use a unique nonce for CTR; in production, ensure it's unique per session
CTR_NONCE = b'abcdefghijklmnop'  # 16-byte nonce

# Audio Configuration
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100
CHUNK = 1024

# Initialize AES Cipher for Encryption and Decryption
cipher_encrypt = AES.new(AES_KEY, AES.MODE_CTR, nonce=CTR_NONCE[:8], initial_value=int.from_bytes(CTR_NONCE[8:], byteorder='big'))
cipher_decrypt = AES.new(AES_KEY, AES.MODE_CTR, nonce=CTR_NONCE[:8], initial_value=int.from_bytes(CTR_NONCE[8:], byteorder='big'))

def send_audio(client_socket):
    p = pyaudio.PyAudio()
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)

    print("* Recording and sending audio... Press Ctrl+C to stop.")
    try:
        while True:
            data = stream.read(CHUNK)
            encrypted_data = cipher_encrypt.encrypt(data)
            client_socket.sendall(encrypted_data)
    except KeyboardInterrupt:
        print("\n[*] Stopped sending audio.")
    finally:
        stream.stop_stream()
        stream.close()
        p.terminate()
        client_socket.close()

def receive_audio(client_socket):
    p = pyaudio.PyAudio()
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    output=True,
                    frames_per_buffer=CHUNK)

    print("* Receiving and playing audio...")
    try:
        while True:
            data = client_socket.recv(BUFFER_SIZE)
            if not data:
                break
            decrypted_data = cipher_decrypt.decrypt(data)
            stream.write(decrypted_data)
    except KeyboardInterrupt:
        print("\n[*] Stopped receiving audio.")
    finally:
        stream.stop_stream()
        stream.close()
        p.terminate()
        client_socket.close()

def main():
    global CHANNEL_NAME
    if len(sys.argv) > 1:
        CHANNEL_NAME = sys.argv[1]

    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        client_socket.connect((SERVER_HOST, SERVER_PORT))
        # Send channel name to the server
        client_socket.sendall(CHANNEL_NAME.encode())
    except Exception as e:
        print(f"[!] Unable to connect to server: {e}")
        return

    # Start threads for sending and receiving audio
    send_thread = threading.Thread(target=send_audio, args=(client_socket,))
    receive_thread = threading.Thread(target=receive_audio, args=(client_socket,))

    send_thread.start()
    receive_thread.start()

    send_thread.join()
    receive_thread.join()

if __name__ == "__main__":
    main()
