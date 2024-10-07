import pyaudio
import wave
import threading
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64

def encrypt(text):
    key = b'1234567890123456'
    iv = b'1234567890123456'
    cipher = AES.new(key, AES.MODE_CBC, iv)
    return base64.b64encode(cipher.encrypt(pad(text, 16)))

def decrypt(text):
    key = b'1234567890123456'
    iv = b'1234567890123456'
    cipher = AES.new(key, AES.MODE_CBC, iv)
    return unpad(cipher.decrypt(base64.b64decode(text)), 16)

def list_audio_devices():
    p = pyaudio.PyAudio()
    input_devices = []
    output_devices = []
    
    for i in range(p.get_device_count()):
        device = p.get_device_info_by_index(i)
        if device['maxInputChannels'] > 0:
            input_devices.append((i, device['name']))
        if device['maxOutputChannels'] > 0:
            output_devices.append((i, device['name']))
    
    p.terminate()
    return input_devices, output_devices

def get_user_device_choice(devices, device_type):
    print(f"Select {device_type} device:")
    for index, name in devices:
        print(f"Device {index}: {name}")
    choice = int(input(f"Enter the device number for {device_type}: "))
    return choice

def send_audio(input_device_index):
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 44100
    p = pyaudio.PyAudio()
    stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True,
                    frames_per_buffer=CHUNK, input_device_index=input_device_index)

    while True:
        data = stream.read(CHUNK)
        encrypted_data = encrypt(data)
        # Send encrypted_data to the channel
        # print(f"Sent encrypted audio chunk: {encrypted_data}")
        print(f"Sent encrypted audio chunk")

def receive_audio(output_device_index):
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 44100
    p = pyaudio.PyAudio()
    stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, output=True,
                    output_device_index=output_device_index)

    while True:
        # Receive encrypted_data from the channel
        encrypted_data = b'...'  # This should be the actual received data
        decrypted_data = decrypt(encrypted_data)
        stream.write(decrypted_data)

if __name__ == '__main__':
    input_devices, output_devices = list_audio_devices()
    input_device_index = get_user_device_choice(input_devices, 'input')
    output_device_index = get_user_device_choice(output_devices, 'output')

    threading.Thread(target=send_audio, args=(input_device_index,)).start()
    threading.Thread(target=receive_audio, args=(output_device_index,)).start()
