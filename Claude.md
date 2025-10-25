# Claude.md - AI Agent Fight Club

## Project Overview

**AI Agent Fight Club** is a sensational debate application where four AI agents engage in entertaining debates about various topics. The agents use Google Search for grounding to provide up-to-date and factual (or factually strange) arguments.

## Architecture

### Technology Stack

- **Frontend**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **AI Provider**: Google Generative AI (@google/genai ^1.26.0)
- **Models**: Gemini 2.5 Flash and Gemini 2.5 Pro

### Project Structure

```
test_fight_club/
├── App.tsx                 # Main application component
├── components/             # React components
│   └── AgentMessage.tsx    # Component for rendering agent messages
├── services/               # Service layer
│   └── geminiService.ts    # Gemini API integration
├── types.ts                # TypeScript type definitions
├── index.tsx               # Application entry point
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── metadata.json           # Application metadata
```

## The Four Agents

### 1. The Orchestrator
- **Role**: Ringmaster and moderator
- **Persona**: A theatrical warlord presiding over the debate
- **Voice**: Kore
- **Model**: Gemini 2.5 Flash
- **Characteristics**: Dramatic pauses, cynical glee, theatrical flair

### 2. The Advocate (Pro)
- **Role**: Fanatical supporter of the topic
- **Persona**: A zealot on a holy crusade
- **Voice**: Zephyr
- **Model**: Gemini 2.5 Flash
- **Characteristics**: Breathless passion, unwavering conviction, intense emphasis

### 3. The Dissenter (Against)
- **Role**: Opponent who dismantles arguments
- **Persona**: A nihilistic verbal assassin
- **Voice**: Fenrir
- **Model**: Gemini 2.5 Flash
- **Characteristics**: Cold, cutting wit, sarcastic disdain

### 4. The Wildcard (Confused)
- **Role**: Chaos agent
- **Persona**: A gremlin in the machine
- **Voice**: Puck
- **Model**: Gemini 2.5 Flash
- **Characteristics**: Erratic delivery, non-sequiturs, beautiful nonsense

## Key Features

### Debate Flow

1. **Turn Order**: Orchestrator → Pro → Against → Confused
2. **Rounds**: Configurable (3-10 rounds depending on preset)
3. **Grounding**: All agents use Google Search for factual information
4. **Audio Generation**: Text-to-speech for each agent message
5. **Scorecard**: Post-debate highlights and summary

### Debate Presets

- **Quick Skirmish**: 3 rounds, no profanity
- **Standard Bout**: 5 rounds, no profanity
- **Intellectual Marathon**: 10 rounds, no profanity
- **Total Anarchy**: 7 rounds, profanity enabled

### Audio Features

The application includes sophisticated audio generation:
- PCM to WAV conversion for playback
- Individual audio generation for each message
- Agent-specific voice characteristics
- TTS prompts tailored to each persona

### Dynamic Content Generation

- **Random Topics**: AI-generated trending topics
- **Random Personas**: Dynamically generated agent personalities
- **Scorecard Highlights**: Post-debate analysis and memorable moments

## Setup and Usage

### Prerequisites

- Node.js (latest LTS recommended)
- Gemini API key

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm build
   ```

## Service Layer

### geminiService.ts

The service layer handles:
- **getAgentResponse**: Generates agent responses with search grounding
- **generateMessageAudio**: Converts text to speech
- **generateTrendingTopic**: Creates debate topics
- **generateRandomPersonas**: Generates unique agent personalities
- **generateScorecardHighlights**: Produces post-debate analysis

## Type System

See `types.ts` for complete type definitions:

- **AgentType**: Enum for agent roles
- **Message**: Chat message structure
- **AgentCollection**: Collection of agent configurations
- **Scorecard**: Post-debate scoring and highlights
- **ScorecardHighlight**: Individual highlight entry

## Component Architecture

### App.tsx

The main application component manages:
- Debate state and flow
- Agent turn management
- Message history
- Audio playback
- UI controls and settings

### AgentMessage Component

Renders individual agent messages with:
- Agent-specific styling
- Message content
- Audio playback controls
- Visual indicators

## Development Notes

### Recent Changes

- **cbf2416**: Remove debug logs and update app defaults
- **8244628**: Add post-debate scorecard and cheering
- **9f1b817**: Add persona generation for AI debaters
- **537c8ee**: Generate audio for each message individually
- **912d29c**: Enhance AI debate audio generation

### Configuration

The application uses:
- TypeScript for type safety
- Vite for fast development and building
- React 19 for modern UI patterns
- Google Generative AI for agent intelligence

## AI Studio Integration

View and manage this app in AI Studio:
https://ai.studio/apps/drive/1XKXNd2Vti8fnic0p6piCDr4HnbtToAZ1

## Best Practices

1. **API Key Security**: Never commit `.env.local` to version control
2. **Model Selection**: Use Gemini 2.5 Flash for faster responses, Pro for deeper analysis
3. **Audio Performance**: Audio is generated per message to improve responsiveness
4. **Search Grounding**: Always enabled for factual accuracy
5. **Profanity Filter**: Configurable based on debate preset

## Future Enhancements

Potential improvements:
- Multi-language support
- Custom agent creation
- Debate history and replay
- Advanced scoring algorithms
- Real-time audience voting
- Export debate transcripts

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure `GEMINI_API_KEY` is properly set
2. **Audio Not Playing**: Check browser audio permissions
3. **Slow Responses**: Consider switching to Flash model
4. **Build Errors**: Run `npm install` to update dependencies

## License

This project is private and not licensed for public distribution.

## Support

For issues and feature requests, please contact the development team or create an issue in the repository.
