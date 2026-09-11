export const tokens = {
  bg: '#0D0E12',
  surface: '#16181F',
  surfaceHover: '#1C1F28',
  surfaceActive: '#20242F',
  border: '#272A36',
  textPrimary: '#EDEFF5',
  textSecondary: '#8A8F9E',
  accentGreen: '#00E599',
  accentPurple: '#8B5CF6',
  danger: '#FF5258',
  radius: '6px',
  fontDisplay: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
  fontBody: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  gatewayEndpoint: 'ai-gateway.vercel.sh/v1',
};

export const MODELS = {
  text: [
    { id: 'openai/gpt-6-astra', label: 'GPT-6 Astra' },
    { id: 'openai/gpt-6', label: 'GPT-6' },
    { id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
    { id: 'google/gemini-3.1-flash', label: 'Gemini 3.1 Flash' },
    { id: 'x-ai/grok-4', label: 'Grok 4' },
  ],
  image: [
    { id: 'openai/gpt-image-2', label: 'GPT Image 2 (Images API)' },
    { id: 'google/gemini-3.1-flash-image-preview', label: 'Gemini Flash Image (Multimodal)' },
    { id: 'bfl/flux-2-pro', label: 'Flux 2 Pro' },
  ],
  speech: [
    { id: 'openai/tts-1', label: 'TTS-1' },
    { id: 'openai/tts-1-hd', label: 'TTS-1 HD' },
  ],
  transcribe: [
    { id: 'openai/whisper-1', label: 'Whisper-1' },
    { id: 'openai/gpt-4o-transcribe', label: 'GPT-4o Transcribe' },
    { id: 'google/gemini-3.5-transcribe', label: 'Gemini 3.5 Transcribe' },
  ],
};

export const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];