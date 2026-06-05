const kanbanEls = {
  console: document.querySelector("[data-kanban-console]"),
  select: document.querySelector("#kanbanProjectSelect"),
  search: document.querySelector("#kanbanSearch"),
  list: document.querySelector("#kanbanBoardList"),
  title: document.querySelector("#kanbanBoardTitle"),
  eyebrow: document.querySelector("#kanbanEyebrow"),
  summary: document.querySelector("#kanbanBoardSummary"),
  telemetry: document.querySelector("#kanbanTelemetry"),
  liveLink: document.querySelector("#kanbanLiveLink"),
  frame: document.querySelector("#kanbanFrame"),
  frameShell: document.querySelector(".kanban-frame-shell"),
  frameStatus: document.querySelector("#kanbanFrameStatus"),
  framePath: document.querySelector("#kanbanFramePath"),
  snapshotStamp: document.querySelector("#kanbanSnapshotStamp"),
  staticBoard: document.querySelector("#kanbanStaticBoard"),
};

let kanbanPayload = null;
let activeKanbanId = "";
let pendingKanbanJump = "";

const localKanbanEmbeddableHost =
  location.protocol === "http:" &&
  ["127.0.0.1", "localhost", ""].includes(location.hostname);
const mobileKanbanQuery = window.matchMedia("(max-width: 760px)");

const columnOrder = ["backlog", "ready", "in_progress", "blocked", "review", "done"];
const maxStaticCardsPerColumn = 8;
const explicitBoardMap = {
  "hapa-character-sheet": "hapa-ecosystem-packaging-quest",
  "hapa-awesome": "hapa-ecosystem-packaging-quest",
  "hapa-quest-keeper": "hapa-quest-keeper",
  "hapa-space": "hapa-ecosystem-packaging-quest",
  "hapa-proto0-00-00-7-visualizer": "hapa-ecosystem-packaging-quest",
  "hapa-scratchpad": "hapa-ecosystem-packaging-quest",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function displayBoardName(board) {
  return String(board?.name || board?.id || "")
    .replace(/\s+App Kanban$/i, "")
    .replace(/^hapa\s+/i, "Hapa ");
}

function boardKind(board) {
  if (board?.id === kanbanPayload?.defaultProjectId) return "overall";
  if (board?.id === "hapa-app-overwatch") return "overwatch";
  return "node";
}

function boardUrl(board) {
  const base = kanbanPayload?.liveBaseUrl || "http://127.0.0.1:5181/";
  return `${base}?project=${encodeURIComponent(board.id)}`;
}

function slugifyNodeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveBoardId(id) {
  if (!kanbanPayload?.boards?.length) return id;
  const boardIds = new Set(kanbanPayload.boards.map((board) => board.id));
  return boardIds.has(id) ? id : "";
}

function boardIdForNodeName(name) {
  if (!kanbanPayload?.boards?.length) return "";
  const slug = slugifyNodeName(name);
  const boardIds = new Set(kanbanPayload.boards.map((board) => board.id));
  const candidates = [
    explicitBoardMap[slug],
    `hapa-app-${slug}`,
    slug,
  ].filter(Boolean);

  return candidates.find((id) => boardIds.has(id)) || kanbanPayload.defaultProjectId;
}

function jumpToKanbanBoard(id, shouldScroll = true) {
  const boardId = resolveBoardId(id) || kanbanPayload?.defaultProjectId || id;
  pendingKanbanJump = boardId;
  if (kanbanPayload?.boards?.length) {
    setActiveKanban(boardId);
  }
  if (shouldScroll) {
    document.querySelector("#kanban")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }
}

function shouldEmbedKanbanFrame() {
  return localKanbanEmbeddableHost && !mobileKanbanQuery.matches;
}

function formatStamp(value) {
  if (!value) return "Snapshot generated from Overwatch state";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Snapshot generated from Overwatch state";
  return `Snapshot ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function taskCountFor(board, columnId) {
  const counts = board?.telemetry?.columnCounts || {};
  return counts[columnId] ?? board.tasks.filter((task) => task.column === columnId).length;
}

function sortColumns(board) {
  const byId = new Map((board.columns || []).map((column) => [column.id, column]));
  const ordered = columnOrder
    .filter((id) => byId.has(id))
    .map((id) => byId.get(id));
  const rest = (board.columns || []).filter((column) => !columnOrder.includes(column.id));
  return [...ordered, ...rest];
}

function setActiveKanban(id) {
  const board = kanbanPayload?.boards.find((item) => item.id === id) || kanbanPayload?.boards[0];
  if (!board) return;

  activeKanbanId = board.id;
  kanbanEls.select.value = board.id;
  renderBoardList();
  renderActiveBoard(board);
}

function renderProjectSelect() {
  kanbanEls.select.innerHTML = kanbanPayload.boards
    .map((board) => `<option value="${escapeHtml(board.id)}">${escapeHtml(displayBoardName(board))}</option>`)
    .join("");
}

function filteredBoards() {
  const q = kanbanEls.search.value.trim().toLowerCase();
  if (!q) return kanbanPayload.boards;
  return kanbanPayload.boards.filter((board) => {
    const haystack = [
      board.id,
      board.name,
      board.summary,
      boardKind(board),
      ...(board.tasks || []).slice(0, 8).flatMap((task) => [task.title, task.owner, task.lane, task.node, ...(task.tags || [])]),
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });
}

function renderBoardList() {
  const boards = filteredBoards();
  kanbanEls.list.innerHTML = boards.map((board) => {
    const active = board.id === activeKanbanId;
    const telemetry = board.telemetry || {};
    const kind = boardKind(board);
    return `
      <button class="kanban-board-button${active ? " active" : ""}" type="button" data-project-id="${escapeHtml(board.id)}" aria-pressed="${active}">
        <span>${escapeHtml(kind)}</span>
        <strong>${escapeHtml(displayBoardName(board))}</strong>
        <small>${escapeHtml(telemetry.totalTasks ?? board.tasks.length)} cards / ${escapeHtml(telemetry.totalEvents ?? 0)} events</small>
      </button>
    `;
  }).join("") || `<p class="kanban-empty">No board matches that filter.</p>`;
}

function renderTelemetry(board) {
  const t = board.telemetry || {};
  const chips = [
    ["Cards", t.totalTasks ?? board.tasks.length],
    ["Events", t.totalEvents ?? 0],
    ["Review", t.columnCounts?.review ?? 0],
    ["Blocked", t.blockedCount ?? t.columnCounts?.blocked ?? 0],
    ["Done", t.doneCount ?? t.columnCounts?.done ?? 0],
    ["Progress", `${t.progress ?? 0}%`],
  ];
  kanbanEls.telemetry.innerHTML = chips
    .map(([label, value]) => `<span><b>${escapeHtml(value)}</b><small>${escapeHtml(label)}</small></span>`)
    .join("");
}

function renderFrame(board) {
  const url = boardUrl(board);
  kanbanEls.liveLink.href = url;
  kanbanEls.framePath.textContent = url;

  if (shouldEmbedKanbanFrame()) {
    kanbanEls.frameShell.classList.remove("static-only");
    if (kanbanEls.frame.getAttribute("src") !== url) {
      kanbanEls.frame.setAttribute("src", url);
    }
    kanbanEls.frameStatus.querySelector("span")?.replaceChildren(statusLight(), document.createTextNode(" Local Overwatch Kanban embed"));
    return;
  }

  kanbanEls.frameShell.classList.add("static-only");
  kanbanEls.frame.removeAttribute("src");
  kanbanEls.frameStatus.querySelector("span")?.replaceChildren(statusLight(), document.createTextNode(" Live board opens locally"));
}

function statusLight() {
  return document.createElement("i");
}

function renderStaticBoard(board) {
  const columns = sortColumns(board);
  const total = board.telemetry?.totalTasks ?? board.tasks.length;
  let shown = 0;

  const columnHtml = columns.map((column) => {
    const tasks = board.tasks.filter((task) => task.column === column.id);
    const count = taskCountFor(board, column.id);
    const visibleTasks = tasks.slice(0, maxStaticCardsPerColumn);
    const hiddenCount = Math.max(0, count - visibleTasks.length);
    shown += visibleTasks.length;
    return `
      <section class="kanban-column">
        <div class="kanban-column-head">
          <div>
            <strong>${escapeHtml(column.label || column.id)}</strong>
            <small>${escapeHtml(column.intent || "Board lane")}</small>
          </div>
          <span>${escapeHtml(count)}</span>
        </div>
        <div class="kanban-card-stack">
          ${visibleTasks.map(renderTaskCard).join("") || `<p class="kanban-column-empty">No snapshot cards in this lane.</p>`}
          ${hiddenCount ? `<p class="kanban-column-empty">+${escapeHtml(hiddenCount)} more cards in the live board.</p>` : ""}
        </div>
      </section>
    `;
  }).join("");

  kanbanEls.snapshotStamp.textContent =
    `${formatStamp(board.telemetry?.generatedAt || kanbanPayload.generatedAt)} / previewing ${shown}${shown < total ? ` of ${total}` : ""} cards`;
  kanbanEls.staticBoard.innerHTML = columnHtml;
}

function renderTaskCard(task) {
  const tags = (task.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  return `
    <article class="kanban-task-card">
      <div class="kanban-task-top">
        <span>${escapeHtml(task.priority || "P2")}</span>
        <span>${escapeHtml(task.owner || "Overwatch")}</span>
      </div>
      <h4>${escapeHtml(task.title || task.id)}</h4>
      <p>${escapeHtml(task.description || "No description captured in the public snapshot.")}</p>
      <div class="kanban-task-meta">
        ${task.lane ? `<span>${escapeHtml(task.lane)}</span>` : ""}
        ${task.node ? `<span>${escapeHtml(task.node)}</span>` : ""}
        ${tags}
      </div>
    </article>
  `;
}

function renderActiveBoard(board) {
  kanbanEls.eyebrow.textContent =
    board.id === kanbanPayload.defaultProjectId ? "HAPA ECOSYSTEM / OVERALL QUEST" : "HAPA NODE / BOARD PROJECTION";
  kanbanEls.title.textContent = displayBoardName(board);
  kanbanEls.summary.textContent = board.summary || "Append-only Overwatch board projection.";
  renderTelemetry(board);
  renderFrame(board);
  renderStaticBoard(board);
}

function hydrateRepoBoardLinks() {
  document.querySelectorAll(".repo-card").forEach((card) => {
    if (card.querySelector(".repo-board-link")) return;
    const title = card.querySelector("h3")?.textContent?.trim();
    if (!title) return;
    const boardId = boardIdForNodeName(title);
    const isEcosystemFallback = boardId === kanbanPayload.defaultProjectId;
    const link = document.createElement("a");
    link.className = `repo-board-link${isEcosystemFallback ? " ecosystem" : ""}`;
    link.href = "#kanban";
    link.dataset.kanbanJump = boardId;
    link.setAttribute("aria-label", `${isEcosystemFallback ? "Open ecosystem board for" : "Open Kanban board for"} ${title}`);
    link.innerHTML = `<span>${isEcosystemFallback ? "Ecosystem board" : "Kanban board"}</span>`;
    card.append(link);
  });
}

async function initKanbanBoards() {
  if (!kanbanEls.console) return;
  try {
    const response = await fetch("assets/kanban-boards.json?v=kanban-bottom-20260605");
    kanbanPayload = await response.json();
    renderProjectSelect();
    hydrateRepoBoardLinks();
    const queryBoard = new URLSearchParams(location.search).get("board");
    const initial = resolveBoardId(queryBoard || pendingKanbanJump) || kanbanPayload.defaultProjectId || kanbanPayload.boards[0]?.id;
    setActiveKanban(initial);
  } catch (error) {
    kanbanEls.console.innerHTML = `<p class="kanban-empty">Kanban snapshot failed to load: ${escapeHtml(error.message)}</p>`;
  }
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-kanban-jump]");
  if (!link) return;
  event.preventDefault();
  jumpToKanbanBoard(link.dataset.kanbanJump);
});
kanbanEls.select?.addEventListener("change", () => setActiveKanban(kanbanEls.select.value));
kanbanEls.search?.addEventListener("input", renderBoardList);
kanbanEls.list?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-project-id]");
  if (!button) return;
  setActiveKanban(button.dataset.projectId);
});
mobileKanbanQuery.addEventListener?.("change", () => {
  if (activeKanbanId) setActiveKanban(activeKanbanId);
});

initKanbanBoards();
