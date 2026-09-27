// QVAC Word Rhyme Finder — core logic.
// completion() lists words that rhyme with a given word.

import { completion } from "@qvac/sdk";

const VOWELS = "aeiouy";

function lastSound(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  for (let i = w.length - 1; i >= 0; i--) {
    if (VOWELS.includes(w[i])) return w.slice(i);
  }
  return w.slice(-2);
}

function looksUnusable(list) {
  if (!Array.isArray(list) || list.length === 0) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i am not able"];
  const joined = list.join(" ").toLowerCase();
  if (bad.some((phrase) => joined.includes(phrase))) return true;
  if (list.some((w) => !w || w.trim().length === 0 || w.split(/\s+/).length > 2)) return true;
  return false;
}

function fallback(word) {
  const suffix = lastSound(word);
  const stock = [
    `b${suffix}`,
    `c${suffix}`,
    `d${suffix}`,
    `f${suffix}`,
    `m${suffix}`,
    `l${suffix}`,
  ];
  const cleaned = stock.filter((w) => w.toLowerCase() !== word.toLowerCase());
  return cleaned.length >= 5 ? cleaned.slice(0, 5) : [...cleaned, `${word}-like`].slice(0, 5);
}

function parseList(text) {
  return text
    .split(/[\n,]/)
    .map((line) => line.replace(/^[\s\-*\d.)]+/, "").trim())
    .filter((line) => line.length > 0);
}

export async function generate(modelId, word) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You find real English words that rhyme with a given word. " +
          "Given a word, reply with exactly 6 rhyming words, one per line, no numbering, no preamble, no explanation. " +
          "If you cannot find good rhymes, give the closest-sounding words you can.",
      },
      { role: "user", content: "Word: light" },
      {
        role: "assistant",
        content: "night\nbright\nsight\nflight\nfight\nkite",
      },
      { role: "user", content: "Word: orange" },
      {
        role: "assistant",
        content: "door-hinge\nsporange\nfour-inch\nstorage\nforage\nporridge",
      },
      { role: "user", content: `Word: ${word}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.7, maxTokens: 80 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text.trim();

  let rhymes = parseList(text).slice(0, 6);
  if (looksUnusable(rhymes)) rhymes = fallback(word);

  // Deterministically verify each candidate actually rhymes (same
  // last-vowel-sound key used by the fallback) — the model occasionally
  // mixes in a non-rhyming word (e.g. "flint" for "light"). Drop anything
  // that fails the check; if too few survive, top up with the fallback.
  const targetSound = lastSound(word);
  const wordLower = word.trim().toLowerCase();
  const seen = new Set();
  const verified = rhymes.filter((r) => {
    const rLower = r.toLowerCase();
    if (rLower === wordLower || seen.has(rLower)) return false;
    seen.add(rLower);
    return lastSound(r) === targetSound;
  });
  if (verified.length < 3) {
    const extra = fallback(word).filter((f) => !verified.includes(f));
    rhymes = [...verified, ...extra].slice(0, 6);
  } else {
    rhymes = verified;
  }

  return { rhymes };
}
