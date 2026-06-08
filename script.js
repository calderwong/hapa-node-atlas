const nodes = {
  character: {
    tab: "tab-character",
    title: "Hapa Character Sheet",
    eyebrow: "HAPA CHARACTER SHEET / HERO DETAIL",
    description:
      "The real Hapa Character Sheet app template embedded with the generated Calder Wong / CJ data pack.",
    note:
      "Loaded from the standalone Hapa Character Sheet prototype, including its data JS/JSON, mock routes, sprites, and media assets.",
    frame: "nodes/character-sheet/index.html?v=video-contain-20260605#presentation",
    repo: "https://github.com/calderwong/hapa-character-sheet",
    board: "hapa-ecosystem-packaging-quest",
    status: "Calder/CJ dossier loaded",
    metrics: [
      ["Public repo", "hapa-character-sheet"],
      ["Surface", "Hero Detail + Codex"],
      ["Character", "Calder Wong / CJ"],
      ["Source items", "67,819"],
      ["Evidence XP", "1,202,201"],
      ["Turns", "6,106"],
      ["Media jobs", "1,055"],
    ],
  },
  secondBrain: {
    tab: "tab-second-brain",
    title: "Hapa Second Brain",
    eyebrow: "NODE.MEMORY.SECOND-BRAIN",
    description:
      "Operator preview for media history, Hapa Cards, wiki articles, claims, taste, and agent context packs.",
    note:
      "The public repo ships a local API-backed UI. This embed uses brochure-safe demo data so it remains portable.",
    frame: "nodes/hapa-second-brain/index.html?v=mobile-submenus-20260605",
    repo: "https://github.com/calderwong/hapa-second-brain",
    board: "hapa-app-hapa-second-brain",
    status: "memory projection filled",
    metrics: [
      ["Repo", "hapa-second-brain"],
      ["Items", "67,819"],
      ["Topics", "11,120"],
      ["Capabilities", "218"],
      ["Media jobs", "1,055"],
      ["Agents", "7 + 7 harnesses"],
    ],
  },
  devProto: {
    tab: "tab-dev-proto",
    title: "Hapa Dev Proto",
    eyebrow: "HAPA-AG / ELECTRON REACT SANDBOX",
    description:
      "Built renderer embed for chat, card library, wormhole, forge, wiki, local AI, 3D Nexus, P2P, and operator surfaces.",
    note:
      "This brochure-safe embed mirrors the public renderer surface. The full built renderer is vendored behind the Open action.",
    frame: "nodes/hapa-dev-proto/index.html?v=mobile-submenus-20260605",
    open: "nodes/hapa-dev-proto-renderer/index.html",
    repo: "https://github.com/calderwong/hapa-dev-proto",
    board: "hapa-app-hapa-dev-proto",
    status: "dev sandbox preview online",
    metrics: [
      ["Repo", "hapa-dev-proto"],
      ["Surface", "Browser preview"],
      ["Stack", "React + TypeScript"],
      ["Shell", "Electron capable"],
      ["Renderer", "vendored separately"],
    ],
  },
};

const nodeFrame = document.querySelector("#nodeFrame");
const activeRepoLink = document.querySelector("#activeRepoLink");
const activeEmbedLink = document.querySelector("#activeEmbedLink");
const activeBoardLink = document.querySelector("#activeBoardLink");
const activeEyebrow = document.querySelector("#activeEyebrow");
const activeTitle = document.querySelector("#activeTitle");
const activeDescription = document.querySelector("#activeDescription");
const activeMetrics = document.querySelector("#activeMetrics");
const activeNote = document.querySelector("#activeNote");
const frameStatus = document.querySelector("#frameStatus");
const framePath = document.querySelector("#framePath");
const tabs = [...document.querySelectorAll(".node-tab")];

function setActiveNode(key) {
  const node = nodes[key];
  if (!node) return;

  tabs.forEach((tab) => {
    const isActive = tab.dataset.node === key;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  activeEyebrow.textContent = node.eyebrow;
  activeTitle.textContent = node.title;
  activeDescription.textContent = node.description;
  activeNote.textContent = node.note;
  activeRepoLink.href = node.repo;
  activeEmbedLink.href = node.open || node.frame;
  activeBoardLink.dataset.kanbanJump = node.board;
  activeBoardLink.href = "#kanban";
  frameStatus.textContent = node.status;
  framePath.textContent = node.frame;
  nodeFrame.title = `${node.title} embed`;

  activeMetrics.innerHTML = "";
  node.metrics.forEach(([label, value]) => {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    row.append(dt, dd);
    activeMetrics.append(row);
  });

  if (nodeFrame.getAttribute("src") !== node.frame) {
    nodeFrame.setAttribute("src", node.frame);
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveNode(tab.dataset.node));
});

const memoryVideo = document.querySelector("#memoryVideo");
const memoryVideoShell = document.querySelector("[data-memory-video-shell]");
const memoryPlayButton = document.querySelector("#memoryPlayButton");
const memoryPlayLabel = document.querySelector("#memoryPlayLabel");
const memoryVideoStatus = document.querySelector("#memoryVideoStatus");

function setMemoryVideoState(state) {
  if (!memoryVideoShell || !memoryPlayLabel || !memoryVideoStatus) return;
  memoryVideoShell.classList.toggle("is-playing", state === "playing");
  if (state === "playing") {
    memoryVideo.controls = true;
    memoryPlayLabel.textContent = "Playing";
    memoryVideoStatus.textContent = "Memory graph online";
    return;
  }
  memoryVideo.controls = false;
  if (state === "ended") {
    memoryPlayLabel.textContent = "Replay";
    memoryVideoStatus.textContent = "Playback complete";
    return;
  }
  memoryPlayLabel.textContent = memoryVideo.currentTime > 0 ? "Resume" : "Play";
  memoryVideoStatus.textContent = memoryVideo.currentTime > 0 ? "Playback paused" : "Ready for playback";
}

if (memoryVideo && memoryPlayButton) {
  memoryVideo.controls = false;
  memoryPlayButton.addEventListener("click", async () => {
    if (!memoryVideo.paused) {
      memoryVideo.pause();
      return;
    }
    if (memoryVideo.ended) memoryVideo.currentTime = 0;
    try {
      await memoryVideo.play();
    } catch {
      memoryVideoStatus.textContent = "Use video controls to start";
    }
  });
  memoryVideo.addEventListener("play", () => setMemoryVideoState("playing"));
  memoryVideo.addEventListener("pause", () => {
    if (!memoryVideo.ended) setMemoryVideoState("paused");
  });
  memoryVideo.addEventListener("ended", () => setMemoryVideoState("ended"));
}

window.addEventListener("keydown", (event) => {
  if (!event.altKey) return;
  const currentIndex = tabs.findIndex((tab) => tab.classList.contains("active"));
  if (event.key === "ArrowRight") {
    event.preventDefault();
    const next = tabs[(currentIndex + 1) % tabs.length];
    setActiveNode(next.dataset.node);
    next.focus();
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    const next = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
    setActiveNode(next.dataset.node);
    next.focus();
  }
});

setActiveNode("character");
