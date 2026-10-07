/*
 * Monty Satranç — kural motoru ve yapay zeka.
 * Hem sayfada (<script>) hem de Web Worker'da (importScripts) çalışır; global `MontyChess` tanımlar.
 *
 * Tahta 0x88 düzeninde: kare = sıra * 16 + sütun. Sıra 0 = beyazın 1. sırası, sütun 0 = "a".
 * Taş kodu: renk (0 beyaz, 8 siyah) | tür (1 piyon … 6 şah).
 * Hamle tek bir tamsayı: from | to << 7 | terfi << 14 | bayraklar << 17.
 */
(function (root) {
  'use strict';

  const WHITE = 0;
  const BLACK = 8;
  const PAWN = 1;
  const KNIGHT = 2;
  const BISHOP = 3;
  const ROOK = 4;
  const QUEEN = 5;
  const KING = 6;

  const F_CAP = 1;
  const F_EP = 2;
  const F_CASTLE = 4;
  const F_DOUBLE = 8;
  const F_PROMO = 16;

  const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const KNIGHT_OFF = [33, 31, 18, 14, -33, -31, -18, -14];
  const BISHOP_OFF = [17, 15, -17, -15];
  const ROOK_OFF = [16, -16, 1, -1];
  const KING_OFF = [17, 16, 15, 1, -1, -15, -16, -17];

  const VALUE = [0, 100, 320, 330, 500, 900, 0];
  const PHASE = [0, 0, 1, 1, 2, 4, 0];

  const encode = (from, to, promo, flags) => from | (to << 7) | (promo << 14) | (flags << 17);
  const mFrom = (m) => m & 127;
  const mTo = (m) => (m >> 7) & 127;
  const mPromo = (m) => (m >> 14) & 7;
  const mFlags = (m) => m >>> 17;

  const rankOf = (sq) => sq >> 4;
  const fileOf = (sq) => sq & 7;

  // Rok hakları: beyaz kısa 1, beyaz uzun 2, siyah kısa 4, siyah uzun 8.
  const CASTLE_MASK = new Uint8Array(128).fill(15);
  CASTLE_MASK[0] = 13; // a1
  CASTLE_MASK[7] = 14; // h1
  CASTLE_MASK[4] = 12; // e1
  CASTLE_MASK[112] = 7; // a8
  CASTLE_MASK[119] = 11; // h8
  CASTLE_MASK[116] = 3; // e8

  // --- Zobrist anahtarları (sabit tohum: sayfa ve worker aynı değerleri üretir) ---
  let seed = 0x9e3779b9;
  function rand32() {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return seed | 0;
  }
  const Z_PIECE_LO = new Int32Array(16 * 128);
  const Z_PIECE_HI = new Int32Array(16 * 128);
  for (let i = 0; i < 16 * 128; i++) {
    Z_PIECE_LO[i] = rand32();
    Z_PIECE_HI[i] = rand32();
  }
  const Z_CASTLE_LO = new Int32Array(16);
  const Z_CASTLE_HI = new Int32Array(16);
  for (let i = 0; i < 16; i++) {
    Z_CASTLE_LO[i] = rand32();
    Z_CASTLE_HI[i] = rand32();
  }
  const Z_EP_LO = new Int32Array(128);
  const Z_EP_HI = new Int32Array(128);
  for (let i = 0; i < 128; i++) {
    Z_EP_LO[i] = rand32();
    Z_EP_HI[i] = rand32();
  }
  const Z_SIDE_LO = rand32();
  const Z_SIDE_HI = rand32();

  // --- Konum ---
  class Position {
    constructor(fen) {
      this.board = new Int8Array(128);
      this.side = WHITE;
      this.castle = 0;
      this.ep = -1;
      this.half = 0;
      this.full = 1;
      this.kings = [4, 116];
      this.hashLo = 0;
      this.hashHi = 0;
      this.undo = []; // her hamle için 6 değer
      this.histLo = [];
      this.histHi = [];
      this.setFen(fen || START_FEN);
    }

    setFen(fen) {
      const [placement, side, castle, ep, half, full] = fen.trim().split(/\s+/);
      this.board.fill(0);
      let rank = 7;
      let file = 0;
      for (const ch of placement) {
        if (ch === '/') {
          rank--;
          file = 0;
        } else if (ch >= '1' && ch <= '8') {
          file += Number(ch);
        } else {
          const color = ch === ch.toLowerCase() ? BLACK : WHITE;
          const type = ' pnbrqk'.indexOf(ch.toLowerCase());
          const sq = rank * 16 + file;
          this.board[sq] = color | type;
          if (type === KING) this.kings[color >> 3] = sq;
          file++;
        }
      }
      this.side = side === 'b' ? BLACK : WHITE;
      this.castle = 0;
      if (castle && castle !== '-') {
        if (castle.includes('K')) this.castle |= 1;
        if (castle.includes('Q')) this.castle |= 2;
        if (castle.includes('k')) this.castle |= 4;
        if (castle.includes('q')) this.castle |= 8;
      }
      this.ep = ep && ep !== '-' ? (Number(ep[1]) - 1) * 16 + (ep.charCodeAt(0) - 97) : -1;
      this.half = Number(half) || 0;
      this.full = Number(full) || 1;
      this.undo.length = 0;
      this.computeHash();
      this.histLo = [this.hashLo];
      this.histHi = [this.hashHi];
    }

    fen() {
      let out = '';
      for (let rank = 7; rank >= 0; rank--) {
        let empty = 0;
        for (let file = 0; file < 8; file++) {
          const p = this.board[rank * 16 + file];
          if (!p) {
            empty++;
            continue;
          }
          if (empty) out += empty;
          empty = 0;
          const ch = ' pnbrqk'[p & 7];
          out += p & 8 ? ch : ch.toUpperCase();
        }
        if (empty) out += empty;
        if (rank) out += '/';
      }
      let c = '';
      if (this.castle & 1) c += 'K';
      if (this.castle & 2) c += 'Q';
      if (this.castle & 4) c += 'k';
      if (this.castle & 8) c += 'q';
      const ep = this.ep < 0 ? '-' : squareName(this.ep);
      return `${out} ${this.side ? 'b' : 'w'} ${c || '-'} ${ep} ${this.half} ${this.full}`;
    }

    computeHash() {
      let lo = 0;
      let hi = 0;
      for (let sq = 0; sq < 128; sq++) {
        if (sq & 0x88) {
          sq += 7;
          continue;
        }
        const p = this.board[sq];
        if (p) {
          lo ^= Z_PIECE_LO[p * 128 + sq];
          hi ^= Z_PIECE_HI[p * 128 + sq];
        }
      }
      lo ^= Z_CASTLE_LO[this.castle];
      hi ^= Z_CASTLE_HI[this.castle];
      if (this.ep >= 0) {
        lo ^= Z_EP_LO[this.ep];
        hi ^= Z_EP_HI[this.ep];
      }
      if (this.side) {
        lo ^= Z_SIDE_LO;
        hi ^= Z_SIDE_HI;
      }
      this.hashLo = lo;
      this.hashHi = hi;
    }

    /** `by` renginden bir taş `sq` karesine saldırıyor mu? */
    attacked(sq, by) {
      const b = this.board;
      if (by === WHITE) {
        if (!((sq - 15) & 0x88) && b[sq - 15] === (WHITE | PAWN)) return true;
        if (!((sq - 17) & 0x88) && b[sq - 17] === (WHITE | PAWN)) return true;
      } else {
        if (!((sq + 15) & 0x88) && b[sq + 15] === (BLACK | PAWN)) return true;
        if (!((sq + 17) & 0x88) && b[sq + 17] === (BLACK | PAWN)) return true;
      }
      const knight = by | KNIGHT;
      for (let i = 0; i < 8; i++) {
        const t = sq + KNIGHT_OFF[i];
        if (!(t & 0x88) && b[t] === knight) return true;
      }
      const king = by | KING;
      for (let i = 0; i < 8; i++) {
        const t = sq + KING_OFF[i];
        if (!(t & 0x88) && b[t] === king) return true;
      }
      const bishop = by | BISHOP;
      const rook = by | ROOK;
      const queen = by | QUEEN;
      for (let i = 0; i < 4; i++) {
        const d = BISHOP_OFF[i];
        let t = sq + d;
        while (!(t & 0x88)) {
          const p = b[t];
          if (p) {
            if (p === bishop || p === queen) return true;
            break;
          }
          t += d;
        }
      }
      for (let i = 0; i < 4; i++) {
        const d = ROOK_OFF[i];
        let t = sq + d;
        while (!(t & 0x88)) {
          const p = b[t];
          if (p) {
            if (p === rook || p === queen) return true;
            break;
          }
          t += d;
        }
      }
      return false;
    }

    inCheck() {
      return this.attacked(this.kings[this.side >> 3], this.side ^ 8);
    }

    /** Sözde-yasal hamleleri `buf` içine yazar, adedini döndürür. capsOnly: sadece alma + vezir terfisi. */
    generate(buf, capsOnly) {
      const b = this.board;
      const us = this.side;
      const them = us ^ 8;
      let n = 0;
      const pawnDir = us === WHITE ? 16 : -16;
      const startRank = us === WHITE ? 1 : 6;
      const promoRank = us === WHITE ? 7 : 0;

      for (let from = 0; from < 128; from++) {
        if (from & 0x88) {
          from += 7;
          continue;
        }
        const p = b[from];
        if (!p || (p & 8) !== us) continue;
        const type = p & 7;

        if (type === PAWN) {
          const one = from + pawnDir;
          if (!(one & 0x88) && !b[one]) {
            if (rankOf(one) === promoRank) {
              buf[n++] = encode(from, one, QUEEN, F_PROMO);
              if (!capsOnly) {
                buf[n++] = encode(from, one, KNIGHT, F_PROMO);
                buf[n++] = encode(from, one, ROOK, F_PROMO);
                buf[n++] = encode(from, one, BISHOP, F_PROMO);
              }
            } else if (!capsOnly) {
              buf[n++] = encode(from, one, 0, 0);
              const two = one + pawnDir;
              if (rankOf(from) === startRank && !b[two]) buf[n++] = encode(from, two, 0, F_DOUBLE);
            }
          }
          for (let s = -1; s <= 1; s += 2) {
            const to = one + s;
            if (to & 0x88) continue;
            const t = b[to];
            if (t && (t & 8) === them) {
              if (rankOf(to) === promoRank) {
                buf[n++] = encode(from, to, QUEEN, F_PROMO | F_CAP);
                if (!capsOnly) {
                  buf[n++] = encode(from, to, KNIGHT, F_PROMO | F_CAP);
                  buf[n++] = encode(from, to, ROOK, F_PROMO | F_CAP);
                  buf[n++] = encode(from, to, BISHOP, F_PROMO | F_CAP);
                }
              } else {
                buf[n++] = encode(from, to, 0, F_CAP);
              }
            } else if (to === this.ep) {
              buf[n++] = encode(from, to, 0, F_CAP | F_EP);
            }
          }
          continue;
        }

        if (type === KNIGHT || type === KING) {
          const offs = type === KNIGHT ? KNIGHT_OFF : KING_OFF;
          for (let i = 0; i < 8; i++) {
            const to = from + offs[i];
            if (to & 0x88) continue;
            const t = b[to];
            if (!t) {
              if (!capsOnly) buf[n++] = encode(from, to, 0, 0);
            } else if ((t & 8) === them) {
              buf[n++] = encode(from, to, 0, F_CAP);
            }
          }
          if (type === KING && !capsOnly) n = this.genCastles(buf, n);
          continue;
        }

        const dirs = type === BISHOP ? BISHOP_OFF : type === ROOK ? ROOK_OFF : KING_OFF;
        for (let i = 0; i < dirs.length; i++) {
          const d = dirs[i];
          let to = from + d;
          while (!(to & 0x88)) {
            const t = b[to];
            if (!t) {
              if (!capsOnly) buf[n++] = encode(from, to, 0, 0);
            } else {
              if ((t & 8) === them) buf[n++] = encode(from, to, 0, F_CAP);
              break;
            }
            to += d;
          }
        }
      }
      return n;
    }

    genCastles(buf, n) {
      const b = this.board;
      const us = this.side;
      const them = us ^ 8;
      const base = us === WHITE ? 0 : 112;
      const kingSide = us === WHITE ? 1 : 4;
      const queenSide = us === WHITE ? 2 : 8;
      if (b[base + 4] !== (us | KING)) return n;
      if (this.castle & kingSide && !b[base + 5] && !b[base + 6] && b[base + 7] === (us | ROOK)) {
        if (!this.attacked(base + 4, them) && !this.attacked(base + 5, them)) {
          buf[n++] = encode(base + 4, base + 6, 0, F_CASTLE);
        }
      }
      if (
        this.castle & queenSide &&
        !b[base + 3] &&
        !b[base + 2] &&
        !b[base + 1] &&
        b[base] === (us | ROOK)
      ) {
        if (!this.attacked(base + 4, them) && !this.attacked(base + 3, them)) {
          buf[n++] = encode(base + 4, base + 2, 0, F_CASTLE);
        }
      }
      return n;
    }

    /** Hamleyi oynar. Kendi şahını açıkta bırakıyorsa geri alır ve false döner. */
    make(m) {
      const b = this.board;
      const from = mFrom(m);
      const to = mTo(m);
      const flags = mFlags(m);
      const us = this.side;
      const them = us ^ 8;
      const piece = b[from];
      let capSq = to;
      if (flags & F_EP) capSq = us === WHITE ? to - 16 : to + 16;
      const captured = b[capSq];

      this.undo.push(captured, this.castle, this.ep, this.half, this.hashLo, this.hashHi);

      let lo = this.hashLo;
      let hi = this.hashHi;
      if (this.ep >= 0) {
        lo ^= Z_EP_LO[this.ep];
        hi ^= Z_EP_HI[this.ep];
      }
      lo ^= Z_CASTLE_LO[this.castle];
      hi ^= Z_CASTLE_HI[this.castle];

      if (captured) {
        b[capSq] = 0;
        lo ^= Z_PIECE_LO[captured * 128 + capSq];
        hi ^= Z_PIECE_HI[captured * 128 + capSq];
      }
      b[from] = 0;
      lo ^= Z_PIECE_LO[piece * 128 + from];
      hi ^= Z_PIECE_HI[piece * 128 + from];
      const placed = flags & F_PROMO ? us | mPromo(m) : piece;
      b[to] = placed;
      lo ^= Z_PIECE_LO[placed * 128 + to];
      hi ^= Z_PIECE_HI[placed * 128 + to];

      if (flags & F_CASTLE) {
        const rookFrom = to > from ? to + 1 : to - 2;
        const rookTo = to > from ? to - 1 : to + 1;
        const rook = b[rookFrom];
        b[rookFrom] = 0;
        b[rookTo] = rook;
        lo ^= Z_PIECE_LO[rook * 128 + rookFrom] ^ Z_PIECE_LO[rook * 128 + rookTo];
        hi ^= Z_PIECE_HI[rook * 128 + rookFrom] ^ Z_PIECE_HI[rook * 128 + rookTo];
      }
      if ((piece & 7) === KING) this.kings[us >> 3] = to;

      this.castle &= CASTLE_MASK[from] & CASTLE_MASK[to];
      lo ^= Z_CASTLE_LO[this.castle];
      hi ^= Z_CASTLE_HI[this.castle];

      this.ep = flags & F_DOUBLE ? (from + to) >> 1 : -1;
      if (this.ep >= 0) {
        lo ^= Z_EP_LO[this.ep];
        hi ^= Z_EP_HI[this.ep];
      }
      this.half = (piece & 7) === PAWN || captured ? 0 : this.half + 1;
      if (us === BLACK) this.full++;
      this.side = them;
      lo ^= Z_SIDE_LO;
      hi ^= Z_SIDE_HI;
      this.hashLo = lo;
      this.hashHi = hi;
      this.histLo.push(lo);
      this.histHi.push(hi);

      if (this.attacked(this.kings[us >> 3], them)) {
        this.unmake(m);
        return false;
      }
      return true;
    }

    unmake(m) {
      const b = this.board;
      const from = mFrom(m);
      const to = mTo(m);
      const flags = mFlags(m);
      const them = this.side;
      const us = them ^ 8;
      const u = this.undo;
      const hashHi = u.pop();
      const hashLo = u.pop();
      const half = u.pop();
      const ep = u.pop();
      const castle = u.pop();
      const captured = u.pop();
      this.histLo.pop();
      this.histHi.pop();

      const placed = b[to];
      b[from] = flags & F_PROMO ? us | PAWN : placed;
      b[to] = 0;
      if (flags & F_EP) b[us === WHITE ? to - 16 : to + 16] = captured;
      else b[to] = captured;
      if (flags & F_CASTLE) {
        const rookFrom = to > from ? to + 1 : to - 2;
        const rookTo = to > from ? to - 1 : to + 1;
        b[rookFrom] = b[rookTo];
        b[rookTo] = 0;
      }
      if ((b[from] & 7) === KING) this.kings[us >> 3] = from;
      if (us === BLACK) this.full--;
      this.side = us;
      this.castle = castle;
      this.ep = ep;
      this.half = half;
      this.hashLo = hashLo;
      this.hashHi = hashHi;
    }

    makeNull() {
      this.undo.push(0, this.castle, this.ep, this.half, this.hashLo, this.hashHi);
      if (this.ep >= 0) {
        this.hashLo ^= Z_EP_LO[this.ep];
        this.hashHi ^= Z_EP_HI[this.ep];
      }
      this.ep = -1;
      this.half = 0; // tekrar taraması boş hamlenin ötesine geçmesin
      this.side ^= 8;
      this.hashLo ^= Z_SIDE_LO;
      this.hashHi ^= Z_SIDE_HI;
      this.histLo.push(this.hashLo);
      this.histHi.push(this.hashHi);
    }

    unmakeNull() {
      const u = this.undo;
      this.hashHi = u.pop();
      this.hashLo = u.pop();
      this.half = u.pop();
      this.ep = u.pop();
      this.castle = u.pop();
      u.pop();
      this.histLo.pop();
      this.histHi.pop();
      this.side ^= 8;
    }

    /** Bu konum, son geri dönüşsüz hamleden beri kaç kez daha görüldü? */
    repetitions() {
      const lo = this.histLo;
      const hi = this.histHi;
      const last = lo.length - 1;
      const limit = Math.max(0, last - this.half);
      let count = 0;
      for (let i = last - 2; i >= limit; i -= 2) {
        if (lo[i] === this.hashLo && hi[i] === this.hashHi) count++;
      }
      return count;
    }

    insufficientMaterial() {
      let minors = 0;
      let bishopColors = 0; // bit 1: açık kare fili, bit 2: koyu kare fili
      let bishops = 0;
      for (let sq = 0; sq < 128; sq++) {
        if (sq & 0x88) {
          sq += 7;
          continue;
        }
        const t = this.board[sq] & 7;
        if (!t || t === KING) continue;
        if (t === PAWN || t === ROOK || t === QUEEN) return false;
        minors++;
        if (t === BISHOP) {
          bishops++;
          bishopColors |= (rankOf(sq) + fileOf(sq)) & 1 ? 1 : 2;
        }
      }
      if (minors <= 1) return true;
      return bishops === minors && bishopColors !== 3;
    }

    legalMoves() {
      const buf = new Int32Array(256);
      const n = this.generate(buf, false);
      const out = [];
      for (let i = 0; i < n; i++) {
        if (this.make(buf[i])) {
          this.unmake(buf[i]);
          out.push(buf[i]);
        }
      }
      return out;
    }

    /** Standart cebirsel gösterim (SAN): Nf3, exd5, O-O, e8=Q+, Qh7# */
    san(m, legal) {
      legal = legal || this.legalMoves();
      const from = mFrom(m);
      const to = mTo(m);
      const flags = mFlags(m);
      const type = this.board[from] & 7;
      let s;
      if (flags & F_CASTLE) {
        s = to > from ? 'O-O' : 'O-O-O';
      } else {
        s = '';
        if (type !== PAWN) {
          s = ' PNBRQK'[type];
          let sameFile = false;
          let sameRank = false;
          let ambiguous = false;
          for (const o of legal) {
            if (o === m || mTo(o) !== to || mFrom(o) === from) continue;
            if ((this.board[mFrom(o)] & 7) !== type) continue;
            ambiguous = true;
            if (fileOf(mFrom(o)) === fileOf(from)) sameFile = true;
            if (rankOf(mFrom(o)) === rankOf(from)) sameRank = true;
          }
          if (ambiguous) {
            if (!sameFile) s += 'abcdefgh'[fileOf(from)];
            else if (!sameRank) s += rankOf(from) + 1;
            else s += squareName(from);
          }
        }
        if (flags & F_CAP) {
          if (type === PAWN) s += 'abcdefgh'[fileOf(from)];
          s += 'x';
        }
        s += squareName(to);
        if (flags & F_PROMO) s += '=' + ' PNBRQK'[mPromo(m)];
      }
      this.make(m);
      if (this.inCheck()) s += this.legalMoves().length ? '+' : '#';
      this.unmake(m);
      return s;
    }
  }

  function squareName(sq) {
    return 'abcdefgh'[fileOf(sq)] + (rankOf(sq) + 1);
  }

  // --- Değerlendirme (Tomasz Michniewski'nin basitleştirilmiş tabloları; 8. sıra en üstte) ---
  const PST = [
    null,
    // piyon
    [
      0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0,
      0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    // at
    [
      -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20,
      15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30,
      -30, -30, -30, -40, -50,
    ],
    // fil
    [
      -20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5,
      -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10,
      -10, -10, -20,
    ],
    // kale
    [
      0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0,
      0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0,
    ],
    // vezir
    [
      -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0,
      5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20,
    ],
    // şah (oyun ortası)
    [
      -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30,
      -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0,
      0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20,
    ],
  ];
  const KING_END = [
    -50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30,
    40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30,
    -50, -30, -30, -30, -30, -30, -30, -50,
  ];
  const PASSED = [0, 5, 10, 20, 35, 60, 100, 0];
  const CENTER_DIST = (sq) => Math.max(3 - Math.min(fileOf(sq), 7 - fileOf(sq)), 3 - Math.min(rankOf(sq), 7 - rankOf(sq)));

  // Değerlendirme sırasında tekrar tekrar ayırmamak için sabit tampon.
  const pawnMin = [new Int8Array(8), new Int8Array(8)]; // her sütunda en geri piyonun (göreli) sırası
  const pawnMax = [new Int8Array(8), new Int8Array(8)];
  const pawnCount = [new Int8Array(8), new Int8Array(8)];

  /** Hamle sırası kimdeyse onun açısından puan (santipiyon). */
  function evaluate(pos) {
    const b = pos.board;
    let mg = 0; // beyaz açısından
    let king = [0, 0];
    let kingEnd = [0, 0];
    let phase = 0;
    let bishops = [0, 0];
    let material = [0, 0];
    for (let c = 0; c < 2; c++) {
      pawnCount[c].fill(0);
      pawnMin[c].fill(8);
      pawnMax[c].fill(-1);
    }

    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7;
        continue;
      }
      const p = b[sq];
      if (!p) continue;
      const type = p & 7;
      const c = p >> 3;
      const r = rankOf(sq);
      const f = fileOf(sq);
      const idx = c === 0 ? (7 - r) * 8 + f : r * 8 + f;
      phase += PHASE[type];
      if (type === KING) {
        king[c] = PST[KING][idx];
        kingEnd[c] = KING_END[idx];
        continue;
      }
      const v = VALUE[type] + PST[type][idx];
      material[c] += VALUE[type];
      mg += c === 0 ? v : -v;
      if (type === BISHOP) bishops[c]++;
      if (type === PAWN) {
        const rel = c === 0 ? r : 7 - r;
        pawnCount[c][f]++;
        if (rel < pawnMin[c][f]) pawnMin[c][f] = rel;
        if (rel > pawnMax[c][f]) pawnMax[c][f] = rel;
      }
    }

    if (phase > 24) phase = 24;
    const endW = 24 - phase; // 0 = açılış, 24 = oyun sonu
    let score = mg;
    score += ((king[0] - king[1]) * phase + (kingEnd[0] - kingEnd[1]) * endW) / 24;
    if (bishops[0] >= 2) score += 30;
    if (bishops[1] >= 2) score -= 30;

    // Piyon yapısı: geçer, çift, izole.
    for (let c = 0; c < 2; c++) {
      const o = 1 - c;
      const sign = c === 0 ? 1 : -1;
      for (let f = 0; f < 8; f++) {
        const cnt = pawnCount[c][f];
        if (!cnt) continue;
        if (cnt > 1) score -= sign * 12 * (cnt - 1);
        const left = f > 0 ? pawnCount[c][f - 1] : 0;
        const right = f < 7 ? pawnCount[c][f + 1] : 0;
        if (!left && !right) score -= sign * 10 * cnt;
        // en ileri piyon: rakibin önündeki 3 sütunda onu durduracak piyon yoksa geçer piyon
        const rel = pawnMax[c][f];
        let passed = true;
        for (let g = Math.max(0, f - 1); g <= Math.min(7, f + 1) && passed; g++) {
          // rakibin en geride kalan piyonu (bizim açımızdan en ileride) bizimkinin önündeyse yol kapalı
          if (pawnCount[o][g] && 7 - pawnMin[o][g] > rel) passed = false;
        }
        if (passed) score += (sign * PASSED[rel] * (12 + endW)) / 24;
      }
    }

    // Oyun sonu "temizlik": öndeki taraf rakip şahı kenara itsin, kendi şahını yaklaştırsın.
    if (endW >= 14) {
      const diff = material[0] - material[1];
      if (Math.abs(diff) >= 300) {
        const strong = diff > 0 ? 0 : 1;
        const weakKing = pos.kings[1 - strong];
        const strongKing = pos.kings[strong];
        const dist =
          Math.abs(fileOf(weakKing) - fileOf(strongKing)) + Math.abs(rankOf(weakKing) - rankOf(strongKing));
        const bonus = CENTER_DIST(weakKing) * 12 + (14 - dist) * 5;
        score += strong === 0 ? bonus : -bonus;
      }
    }

    return pos.side === WHITE ? score : -score;
  }

  // --- Arama ---
  const MATE = 100000;
  const INF = 1000000;
  const MAX_PLY = 64;
  const TT_BITS = 18;
  const TT_SIZE = 1 << TT_BITS;
  const TT_MASK = TT_SIZE - 1;
  const TT_EXACT = 1;
  const TT_LOWER = 2;
  const TT_UPPER = 3;

  class Searcher {
    constructor() {
      this.ttLo = new Int32Array(TT_SIZE);
      this.ttHi = new Int32Array(TT_SIZE);
      this.ttMove = new Int32Array(TT_SIZE);
      this.ttScore = new Int32Array(TT_SIZE);
      this.ttDepth = new Int8Array(TT_SIZE);
      this.ttFlag = new Int8Array(TT_SIZE);
      this.moveBuf = [];
      this.scoreBuf = [];
      for (let i = 0; i <= MAX_PLY + 8; i++) {
        this.moveBuf.push(new Int32Array(256));
        this.scoreBuf.push(new Int32Array(256));
      }
      this.killers = new Int32Array((MAX_PLY + 8) * 2);
      this.history = new Int32Array(16 * 128);
    }

    reset() {
      this.ttFlag.fill(0);
      this.killers.fill(0);
      this.history.fill(0);
    }

    noise(pos) {
      if (!this.noiseAmp) return 0;
      const h = Math.imul(pos.hashLo ^ this.noiseSeed, 0x9e3779b1) >>> 0;
      return (h % (this.noiseAmp * 2 + 1)) - this.noiseAmp;
    }

    eval(pos) {
      return evaluate(pos) + this.noise(pos);
    }

    timeUp() {
      if ((++this.nodes & 1023) === 0 && Date.now() > this.deadline) this.stopped = true;
      return this.stopped;
    }

    orderMoves(pos, moves, scores, n, ttMove, ply) {
      const b = pos.board;
      const k1 = this.killers[ply * 2];
      const k2 = this.killers[ply * 2 + 1];
      for (let i = 0; i < n; i++) {
        const m = moves[i];
        const flags = mFlags(m);
        let s;
        if (m === ttMove) s = 2000000;
        else if (flags & F_CAP) {
          const victim = flags & F_EP ? PAWN : b[mTo(m)] & 7;
          s = 1000000 + VALUE[victim] * 10 - (b[mFrom(m)] & 7);
        } else if (flags & F_PROMO) s = 900000 + mPromo(m);
        else if (m === k1) s = 800000;
        else if (m === k2) s = 700000;
        else s = this.history[b[mFrom(m)] * 128 + mTo(m)];
        scores[i] = s;
      }
    }

    pick(moves, scores, n, i) {
      let best = i;
      for (let j = i + 1; j < n; j++) if (scores[j] > scores[best]) best = j;
      if (best !== i) {
        const m = moves[i];
        moves[i] = moves[best];
        moves[best] = m;
        const s = scores[i];
        scores[i] = scores[best];
        scores[best] = s;
      }
      return moves[i];
    }

    quiesce(pos, alpha, beta, ply) {
      if (this.timeUp()) return 0;
      const inCheck = pos.inCheck();
      if (ply >= MAX_PLY) return this.eval(pos);
      let best = -INF;
      if (!inCheck) {
        const stand = this.eval(pos);
        if (stand >= beta) return stand;
        if (stand > alpha) alpha = stand;
        best = stand;
      }
      const moves = this.moveBuf[ply];
      const scores = this.scoreBuf[ply];
      const n = pos.generate(moves, !inCheck);
      this.orderMoves(pos, moves, scores, n, 0, ply);
      let legal = 0;
      for (let i = 0; i < n; i++) {
        const m = this.pick(moves, scores, n, i);
        if (!pos.make(m)) continue;
        legal++;
        const score = -this.quiesce(pos, -beta, -alpha, ply + 1);
        pos.unmake(m);
        if (this.stopped) return 0;
        if (score > best) best = score;
        if (score > alpha) {
          alpha = score;
          if (score >= beta) return score;
        }
      }
      if (inCheck && !legal) return -MATE + ply;
      return best;
    }

    negamax(pos, depth, alpha, beta, ply, allowNull) {
      if (ply > 0) {
        if (pos.half >= 100 || pos.repetitions() > 0 || pos.insufficientMaterial()) return 0;
      }
      const inCheck = pos.inCheck();
      if (inCheck) depth++;
      if (depth <= 0) return this.quiesce(pos, alpha, beta, ply);
      if (this.timeUp()) return 0;
      if (ply >= MAX_PLY) return this.eval(pos);

      const idx = pos.hashLo & TT_MASK;
      let ttMove = 0;
      if (this.ttFlag[idx] && this.ttLo[idx] === pos.hashLo && this.ttHi[idx] === pos.hashHi) {
        ttMove = this.ttMove[idx];
        if (ply > 0 && this.ttDepth[idx] >= depth) {
          let s = this.ttScore[idx];
          if (s > MATE - 1000) s -= ply;
          else if (s < -MATE + 1000) s += ply;
          const flag = this.ttFlag[idx];
          if (flag === TT_EXACT) return s;
          if (flag === TT_LOWER && s >= beta) return s;
          if (flag === TT_UPPER && s <= alpha) return s;
        }
      }

      const pvNode = beta - alpha > 1;
      if (this.useNull && allowNull && !pvNode && !inCheck && depth >= 3 && ply > 0 && this.hasPieces(pos)) {
        if (this.eval(pos) >= beta) {
          pos.makeNull();
          const score = -this.negamax(pos, depth - 3, -beta, -beta + 1, ply + 1, false);
          pos.unmakeNull();
          if (this.stopped) return 0;
          if (score >= beta) return beta;
        }
      }

      const moves = this.moveBuf[ply];
      const scores = this.scoreBuf[ply];
      const n = pos.generate(moves, false);
      this.orderMoves(pos, moves, scores, n, ttMove, ply);

      const alphaOrig = alpha;
      let best = -INF;
      let bestMove = 0;
      let legal = 0;
      for (let i = 0; i < n; i++) {
        const m = this.pick(moves, scores, n, i);
        if (!pos.make(m)) continue;
        legal++;
        const quiet = !(mFlags(m) & (F_CAP | F_PROMO));
        let score;
        if (legal === 1) {
          score = -this.negamax(pos, depth - 1, -beta, -alpha, ply + 1, true);
        } else {
          let reduction = 0;
          if (this.useLmr && depth >= 3 && legal > 3 && quiet && !inCheck && !pos.inCheck()) {
            reduction = legal > 8 ? 2 : 1;
          }
          score = -this.negamax(pos, depth - 1 - reduction, -alpha - 1, -alpha, ply + 1, true);
          if (score > alpha && (reduction || score < beta)) {
            score = -this.negamax(pos, depth - 1, -beta, -alpha, ply + 1, true);
          }
        }
        pos.unmake(m);
        if (this.stopped) return 0;
        if (score > best) {
          best = score;
          bestMove = m;
          if (ply === 0) this.rootBest = m;
        }
        if (score > alpha) {
          alpha = score;
          if (score >= beta) {
            if (quiet) {
              if (this.killers[ply * 2] !== m) {
                this.killers[ply * 2 + 1] = this.killers[ply * 2];
                this.killers[ply * 2] = m;
              }
              const h = pos.board[mFrom(m)] * 128 + mTo(m);
              this.history[h] = Math.min(this.history[h] + depth * depth, 600000);
            }
            break;
          }
        }
      }

      if (!legal) return inCheck ? -MATE + ply : 0;

      let stored = best;
      if (stored > MATE - 1000) stored += ply;
      else if (stored < -MATE + 1000) stored -= ply;
      this.ttLo[idx] = pos.hashLo;
      this.ttHi[idx] = pos.hashHi;
      this.ttMove[idx] = bestMove;
      this.ttScore[idx] = stored;
      this.ttDepth[idx] = depth;
      this.ttFlag[idx] = best >= beta ? TT_LOWER : best > alphaOrig ? TT_EXACT : TT_UPPER;
      return best;
    }

    hasPieces(pos) {
      const us = pos.side;
      for (let sq = 0; sq < 128; sq++) {
        if (sq & 0x88) {
          sq += 7;
          continue;
        }
        const p = pos.board[sq];
        if (p && (p & 8) === us && (p & 7) !== PAWN && (p & 7) !== KING) return true;
      }
      return false;
    }

    /** Derinleştirerek arama. opts: { maxDepth, timeMs, noise, seed, nullMove, lmr } */
    search(pos, opts) {
      this.reset();
      this.nodes = 0;
      this.stopped = false;
      this.deadline = Date.now() + (opts.timeMs || 1000);
      this.noiseAmp = opts.noise || 0;
      this.noiseSeed = opts.seed || 0;
      this.useNull = !!opts.nullMove;
      this.useLmr = !!opts.lmr;
      let bestMove = 0;
      let bestScore = 0;
      let reached = 0;
      for (let depth = 1; depth <= (opts.maxDepth || 64); depth++) {
        this.rootBest = 0;
        const score = this.negamax(pos, depth, -INF, INF, 0, false);
        if (this.stopped && depth > 1) break;
        if (this.rootBest) {
          bestMove = this.rootBest;
          bestScore = score;
          reached = depth;
        }
        if (this.stopped) break;
        if (Math.abs(score) > MATE - 1000) break; // mat bulundu
      }
      return { move: bestMove, score: bestScore, depth: reached, nodes: this.nodes };
    }

    /** Her kök hamlesini sığ ve tam pencereyle puanlar (kolay seviye için). */
    scoreRoot(pos) {
      this.reset();
      this.nodes = 0;
      this.stopped = false;
      this.deadline = Date.now() + 5000;
      this.noiseAmp = 0;
      this.useNull = false;
      this.useLmr = false;
      const out = [];
      for (const m of pos.legalMoves()) {
        pos.make(m);
        let s;
        if (!pos.legalMoves().length) s = pos.inCheck() ? MATE : 0;
        else s = -this.quiesce(pos, -INF, INF, 1);
        pos.unmake(m);
        out.push({ move: m, score: s });
      }
      return out;
    }
  }

  // --- Zorluk seviyeleri ---
  const LEVELS = {
    // Kolay: bir hamle ilerisine bakar, bolca rastgelelik ve ara sıra tamamen rastgele hamle.
    easy: { kind: 'shallow', spread: 160, randomChance: 0.22, minMs: 450 },
    // Orta: 3 hamle derinlik, hafif "gürültülü" değerlendirme.
    medium: { kind: 'search', maxDepth: 3, timeMs: 1200, noise: 35, nullMove: false, lmr: false, minMs: 500 },
    // Zor: zaman sınırlı derinleştirme, tüm budamalar açık, gürültü sadece açılış çeşitliliği kadar.
    hard: { kind: 'search', maxDepth: 64, timeMs: 1800, noise: 6, nullMove: true, lmr: true, minMs: 400 },
  };

  let searcher = null;

  function gaussian(rng) {
    const u = Math.max(rng(), 1e-9);
    const v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Yapay zekanın hamlesi. rng: 0..1 üreten fonksiyon (varsayılan Math.random). */
  function think(pos, levelName, seed, rng) {
    rng = rng || Math.random;
    const level = LEVELS[levelName] || LEVELS.medium;
    const legal = pos.legalMoves();
    if (!legal.length) return { move: 0 };
    if (legal.length === 1) return { move: legal[0], depth: 0 };
    searcher = searcher || new Searcher();

    if (level.kind === 'shallow') {
      if (rng() < level.randomChance) return { move: legal[Math.floor(rng() * legal.length)], depth: 0 };
      const scored = searcher.scoreRoot(pos);
      let best = scored[0];
      let bestVal = -Infinity;
      for (const s of scored) {
        const v = s.score + gaussian(rng) * level.spread;
        if (v > bestVal) {
          bestVal = v;
          best = s;
        }
      }
      return { move: best.move, score: best.score, depth: 1 };
    }

    return searcher.search(pos, {
      maxDepth: level.maxDepth,
      timeMs: level.timeMs,
      noise: level.noise,
      seed: seed | 0,
      nullMove: level.nullMove,
      lmr: level.lmr,
    });
  }

  /** Hata ayıklama: belirli derinlikte yaprak sayısı (kural motorunu doğrulamak için). */
  function perft(pos, depth) {
    if (depth === 0) return 1;
    const buf = new Int32Array(256);
    const n = pos.generate(buf, false);
    let count = 0;
    for (let i = 0; i < n; i++) {
      if (!pos.make(buf[i])) continue;
      count += perft(pos, depth - 1);
      pos.unmake(buf[i]);
    }
    return count;
  }

  root.MontyChess = {
    WHITE,
    BLACK,
    PAWN,
    KNIGHT,
    BISHOP,
    ROOK,
    QUEEN,
    KING,
    F_CAP,
    F_EP,
    F_CASTLE,
    F_DOUBLE,
    F_PROMO,
    START_FEN,
    LEVELS,
    Position,
    mFrom,
    mTo,
    mPromo,
    mFlags,
    squareName,
    evaluate,
    think,
    perft,
  };
})(typeof self !== 'undefined' ? self : this);
