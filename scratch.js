// scratch.js — your playground.
// Paste any "Predict, then run" or "Break it" block from a chapter here,
// fill in or change whatever you like, then run:
//
//   node tools/try.js --file scratch.js
//
// Your functions from src/ are already loaded as MS.*, plus two helpers:
//   MS.reveal(label, myGuess, actual)   checks a prediction
//   MS.asciiFrame(frame)                draws a small frame as text

const myGuess = null; // TODO: your guess
const f = MS.createFrame(4, 3);
MS.reveal("bytes in a 4 × 3 frame", myGuess, f.data.length);
