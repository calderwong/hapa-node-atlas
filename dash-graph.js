(() => {
  const canvas = document.querySelector("#dashSwarm");
  if (!canvas) return;

  const els = {
    stats: document.querySelector("#dashGraphStats"),
    count: document.querySelector("#dashGraphCount"),
    legend: document.querySelector("#dashGraphLegend"),
    flowTitle: document.querySelector("#dashFlowTitle"),
    flowSummary: document.querySelector("#dashFlowSummary"),
    flowStep: document.querySelector("#dashFlowStep"),
    flowProgress: document.querySelector("#dashFlowProgress"),
    prev: document.querySelector("#dashFlowPrev"),
    auto: document.querySelector("#dashFlowAuto"),
    next: document.querySelector("#dashFlowNext"),
    tooltip: document.querySelector("#dashGraphTooltip"),
    inspectorKicker: document.querySelector("#dashInspectorKicker"),
    inspectorTitle: document.querySelector("#dashInspectorTitle"),
    inspectorBody: document.querySelector("#dashInspectorBody"),
    inspectorMeta: document.querySelector("#dashInspectorMeta"),
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = {
    graph: null,
    flows: [],
    positions: new Map(),
    layoutKey: "",
    activeFlowIndex: 0,
    activeStepIndex: 0,
    flowAutoplay: !reduceMotion,
    flowLastAdvance: 0,
    hover: null,
    reduceMotion,
  };

  const ctx = canvas.getContext("2d");

  fetch("assets/hapadash-graph.json?v=dash-graph-20260605")
    .then((response) => {
      if (!response.ok) throw new Error(`Graph request failed: ${response.status}`);
      return response.json();
    })
    .then((graph) => {
      state.graph = graph;
      state.flows = graph.flows || [];
      clampFlowPlayback();
      renderStats();
      renderLegend();
      renderFlowPlayback();
      renderInspector();
      requestAnimationFrame(drawSwarm);
    })
    .catch((error) => {
      if (els.flowTitle) els.flowTitle.textContent = "Graph export unavailable";
      if (els.flowSummary) els.flowSummary.textContent = error.message;
      if (els.count) els.count.textContent = "Graph offline";
    });

  els.prev?.addEventListener("click", previousFlow);
  els.next?.addEventListener("click", nextFlow);
  els.auto?.addEventListener("click", () => {
    state.flowAutoplay = !state.flowAutoplay;
    state.flowLastAdvance = performance.now();
    renderFlowPlayback();
  });

  els.flowProgress?.addEventListener("click", (event) => {
    const segment = event.target.closest("[data-flow-step]");
    if (!segment) return;
    state.activeStepIndex = Number(segment.dataset.flowStep) || 0;
    state.flowLastAdvance = performance.now();
    renderFlowPlayback();
    renderInspector();
  });

  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerleave", clearPointerHover);
  window.addEventListener("resize", () => {
    state.layoutKey = "";
  });

  function drawSwarm(now) {
    requestAnimationFrame(drawSwarm);
    if (!state.graph || document.hidden) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      state.layoutKey = "";
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const nodes = state.graph.nodes || [];
    const edges = state.graph.edges || [];
    layoutSwarm(nodes, rect);
    advanceFlowPlayback(now);

    const t = state.reduceMotion ? 0 : now / 900;
    drawRadarGrid(ctx, rect, t);
    edges.filter((edge) => edge.kind === "monitors").forEach((edge) => drawMonitorEdge(ctx, edge));
    edges.filter((edge) => edge.kind === "pathway").forEach((edge) => drawPathwayEdge(ctx, edge, t));
    drawFlowOverlay(ctx, t);
    nodes.forEach((node) => drawNode(ctx, node, nodes.length));
  }

  function drawRadarGrid(context, rect, t) {
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.43;
    context.save();
    context.strokeStyle = "rgba(34,211,238,0.07)";
    context.lineWidth = 1;
    for (let index = 1; index <= 4; index += 1) {
      context.beginPath();
      context.arc(cx, cy, (radius * index) / 4, 0, Math.PI * 2);
      context.stroke();
    }
    context.strokeStyle = "rgba(217,70,239,0.05)";
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8 + (state.reduceMotion ? 0 : t * 0.006);
      context.beginPath();
      context.moveTo(cx, cy);
      context.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
      context.stroke();
    }
    context.restore();
  }

  function drawMonitorEdge(context, edge) {
    const a = state.positions.get(edge.source);
    const b = state.positions.get(edge.target);
    if (!a || !b) return;
    const hovered = edgeIsHovered(edge);
    context.save();
    context.strokeStyle = hovered ? "rgba(34,211,238,0.62)" : "rgba(34,211,238,0.09)";
    context.lineWidth = hovered ? 2 : 0.7;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
    context.restore();
  }

  function drawPathwayEdge(context, edge, t) {
    const a = state.positions.get(edge.source);
    const b = state.positions.get(edge.target);
    if (!a || !b) return;
    const hovered = edgeIsHovered(edge);
    const active = edge.active || hovered;
    const control = edgeControlPoint(a, b, edge);
    context.save();
    context.strokeStyle = layerRgba(edge.layer, hovered ? 0.94 : active ? 0.78 : 0.24);
    context.lineWidth = hovered ? 3.1 : active ? 2.3 : 1.05;
    context.shadowColor = layerRgba(edge.layer, hovered || active ? 0.9 : 0);
    context.shadowBlur = hovered ? 22 : active ? 15 : 0;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.quadraticCurveTo(control.x, control.y, b.x, b.y);
    context.stroke();
    context.restore();

    if (!state.reduceMotion && active) {
      const score = Number(edge.activity_score || 0.64);
      const packets = score > 0.75 ? 3 : 2;
      for (let index = 0; index < packets; index += 1) {
        const offset = ((hashString(edge.id) % 100) / 100 + index / packets) % 1;
        const progress = (t * (0.16 + score * 0.14) + offset) % 1;
        const point = quadraticPoint(a, control, b, progress);
        drawPacket(context, point, layerRgba(edge.layer, 0.94), 2.8 + score * 1.4, 11);
      }
    }
  }

  function drawFlowOverlay(context, t) {
    const flow = activeFlow();
    if (!flow || !flow.steps) return;
    flow.steps.forEach((step, index) => drawFlowStep(context, flow, step, index, t));
  }

  function drawFlowStep(context, flow, step, index, t) {
    const a = state.positions.get(step.source);
    const b = state.positions.get(step.target);
    if (!a || !b) return;
    const current = index === state.activeStepIndex;
    const done = index < state.activeStepIndex;
    const hovered = flowStepIsHovered(step);
    const control = edgeControlPoint(a, b, step);
    const alpha = hovered ? 0.98 : current ? 0.94 : done ? 0.46 : 0.16;
    const width = hovered ? 4.1 : current ? 3.5 : done ? 2.1 : 1.25;

    context.save();
    context.strokeStyle = layerRgba(step.layer, alpha);
    context.lineWidth = width;
    context.shadowColor = layerRgba(step.layer, current || hovered ? 0.98 : 0);
    context.shadowBlur = hovered ? 28 : current ? 24 : 0;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.quadraticCurveTo(control.x, control.y, b.x, b.y);
    context.stroke();
    context.restore();

    if (!state.reduceMotion && (current || hovered)) {
      const packetCount = current ? 5 : 2;
      for (let packet = 0; packet < packetCount; packet += 1) {
        const seed = ((hashString(`${flow.id}-${step.id}`) % 100) / 100 + packet / packetCount) % 1;
        const progress = (t * 0.3 + seed) % 1;
        const point = quadraticPoint(a, control, b, progress);
        drawPacket(context, point, layerRgba(step.layer, 0.98), current ? 4.4 : 3.2, 18);
      }
    }
  }

  function drawPacket(context, point, color, radius, blur) {
    context.save();
    context.fillStyle = color;
    context.shadowColor = color;
    context.shadowBlur = blur;
    context.beginPath();
    context.arc(point.x, point.y, radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawNode(context, node, nodeCount) {
    const p = state.positions.get(node.id);
    if (!p) return;
    const primary = node.id === "hapa-dash-node";
    const documented = node.registry_status === "documented";
    const hovered = nodeIsHovered(node);
    const flowState = flowNodeState(node.id);
    const color = flowState.active ? flowState.color : toneColor(node.tone);
    const radius = primary ? 17 : documented ? 8 : 10;

    context.save();
    context.fillStyle = "rgba(2,6,23,0.94)";
    context.strokeStyle = color;
    context.lineWidth = flowState.current ? 4 : hovered ? 3 : flowState.active ? 2.6 : primary ? 2.7 : 1.55;
    context.shadowColor = hovered || flowState.active ? color : "transparent";
    context.shadowBlur = flowState.current ? 25 : hovered ? 18 : flowState.active ? 12 : 0;
    context.beginPath();
    context.arc(p.x, p.y, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    if (primary || flowState.current) {
      context.beginPath();
      context.arc(p.x, p.y, radius + 9, 0, Math.PI * 2);
      context.strokeStyle = color.replace(")", ", 0.26)").replace("rgb", "rgba");
      context.lineWidth = 1;
      context.stroke();
    }

    context.shadowBlur = 0;
    const maxLabel = nodeCount > 100 ? 13 : 16;
    const label = String(node.label || node.id).slice(0, maxLabel);
    context.font = `${nodeCount > 100 ? 8 : 9}px SFMono-Regular, Consolas, monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = primary || flowState.current || hovered ? "#f8fafc" : "rgba(226,232,240,0.82)";
    context.fillText(label, p.x, p.y + radius + 12);
    context.restore();
  }

  function layoutSwarm(nodes, rect) {
    const sizeKey = `${Math.round(rect.width)}x${Math.round(rect.height)}:${nodes.map((node) => node.id).join("|")}`;
    if (state.layoutKey === sizeKey && state.positions.size === nodes.length) return;

    state.positions.clear();
    state.layoutKey = sizeKey;
    const margin = nodes.length > 90 ? 52 : 44;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = Math.max(80, rect.width / 2 - margin);
    const ry = Math.max(80, rect.height / 2 - margin);
    const dash = nodes.find((node) => node.id === "hapa-dash-node");
    if (dash) state.positions.set(dash.id, { x: cx, y: cy });

    const others = nodes.filter((node) => node.id !== "hapa-dash-node");
    const groups = groupNodes(others);
    const groupNames = orderedGroups(groups);
    const baseAngle = -Math.PI / 2;
    const golden = Math.PI * (3 - Math.sqrt(5));
    let globalIndex = 0;

    groupNames.forEach((groupName, groupIndex) => {
      const groupList = groups.get(groupName) || [];
      const sector = (Math.PI * 2) / Math.max(groupNames.length, 1);
      const centerAngle = baseAngle + groupIndex * sector;
      const spread = Math.min(sector * 0.74, 1.24);
      groupList.forEach((node, index) => {
        const local = groupList.length === 1 ? 0 : index / (groupList.length - 1) - 0.5;
        const spiral = globalIndex * golden * 0.16;
        const angle = centerAngle + local * spread + spiral;
        const depth = Math.sqrt((globalIndex + 1) / Math.max(others.length, 1));
        const radius = 0.31 + depth * 0.63;
        const x = clamp(cx + Math.cos(angle) * rx * radius, margin, rect.width - margin);
        const y = clamp(cy + Math.sin(angle) * ry * radius, margin, rect.height - margin);
        state.positions.set(node.id, { x, y });
        globalIndex += 1;
      });
    });
  }

  function groupNodes(nodes) {
    const groups = new Map();
    nodes.forEach((node) => {
      const group = node.group || node.registry_status || "other";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(node);
    });
    return groups;
  }

  function orderedGroups(groups) {
    const preferred = [
      "core",
      "ops",
      "memory",
      "media",
      "trust",
      "protocol",
      "surface",
      "app",
      "archive",
      "overwatch",
      "second-brain",
      "documented",
      "other",
    ];
    return [
      ...preferred.filter((group) => groups.has(group)),
      ...Array.from(groups.keys()).filter((group) => !preferred.includes(group)).sort(),
    ];
  }

  function handlePointerMove(event) {
    if (!state.graph) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    state.hover = findHoverTarget(x, y);
    renderTooltip(state.hover, x, y, rect);
    renderInspector(state.hover);
  }

  function clearPointerHover() {
    state.hover = null;
    els.tooltip?.classList.add("is-hidden");
    renderInspector();
  }

  function findHoverTarget(x, y) {
    const nodes = state.graph.nodes || [];
    for (const node of nodes) {
      const p = state.positions.get(node.id);
      if (!p) continue;
      const radius = node.id === "hapa-dash-node" ? 24 : node.registry_status === "documented" ? 15 : 17;
      if (Math.hypot(x - p.x, y - p.y) <= radius) {
        return { type: "node", item: node };
      }
    }

    let best = null;
    const flow = activeFlow();
    for (const step of (flow && flow.steps) || []) {
      const a = state.positions.get(step.source);
      const b = state.positions.get(step.target);
      if (!a || !b) continue;
      const distance = distanceToCurve({ x, y }, a, edgeControlPoint(a, b, step), b);
      const threshold = step.step_index === state.activeStepIndex ? 13 : 8;
      if (distance <= threshold && (!best || distance < best.distance)) {
        best = { type: "flow", item: step, distance };
      }
    }

    const hoverEdges = [
      ...(state.graph.edges || []).filter((item) => item.kind === "pathway"),
      ...(state.graph.edges || []).filter((item) => item.kind === "monitors"),
    ];
    for (const edge of hoverEdges) {
      const a = state.positions.get(edge.source);
      const b = state.positions.get(edge.target);
      if (!a || !b) continue;
      const distance =
        edge.kind === "monitors"
          ? distanceToSegment({ x, y }, a, b)
          : distanceToCurve({ x, y }, a, edgeControlPoint(a, b, edge), b);
      const threshold = edge.kind === "monitors" ? 4 : edge.active ? 11 : 8;
      if (distance <= threshold && (!best || distance < best.distance)) {
        best = { type: "edge", item: edge, distance };
      }
    }

    return best ? { type: best.type, item: best.item } : null;
  }

  function renderTooltip(target, x, y, rect) {
    if (!els.tooltip) return;
    if (!target) {
      els.tooltip.classList.add("is-hidden");
      return;
    }

    const item = target.item;
    const layer = item.layer || item.status || item.kind || target.type;
    els.tooltip.innerHTML = `
      <div class="dash-tooltip-kicker">${escapeHtml(target.type)} / ${escapeHtml(layer)}</div>
      <div class="dash-tooltip-title">${escapeHtml(item.hover_title || item.label || item.id)}</div>
      <div class="dash-tooltip-text">${escapeHtml(item.hover_description || item.description || item.label || item.id)}</div>
    `;
    els.tooltip.classList.remove("is-hidden");
    const left = clamp(x + 16, 10, Math.max(10, rect.width - els.tooltip.offsetWidth - 10));
    const top = clamp(y + 16, 10, Math.max(10, rect.height - els.tooltip.offsetHeight - 10));
    els.tooltip.style.left = `${left}px`;
    els.tooltip.style.top = `${top}px`;
  }

  function renderStats() {
    if (!state.graph) return;
    const summary = state.graph.summary || {};
    const stats = [
      ["Nodes", summary.nodes || (state.graph.nodes || []).length],
      ["Paths", summary.pathway_edges || (state.graph.pathways || []).length],
      ["Flows", summary.flow_count || state.flows.length],
      ["Steps", summary.flow_step_count || totalFlowSteps()],
    ];

    if (els.stats) {
      els.stats.innerHTML = stats.map(([label, value]) => `<span>${formatNumber(value)} ${escapeHtml(label)}</span>`).join("");
    }
    if (els.count) {
      els.count.textContent = `${formatNumber(stats[0][1])} nodes / ${formatNumber(stats[1][1])} paths / ${formatNumber(stats[2][1])} flows`;
    }
  }

  function renderLegend() {
    if (!els.legend || !state.graph) return;
    const rows = state.graph.legend || [];
    els.legend.innerHTML = rows
      .map((row) => {
        const color = layerColor(row.layer);
        const hot = row.active ? ` / ${row.active} hot` : "";
        return `<span class="dash-legend-chip" style="color:${color}"><i></i>${escapeHtml(row.layer)} ${formatNumber(row.count || 0)}${hot}</span>`;
      })
      .join("");
  }

  function renderFlowPlayback() {
    const flow = activeFlow();
    const step = activeFlowStep();
    if (!flow || !step) {
      if (els.flowTitle) els.flowTitle.textContent = "No flow scenarios loaded";
      if (els.flowSummary) els.flowSummary.textContent = "Graph flow playback is waiting for Hapa protocol data.";
      if (els.flowStep) els.flowStep.textContent = "";
      if (els.flowProgress) els.flowProgress.innerHTML = "";
      return;
    }

    if (els.flowTitle) {
      els.flowTitle.textContent = `${flow.name} (${state.activeFlowIndex + 1}/${state.flows.length})`;
    }
    if (els.flowSummary) {
      els.flowSummary.textContent = flow.summary || `${flow.name} is available for multi-node playback.`;
    }
    if (els.flowStep) {
      els.flowStep.innerHTML = `<strong>Step ${state.activeStepIndex + 1}/${flow.steps.length}</strong> ${escapeHtml(
        step.source_label || step.raw_source || step.source,
      )} to ${escapeHtml(step.target_label || step.raw_target || step.target)} / ${escapeHtml(
        step.layer_text || step.layer,
      )}. ${escapeHtml(step.description || step.label || "")}`;
    }
    if (els.flowProgress) {
      els.flowProgress.innerHTML = flow.steps
        .map((row, index) => {
          const cls = [
            "dash-flow-segment",
            index < state.activeStepIndex ? "done" : "",
            index === state.activeStepIndex ? "active" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return `<button class="${cls}" data-flow-step="${index}" aria-label="Show flow step ${
            index + 1
          }" title="${escapeHtml(row.label || `Step ${index + 1}`)}" style="color:${layerColor(row.layer)}"></button>`;
        })
        .join("");
    }
    if (els.auto) {
      els.auto.classList.toggle("active", state.flowAutoplay);
      els.auto.textContent = state.flowAutoplay ? "Auto" : "Hold";
    }
  }

  function renderInspector(target = null) {
    const activeTarget = target || activeInspectorTarget();
    if (!activeTarget) return;
    const item = activeTarget.item;
    const layer = item.layer || item.status || item.kind || activeTarget.type;

    if (els.inspectorKicker) {
      els.inspectorKicker.textContent = `${activeTarget.type.toUpperCase()} / ${String(layer).toUpperCase()}`;
    }
    if (els.inspectorTitle) {
      els.inspectorTitle.textContent = item.hover_title || item.label || item.name || item.id || "Flow Route";
    }
    if (els.inspectorBody) {
      els.inspectorBody.textContent =
        item.hover_description || item.description || item.summary || item.label || "Protocol route selected.";
    }
    if (els.inspectorMeta) {
      const meta = [];
      if (item.source || item.raw_source) meta.push(["Source", item.source_label || item.raw_source || item.source]);
      if (item.target || item.raw_target) meta.push(["Target", item.target_label || item.raw_target || item.target]);
      if (item.truth_source) meta.push(["Truth", item.truth_source]);
      els.inspectorMeta.innerHTML = meta
        .slice(0, 3)
        .map(([label, value]) => `<span>${escapeHtml(label)} ${escapeHtml(value)}</span>`)
        .join("");
    }
  }

  function activeInspectorTarget() {
    const step = activeFlowStep();
    if (step) return { type: "flow", item: step };
    const flow = activeFlow();
    if (flow) return { type: "flow", item: flow };
    return null;
  }

  function advanceFlowPlayback(now) {
    if (!state.flowAutoplay || !state.flows.length) return;
    const hold = state.reduceMotion ? 7000 : 4200;
    if (!state.flowLastAdvance) state.flowLastAdvance = now;
    if (now - state.flowLastAdvance < hold) return;
    nextFlowStep(now);
  }

  function nextFlowStep(now = performance.now()) {
    const flow = activeFlow();
    if (!flow || !flow.steps || !flow.steps.length) return;
    if (state.activeStepIndex < flow.steps.length - 1) {
      state.activeStepIndex += 1;
    } else {
      state.activeFlowIndex = (state.activeFlowIndex + 1) % Math.max(1, state.flows.length);
      state.activeStepIndex = 0;
    }
    state.flowLastAdvance = now;
    renderFlowPlayback();
    renderInspector(state.hover);
  }

  function nextFlow() {
    if (!state.flows.length) return;
    state.activeFlowIndex = (state.activeFlowIndex + 1) % state.flows.length;
    state.activeStepIndex = 0;
    state.flowLastAdvance = performance.now();
    renderFlowPlayback();
    renderInspector(state.hover);
  }

  function previousFlow() {
    if (!state.flows.length) return;
    state.activeFlowIndex = (state.activeFlowIndex - 1 + state.flows.length) % state.flows.length;
    state.activeStepIndex = 0;
    state.flowLastAdvance = performance.now();
    renderFlowPlayback();
    renderInspector(state.hover);
  }

  function clampFlowPlayback() {
    if (!state.flows.length) {
      state.activeFlowIndex = 0;
      state.activeStepIndex = 0;
      return;
    }
    state.activeFlowIndex = clamp(state.activeFlowIndex, 0, state.flows.length - 1);
    const flow = activeFlow();
    state.activeStepIndex = clamp(state.activeStepIndex, 0, Math.max(0, ((flow && flow.steps) || []).length - 1));
  }

  function activeFlow() {
    return state.flows[state.activeFlowIndex] || null;
  }

  function activeFlowStep() {
    const flow = activeFlow();
    return flow && flow.steps ? flow.steps[state.activeStepIndex] || null : null;
  }

  function flowNodeState(nodeId) {
    const flow = activeFlow();
    if (!flow || !flow.steps) return { active: false, current: false, color: toneColor("slate") };
    let active = false;
    let current = false;
    let color = toneColor("slate");
    flow.steps.forEach((step, index) => {
      const touches = step.source === nodeId || step.target === nodeId;
      if (!touches) return;
      if (index <= state.activeStepIndex) active = true;
      if (index === state.activeStepIndex) current = true;
      if (index <= state.activeStepIndex) color = layerColor(step.layer);
    });
    return { active, current, color };
  }

  function nodeIsHovered(node) {
    return state.hover && state.hover.type === "node" && state.hover.item.id === node.id;
  }

  function edgeIsHovered(edge) {
    return state.hover && state.hover.type === "edge" && state.hover.item.id === edge.id;
  }

  function flowStepIsHovered(step) {
    return state.hover && state.hover.type === "flow" && state.hover.item.id === step.id;
  }

  function edgeControlPoint(a, b, edge) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const spread = ((hashString(edge.id) % 41) - 20) * 1.05;
    return {
      x: (a.x + b.x) / 2 + normalX * spread,
      y: (a.y + b.y) / 2 + normalY * spread,
    };
  }

  function quadraticPoint(a, c, b, p) {
    const inv = 1 - p;
    return {
      x: inv * inv * a.x + 2 * inv * p * c.x + p * p * b.x,
      y: inv * inv * a.y + 2 * inv * p * c.y + p * p * b.y,
    };
  }

  function distanceToCurve(point, a, control, b) {
    let previous = a;
    let best = Number.POSITIVE_INFINITY;
    for (let index = 1; index <= 24; index += 1) {
      const current = quadraticPoint(a, control, b, index / 24);
      best = Math.min(best, distanceToSegment(point, previous, current));
      previous = current;
    }
    return best;
  }

  function distanceToSegment(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t = length ? clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / length, 0, 1) : 0;
    return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
  }

  function toneColor(tone) {
    return {
      green: "#34d399",
      cyan: "#22d3ee",
      gold: "#f59e0b",
      rose: "#fb7185",
      fuchsia: "#e879f9",
    }[tone] || "#64748b";
  }

  function layerColor(layer) {
    return {
      UI: "#22d3ee",
      API: "#f59e0b",
      CLI: "#e879f9",
      DATA: "#34d399",
      MONITOR: "#64748b",
    }[layer] || "#64748b";
  }

  function layerRgba(layer, alpha) {
    const map = {
      UI: [34, 211, 238],
      API: [245, 158, 11],
      CLI: [232, 121, 249],
      DATA: [52, 211, 153],
      MONITOR: [100, 116, 139],
    };
    const rgb = map[layer] || map.MONITOR;
    return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  }

  function hashString(value) {
    let hash = 0;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
    }
    return Math.abs(hash);
  }

  function totalFlowSteps() {
    return state.flows.reduce((total, flow) => total + ((flow.steps && flow.steps.length) || 0), 0);
  }

  function formatNumber(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString() : "0";
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
