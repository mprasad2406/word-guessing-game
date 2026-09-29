/**
 * GuessPreparationService:
 * Analyzes authoritative feedback from previous attempts to generate intelligent draft suggestions.
 * 
 * Rules:
 * 1. Preserves confirmed GREEN letters in their exact positions.
 * 2. Carries ORANGE letters into unconfirmed (non-green) slots.
 * 3. Leaves positions that received GREY feedback empty.
 * 4. Correctly handles repeated letters according to the exact feedback array.
 * 5. Identifies when all letters are found (all green or orange) for smart reordering.
 */

export const GuessPreparationService = {
  /**
   * Analyzes all previous guesses to extract cumulative knowledge and prepare a draft.
   * @param {Array} guesses - Array of previous guess objects with .guess and .letter_feedback
   * @param {number} wordLength - Length of the target word (default 5)
   * @returns {Object} Preparation analysis and suggested draft
   */
  analyzeFeedback(guesses = [], wordLength = 5) {
    const safeWordLength = Math.max(1, wordLength || 5);
    if (!guesses || guesses.length === 0) {
      return {
        canPrepare: false,
        suggestedDraft: "",
        greenPositions: {},
        orangeLetters: [],
        isAllLettersFound: false,
        greenCount: 0,
        orangeCount: 0,
      };
    }

    const lastGuess = guesses[guesses.length - 1];
    const lastWord = (lastGuess.guess || "").toUpperCase();
    const lastFeedback = lastGuess.letter_feedback || [];

    // Accumulate green positions across all guesses (once green, always confirmed)
    const cumulativeGreens = {};
    for (const g of guesses) {
      const w = (g.guess || "").toUpperCase();
      const fb = g.letter_feedback || [];
      for (let i = 0; i < safeWordLength; i++) {
        if (fb[i] === "correct" && w[i]) {
          cumulativeGreens[i] = w[i];
        }
      }
    }

    // From the most recent guess, extract greens and oranges
    const draftArray = Array(safeWordLength).fill("");
    const unconfirmedIndices = [];
    const orangeLetters = [];

    // First pass: apply cumulative confirmed greens
    for (let i = 0; i < safeWordLength; i++) {
      if (cumulativeGreens[i]) {
        draftArray[i] = cumulativeGreens[i];
      } else {
        unconfirmedIndices.push(i);
      }
    }

    // Extract orange letters from last guess
    for (let i = 0; i < safeWordLength; i++) {
      if (lastFeedback[i] === "present" && lastWord[i]) {
        orangeLetters.push({ letter: lastWord[i], fromIndex: i });
      }
    }

    // Place orange letters into available unconfirmed slots (avoiding placing in their original fromIndex if possible)
    const placedOranges = [];
    let orangeIdx = 0;
    for (const slotIndex of unconfirmedIndices) {
      if (orangeIdx < orangeLetters.length) {
        const item = orangeLetters[orangeIdx];
        draftArray[slotIndex] = item.letter;
        placedOranges.push({ letter: item.letter, slotIndex });
        orangeIdx++;
      }
    }

    const greenCount = Object.keys(cumulativeGreens).length;
    const orangeCount = orangeLetters.length;
    const isAllLettersFound = greenCount + orangeCount >= safeWordLength;
    const suggestedDraft = draftArray.join("");

    return {
      canPrepare: greenCount > 0 || orangeCount > 0,
      suggestedDraft,
      greenPositions: cumulativeGreens,
      orangeLetters,
      isAllLettersFound,
      greenCount,
      orangeCount,
      unconfirmedIndices,
    };
  },

  /**
   * Generates a constrained shuffle of a draft string where green positions remain fixed.
   * @param {string} draft - Current draft string
   * @param {Object} greenPositions - Map of { [index]: letter } for locked positions
   * @param {number} wordLength - Length of word
   * @returns {string} Shuffled draft string
   */
  shuffleDraft(draft = "", greenPositions = {}, wordLength = 5) {
    const safeWordLength = Math.max(1, wordLength || 5);
    const chars = draft.toUpperCase().padEnd(safeWordLength, " ").split("");

    // Identify indices and letters that are free to shuffle
    const freeIndices = [];
    const freeLetters = [];

    for (let i = 0; i < safeWordLength; i++) {
      if (greenPositions[i] !== undefined && chars[i] === greenPositions[i]) {
        // Locked green position
        continue;
      }
      if (chars[i] && chars[i] !== " ") {
        freeIndices.push(i);
        freeLetters.push(chars[i]);
      }
    }

    if (freeLetters.length <= 1) {
      return draft;
    }

    // Permute free letters to ensure a distinct arrangement if possible
    let shuffled = [...freeLetters];
    let attempts = 0;
    const maxAttempts = 12;

    while (attempts < maxAttempts) {
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // If at least one letter moved or different, accept
      const isIdentical = shuffled.every((ch, idx) => ch === freeLetters[idx]);
      if (!isIdentical || attempts === maxAttempts - 1) {
        break;
      }
      attempts++;
    }

    // Place shuffled letters back into free slots
    const result = [...chars];
    freeIndices.forEach((slotIdx, i) => {
      result[slotIdx] = shuffled[i] || "";
    });

    return result.join("").trimEnd();
  },
};
