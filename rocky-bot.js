class RockyBot {
  constructor() {
    this.memory = {
      userName: localStorage.getItem("rockyUserName") || null,
      learnedLexicon: JSON.parse(localStorage.getItem("rockyLearnedLexicon") || "{}")
    };

    this.state = {
      lastIntent: null,
      lastReply: null,
      pendingUnknownWord: null
    };

    this.validIntents = [
      "greeting",
      "goodbye",
      "help",
      "danger",
      "friendship",
      "question"
    ];

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

  saveMemory() {
    localStorage.setItem("rockyUserName", this.memory.userName || "");
    localStorage.setItem("rockyLearnedLexicon", JSON.stringify(this.memory.learnedLexicon));
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
    const choices = filtered.length ? filtered : arr;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  tokenize(text) {
    return text.toLowerCase().match(/[a-z][a-z'-]*/g) || [];
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
        const raw = match[1];
        return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      }
    }
    return null;
  }

  maybeLearnName(text) {
    const newName = this.extractName(text);
    if (!newName) return null;

    const oldName = this.memory.userName;
    this.memory.userName = newName;
    this.saveMemory();

    if (!oldName) return "learnedName";
    if (oldName !== newName) return "updatedName";
    return "learnedName";
  }

  isKnownWord(word) {
    if (this.memory.learnedLexicon[word]) return true;

    return this.intentRules.some(rule =>
      rule.patterns.some(pattern => pattern.test(word))
    );
  }

  getLongestUnknownWord(text) {
    const words = this.tokenize(text)
      .filter(word => word.length >= 3)
      .filter(word => !this.isKnownWord(word));

    if (!words.length) return null;

    return words.sort((a, b) => b.length - a.length)[0];
  }

  getAdjectiveCandidate(text) {
    const doc = nlp(text);
    const adjectives = doc.adjectives().json();

    for (const entry of adjectives) {
      const word = (entry.text || "").toLowerCase().trim();
      if (!word) continue;
      if (!this.isKnownWord(word)) return word;
    }

    return null;
  }

  getWordToAskAbout(text) {
    const adjective = this.getAdjectiveCandidate(text);
    if (adjective) return adjective;

    return this.getLongestUnknownWord(text);
  }

  scoreIntent(text, rule) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) score += rule.weight;
    }
    return score;
  }

  detectIntent(text) {
    const scores = {
      greeting: 0,
      goodbye: 0,
      help: 0,
      danger: 0,
      friendship: 0,
      question: 0
    };

    for (const rule of this.intentRules) {
      scores[rule.name] += this.scoreIntent(text, rule);
    }

    for (const word of this.tokenize(text)) {
      const learnedIntent = this.memory.learnedLexicon[word];
      if (learnedIntent && scores[learnedIntent] !== undefined) {
        scores[learnedIntent] += 5;
      }
    }

    let bestIntent = "unknown";
    let bestScore = 0;

    for (const [intent, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    return bestIntent;
  }

  inferIntentFromExplanation(text) {
    const lower = text.toLowerCase();

    const directPatterns = [
      /\b(greeting|goodbye|help|danger|friendship|question)\b/,
      /\bmeans\s+(greeting|goodbye|help|danger|friendship|question)\b/,
      /\bis\s+(greeting|goodbye|help|danger|friendship|question)\b/,
      /\bbelongs to\s+(greeting|goodbye|help|danger|friendship|question)\b/
    ];

    for (const pattern of directPatterns) {
      const match = lower.match(pattern);
      if (match) return match[1];
    }

    const inferred = this.detectIntent(text);
    return inferred === "unknown" ? null : inferred;
  }

  handlePendingUnknownWord(text) {
    if (!this.state.pendingUnknownWord) return null;

    const learnedIntent = this.inferIntentFromExplanation(text);
    const word = this.state.pendingUnknownWord;

    if (!learnedIntent) {
      return `Rocky still confused. Does "${word}" mean greeting, goodbye, help, danger, friendship, or question?`;
    }

    this.memory.learnedLexicon[word] = learnedIntent;
    this.saveMemory();
    this.state.pendingUnknownWord = null;

    return `Ahhh. Rocky learns "${word}" means ${learnedIntent}, yes.`;
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

    const wordReply = this.handlePendingUnknownWord(text);
    if (wordReply) {
      this.state.lastIntent = "learnedWord";
      this.state.lastReply = wordReply;
      return wordReply;
    }

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

    if (intent === "unknown") {
      const targetWord = this.getWordToAskAbout(text);
      if (targetWord) {
        this.state.pendingUnknownWord = targetWord;
        const reply = `Rocky does not know word "${targetWord}". What does "${targetWord}" mean?`;
        this.state.lastIntent = "clarification";
        this.state.lastReply = reply;
        return reply;
      }
    }

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
