export function formatTime(secs) {
  if (!isFinite(secs)) return "...";
  if (secs > 0 && secs < 1) {
    return `0:00.${Math.round(secs * 10)}`;
  }
  const s = Math.round(secs);
  const m = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

export function reverseHebrewWords(str) {
  return str.replace(/[\u0590-\u05FF]+/g, word =>
    word.split('').reverse().join('')
  );
}