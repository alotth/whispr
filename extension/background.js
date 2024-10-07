let mediaRecorder;
let socket;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("chrome.runtime.onMessag", request, sender, sendResponse);
  if (request.action === "startStreaming") {
    startStreaming();
  } else if (request.action === "stopStreaming") {
    stopStreaming();
  }
});

async function startStreaming() {
  console.log("Starting streaming...");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = async (event) => {
    if (event.data.size > 0) {
      const encryptedData = await encryptData(event.data);
      sendDataToServer(encryptedData);
    }
  };

  mediaRecorder.start(250); // Send data every 250ms
}

function stopStreaming() {
  console.log("Stopping streaming...");
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}

async function encryptData(audioBlob) {
  console.log("Encrypting audio data...");
  // Implementação da criptografia AES
  const key = await getEncryptionKey(); // Você deve definir como obter a chave
  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.onload = async () => {
      const arrayBuffer = reader.result;
      // Aqui você deve implementar a criptografia usando Web Crypto API ou outra biblioteca
      const encrypted = await aesEncrypt(arrayBuffer, key);
      resolve(encrypted);
    };
    reader.readAsArrayBuffer(audioBlob);
  });
}

function sendDataToServer(data) {
  console.log("Sending data to server...");
  // Aqui você deve implementar a lógica para enviar os dados criptografados para o seu servidor Python
  if (!socket) {
    socket = new WebSocket("ws://localhost:5000"); // Certifique-se de que o servidor esteja configurado para WebSockets
  }
  socket.send(data);
}

function aesEncrypt(data, key) {
  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.lib.WordArray.create(data),
    key
  );
  return encrypted.toString();
}
