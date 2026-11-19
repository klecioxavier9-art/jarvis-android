
const $ = (id) => document.getElementById(id);

const conversation = $("conversation");
const state = $("state");
const micButton = $("micButton");
const micLabel = $("micLabel");
const input = $("textInput");

const API_URL = "https://jarvis-android-g5i4.onrender.com/chat";

// Histórico das conversas durante a sessão
let chatHistory = [];

function addMessage(who, text) {
  const item = document.createElement("div");
  item.className = `msg ${who}`;

  const label = document.createElement("b");
  label.textContent = who === "user" ? "VOCÊ" : "JARVIS";

  const body = document.createElement("p");
  body.textContent = text;

  item.append(label, body);
  conversation.appendChild(item);
  conversation.scrollTop = conversation.scrollHeight;
}

function saveHistory(userMessage, assistantMessage) {
  chatHistory.push(
    { role: "user", content: userMessage },
    { role: "assistant", content: assistantMessage }
  );

  chatHistory = chatHistory.slice(-12);
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.85;
  utterance.pitch = 0.75;

  window.speechSynthesis.speak(utterance);
}

function answerLocal(raw) {
  const q = raw.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (q.includes("parar de falar") || q.includes("silencio")) {
    window.speechSynthesis?.cancel();
    return "Certo. Interrompi a fala.";
  }

  if (q.includes("que horas") || q.includes("hora")) {
    return `Agora são ${new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })}.`;
  }

  if (q.includes("que dia") || q.includes("data de hoje") || q.includes("data")) {
    return `Hoje é ${new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    })}.`;
  }

  return null;
}

async function handleCommand(text) {
  const clean = text.trim();
  if (!clean) return;

  addMessage("user", clean);

  const localAnswer = answerLocal(clean);

if (localAnswer) {
    addMessage("jarvis", localAnswer);
    saveHistory(clean, localAnswer);

    const normalized = clean.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (
      !normalized.includes("parar de falar") &&
      !normalized.includes("silencio")
    ) {
      speak(localAnswer);
    }

    return;
}

  state.textContent = "PROCESSANDO";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: clean,
        history: chatHistory.slice(-12)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Erro ao consultar a inteligência artificial."
      );
    }

    const answer = data.reply || "Não recebi uma resposta válida.";

    addMessage("jarvis", answer);
    saveHistory(clean, answer);
    speak(answer);

  } catch (error) {
    addMessage(
      "jarvis",
      "Não consegui acessar minha inteligência artificial. Verifique sua conexão e tente novamente. Detalhe: " + error.message
    );
  } finally {
    state.textContent = "AGUARDANDO";
  }
}

$("textForm").addEventListener("submit", (event) => {
  event.preventDefault();
  handleCommand(input.value);
  input.value = "";
});

document.querySelectorAll("[data-command]").forEach(button => {
  button.addEventListener("click", () => {
    handleCommand(button.dataset.command);
  });
});

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    state.textContent = "OUVINDO";
    micLabel.textContent = "ESTOU OUVINDO...";
    micButton.classList.add("listening");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    handleCommand(transcript);
  };

  recognition.onerror = (event) => {
    state.textContent = "ERRO DE MICROFONE";
    addMessage(
      "jarvis",
      `Não consegui reconhecer a fala (${event.error}). Verifique a permissão do microfone e tente novamente.`
    );
  };

  recognition.onend = () => {
    state.textContent = "AGUARDANDO";
    micLabel.textContent = "TOQUE PARA FALAR";
    micButton.classList.remove("listening");
  };

} else {
  $("supportNote").textContent =
    "Este navegador não oferece reconhecimento de voz. Use o Chrome atualizado ou digite seus comandos.";

  micButton.disabled = true;
  micButton.style.opacity = ".5";
}

micButton.addEventListener("click", () => {
  if (!recognition) return;

  try {
    window.speechSynthesis?.cancel();
    recognition.start();
  } catch (error) {
    addMessage(
      "jarvis",
      "O microfone já está ativo. Aguarde um instante e tente novamente."
    );
  }
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
