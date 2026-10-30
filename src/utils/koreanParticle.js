const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
const FINAL_CONSONANT_COUNT = 28;
const RIEUL_FINAL_CONSONANT = 8;

/** 받침이 없거나 ㄹ 받침이면 '로', 그 밖의 받침이면 '으로'를 붙인다. 한글이 아니면 '로'를 쓴다. */
export const withDirectionParticle = (word) => {
  const lastCharCode = word.charCodeAt(word.length - 1);

  if (Number.isNaN(lastCharCode) || lastCharCode < HANGUL_START || lastCharCode > HANGUL_END) {
    return `${word}로`;
  }

  const finalConsonant = (lastCharCode - HANGUL_START) % FINAL_CONSONANT_COUNT;
  const hasParticleEu = finalConsonant !== 0 && finalConsonant !== RIEUL_FINAL_CONSONANT;

  return `${word}${hasParticleEu ? '으로' : '로'}`;
};
