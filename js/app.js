const $ = (id) => document.getElementById(id);
const N = 4;
let board,
  score,
  best = Number(localStorage.getItem("2048-play-best") || 0),
  moves = 0,
  merges = 0,
  history = [],
  branch = 0,
  lastChanged = [],
  lastMerged = [];
const dirs = ["up", "right", "down", "left"];
const glyph = { up: "↑", right: "→", down: "↓", left: "←" };
const names = { up: "UP", right: "RIGHT", down: "DOWN", left: "LEFT" };
function blank() {
  return Array.from({ length: N }, () => Array(N).fill(0));
}
function clone(b) {
  return b.map((r) => r.slice());
}
function emptyCount(b) {
  return b.flat().filter((x) => !x).length;
}
function spawn() {
  let e = [];
  board.forEach((r, y) =>
    r.forEach((v, x) => {
      if (!v) e.push([y, x]);
    }),
  );
  if (!e.length) return;
  let [y, x] = e[Math.floor(Math.random() * e.length)];
  board[y][x] = Math.random() < 0.9 ? 2 : 4;
  return [y, x];
}
function snapshot() {
  return { board: clone(board), score, moves, merges };
}
function save() {
  history.push(snapshot());
  if (history.length > 100) history.shift();
  $("undoBtn").disabled = !history.length;
}
function newGame() {
  board = blank();
  score = 0;
  moves = 0;
  merges = 0;
  history = [];
  branch = 0;
  spawn();
  spawn();
  lastChanged = [];
  lastMerged = [];
  render();
  invalidateTree(
    "New game started. Generate a tree to explore this new board.",
  );
  coach(
    "Make your first move",
    "Watch the board. After a move, I’ll point out the DSA idea that just happened — no lecture required.",
    "WAITING",
    "Try any direction to begin.",
  );
  $("backtrackNote").innerHTML =
    "Your move history will appear here. Use <b>↶ Backtrack</b> after making a move.";
  $("undoBtn").disabled = true;
  renderCandidates();
  $("endModal").classList.add("hidden");
}
function slideLine(line) {
  let vals = line.filter((v) => v !== 0),
    out = [],
    gained = 0,
    merged = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === vals[i + 1]) {
      out.push(vals[i] * 2);
      gained += vals[i] * 2;
      merged++;
      i++;
    } else out.push(vals[i]);
  }
  while (out.length < N) out.push(0);
  return { out, gained, merged, compressed: vals };
}
function moveBoard(src, dir) {
  let b = clone(src),
    gained = 0,
    mergeCount = 0,
    changed = [];
  for (let k = 0; k < N; k++) {
    let coords = [];
    for (let t = 0; t < N; t++) {
      let y, x;
      if (dir === "left") {
        y = k;
        x = t;
      } else if (dir === "right") {
        y = k;
        x = N - 1 - t;
      } else if (dir === "up") {
        y = t;
        x = k;
      } else {
        y = N - 1 - t;
        x = k;
      }
      coords.push([y, x]);
    }
    let line = coords.map(([y, x]) => b[y][x]),
      res = slideLine(line);
    gained += res.gained;
    mergeCount += res.merged;
    coords.forEach(([y, x], i) => {
      if (b[y][x] !== res.out[i]) changed.push([y, x]);
      b[y][x] = res.out[i];
    });
  }
  return {
    board: b,
    gained,
    mergeCount,
    changed,
    valid: JSON.stringify(src) !== JSON.stringify(b),
  };
}
function handleMove(dir, source = "player") {
  if (!board) return;
  let result = moveBoard(board, dir);
  if (!result.valid) {
    if (source === "player")
      toast("No tiles can move that way. Try another direction.");
    return false;
  }
  save();
  board = result.board;
  score += result.gained;
  moves++;
  merges += result.mergeCount;
  lastChanged = result.changed;
  lastMerged = result.mergeCount ? result.changed.slice() : [];
  let spawned = spawn();
  render();
  updateTimeline();
  $("undoBtn").disabled = !history.length;
  invalidateTree(
    "The game board changed. Generate a fresh tree to explore this position.",
  );
  let title, body, pill, visual;
  if (source === "greedy") {
    title = `Greedy picked ${names[dir]}`;
    body = `It chose the highest-scoring immediate option from the moves available now. It gained ${result.gained} points and made ${result.mergeCount} merge${result.mergeCount === 1 ? "" : "s"}. Notice: a locally best move can still lead to a poor future board.`;
    pill = "GREEDY MOVE";
    visual = `<div class="mini-arrow">${glyph[dir]}</div><div><b>Chosen because its immediate evaluation was highest</b><small>Try a different move after Backtrack and compare the outcome.</small></div>`;
  } else {
    title = `You moved ${names[dir]}`;
    body = `The game scanned each row/column in order, compressed non-zero values, then merged equal neighbours. ${result.mergeCount ? `You created ${result.mergeCount} merge${result.mergeCount === 1 ? "" : "s"} and earned ${result.gained} points.` : "No tiles merged this turn."} A new tile appeared${spawned ? ` at row ${spawned[0] + 1}, column ${spawned[1] + 1}` : ""}.`;
    pill = result.mergeCount ? "MERGE DETECTED" : "MATRIX UPDATED";
    visual = `<div class="mini-arrow">${glyph[dir]}</div><div><b>${result.mergeCount ? `${result.mergeCount} merge${result.mergeCount === 1 ? "" : "s"}: ${result.gained} points` : "Tiles compressed in the chosen direction"}</b><small>2D array traversal → compress → merge → spawn.</small></div>`;
  }
  coach(title, body, pill, visual);
  renderCandidates();
  if (isGameOver()) {
    setTimeout(() => {
      $("endTitle").textContent = "No more moves";
      $("endText").textContent =
        `Final score: ${score}. Start a new game and try a different strategy.`;
      $("endModal").classList.remove("hidden");
    }, 250);
  }
  return true;
}
function coach(title, body, pill, visual) {
  $("coachTitle").textContent = title;
  $("coachText").textContent = body;
  $("eventPill").textContent = pill;
  $("eventVisual").innerHTML = visual;
}
function isGameOver() {
  if (emptyCount(board)) return false;
  return dirs.every((d) => !moveBoard(board, d).valid);
}
function render() {
  let el = $("board");
  el.innerHTML = "";
  board.forEach((row, y) =>
    row.forEach((v, x) => {
      let c = document.createElement("div");
      c.className =
        "cell" +
        (v ? " filled v" + v : "") +
        (lastChanged.some((p) => p[0] === y && p[1] === x) ? " changed" : "") +
        (lastMerged.some((p) => p[0] === y && p[1] === x) ? " merged" : "");
      c.setAttribute("role", "gridcell");
      c.textContent = v || "";
      el.appendChild(c);
    }),
  );
  $("score").textContent = score;
  $("best").textContent = best;
  $("moves").textContent = moves;
  $("merges").textContent = merges;
  $("empty").textContent = emptyCount(board);
  if (score > best) {
    best = score;
    localStorage.setItem("2048-play-best", best);
    $("best").textContent = best;
  }
  $("status").textContent = isGameOver()
    ? "No moves left — try again"
    : "Your turn — choose a direction";
}
function evaluate(src, dir) {
  let r = moveBoard(src, dir);
  if (!r.valid) return null;
  let b = r.board,
    empty = emptyCount(b),
    smooth = 0,
    mono = 0;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (!b[y][x]) continue;
      if (x + 1 < N && b[y][x + 1])
        smooth -= Math.abs(Math.log2(b[y][x]) - Math.log2(b[y][x + 1]));
      if (y + 1 < N && b[y + 1][x])
        smooth -= Math.abs(Math.log2(b[y][x]) - Math.log2(b[y + 1][x]));
    }
  for (let row of b) {
    let vals = row.filter(Boolean).map(Math.log2);
    for (let i = 1; i < vals.length; i++)
      mono -= Math.abs(vals[i] - vals[i - 1]);
  }
  let value = r.gained * 1.8 + empty * 2.4 + smooth * 0.35 + mono * 0.12;
  return { dir, value, r, empty };
}
function evaluations() {
  return dirs
    .map((d) => evaluate(board, d))
    .filter(Boolean)
    .sort((a, b) => b.value - a.value);
}
function renderCandidates() {
  let all = evaluations(),
    bestMove = all[0];
  $("candidates").innerHTML = "";
  if (!all.length) {
    $("candidates").innerHTML =
      '<div class="candidate-empty">No legal moves. Start a new game.</div>';
    $("greedyBtn").disabled = true;
    return;
  }
  $("greedyBtn").disabled = false;
  dirs.forEach((d) => {
    let e = all.find((a) => a.dir === d),
      node = document.createElement("div");
    node.className =
      "candidate" + (bestMove && bestMove.dir === d ? " best" : "");
    node.innerHTML = `<b>${glyph[d]} ${names[d]}</b><small>${e ? `value ${e.value.toFixed(1)}` : "blocked"}</small>`;
    $("candidates").appendChild(node);
  });
  $("greedyBtn").dataset.dir = bestMove.dir;
}
function greedyMove() {
  let d = $("greedyBtn").dataset.dir;
  if (!d) return;
  let e = evaluate(board, d);
  if (!e) return;
  toast(`Greedy compares legal moves and selects ${names[d]}.`);
  handleMove(d, "greedy");
}
function backtrack() {
  if (!history.length) {
    toast("Nothing to rewind yet. Make a move first.");
    return;
  }
  let current = snapshot(),
    prev = history.pop();
  board = clone(prev.board);
  score = prev.score;
  moves = prev.moves;
  merges = prev.merges;
  branch++;
  lastChanged = [];
  lastMerged = [];
  render();
  renderCandidates();
  invalidateTree(
    "Backtracking restored an earlier board. Generate a fresh tree for this position.",
  );
  $("undoBtn").disabled = !history.length;
  coach(
    "Backtracked one move",
    "The latest state was popped from the history stack (LIFO). The board and score returned to the earlier snapshot. Now choose a different direction to explore another path.",
    "STATE RESTORED",
    `<div class="mini-arrow">↶</div><div><b>Previous board restored</b><small>One future branch was abandoned. Try another move from here.</small></div>`,
  );
  $("backtrackNote").innerHTML =
    `<b>Rewind complete.</b> Move ${current.moves} was undone. You are back at move ${moves}. Make a different move to explore a new branch.`;
  updateTimeline();
  toast("Backtracked: previous board restored. Try another direction.");
}
function updateTimeline() {
  let t = $("timeline");
  let start = '<span class="time-node active">START</span>';
  let line = '<span class="time-line"></span>';
  let end = `<span class="time-node active">MOVE ${moves}</span>`;
  if (moves === 0) end = '<span class="time-node">NEXT MOVE</span>';
  t.innerHTML = start + line + end;
}
let toastTimer;
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2300);
}
document.addEventListener("keydown", (e) => {
  let d = {
    ArrowUp: "up",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowLeft: "left",
  }[e.key];
  if (d) {
    e.preventDefault();
    handleMove(d);
  }
});
$("board").addEventListener(
  "touchstart",
  (e) => {
    window.touchStart = [
      e.changedTouches[0].clientX,
      e.changedTouches[0].clientY,
    ];
  },
  { passive: true },
);
$("board").addEventListener(
  "touchend",
  (e) => {
    if (!window.touchStart) return;
    let dx = e.changedTouches[0].clientX - window.touchStart[0],
      dy = e.changedTouches[0].clientY - window.touchStart[1];
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 28)
      handleMove(
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? "right"
            : "left"
          : dy > 0
            ? "down"
            : "up",
      );
    window.touchStart = null;
  },
  { passive: true },
);
document
  .querySelectorAll("[data-dir]")
  .forEach((b) => b.addEventListener("click", () => handleMove(b.dataset.dir)));
$("undoBtn").addEventListener("click", backtrack);
$("newBtn").addEventListener("click", newGame);
$("modalNew").addEventListener("click", newGame);
$("greedyBtn").addEventListener("click", greedyMove);
// ---------------- CONNECTED MULTI-LEVEL STATE SPACE TREE ----------------
let stateTree = null,
  treeTimers = [],
  traversalRun = 0;
function clearTreeTimers() {
  treeTimers.forEach(clearTimeout);
  treeTimers = [];
  traversalRun++;
}
function invalidateTree(message) {
  clearTreeTimers();
  stateTree = null;
  $("treeCanvas").innerHTML =
    '<div class="tree-placeholder">Generate a tree to see every explored path.</div>';
  $("treeStatus").textContent = message;
  ["guidedBtn", "bfsBtn", "dfsBtn", "allPathsBtn", "bestPathBtn"].forEach(
    (id) => {
      if ($(id)) $(id).disabled = true;
    },
  );
  $("treeNodes").textContent = "0";
  $("treeBest").textContent = "—";
  $("treeTraversal").textContent = "—";
  $("treeDetailTitle").textContent = "How to read this tree";
  $("treeDetail").textContent =
    "Start at the top board. Follow connected lines down: move → random tile → next move. Green marks the best immediate choice at each decision; blue shows other legal choices; red marks a choice that is not best.";
}
function boardMarkup(b, extra = "") {
  return `<div class="mini-board ${extra}" data-board="${encodeURIComponent(JSON.stringify(b))}" title="Click to inspect this board">${b
    .flat()
    .map(
      (v) =>
        `<span class="mini-cell ${!v ? "empty" : v === 2 ? "t2" : v === 4 ? "t4" : v === 8 ? "t8" : v === 16 ? "t16" : v <= 64 ? "t32" : "high"}">${v || ""}</span>`,
    )
    .join("")}</div>`;
}
function addSampleTile(b, value) {
  const copy = clone(b);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (!copy[y][x]) {
        copy[y][x] = value;
        return copy;
      }
  return copy;
}
function makeTreeNode(type, label, b, meta = {}) {
  return {
    id: `n${Math.random().toString(36).slice(2, 10)}`,
    type,
    label,
    board: clone(b),
    meta,
    children: [],
    best: false,
  };
}
function buildDecisionChildren(parent, depth) {
  const opts = dirs
    .map((d) => evaluate(parent.board, d))
    .filter(Boolean)
    .sort((a, b) => b.value - a.value);
  if (!opts.length) return;
  parent.bestDir = opts[0].dir;
  opts.forEach((o) => {
    const move = makeTreeNode(
      depth === 2 ? "move" : "leaf",
      `${glyph[o.dir]} ${names[o.dir]}`,
      o.r.board,
      {
        dir: o.dir,
        value: o.value,
        gained: o.r.gained,
        merges: o.r.mergeCount,
        depth,
      },
    );
    move.best = o.dir === parent.bestDir;
    parent.children.push(move);
    if (depth === 2) {
      [2, 4].forEach((v) => {
        const chance = makeTreeNode(
          "chance",
          `NEW TILE +${v}`,
          addSampleTile(o.r.board, v),
          { spawn: v },
        );
        move.children.push(chance);
        buildDecisionChildren(chance, 1);
      });
    }
  });
}
function countLeaves(node) {
  if (!node.children.length) {
    node.leaves = 1;
    return 1;
  }
  node.leaves = node.children.reduce((s, c) => s + countLeaves(c), 0);
  return node.leaves;
}
function assignTreePositions(node, depth, left, slotWidth) {
  node.y = [24, 225, 455, 685][depth] ?? 685;
  if (!node.children.length) {
    node.x = left + slotWidth / 2;
    return node.x;
  }
  let cursor = left,
    centres = [];
  node.children.forEach((child) => {
    const span = child.leaves * slotWidth;
    centres.push(assignTreePositions(child, depth + 1, cursor, slotWidth));
    cursor += span;
  });
  node.x = (centres[0] + centres[centres.length - 1]) / 2;
  return node.x;
}
function flattenTree(root) {
  const out = [];
  function walk(n, p = null) {
    n.parent = p;
    out.push(n);
    n.children.forEach((c) => walk(c, n));
  }
  walk(root);
  return out;
}
function nodeCard(n) {
  const label = n.type === "root" ? "CURRENT BOARD" : n.label;
  const sub =
    n.type === "root"
      ? "LEVEL 0"
      : n.type === "move"
        ? `Value ${n.meta.value.toFixed(1)} · +${n.meta.gained} pts`
        : n.type === "chance"
          ? "RANDOM TILE OUTCOME"
          : `DEPTH 2 · ${n.meta.value.toFixed(1)}`;
  return `<div class="tree-node-card ${n.type} ${n.best ? "best-path" : ""}" data-node="${n.id}" style="left:${n.x - 66}px;top:${n.y}px">
    <div class="tree-node-title">${label}</div>${boardMarkup(n.board)}
    <div class="tree-node-sub">${sub}</div>
    ${n.type === "move" || n.type === "leaf" ? `<button class="tree-pick" data-pick="${n.id}" type="button">Choose ${names[n.meta.dir]}</button>` : ""}
  </div>`;
}
function renderConnectedTree(root) {
  countLeaves(root);
  const slot = 148,
    leafCount = root.leaves,
    width = Math.max(980, leafCount * slot + 100),
    height = 910;
  assignTreePositions(root, 0, 0, slot);
  const nodes = flattenTree(root);
  const edges = nodes
    .filter((n) => n.parent)
    .map((n) => {
      const p = n.parent,
        x1 = p.x,
        y1 = p.y + 165,
        x2 = n.x,
        y2 = n.y,
        mid = (y1 + y2) / 2;
      const edgeKind =
        n.type === "chance"
          ? "chance-edge"
          : n.best
            ? "preferred-edge"
            : "other-edge";
      return `<path class="tree-edge ${edgeKind}" data-edge="${p.id}-${n.id}" d="M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}"/>`;
    })
    .join("");
  $("treeCanvas").innerHTML =
    `<div class="connected-tree" style="width:${width}px;height:${height}px"><svg class="tree-links" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${edges}</svg>${nodes.map(nodeCard).join("")}</div>`;
  stateTree.nodes = nodes;
}
function revealTree() {
  const nodes = [...$("treeCanvas").querySelectorAll(".tree-node-card")],
    edges = [...$("treeCanvas").querySelectorAll(".tree-edge")];
  nodes.forEach((el, i) =>
    treeTimers.push(
      setTimeout(() => {
        el.classList.add("revealed");
        const edge = edges.find((e) =>
          e.dataset.edge.endsWith("-" + el.dataset.node),
        );
        if (edge) edge.classList.add("revealed");
      }, i * 75),
    ),
  );
  treeTimers.push(
    setTimeout(
      () => {
        $("treeStatus").innerHTML =
          `Tree ready: <b>${stateTree.nodes.length - 1} connected states</b> across two move levels. Follow the green path for the best immediate choice.`;
      },
      nodes.length * 75 + 200,
    ),
  );
}
function generateStateTree() {
  clearTreeTimers();
  const root = makeTreeNode("root", "CURRENT BOARD", board);
  buildDecisionChildren(root, 2);
  if (!root.children.length) {
    invalidateTree("No legal moves are available. Start a new game.");
    return;
  }
  stateTree = { root, best: root.bestDir, nodes: [] };
  renderConnectedTree(root);
  $("treeNodes").textContent = String(stateTree.nodes.length);
  $("treeBest").textContent = names[root.bestDir];
  $("treeTraversal").textContent = "Ready";
  $("treeStatus").textContent =
    "Building connected tree… follow each line from the current board to a move, a random tile outcome, and the next possible move.";
  $("treeDetailTitle").textContent = "The tree has 3 decision levels";
  $("treeDetail").textContent =
    "Level 0: current board. Level 1: every legal direction. Level 2: representative random +2/+4 outcomes. Level 3: every legal next move from those outcomes.";
  ["guidedBtn", "bfsBtn", "dfsBtn", "allPathsBtn", "bestPathBtn"].forEach(
    (id) => ($(id).disabled = false),
  );
  revealTree();
}
function inspectTreeBoard(el) {
  try {
    const b = JSON.parse(decodeURIComponent(el.dataset.board));
    $("treeDetailTitle").textContent = "Board selected";
    $("treeDetail").textContent =
      b
        .map((r, i) => `Row ${i + 1}: ${r.map((v) => v || "·").join(" | ")}`)
        .join("     ") + ". Empty cells are shown as dots.";
  } catch (e) {}
}
function getNode(id) {
  return stateTree?.nodes.find((n) => n.id === id);
}
function clearNodeStates() {
  document
    .querySelectorAll(".tree-node-card")
    .forEach((n) =>
      n.classList.remove("wrong-choice", "active-step", "traversing"),
    );
  document
    .querySelectorAll(".tree-edge")
    .forEach((e) =>
      e.classList.remove("wrong-edge", "best-edge", "active-edge"),
    );
}
function chooseTreeNode(id) {
  const n = getNode(id);
  if (!n || !["move", "leaf"].includes(n.type)) return;
  clearNodeStates();
  const parent = n.parent,
    correct = n.meta.dir === parent.bestDir,
    card = $("treeCanvas").querySelector(`[data-node="${id}"]`);
  if (correct) {
    card.classList.add("active-step");
    $("treeStatus").innerHTML =
      `<b class="good-text">✓ Correct choice: ${names[n.meta.dir]}.</b> Highest immediate evaluation from this board.`;
    $("treeDetailTitle").textContent = "Correct branch — green";
    $("treeDetail").textContent =
      `${names[n.meta.dir]} scores ${n.meta.value.toFixed(1)} and is the best immediate choice among ${parent.children.length} legal directions. Continue down its +2 or +4 outcome to choose the next move.`;
    const edge = $("treeCanvas").querySelector(
      `[data-edge="${parent.id}-${n.id}"]`,
    );
    if (edge) edge.classList.add("best-edge");
  } else {
    card.classList.add("wrong-choice");
    $("treeStatus").innerHTML =
      `<b class="bad-text">✕ Not the best immediate choice.</b> ${names[n.meta.dir]} is legal, but ${names[parent.bestDir]} has the highest evaluation here.`;
    $("treeDetailTitle").textContent = "Alternative branch — red";
    $("treeDetail").textContent =
      `This move is allowed in the game, but it is not the best Greedy choice at this node. Recommended direction: ${names[parent.bestDir]}.`;
    const edge = $("treeCanvas").querySelector(
      `[data-edge="${parent.id}-${n.id}"]`,
    );
    if (edge) edge.classList.add("wrong-edge");
  }
}
function startGuided() {
  if (!stateTree) return;
  $("treeStatus").innerHTML =
    "Guided mode: click any move card at either decision level. <b>Green</b> means best immediate move; <b>red</b> means another legal move.";
  toast("Choose a move card in the tree.");
}
function animateNodes(sequence, kind) {
  clearTreeTimers();
  const run = traversalRun;
  clearNodeStates();
  $("treeTraversal").textContent = kind;
  $("treeStatus").textContent = `${kind}: starting traversal…`;
  sequence.forEach((n, i) =>
    treeTimers.push(
      setTimeout(() => {
        if (run !== traversalRun) return;
        const el = $("treeCanvas").querySelector(`[data-node="${n.id}"]`);
        if (el) {
          el.classList.add("traversing");
          el.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
        $("treeDetailTitle").textContent =
          `${kind} · ${i + 1}/${sequence.length} · ${n.label}`;
        $("treeDetail").textContent =
          kind === "BFS"
            ? "Queue (FIFO): visit all nodes at the current depth before moving deeper."
            : "DFS: follow one connected branch down to its leaves, then return and explore the next branch.";
      }, i * 230),
    ),
  );
  treeTimers.push(
    setTimeout(
      () => {
        if (run !== traversalRun) return;
        document
          .querySelectorAll(".traversing")
          .forEach((e) => e.classList.remove("traversing"));
        $("treeStatus").innerHTML =
          `<b>${kind} traversal completed.</b> All displayed states were visited.`;
      },
      sequence.length * 230 + 200,
    ),
  );
}
function runTraversal(kind) {
  if (!stateTree) return;
  const seq = [];
  if (kind === "BFS") {
    const q = [stateTree.root];
    while (q.length) {
      const n = q.shift();
      seq.push(n);
      n.children.forEach((c) => q.push(c));
    }
  } else {
    const stack = [stateTree.root];
    while (stack.length) {
      const n = stack.pop();
      seq.push(n);
      [...n.children].reverse().forEach((c) => stack.push(c));
    }
  }
  animateNodes(seq, kind);
}
function animateBestPath() {
  if (!stateTree) return;
  clearTreeTimers();
  clearNodeStates();
  $("treeTraversal").textContent = "BEST PATH";
  const seq = [stateTree.root];
  const rootMove = stateTree.root.children.find(
    (c) => c.meta.dir === stateTree.root.bestDir,
  );
  if (rootMove) {
    seq.push(rootMove);
    rootMove.children.forEach((chance) => {
      seq.push(chance);
      const next = chance.children.find((c) => c.meta.dir === chance.bestDir);
      if (next) seq.push(next);
    });
  }
  seq.forEach((n, i) =>
    treeTimers.push(
      setTimeout(() => {
        const el = $("treeCanvas").querySelector(`[data-node="${n.id}"]`);
        if (el) {
          el.classList.add("active-step");
          el.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
        if (n.parent) {
          const edge = $("treeCanvas").querySelector(
            `[data-edge="${n.parent.id}-${n.id}"]`,
          );
          if (edge) edge.classList.add("best-edge");
        }
        $("treeDetailTitle").textContent = `Best path · step ${i + 1}`;
        $("treeDetail").textContent =
          n.type === "move" || n.type === "leaf"
            ? `${n.label} is the best immediate move at this board (value ${n.meta.value.toFixed(1)}).`
            : `${n.label}: representative random tile outcome.`;
      }, i * 600),
    ),
  );
  treeTimers.push(
    setTimeout(
      () => {
        $("treeStatus").innerHTML =
          '<b class="good-text">Best path completed.</b> Green nodes show the highest immediate Greedy choice at each decision point.';
      },
      seq.length * 600 + 200,
    ),
  );
}
$("generateTreeBtn").addEventListener("click", generateStateTree);
$("guidedBtn").addEventListener("click", startGuided);
$("bfsBtn").addEventListener("click", () => runTraversal("BFS"));
$("dfsBtn").addEventListener("click", () => runTraversal("DFS"));
$("allPathsBtn").addEventListener("click", () => {
  if (stateTree) animateNodes(stateTree.nodes, "ALL PATHS");
});
$("bestPathBtn").addEventListener("click", animateBestPath);
$("resetTreeBtn").addEventListener("click", () =>
  invalidateTree("Tree reset. Generate it again from the current live board."),
);
$("treeCanvas").addEventListener("click", (e) => {
  const pick = e.target.closest("[data-pick]");
  if (pick) {
    chooseTreeNode(pick.dataset.pick);
    return;
  }
  const mini = e.target.closest(".mini-board");
  if (mini) inspectTreeBoard(mini);
});

newGame();
