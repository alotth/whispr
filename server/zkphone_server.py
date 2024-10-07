from websocket_server import WebsocketServer
import base64


def new_client(client, server):
    print(f"Cliente {client['id']} conectado.")


def message_received(client, server, message):
    # Decodifica os dados de áudio e salve ou processe conforme necessário
    audio_data = base64.b64decode(message)
    with open("received_audio.wav", "wb") as f:
        f.write(audio_data)
    print("Dados de áudio recebidos.")


server = WebsocketServer(host='0.0.0.0', port=5000)
server.set_fn_new_client(new_client)
server.set_fn_message_received(message_received)
server.run_forever()
