# QVAC Word Rhyme Finder

Enter a word and an on-device AI lists words that rhyme with it. No cloud call, no API key.

## Run

```bash
npm install
npm start
```

Then open http://localhost:32032

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## How it works

Built on [Tether's QVAC SDK](https://www.npmjs.com/package/@qvac/sdk) — all inference runs on-device, no cloud call, no API key. The app loads `LLAMA_3_2_1B_INST_Q4_0` locally with `loadModel()`, generates with `completion()` (streamed via `tokenStream`), and releases the model with `unloadModel()` on shutdown.

Type a word into the form and submit it. The server sends the model a short system prompt plus two few-shot examples (one showing a clean rhyme set, one showing a trickier word) so it learns to reply with one rhyming word per line instead of prose. The streamed reply is split into a list, checked for refusal phrases or malformed entries, and shown as chips. If the model output looks unusable, a deterministic fallback builds near-rhymes by swapping the word's leading consonant onto its last vowel sound, so the page never comes back empty.

**Example**

- Input: `light`
- Output: `night`, `bright`, `sight`, `flight`, `fight`, `kite`

## License

MIT
