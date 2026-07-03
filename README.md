# LLM Token & Cost Calculator

A small React + TypeScript app for estimating LLM API spend, built on top of [`llm-ledger`](https://github.com/PhyoeBlitz/llm-ledger).

Pick a built-in Claude model (or register a custom one with your own $/MTok rates for OpenAI, Gemini, etc.), enter token counts for a request, and it tracks running totals, a per-model breakdown, and prompt-cache savings using `llm-ledger`'s `CostTracker`.

## Features

- Built-in pricing for current Claude models via `knownModels()` / `getPricing()`
- Custom model support via `registerPricing()` for any other provider
- Input, output, and cache (read / 5-minute write / 1-hour write) token fields
- Live running totals: requests, total tokens, total cost, total cache savings
- Per-model breakdown and a full request log, powered by `CostTracker.byModel()`
- Optional tags per request

## Stack

- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/) 6
- [Vite](https://vite.dev/) 8
- [llm-ledger](https://www.npmjs.com/package/llm-ledger)

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Build

```bash
npm run build
```

## License

MIT
