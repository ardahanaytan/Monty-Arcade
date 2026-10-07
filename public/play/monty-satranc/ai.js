/* Monty Satranç — yapay zeka worker'ı. Arama arayüzü dondurmasın diye ayrı iş parçacığında çalışır. */
importScripts('./engine.js');

self.onmessage = (event) => {
  const { id, fen, moves, level, seed } = event.data;
  const pos = new MontyChess.Position(fen);
  for (const m of moves) pos.make(m);
  const result = MontyChess.think(pos, level, seed);
  self.postMessage({ id, move: result.move, depth: result.depth, score: result.score });
};
