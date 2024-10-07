import socket
import threading

# Server Configuration
SERVER_HOST = '0.0.0.0'  # Listen on all interfaces
SERVER_PORT = 3001
BUFFER_SIZE = 4096

# Channel Management
channels = {}  # channel_name: set of client sockets
lock = threading.Lock()

def handle_client(client_socket, addr):
    print(f"[+] New connection from {addr}")
    current_channel = None
    try:
        while True:
            # First message should be the channel name
            if not current_channel:
                channel_name = client_socket.recv(BUFFER_SIZE).decode()
                if not channel_name:
                    break
                with lock:
                    if channel_name not in channels:
                        channels[channel_name] = set()
                    channels[channel_name].add(client_socket)
                current_channel = channel_name
                print(f"[+] {addr} joined channel '{channel_name}'")
                continue

            # Receive encrypted audio data
            data = client_socket.recv(BUFFER_SIZE)
            if not data:
                break

            # Relay data to other clients in the same channel
            with lock:
                for client in channels[current_channel]:
                    if client != client_socket:
                        try:
                            client.sendall(data)
                        except:
                            pass  # Handle broken connections elsewhere
    except Exception as e:
        print(f"[!] Error with client {addr}: {e}")
    finally:
        # Clean up
        if current_channel:
            with lock:
                channels[current_channel].remove(client_socket)
                if len(channels[current_channel]) == 0:
                    del channels[current_channel]
            print(f"[-] {addr} left channel '{current_channel}'")
        client_socket.close()

def start_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind((SERVER_HOST, SERVER_PORT))
    server.listen(5)
    print(f"[*] Listening on {SERVER_HOST}:{SERVER_PORT}")

    try:
        while True:
            client_socket, addr = server.accept()
            client_handler = threading.Thread(target=handle_client, args=(client_socket, addr))
            client_handler.start()
    except KeyboardInterrupt:
        print("\n[*] Shutting down server.")
    finally:
        server.close()

if __name__ == "__main__":
    start_server()
