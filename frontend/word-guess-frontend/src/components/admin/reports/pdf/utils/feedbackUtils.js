/**
 * Compute Wordle feedback for a given guess against target word.
 * Returns array of { letter: string, status: "correct" | "present" | "absent" }
 */
export function computeLetterFeedback(targetWord = "", guessWord = "") {
  if (!targetWord || !guessWord) {
    return (guessWord || "").split("").map((l) => ({ letter: l.toUpperCase(), status: "absent" }));
  }

  const target = targetWord.toUpperCase().split("");
  const guess = guessWord.toUpperCase().split("");
  const n = guess.length;
  const feedback = new Array(n).fill("absent");
  const targetCounts = {};

  for (let i = 0; i < Math.min(n, target.length); i++) {
    if (guess[i] === target[i]) {
      feedback[i] = "correct";
    } else {
      targetCounts[target[i]] = (targetCounts[target[i]] || 0) + 1;
    }
  }

  for (let i = 0; i < n; i++) {
    if (feedback[i] !== "correct") {
      const ch = guess[i];
      if ((targetCounts[ch] || 0) > 0) {
        feedback[i] = "present";
        targetCounts[ch] -= 1;
      }
    }
  }

  return guess.map((letter, i) => ({ letter, status: feedback[i] }));
}
