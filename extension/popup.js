async function startAudioStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Use the stream for audio processing or sending it to the server
    console.log("Microphone access granted");
    // For example, you can now use this stream in a Web Audio API context or send it over WebSockets
  } catch (error) {
    console.error("Error accessing the microphone:", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded");

  // Call the function to start the audio stream when needed
  const startButton = document.getElementById("startButton");
  if (startButton) {
    startButton.addEventListener("click", () => {
      console.log("Iniciando o streaming...");
      startAudioStream(); // Call the audio stream function
    });
  } else {
    console.error("startButton not found in the DOM");
  }
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
