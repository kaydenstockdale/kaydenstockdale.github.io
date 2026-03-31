class RockyBot {
  constructor() {
    this.memory = {
      userName: null
    };

    this.state = {
      lastIntent: null,
      lastReply: null
    };

    this.intentRules = [
      {
        name: "danger",
        weight: 4,
        patterns: [
          /\bdanger(?:ous)?\b/i,
          /\brisk(?:y)?\b/i,
          /\bunsafe\b/i,
          /\bafraid\b/i,
          /\bscared\b/i,
          /\bpanic\b/i
        ]
      },
      {
        name: "help",
        weight: 3,
        patterns: [
          /\bhelp\b/i,
          /\bassist\b/i,
          /\bfix\b/i,
          /\bproblem\b/i,
          /\bissue\b/i,
          /\bcan you help\b/i
        ]
      },
      {
        name: "goodbye",
        weight: 3,
        patterns: [
          /\bbye\b/i,
          /\bgoodbye\b/i,
          /\bsee you\b/i,
          /\bfarewell\b/i,
          /\blater\b/i
        ]
      },
      {
        name: "greeting",
        weight: 2,
        patterns: [
          /\bhi\b/i,
          /\bhello\b/i,
          /\bhey\b/i,
          /\bgreetings?\b/i
        ]
      },
      {
        name: "friendship",
        weight: 2,
        patterns: [
          /\bfriend\b/i,
          /\btrust\b/i,
          /\bteam\b/i,
          /\btogether\b/i
        ]
      },
      {
        name: "question",
        weight: 1,
        patterns: [
          /\bwhy\b/i,
          /\bhow\b/i,
          /\bwhat\b/i,
          /\bwhen\b/i,
          /\bwhere\b/i,
          /\bwho\b/i,
          /\?/i
        ]
      }
    ];

    this.responses = {
      greeting: [
        "Hello, {{name}}.",
        "Greeting, {{name}}.",
        "Hello hello, {{name}}."
      ],
      goodbye: [
        "Goodbye, {{name}}.",
        "Parting now, {{name}}.",
        "See you later, {{name}}."
      ],
      help: [
        "Show problem, {{name}}. Rocky help.",
        "Explain issue clearly, {{name}}.",
        "We solve problem step by step, {{name}}."
      ],
      danger: [
        "Danger, {{name}}. Stop and think first.",
        "Risky plan, {{name}}. Need better idea.",
        "Bad bad bad, {{name}}. Choose safer path."
      ],
      friendship: [
        "You are friend, {{name}}.",
        "Good to work together, {{name}}.",
        "Trust is good, {{name}}."
      ],
      question: [
        "Interesting question, {{name}}.",
        "Rocky thinks, yes, {{name}}.",
        "Explain more, {{name}}. Need clear details."
      ],
      unknown: [
        "I not understand, {{name}}.",
        "Confusing, {{name}}. Say different way.",
        "Need more clear words, {{name}}."
      ],
      learnedName: [
        "Ahhh. Your name is {{name}}. Good, yes.",
        "Rocky learns: {{name}}. Excellent.",
        "Now I know you, {{name}}."
      ],
      updatedName: [
        "Name changed. Now you are {{name}}, yes.",
        "Rocky updates name: {{name}}.",
        "Understood. I call you {{name}} now."
      ]
    };
  }

  getDisplayName() {
    return this.memory.userName || "friend";
  }

  fillTemplate(text) {
    return text.replaceAll("{{name}}", this.getDisplayName());
  }

  randomChoiceDifferent(arr, lastValue = null) {
    if (arr.length === 1) return arr[0];

    const filtered = arr.filter(item => item !== lastValue);
    const choices = filtered.length > 0 ? filtered : arr;

    return choices[Math.floor(Math.random() * choices.length)];
  }

  extractName(text) {
    const patterns = [
      /\bmy name is\s+([A-Za-z][A-Za-z'-]{1,24})\b/i,
      /\bi am\s+([A-Za-z][A-Za-z'-]{1,24})\b/i,
      /\bi'm\s+([A-Za-z][A-Za-z'-]{1,24})\b/i,
      /\bcall me\s+([A-Za-z][A-Za-z'-]{1,24})\b/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const rawName = match[1];
        return rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
      }
    }

    return null;
  }

  maybeLearnName(text) {
    const newName = this.extractName(text);
    if (!newName) return null;

    const oldName = this.memory.userName;
    this.memory.userName = newName;

    if (!oldName) return "learnedName";
    if (oldName !== newName) return "updatedName";
    return "learnedName";
  }

  scoreIntent(text, rule) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        score += rule.weight;
      }
    }
    return score;
  }

  detectIntent(text) {
    let bestIntent = "unknown";
    let bestScore = 0;

    for (const rule of this.intentRules) {
      const score = this.scoreIntent(text, rule);
      if (score > bestScore) {
        bestScore = score;
        bestIntent = rule.name;
      }
    }

    return bestIntent;
  }

  buildResponse(intent, text) {
    const lower = text.toLowerCase();

    if (intent === "help" && /\bcode\b|\bbug\b|\berror\b|\bjavascript\b|\bjs\b/i.test(lower)) {
      const options = [
        "Show code, {{name}}. Rocky inspect problem.",
        "Code issue, yes, {{name}}? Paste code here.",
        "Rocky can help fix code, {{name}}. Show exact problem."
      ];
      return this.fillTemplate(this.randomChoiceDifferent(options, this.state.lastReply));
    }

    if (intent === "question" && /\bwhy\b/i.test(lower)) {
      const options = [
        "Why question is big question, {{name}}.",
        "Need cause and reason, yes, {{name}}.",
        "Rocky explains, but be specific, {{name}}."
      ];
      return this.fillTemplate(this.randomChoiceDifferent(options, this.state.lastReply));
    }

    if (intent === "question" && /\bhow\b/i.test(lower)) {
      const options = [
        "How question means process, yes, {{name}}.",
        "Rocky can explain steps, {{name}}.",
        "Ask clearly, {{name}}. Rocky gives method."
      ];
      return this.fillTemplate(this.randomChoiceDifferent(options, this.state.lastReply));
    }

    const bank = this.responses[intent] || this.responses.unknown;
    return this.fillTemplate(this.randomChoiceDifferent(bank, this.state.lastReply));
  }

  respond(input) {
    const text = input.trim();

    // First, see if Rocky learns the user's name
    const nameEvent = this.maybeLearnName(text);
    if (nameEvent) {
      const reply = this.fillTemplate(
        this.randomChoiceDifferent(this.responses[nameEvent], this.state.lastReply)
      );
      this.state.lastIntent = nameEvent;
      this.state.lastReply = reply;
      return reply;
    }

    const intent = this.detectIntent(text);
    const response = this.buildResponse(intent, text);

    this.state.lastIntent = intent;
    this.state.lastReply = response;

    return response;
  }
}

const bot = new RockyBot();

function addMessage(sender, text, className) {
  const chatWindow = document.getElementById("chatWindow");
  const message = document.createElement("div");
  message.className = `result-card ${className}`;

  const p = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = `${sender}: `;

  p.appendChild(strong);
  p.appendChild(document.createTextNode(text));
  message.appendChild(p);

  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
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

document.getElementById("userInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});
