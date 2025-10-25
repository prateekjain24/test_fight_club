# AI Agent Fight Club

A sensational debate application where four AI agents engage in entertaining debates about various topics. Watch as distinct AI personalities clash in theatrical debates powered by Google's Gemini models with real-time search grounding.

## Features

- **Four Unique AI Agents** - Each with distinct personalities and debate styles
- **Google Search Grounding** - Arguments backed by real-time web search results
- **Text-to-Speech Audio** - Each agent speaks with a unique voice
- **Multiple Debate Presets** - From Quick Skirmishes to Total Anarchy
- **Dynamic Content** - AI-generated topics and randomizable personas
- **Post-Debate Scorecard** - Highlights and analysis after each debate

## The Four Agents

### 🎭 The Orchestrator
**Role:** Ringmaster and moderator
**Persona:** A theatrical warlord presiding over the debate
**Voice:** Kore
**Style:** Dramatic pauses, cynical glee, theatrical flair

### ⚔️ The Advocate (Pro)
**Role:** Fanatical supporter of the topic
**Persona:** A zealot on a holy crusade
**Voice:** Zephyr
**Style:** Breathless passion, unwavering conviction, intense emphasis

### 🗡️ The Dissenter (Against)
**Role:** Opponent who dismantles arguments
**Persona:** A nihilistic verbal assassin
**Voice:** Fenrir
**Style:** Cold, cutting wit, sarcastic disdain

### 🃏 The Wildcard (Confused)
**Role:** Chaos agent
**Persona:** A gremlin in the machine
**Voice:** Puck
**Style:** Erratic delivery, non-sequiturs, beautiful nonsense

## Setup

### Prerequisites

- Node.js (latest LTS recommended) or Bun
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Install dependencies:**
   ```bash
   bun install
   # or
   npm install
   ```

2. **Configure your API key:**

   Open `.env.local` and replace the placeholder with your actual Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Run the development server:**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

4. **Build for production:**
   ```bash
   bun run build
   # or
   npm run build
   ```

## Debate Presets

- **Quick Skirmish** - 3 rounds, no profanity, fast-paced
- **Standard Bout** - 5 rounds, no profanity, balanced
- **Intellectual Marathon** - 10 rounds, no profanity, deep exploration
- **Total Anarchy** - 7 rounds, profanity enabled, unhinged chaos

## Tech Stack

- **Frontend:** React 19.2.0 with TypeScript
- **Build Tool:** Vite 6.2.0
- **AI Models:** Google Gemini 2.5 Flash & Pro
- **AI SDK:** @google/genai ^1.26.0

## Project Structure

```
test_fight_club/
├── App.tsx                 # Main application component
├── components/             # React components
│   └── AgentMessage.tsx    # Agent message renderer
├── services/               # Service layer
│   └── geminiService.ts    # Gemini API integration
├── types.ts                # TypeScript type definitions
├── .env.local              # Environment configuration
└── package.json            # Dependencies and scripts
```

## How It Works

1. **Debate Setup** - Choose a topic (or generate a random one) and select a preset
2. **Turn-Based Flow** - Orchestrator → Pro → Against → Confused (repeats for N rounds)
3. **Search Grounding** - Each agent uses Google Search to ground their arguments in facts
4. **Audio Generation** - Text-to-speech converts each message to audio with agent-specific voices
5. **Scorecard** - After the debate ends, view highlights and memorable moments

## Troubleshooting

### API Key Issues
- Ensure `GEMINI_API_KEY` is properly set in `.env.local`
- Verify your API key is active at [Google AI Studio](https://aistudio.google.com/app/apikey)

### Audio Not Playing
- Check browser audio permissions
- Ensure your browser supports Web Audio API

### Slow Responses
- The app uses Gemini 2.5 Flash for speed
- Large debates may take longer due to search grounding

### Build Errors
- Run `bun install` or `npm install` to update dependencies
- Clear `node_modules` and reinstall if issues persist

## AI Studio

View and manage this app in AI Studio:
https://ai.studio/apps/drive/1XKXNd2Vti8fnic0p6piCDr4HnbtToAZ1

## License

Private project - not licensed for public distribution.

---

**Note:** This application is for entertainment and educational purposes. Agent responses are AI-generated and may contain inaccuracies or unexpected content.
