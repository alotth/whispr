async function startAudioStream() {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(function (stream) {
          // Microphone access granted
          console.log("Microphone access granted");
          //chrome.runtime.sendMessage({ action: "startStreaming" });
          mediaRecorder = new MediaRecorder(stream);

          mediaRecorder.ondataavailable = async (event) => {
            console.log("ondataavailable");
            console.log(event.data.size, "event.data.size");
            if (event.data.size > 0) {
              console.log("event.data", event.data);
              const encryptedData = await encryptData(event.data);
              console.log("encryptedData", encryptedData);
              //sendDataToServer(encryptedData);
              console.log("Sending data to server...");
              // Aqui você deve implementar a lógica para enviar os dados criptografados para o seu servidor Python
              if (!socket) {
                socket = new WebSocket("ws://localhost:3001"); // Certifique-se de que o servidor esteja configurado para WebSockets
              }
              socket.send(data);
            }
          };

          mediaRecorder.start(250); // Send data every 250ms
        })
        .catch(function (err) {
          console.error("Error accessing the microphone:", err);
          if (err.name === "NotAllowedError") {
            alert("Please allow microphone access.");
          }
        });
    } else {
      console.error("Not found navigator.mediaDevices");
    }
  } catch (error) {
    console.error("Error accessing the microphone:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded");

  // Call the function to start the audio stream when needed
  document.getElementById("start").addEventListener("click", () => {
    console.log("Iniciando o streaming...");
    startAudioStream(); // Call the audio stream function
  });

  //document
  //.getElementById("startButton")
  //.addEventListener("click", () => {
  // console.log("Iniciando o streaming...");
  //chrome.runtime.sendMessage({ action: "startStreaming" });
  //startAudioStream()}
  //});

  document.getElementById("stop").addEventListener("click", () => {
    console.log("Parando o streaming...");
    ///chrome.runtime.sendMessage({ action: "stopStreaming" });
  });
});

async function encryptData(audioBlob) {
  console.log("Encrypting audio data...");
  // Implementação da criptografia AES
  //const key = await getEncryptionKey(); // Você deve definir como obter a chave
  const key = CryptoJS.enc.Hex.parse("0123456789abcdef0123456789abcdef"); // Exemplo de chave fixa AES

  const reader = new FileReader();

  return new Promise((resolve) => {
    reader.onload = async () => {
      const arrayBuffer = reader.result;
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
      const encrypted = CryptoJS.AES.encrypt(wordArray, key); // Criptografa os dados
      resolve(encrypted.toString());
    };
    reader.readAsArrayBuffer(audioBlob);
  });
}

function sendDataToServer(data) {
  console.log("Sending data to server...");
  // Aqui você deve implementar a lógica para enviar os dados criptografados para o seu servidor Python
  if (!socket) {
    socket = new WebSocket("ws://localhost:3001"); // Certifique-se de que o servidor esteja configurado para WebSockets
  }
  socket.send(data);
}

function aesEncrypt(data, key) {
  console.log("aesEncrypt", data, key);
  const encrypted = CryptoJS.AES.encrypt(
    CryptoJS.lib.WordArray.create(data),
    key
  );
  return encrypted.toString();
}

async function getEncryptionKey() {
  // Uma chave AES de 256 bits (32 bytes) gerada de forma estática para testes

  const key = await crypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256, // Usa 256 bits para a chave AES
    },
    true, // A chave pode ser exportada
    ["encrypt", "decrypt"]
  );
  return key;
}
