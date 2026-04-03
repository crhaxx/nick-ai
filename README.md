# Nick AI Bot

AI chat application built with Next.js, inspired by Claude AI's design.

## Features

- Dark/Light theme toggle (dark mode default)
- Claude AI-inspired UI with warm terracotta orange tones
- Streaming responses
- Markdown rendering for code blocks and formatted text
- Responsive design
- Clean, modern interface

## Tech Stack

- **Framework:** Next.js 16
- **UI:** React 19
- **Styling:** Tailwind CSS 4
- **Markdown:** react-markdown

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
nick-ai-bot/
├── app/
│   ├── page.tsx      # Main chat interface
│   ├── layout.tsx    # Root layout
│   └── globals.css   # Global styles
├── public/           # Static assets
├── package.json     # Dependencies
└── tsconfig.json    # TypeScript config
```

## API

The chat expects a `/api/ai` endpoint that accepts POST requests with:
```json
{ "prompt": "your message" }
```

And returns a streaming response.

## License

MIT