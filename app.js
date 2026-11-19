const $ = (id) => document.getElementById(id);
const conversation = $("conversation");
const state = $("state");
const micButton = $("micButton");
const micLabel = $("micLabel");
const input = $("textInput");

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


function speak(text) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.92;
  utterance.pitch = 0.85;

  const voices = window.speechSynthesis.getVoices();

  const ptVoices = voices.filter(v =>
    v.lang && v.lang.toLowerCase().startsWith("pt-br")
  );

  const maleVoice = ptVoices.find(v =>
    /male|masculino|daniel/i.test(v.name)
  );

  if (maleVoice) {
    utterance.voice = maleVoice;
  } else if (ptVoices.length > 0) {
    utterance.voice = ptVoices[0];
  }

  window.speechSynthesis.speak(utterance);
}

  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.96;
  utterance.pitch = 0.88;
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("pt-br"));
  if (ptVoice) utterance.voice = ptVoice;
  window.speechSynthesis.speak(utterance);
}

function answerFor(raw) {
  const q = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (q.includes("que horas") || q.includes("hora")) {
    return `Agora são ${new Date().toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"})}.`;
  }
  if (q.includes("que dia") || q.includes("data de hoje") || q.includes("data")) {
    return `Hoje é ${new Date().toLocaleDateString("pt-BR", {weekday:"long", day:"numeric", month:"long", year:"numeric"})}.`;
  }
  if (q.includes("quem e voce") || q.includes("quem e o jarvis")) {
    return "Sou o JARVIS, seu assistente pessoal em desenvolvimento. Esta é minha primeira versão de testes.";
  }
  if (q.includes("ajuda") || q.includes("comandos")) {
    return "Por enquanto posso informar hora e data, explicar quem sou e testar minha voz. Minha conexão com inteligência artificial será adicionada numa próxima etapa.";
  }
  if (q.includes("ola") || q.includes("oi") || q.includes("bom dia")) {
    return "Olá! Estou funcionando. Ainda estou aprendendo e recebendo novos módulos.";
  }
  if (q.includes("parar de falar") || q.includes("silencio")) {
    window.speechSynthesis?.cancel();
    return "Certo. Interrompi a fala.";
  }
  return "Recebi seu comando. Nesta versão de testes ainda não estou conectado a um modelo de inteligência artificial. Podemos adicionar esse recurso na próxima etapa.";
}

function handleCommand(text) {
  const clean = text.trim();
  if (!clean) return;
  addMessage("user", clean);
  const answer = answerFor(clean);
  addMessage("jarvis", answer);
  speak(answer);
}

$("textForm").addEventListener("submit", (event) => {
  event.preventDefault();
  handleCommand(input.value);
  input.value = "";
});

document.querySelectorAll("[data-command]").forEach(button => {
  button.addEventListener("click", () => handleCommand(button.dataset.command));
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
    addMessage("jarvis", `Não consegui reconhecer a fala (${event.error}). Verifique a permissão do microfone e tente novamente.`);
  };
  recognition.onend = () => {
    state.textContent = "AGUARDANDO";
    micLabel.textContent = "TOQUE PARA FALAR";
    micButton.classList.remove("listening");
  };
} else {
  $("supportNote").textContent = "Este navegador não oferece reconhecimento de voz. Use o Chrome atualizado ou digite seus comandos.";
  micButton.disabled = true;
  micButton.style.opacity = ".5";
}

micButton.addEventListener("click", () => {
  if (!recognition) return;
  try { window.speechSynthesis?.cancel(); recognition.start(); }
  catch (error) { addMessage("jarvis", "O microfone já está ativo. Aguarde um instante e tente novamente."); }
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
