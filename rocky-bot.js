class RockyBot {
  constructor() {
    this.memory = {
      friendshipLevel: 0
    };
  }

  detectIntent(text) {
    if (/(hi|hello|hey)/.test(text)) return "greeting";
    if (/(bye|goodbye)/.test(text)) return "goodbye";
    if (/(help|assist)/.test(text)) return "help";
    if (/(danger|dangerous|risky|afraid|scared)/.test(text)) return "danger";
    if (/(friend)/.test(text)) return "friendship";
    if (/(why|how|what|\?)/.test(text)) return "question";
    return "unknown";
  }

  randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  respond(input) {
    const text = input.toLowerCase().trim();
    const intent = this.detectIntent(text);

    const responses = {
      greeting: [
        "Hello, friend!",
        "Greeting, friend!",
        "Hello hello, friend!"
      ],
      goodbye: [
        "Goodbye, friend.",
        "Parting now, friend."
      ],
      help: [
        "I help, yes.",
        "Show problem. I help fix.",
        "We solve problem together."
      ],
      danger: [
        "Danger, yes.",
        "Bad bad bad!",
        "Risky plan, yes."
      ],
      friendship: [
        "You are friend.",
        "Good to have friend.",
        "You are good human."
      ],
      question: [
        "Interesting question!",
        "Explain more, question?",
        "I think on this, yes."
      ],
      unknown: [
        "I not understand.",
        "Confusing, yes.",
        "Explain again, question?"
      ]
    };

    if (intent === "greeting" || intent === "friendship") {
      this.memory.friendshipLevel += 1;
    }

    let response = this.randomChoice(responses[intent] || responses.unknown);

    if (intent === "help" && this.memory.friendshipLevel >= 2) {
      response += " I help friend.";
    }

    return response;
  }
}

const bot = new RockyBot();

function addMessage(sender, text, className) {
  const chatWindow = document.getElementById("chatWindow");
  const message = document.createElement("div");
  message.className = "result-card";
  message.innerHTML = `<p><strong>${sender}:</strong> ${text}</p>`;
  chatWindow.appendChild(message);
}

function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();

  if (!text) return;

  addMessage("You", text, "user");
  const reply = bot.respond(text);
  addMessage("Rocky", reply, "bot");

  input.value = "";
}
