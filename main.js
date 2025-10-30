// ===============================
// TRANSLATION CHAT APP (via Cloudflare Worker)
// ===============================

const translateBtn = document.querySelector(".translate-btn");
const userInput = document.querySelector(".user-input");
const appBody = document.querySelector(".app-body");

let conversationHistory = null;
let selectedLang = null;
let chatDiv = null;
let chatInput = null;
let chatBtn = null;

// ========== MAIN TRANSLATE BUTTON HANDLER ==========

translateBtn.addEventListener("click", async function () {
  if (translateBtn.textContent === "Start Over") {
    resetApp();
    return;
  }

  const prompt = userInput.value.trim();
  selectedLang = document.querySelector('input[name="language"]:checked')?.value;

  if (!prompt) {
    alert("Please enter text to translate.");
    return;
  }
  if (!selectedLang) {
    alert("Please select a language.");
    return;
  }

  translateBtn.textContent = "Translating...";
  translateBtn.disabled = true;

  // Prepare conversation context
  conversationHistory = [
    {
      role: "system",
      content: `You are a translation assistant and chatbot. Translate all user inputs and respond in ${selectedLang}.`,
    },
    { role: "user", content: prompt },
  ];

  // Fetch first translation from the Worker
  const translation = await fetchChatResponse(conversationHistory);

  // Display chat interface with translation
  showChatInterface(prompt, translation);
});

// ========== FETCH FUNCTION USING CLOUDFLARE WORKER ==========

async function fetchChatResponse(messagesArray) {
  try {
    const url = "https://trad-app.jeremie-inkura.workers.dev";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagesArray),
    });

    const data = await response.json();
    console.log("Response JSON:", data);

    if (!response.ok) {
      throw new Error(`Worker Error: ${data.error || "Unknown error"}`);
    }

    // Expecting your Worker to return: { "response": "Translated text" }
    return data.response || data.content || "";
  } catch (err) {
    console.error("Error fetching translation:", err.message);
    alert("Unable to reach translation service. Please try again.");
    return "";
  }
}

// ========== CHAT INTERFACE SETUP ==========

function showChatInterface(initialPrompt, firstTranslation) {
  document.querySelector(".to-translate-title-text").innerText = "Conversation";
  document.querySelector(".to-select").style.display = "none";
  userInput.style.display = "none";

  // Remove any previous chat elements
  document
    .querySelectorAll(".your-translation, .chat-feed, .chat-input-wrapper")
    .forEach((el) => el?.remove());

  // Main chat feed
  chatDiv = document.createElement("div");
  chatDiv.className = "chat-feed";
  chatDiv.innerHTML = `
    <div class="original-textarea-wrapper">
      <textarea class="original-msg" readonly>${escapeHTML(initialPrompt)}</textarea>
    </div>
    <div class="chat-bubble bot-msg">${escapeHTML(firstTranslation)}</div>
  `;

  // Chat input + button
  chatInput = document.createElement("textarea");
  chatInput.className = "chat-input";
  chatInput.placeholder = "Type a message and click Chat!";
  chatInput.rows = 2;
  chatInput.style.display = "block";
  chatInput.style.margin = "1rem auto 0 auto";

  chatBtn = document.createElement("button");
  chatBtn.className = "chat-btn";
  chatBtn.textContent = "Chat";
  chatBtn.style.display = "block";
  chatBtn.style.margin = ".3rem auto 1rem auto";
  chatBtn.style.width = "100%";

  const chatInputWrapper = document.createElement("div");
  chatInputWrapper.className = "chat-input-wrapper";
  chatInputWrapper.style.width = "100%";
  chatInputWrapper.appendChild(chatInput);
  chatInputWrapper.appendChild(chatBtn);

  // Insert elements into app body
  appBody.insertBefore(chatDiv, translateBtn);
  appBody.insertBefore(chatInputWrapper, translateBtn);

  // Chat button event
  chatBtn.onclick = async function () {
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;

    const userBubble = document.createElement("div");
    userBubble.className = "chat-bubble user-msg";
    userBubble.textContent = userMsg;
    chatDiv.appendChild(userBubble);
    chatDiv.scrollTop = chatDiv.scrollHeight;

    chatBtn.disabled = true;
    chatBtn.textContent = "Replying...";

    conversationHistory.push({ role: "user", content: userMsg });

    const reply = await fetchChatResponse(conversationHistory);

    chatBtn.disabled = false;
    chatBtn.textContent = "Chat";
    chatInput.value = "";

    if (!reply) {
      const warnBubble = document.createElement("div");
      warnBubble.className = "chat-bubble bot-msg language-warning";
      warnBubble.textContent = "Sorry, something went wrong.";
      chatDiv.appendChild(warnBubble);
    } else {
      addMessageToChat("assistant", reply);
      const botBubble = document.createElement("div");
      botBubble.className = "chat-bubble bot-msg";
      botBubble.textContent = reply;
      chatDiv.appendChild(botBubble);
    }

    chatDiv.scrollTop = chatDiv.scrollHeight;
  };

  translateBtn.textContent = "Start Over";
  translateBtn.disabled = false;
}

// ========== SUPPORTING FUNCTIONS ==========

function addMessageToChat(role, message) {
  if (!conversationHistory) return;
  conversationHistory.push({ role, content: message });
}

function resetApp() {
  document.querySelector(".to-translate-title-text").innerText =
    "Text to translate 👇";
  document.querySelector(".to-select").style.display = "block";

  userInput.value = "";
  userInput.placeholder = "How are you?";
  userInput.style.display = "block";

  [".your-translation", ".chat-feed", ".chat-input-wrapper"].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.remove();
  });

  translateBtn.textContent = "Translate";
  translateBtn.disabled = false;
  conversationHistory = null;
  selectedLang = null;
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m];
  });
}
