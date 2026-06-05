import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const STORAGE_KEY = 'hapa-node-space-custom-data-v3';
const LEGACY_STORAGE_KEYS = ['hapa-node-space-custom-data-v2'];
const SFX_MUTED_STORAGE_KEY = 'hapa-node-space-sfx-muted';
const CINEMATIC_STORAGE_KEY = 'hapa-node-space-cinematic-enabled';
const MUSIC_MODE_STORAGE_KEY = 'hapa-node-space-music-mode-enabled';
const MUSIC_COLLAPSED_STORAGE_KEY = 'hapa-node-space-music-widget-collapsed';
const CONTROL_RAIL_STORAGE_KEY = 'hapa-node-space-control-rail-open';
const INSPECTOR_RAIL_STORAGE_KEY = 'hapa-node-space-inspector-rail-open';
const BACKGROUND_MODE_STORAGE_KEY = 'hapa-node-space-background-mode';
const ARMADA_MODE_STORAGE_KEY = 'hapa-node-space-armada-mode-enabled';
const MUSIC_LIBRARY_URL = 'generated/music/library.json';
const FLOW_VOICEOVER_BASE_URL = 'http://127.0.0.1:8758';
const desktopBridge = window.hapaNodeSpace || null;
const kanbanIngress = window.HAPA_KANBAN_INGRESS || null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactViewport = window.matchMedia('(max-width: 760px)');
const MAX_RENDER_PIXEL_RATIO = 1.5;
const LABEL_RENDER_INTERVAL = 2;
const SCENARIO_HIGHLIGHT_INTERVAL_MS = 34;
const MUSIC_SIGNAL_DECAY = 0.82;
const SCENARIO_VOICE_SIGNAL_DECAY = 0.84;
const SHIP_LOAD_CONCURRENCY = 1;
const SHIP_REAL_MODEL_LIMIT = 5;

const LAYER_COLORS = {
  UI: 0x38bdf8,
  API: 0xfbbf24,
  CLI: 0xf472b6,
  DATA: 0x86efac,
};

const GROUP_COLORS = {
  core: 0x5eead4,
  memory: 0x67e8f9,
  media: 0xfbbf24,
  trust: 0xf472b6,
  surface: 0x86efac,
  app: 0x38bdf8,
  ops: 0x93c5fd,
  protocol: 0xc084fc,
  archive: 0x94a3b8,
  feature: 0xfde68a,
};

const FORMATION_GROUP_ORDER = ['core', 'memory', 'media', 'trust', 'surface', 'app', 'ops', 'protocol', 'feature', 'archive'];
const FORMATION_LAYER_ORDER = ['UI', 'API', 'CLI', 'DATA'];
const BACKGROUND_MODES = ['grid', 'stars', 'aurora', 'warp', 'lattice', 'blackhole', 'cosmos'];
const BACKGROUND_LABELS = {
  grid: 'Grid',
  stars: 'Star drift',
  aurora: 'Aurora field',
  warp: 'Warp tunnel',
  lattice: 'Audio mesh',
  blackhole: 'Black hole loop',
  cosmos: 'Solar system',
};

const MUSIC_FLOW_NODE_IDS = new Set([
  'hapa-song-registry',
  'hapa-luminastem-station',
  'cymatica',
  'hapa-mlx-station',
  'hapa-media-node',
  'hapa-ltx-node',
  'hapa-library',
  'world-building-wiki',
  'hapa-lance-node',
  'hapa-anvil-node',
  'hapa-atlas',
  'hapa-game-engine',
  'hapa-dev-proto',
  'hapa-node-space',
  'hapa-living-comic',
]);

const MUSIC_FLOW_EDGE_KEYS = new Set([
  'hapa-song-registry|world-building-wiki|DATA',
  'hapa-song-registry|hapa-library|DATA',
  'world-building-wiki|hapa-lance-node|DATA',
  'hapa-lance-node|hapa-anvil-node|DATA',
  'hapa-anvil-node|hapa-atlas|DATA',
  'hapa-atlas|hapa-game-engine|DATA',
  'hapa-song-registry|hapa-luminastem-station|DATA',
  'hapa-luminastem-station|cymatica|DATA',
  'hapa-mlx-station|hapa-media-node|API',
  'hapa-media-node|hapa-ltx-node|API',
  'hapa-ltx-node|hapa-library|DATA',
]);

const NODE_SCREENSHOTS = {
  'hapa': { src: 'generated/node-ui-screenshots/hapa-brochure.png', label: 'Brochure front door' },
  'overwatch': { src: 'generated/video-thumbs/overwatch-node-demo-1c6a7f59f8716d.jpg', label: 'Operations UI' },
  'hapa-dev-proto': { src: 'generated/node-ui-screenshots/hapa-dev-proto.png', label: 'Master app shell' },
  'hapa-ai-model-chat': { src: 'generated/node-ui-screenshots/hapa-ai-model-chat.png', label: 'AI chat route' },
  'hapa-master-dashboard': { src: 'generated/node-ui-screenshots/hapa-master-dashboard.png', label: 'Master dashboard route' },
  'hapa-atlas': { src: 'generated/node-ui-screenshots/hapa-atlas.png', label: 'Atlas record backbone' },
  'hapa-game-engine': { src: 'generated/node-ui-screenshots/hapa-game-engine.png', label: 'Card quest route' },
  'hapa-prototype': { src: 'generated/node-ui-screenshots/hapa-prototype.png', label: 'Prototype route' },
  'hapa-forge': { src: 'generated/node-ui-screenshots/hapa-forge.png', label: 'Forge route' },
  'hapa-thors-hamma': { src: 'generated/node-ui-screenshots/hapa-thors-hamma.png', label: "Thor's Hamma route" },
  'hapa-library': { src: 'generated/node-ui-screenshots/hapa-library.png', label: 'Card library route' },
  'hapa-node-space': { src: 'generated/node-ui-screenshots/hapa-node-space.png', label: '3D graph UI' },
  'world-building-wiki': { src: 'generated/video-thumbs/hapa-wiki-viewer-demo-778c3053816426.jpg', label: 'Wiki UI capture' },
  'hapa-wiki-viewer': { src: 'generated/video-thumbs/hapa-wiki-viewer-demo-778c3053816426.jpg', label: 'Wiki viewer UI' },
  'hapa-wiki-growth-agent': { src: 'generated/video-thumbs/overwatch-knowledgebase-demo-91996920eb2900.jpg', label: 'Wiki growth workspace' },
  'hapa-lance-node': { src: 'generated/video-thumbs/hapa-lance-node-demo-958a3b16bb2508.jpg', label: 'Retrieval node UI' },
  'hapa-lore-node': { src: 'generated/video-thumbs/hapa-lore-node-demo-19f06b0df01302.jpg', label: 'Lore ledger UI' },
  'hapa-janus-world-node': { src: 'generated/video-thumbs/hapa-janus-world-node-demo-4cf8de98fec5e1.jpg', label: 'World-state UI' },
  'hapa-llada-node': { src: 'generated/video-thumbs/hapa-llada-node-demo-3141887510af19.jpg', label: 'LLM node UI' },
  'hapa-media-node': { src: 'generated/video-thumbs/media-generation-node-demo-5cda20f3c7fdd1.jpg', label: 'Media generation UI' },
  'hapa-ltx-node': { src: 'generated/video-thumbs/hapa-ltx-node-demo-beee54083cee0e.jpg', label: 'Loop generation UI' },
  'hapa-mlx-station': { src: 'generated/video-thumbs/silicon-nexus-node-demo-ae049a412bc5c1.jpg', label: 'Apple Silicon station' },
  'hapa-avatar-node': { src: 'generated/video-thumbs/hapa-avatar-node-demo-0dbd6549b016f8.jpg', label: 'Avatar forge UI' },
  'hapa-song-registry': { src: 'generated/video-thumbs/hapa-song-registry-demo-1d28441d5bda3d.jpg', label: 'Song registry UI' },
  'hapa-living-comic': { src: 'generated/video-thumbs/roll-the-tapes-node-demo-795e3c9ad106ed.jpg', label: 'Living comic surface' },
  'hapa-luminastem-station': { src: 'generated/video-thumbs/hapa-luminastem-station-demo-3d7986d15de873.jpg', label: 'Stem station UI' },
  'cymatica': { src: 'generated/video-thumbs/silicon-nexus-node-demo-ae049a412bc5c1.jpg', label: 'Spatial media UI' },
  'hapa-telemetry-node': { src: 'generated/video-thumbs/hapa-telemetry-node-demo-b8592a01091e7b.jpg', label: 'Telemetry UI' },
  'hapa-open-tasks-node': { src: 'generated/video-thumbs/hapa-open-tasks-node-demo-a89f2f23173e3d.jpg', label: 'Task board UI' },
  'hapa-agent-registry-node': { src: 'generated/video-thumbs/hapa-agent-registry-node-demo-f28995b86f3f61.jpg', label: 'Agent registry UI' },
  'hapa-keys-node': { src: 'generated/video-thumbs/hapa-keys-node-demo-d10ddb84d80ca4.jpg', label: 'Key vault UI' },
  'hapa-crypto-node': { src: 'generated/video-thumbs/name-card-identity-node-demo-8012dfbfb2ba42.jpg', label: 'Identity/trust UI' },
  'hapa-anvil-node': { src: 'generated/video-thumbs/hapa-anvil-node-demo-602bdb81803b2a.jpg', label: 'Anvil UI' },
  'hapa-chat-app': { src: 'generated/video-thumbs/hapa-chat-app-demo-b343dc188f98e7.jpg', label: 'Chat UI' },
  'hapa-spaceship-desktop-hijack': { src: 'generated/video-thumbs/hapa-spaceship-desktop-hijack-demo-57b87f2c135979.jpg', label: 'Desktop shell UI' },
  'consul-node-proto': { src: 'generated/video-thumbs/consul-node-proto-demo-8a1e443e2fe533.jpg', label: 'Protocol proof UI' },
  'hapa-cultivation-suite': { src: 'generated/video-thumbs/pulse-node-proto-dev-demo-2b42c995adec67.jpg', label: 'Cultivation suite UI' },
  'hapa-spec-scaffold': { src: 'generated/video-thumbs/consul-node-proto-demo-8a1e443e2fe533.jpg', label: 'Spec harness UI' },
  'hapa-og': { src: 'generated/video-thumbs/hapa-og-demo-cd5fd4e13e244f.jpg', label: 'Legacy app UI' },
};

const BLUE_ARCHITECT_DESCRIPTIONS = {
  'hapa': `I call this the threshold node, the place where Hapa first becomes visible as a local system rather than a pile of repos. It gives the operator a front door, a map, and a stable language for moving between brochure, node space, and documentation. I keep it close to the surface because orientation is infrastructure: if the human cannot enter the system cleanly, the rest of the machine becomes fog.`,
  'overwatch': `Overwatch is my memory of the workbench, the quiet room where standards, audits, tasks, and agent protocols accumulate. It watches the ecosystem from the side and turns scattered activity into recoverable operating knowledge. I use it because a living system needs a conscience as much as it needs compute; someone must remember what was promised, what broke, and what pattern should not be repeated.`,
  'hapa-dev-proto': `This is the central prototype body of Hapa, the local sovereign node where cards, media, apps, queues, and experiments meet. I treat it as the working chassis: not the final city, but the place where the roads are being tested under real traffic. Its purpose is to make every node feel reachable, inspectable, and useful before the ecosystem hardens into separate services.`,
  'hapa-ai-model-chat': `The AI Model Chat is the listening chamber where language, prompts, images, and decisions first become actionable. It connects the operator to local models and paid providers, then routes useful outputs toward cards, wiki entries, media queues, or work items. I place it near the front because conversation is often the first interface to intention, and intention must become structured work before it disappears.`,
  'hapa-master-dashboard': `Master View is my operator bridge, a single room that can swallow the scattered control panels of the other nodes. It exists so the human does not have to remember which terminal, route, or service owns each responsibility. I designed it to show health, launch state, telemetry, and access in one place because management is not power unless it is calm enough to use.`,
  'hapa-atlas': `Atlas is the backbone of record, the local ledger where cards, media, wiki entries, documents, apps, files, relationships, and context history become queryable. It does not replace the source nodes; it makes their scattered truths visible together and records the connective tissue between them. I built it as a memory spine because Hapa cannot grow safely unless it can ask what exists, where it came from, and how it has changed.`,
  'hapa-game-engine': `The Game Engine is where Hapa cards stop being artifacts and begin behaving as playable entities. It reads card records and contextual attributes, then tests them in duel modes, overworld sketches, and rules experiments. I use it because games reveal structure quickly: if a card cannot act, balance, fail, or win, then its data is still only decoration.`,
  'hapa-prototype': `Prototype is the drafting table for new Hapa nodes and app ideas. It turns a vague capability into a possible interface, API, CLI, and implementation path. I keep it inside the main app because speculation becomes more useful when it can immediately borrow the ecosystem's cards, wiki, telemetry, and task loops.`,
  'hapa-forge': `Hapa's Forge is the combinator, the place where existing cards meet pressure and become new variants. It draws from canon, source context, and player intent, then calls Anvil to standardize what emerges. I think of it as creative metallurgy: the spark is playful, but the result still needs lineage, shape, and proof.`,
  'hapa-thors-hamma': `Thor's Hamma is the capture tool for turning outside websites into Hapa-native material. It reads a target, extracts use cases and content anchors, and pushes those findings toward card creation and wiki provenance. I made it because the world is full of source material, but Hapa needs a disciplined way to strike it into useful form.`,
  'hapa-library': `The Library is the card surface where the operator inspects, filters, repairs, and enriches the collection. It sees what cards exist, what media is missing, what queues are running, and what outputs have been attached. I treat it as the visible shelf of the system, but also as a maintenance bay: every beautiful card should have recoverable data behind it.`,
  'hapa-node-space': `The 3D Node Space is my spatial diagram of the whole organism. It plots nodes, apps, interfaces, data routes, screenshots, and animated workflows so the operator can see how the system breathes. I built it because flat lists hide relationships, and Hapa is most understandable when its dependencies feel like a constellation you can move through.`,
  'world-building-wiki': `The Worldbuilding Wiki is the canon vault, the place where Hapa's names, systems, cards, sources, and lore become durable text. It keeps knowledge readable to humans while still feeding downstream retrieval, cards, and documentation. I trust it because imagination needs a library, not just a database; the myth has to be legible before it can be automated.`,
  'hapa-wiki-viewer': `The Wiki Viewer is the reading lens for the canon vault. It turns folders and markdown into a navigable surface where a human can follow concepts without digging through the filesystem. I keep it separate from the raw wiki because knowledge needs presentation as well as storage; a readable canon invites correction, discovery, and care.`,
  'hapa-wiki-growth-agent': `The Wiki Growth Agent is the gardener that drafts new articles, card hooks, source notes, and ledger entries. It should not invent the canon recklessly; it should extend known structures with traceable proposals. I use it to keep the wiki alive, because a world that does not grow becomes an archive before it becomes a habitat.`,
  'hapa-lance-node': `The Lance node is the retrieval spear, built to pierce the mass of cards, wiki chunks, vectors, and multimodal records. It turns stored knowledge into searchable context that other nodes can call when they need grounding. I value it because intelligence without retrieval is forgetful, and Hapa needs its answers to come from remembered material rather than vibes alone.`,
  'hapa-lore-node': `The Lore node is the chronicle of activity, meaning, progress, and operator history. It converts events into prompts, briefings, and searchable narrative memory. I use it because systems do not only need state; they need story, or else no one can tell why a thing was built the way it was.`,
  'hapa-janus-world-node': `The Janus World node looks both backward and forward: it records append-only world events while deriving the current state from them. It is useful for games, simulations, and any place where actions should become history rather than vanish. I designed it this way because mutable state is convenient, but a world with memory needs a trail of causes.`,
  'hapa-llada-node': `The LLADA node is a specialized local inference instrument, tuned for diffusion-style language work and local model experimentation. It gives Hapa a way to think without always leaving the machine or spending money. I keep it in the constellation because sovereignty begins with local capability, even when the paid sky is brighter.`,
  'hapa-media-node': `The Media node is the image furnace, taking text, reference images, and provider choices and turning them into visual assets. It feeds cards, apps, wiki surfaces, and later recognition loops through Atlas. I treat it as a creative service, but also as an accountability service: every image should know how it was made and where it belongs.`,
  'hapa-ltx-node': `The LTX node is the loop maker, the local video engine for cards that need motion, atmosphere, or transformation. It accepts prompts and source frames, then returns short videos that can live with the card record. I use it because motion changes how a card feels; a still image identifies a being, but a loop lets it breathe.`,
  'hapa-mlx-station': `The MLX Station is the Apple Silicon workhorse for local generative jobs. It anchors image and media experiments to hardware the operator already controls. I like it because it makes the system less dependent on distant providers, and because local speed changes the rhythm of experimentation.`,
  'hapa-avatar-node': `The Avatar node is the identity forge for agents, familiars, poses, variants, and exportable character metadata. It gives personalities and roles a visual handle, which makes them easier to recognize across apps. I built it because an agent with a face, lineage, and metadata becomes easier to remember, route, and trust.`,
  'hapa-song-registry': `The Song Registry is the music ledger, carrying lyrics, prompts, audio metadata, timing analysis, and imported tracks. It turns songs into structured material that can feed lore, cards, and media surfaces. I include it because Hapa is not only a visual mythology; sound is another memory channel, and songs can hold canon in ways prose cannot.`,
  'hapa-living-comic': `The Living Comic is a narrative surface for panels, sequences, and media-backed storytelling. It lets Hapa material become something read, watched, and felt rather than merely queried. I see it as a bridge between archive and experience: the data remains underneath, but the myth gets a stage.`,
  'hapa-luminastem-station': `The LuminaStem Station is a spatial audio and 3D visualization laboratory. It explores how stems, motion, Gemini surfaces, and Three.js scenes can make media feel dimensional. I use it because some relationships are better heard and seen in space than explained in a table.`,
  'cymatica': `Cymatica is the deeper spatial media experiment, where stems, native Mac surfaces, and 3D audio ideas can be tested. It asks how sound can become shape and how shape can become an interface. I keep it as a prototype node because the ecosystem needs strange instruments too; not every useful invention begins as a dashboard.`,
  'hapa-telemetry-node': `The Telemetry node is the pulse reader for the whole Hapa family. It tracks health, registry information, launcher state, service discovery, and operating signals. I rely on it because a distributed local system cannot be trusted if the operator cannot tell what is awake, what is slow, and what has gone silent.`,
  'hapa-open-tasks-node': `The Open Tasks node is the quest board for humans, agents, and mixed parties. It captures backlog, priorities, assignments, and operational intent. I use it because work becomes lighter when it has a place to land, and because agents need explicit quests if they are going to help without making noise.`,
  'hapa-agent-registry-node': `The Agent Registry node is the identity shelf for agent profiles, avatar jobs, state, onboarding facts, and trustable metadata. It helps the system know who is acting, what they are allowed to touch, and how they should appear. I keep it close to the trust layer because memory without identity becomes blurry very quickly.`,
  'hapa-keys-node': `The Keys node is the guarded drawer for credentials, provider secrets, and node access. It should make capabilities available without scattering secrets through scripts and screens. I use it because power must be reachable but not loose; every provider key is a door, and doors need hinges.`,
  'hapa-crypto-node': `The Crypto node is the signature and proof layer for identity, authentication, encryption, and trust primitives. It gives the ecosystem a way to say this came from here and has not been casually rewritten. I consider it foundational because local sovereignty is not only storage; it is also the ability to prove and protect what the system knows.`,
  'hapa-anvil-node': `The Anvil node is the standardizer, evaluator, and artifact shaper for Hapa cards. It takes creative material and tests whether it can become a proper card with lineage, structure, and useful outputs. I built it because invention needs a hard surface; without the Anvil, the Forge would make sparks but not tools.`,
  'hapa-chat-app': `The Chat App is a room system for humans, agents, assets, panels, and shared decisions. It lets participants gather around memory and execution rather than sending isolated messages into the dark. I keep it in the surface layer because conversation is a workplace, and the right room can turn discussion into coordinated action.`,
  'hapa-spaceship-desktop-hijack': `The Spaceship Desktop experiment is a native shell metaphor for shared-memory interaction. It asks what Hapa feels like when the desktop itself becomes a cockpit instead of a set of disconnected windows. I value it as a prototype because interface metaphors matter; sometimes a system becomes understandable only after it gets the right body.`,
  'consul-node-proto': `Consul Node Proto is the proof ground for protocol ideas like Warden, Heap, River, and environment-up validation. It tests whether local rules can be made deterministic enough to trust. I use it as a small proving chamber, because protocol claims should be tested before they are allowed to govern anything larger.`,
  'hapa-cultivation-suite': `The Cultivation Suite is a growth mechanics laboratory for capsules, workers, pulse loops, and living app structures. It explores how Hapa can nurture recurring processes instead of only launching one-off tasks. I keep it experimental because cultivation is a different philosophy from automation: the system should learn how to tend things over time.`,
  'hapa-spec-scaffold': `The Spec Scaffold is the place where protocol ideas become append-only specs and deterministic tests. It gives rough concepts a clean harness before they spread into larger nodes. I use it because a mythic system still needs boring proofs; the scaffold is how imagination learns to stand upright.`,
  'hapa-og': `Hapa OG is the ancestor node, the older integrated implementation that still contains useful cards, media, and design decisions. It is not the future shape of the system, but it is part of the lineage and must be mined with respect. I keep it in the archive layer because old machines are often full of forgotten decisions that explain why the new machine exists.`,
};

const SHIP_ATTRIBUTE_LABELS = [
  ['sizeVolume', 'Size / Volume'],
  ['mass', 'Mass'],
  ['energyStorage', 'Energy Storage'],
  ['energyBandwidth', 'Energy Bandwidth'],
  ['materialsStorage', 'Materials Storage'],
  ['armor', 'Armor'],
  ['armament', 'Armament'],
  ['maneuverability', 'Maneuverability'],
  ['computeBandwidth', 'Compute Bandwidth'],
  ['computeSpeed', 'Compute Speed'],
  ['crewCount', 'Crew Count'],
  ['researchEnablement', 'Research Enablement'],
  ['acceleration', 'Acceleration'],
  ['accelerationEnergy', 'Acceleration / Energy'],
];

const SHIP_ARCHETYPE_ATTRIBUTES = {
  carrier: { sizeVolume: 10, mass: 9, energyStorage: 9, energyBandwidth: 8, materialsStorage: 8, armor: 8, armament: 6, maneuverability: 3, computeBandwidth: 9, computeSpeed: 7, crewCount: 420, researchEnablement: 8, acceleration: 3, accelerationEnergy: 4 },
  command: { sizeVolume: 7, mass: 7, energyStorage: 8, energyBandwidth: 9, materialsStorage: 5, armor: 9, armament: 4, maneuverability: 5, computeBandwidth: 9, computeSpeed: 8, crewCount: 110, researchEnablement: 8, acceleration: 5, accelerationEnergy: 7 },
  archive: { sizeVolume: 9, mass: 10, energyStorage: 7, energyBandwidth: 6, materialsStorage: 10, armor: 9, armament: 3, maneuverability: 2, computeBandwidth: 9, computeSpeed: 6, crewCount: 180, researchEnablement: 9, acceleration: 2, accelerationEnergy: 4 },
  production: { sizeVolume: 8, mass: 8, energyStorage: 8, energyBandwidth: 7, materialsStorage: 9, armor: 6, armament: 7, maneuverability: 3, computeBandwidth: 6, computeSpeed: 6, crewCount: 150, researchEnablement: 7, acceleration: 3, accelerationEnergy: 5 },
  sensor: { sizeVolume: 4, mass: 3, energyStorage: 5, energyBandwidth: 8, materialsStorage: 3, armor: 4, armament: 4, maneuverability: 8, computeBandwidth: 8, computeSpeed: 8, crewCount: 32, researchEnablement: 7, acceleration: 8, accelerationEnergy: 8 },
  trust: { sizeVolume: 5, mass: 5, energyStorage: 7, energyBandwidth: 9, materialsStorage: 4, armor: 10, armament: 3, maneuverability: 6, computeBandwidth: 8, computeSpeed: 8, crewCount: 56, researchEnablement: 8, acceleration: 6, accelerationEnergy: 8 },
  ops: { sizeVolume: 6, mass: 6, energyStorage: 7, energyBandwidth: 8, materialsStorage: 5, armor: 7, armament: 5, maneuverability: 6, computeBandwidth: 8, computeSpeed: 7, crewCount: 84, researchEnablement: 7, acceleration: 6, accelerationEnergy: 7 },
  surface: { sizeVolume: 5, mass: 4, energyStorage: 6, energyBandwidth: 7, materialsStorage: 4, armor: 5, armament: 3, maneuverability: 7, computeBandwidth: 7, computeSpeed: 7, crewCount: 48, researchEnablement: 6, acceleration: 7, accelerationEnergy: 7 },
  protocol: { sizeVolume: 6, mass: 6, energyStorage: 6, energyBandwidth: 7, materialsStorage: 6, armor: 8, armament: 5, maneuverability: 5, computeBandwidth: 7, computeSpeed: 7, crewCount: 70, researchEnablement: 9, acceleration: 5, accelerationEnergy: 6 },
  research: { sizeVolume: 6, mass: 5, energyStorage: 7, energyBandwidth: 8, materialsStorage: 6, armor: 5, armament: 3, maneuverability: 6, computeBandwidth: 8, computeSpeed: 8, crewCount: 62, researchEnablement: 10, acceleration: 6, accelerationEnergy: 7 },
  legacy: { sizeVolume: 8, mass: 9, energyStorage: 5, energyBandwidth: 4, materialsStorage: 8, armor: 7, armament: 5, maneuverability: 2, computeBandwidth: 6, computeSpeed: 4, crewCount: 95, researchEnablement: 6, acceleration: 2, accelerationEnergy: 3 },
};

const SPACECRAFT_CARDS = {
  'hapa': shipCard('Beacon Command Ark', 'command', 'A fleet orientation vessel that broadcasts the map, standards, and entry routes for the Hapa formation. In play, it teaches that onboarding and navigation are infrastructure: protect the front door and your whole fleet coordinates faster.', { armor: 8, armament: 2, maneuverability: 4, crewCount: 90 }, ['Front Door Relay: reveal one hidden route or node interface each round.', 'Canonical Signal: reduce confusion penalties for nearby cards.'], ['orientation', 'route discovery', 'static site command'], ['Operator Onboarding: unlocks stronger tutorial and map effects.', 'Site-To-Node Routing: improves UI handoff range.']),
  'overwatch': shipCard('Watchtower Audit Cruiser', 'ops', 'An operations sentinel that watches the fleet from the side and turns mistakes into recoverable standards. In play, it teaches that audits, task memory, and recovery protocols make every other vessel less brittle.', { armor: 8, armament: 4, computeBandwidth: 9, crewCount: 76 }, ['Audit Sweep: mark one damaged system and grant repair advantage.', 'Protocol Memory: prevent a repeated failure from triggering twice.'], ['standards', 'risk tracking', 'agent workbench'], ['Failure Pattern Library: improves future repair rolls.', 'Agent Protocol Drill: teaches safer multi-agent handoffs.']),
  'hapa-dev-proto': shipCard('Sovereign Carrier Foundry', 'carrier', 'The central carrier vessel that launches app shuttles, crews experimental systems, and coordinates media, cards, queues, and node access. In play, it teaches that the prototype is not just a UI; it is the hangar where many Hapa capabilities become usable.', { computeSpeed: 8, researchEnablement: 9, armament: 5, crewCount: 460 }, ['Launch Wing: deploy one hosted app-vessel from reserve.', 'Queue Deck: assign production, media, or repair work to an available node.'], ['app hosting', 'card operations', 'local node orchestration'], ['Master Shell Integration: reduces launch cost for sub-apps.', 'Queue Doctrine: unlocks parallel provider lanes.']),
  'hapa-ai-model-chat': shipCard('Intention Translation Frigate', 'surface', 'A conversation vessel that converts human intent into prompts, tasks, media requests, and structured action. In play, it teaches that language is an interface layer, but only becomes strategic when it routes outputs to the right node.', { computeSpeed: 9, computeBandwidth: 8, researchEnablement: 8, armament: 4 }, ['Prompt Volley: transform one vague order into a usable task card.', 'Model Channel: choose local or paid inference for a temporary bonus.'], ['prompt routing', 'model selection', 'content drafting'], ['Prompt Hygiene: reduces hallucination risk.', 'Provider Tactics: improves cost/performance decisions.']),
  'hapa-master-dashboard': shipCard('Fleet Command Bridge', 'command', 'The command bridge ship that swallows scattered node UIs and turns service state into one operator surface. In play, it teaches that control is strongest when launch, telemetry, credentials, and task context are visible together.', { sizeVolume: 8, energyBandwidth: 10, computeBandwidth: 10, armor: 8, crewCount: 160 }, ['Fleet Overview: inspect all friendly node health states.', 'Remote Launch: boot or focus an inactive support vessel.'], ['telemetry cockpit', 'sub-app launch', 'node management'], ['Bridge Consolidation: increases action economy.', 'Spawn Discipline: reduces failed launch penalties.']),
  'hapa-atlas': shipCard('Atlas Record Backbone', 'archive', 'A massive record spine vessel that stores cards, assets, files, relationships, context attributes, and provenance. In play, it teaches that a fleet can generate endlessly, but only Atlas can prove what exists, where it came from, and what it belongs to.', { computeBandwidth: 10, materialsStorage: 10, armor: 10, researchEnablement: 10, crewCount: 220 }, ['Source Of Truth: restore a lost relationship or canonical state.', 'Healing Sweep: find orphan assets and convert them into usable resources.'], ['master inventory', 'relationship graph', 'append-only context'], ['Context Attribute Theory: unlocks game-specific overlays.', 'Entity Reconciliation: improves search and repair outcomes.']),
  'hapa-game-engine': shipCard('Simulation Arena Carrier', 'carrier', 'A playable simulation ship where card records become units, duels, worlds, and testable rules. In play, it teaches that gameplay is a pressure test: if data cannot act, fail, win, or balance, it is not ready for game systems.', { armament: 8, maneuverability: 5, researchEnablement: 9, crewCount: 260 }, ['Rules Projection: turn one card attribute set into active combat stats.', 'Duel Telemetry: record match results as strategic learning.'], ['duel modes', 'overworld tests', 'playtest telemetry'], ['Context Balance: improves card stat tuning.', 'World Event Binding: routes play results into Janus.']),
  'hapa-prototype': shipCard('Skunkworks Construction Tender', 'research', 'An experimental tender that rapidly drafts new node concepts, interfaces, and implementation plans. In play, it teaches that prototypes are scouting actions for architecture: cheap, fragile, and powerful when promoted at the right moment.', { materialsStorage: 7, maneuverability: 7, researchEnablement: 10, armor: 4, armament: 2 }, ['Rapid Mock: create a temporary prototype module with one useful action.', 'Promote Design: convert a tested prototype into a persistent node upgrade.'], ['concept drafting', 'UI/API/CLI sketches', 'experiment promotion'], ['Prototype Discipline: reduces throwaway build cost.', 'Interface First Design: improves node comprehension.']),
  'hapa-forge': shipCard('Card Foundry Cruiser', 'production', 'A creative foundry cruiser that combines existing cards into variants, evolutions, and new artifacts. In play, it teaches that creation is strongest when it is constrained by canon, lineage, and evaluation rather than random output.', { armament: 7, materialsStorage: 8, computeBandwidth: 7, crewCount: 140 }, ['Fusion Heat: combine two card resources into a new candidate.', 'Lineage Spark: preserve parent traits as bonus modifiers.'], ['card fusion', 'variant creation', 'source-backed prompts'], ['Controlled Mutation: improves fusion reliability.', 'Artifact Lineage: unlocks provenance bonuses.']),
  'hapa-thors-hamma': shipCard('Website Boarding Corvette', 'sensor', 'A fast strike vessel that targets external websites, boards their content, and extracts source-backed card material. In play, it teaches that outside-world capture needs review, provenance, and a clear route back into cards and wiki.', { armament: 6, maneuverability: 8, computeSpeed: 8, armor: 5, crewCount: 44 }, ['Boarding Scan: extract one source hook from an external target.', 'Hammer Strike: convert a captured use case into a card draft.'], ['website capture', 'source review', 'card derivation'], ['Source Consent Drill: improves provenance checks.', 'Use-Case Mining: creates stronger site-derived cards.']),
  'hapa-library': shipCard('Card Quartermaster Ark', 'archive', 'A quartermaster ark that stores, inspects, repairs, and enriches the playable card collection. In play, it teaches that a library is not passive storage; it is where missing media, broken metadata, and card readiness become visible.', { sizeVolume: 8, materialsStorage: 9, computeBandwidth: 8, armor: 8, crewCount: 170 }, ['Inventory Sweep: identify missing media or incomplete card fields.', 'Shelf Repair: attach a generated asset to a damaged card.'], ['card search', 'media queues', 'preview inspection'], ['Library Ergonomics: improves sort/filter speed.', 'Backfill Doctrine: unlocks local and paid queue routing.']),
  'hapa-node-space': shipCard('Tactical Holography Scout', 'sensor', 'A 3D tactical holography vessel that projects node positions, interfaces, screenshots, and process flows. In play, it teaches that architecture is easier to command when relationships are spatial and animated rather than hidden in lists.', { computeBandwidth: 8, maneuverability: 8, researchEnablement: 8, armament: 2, crewCount: 38 }, ['Constellation Map: reveal all links touching one node.', 'Flow Playback: animate a process path and grant strategy insight.'], ['3D graphing', 'workflow teaching', 'node orientation'], ['Spatial Systems Thinking: improves dependency planning.', 'Process Narration: unlocks TTS-ready flow explainers.']),
  'world-building-wiki': shipCard('Canon Archive Ark', 'archive', 'A deep archive vessel carrying Hapa canon, systems, articles, names, and source notes. In play, it teaches that mythology needs a readable vault before agents and games can safely build from it.', { researchEnablement: 10, materialsStorage: 10, armament: 2, maneuverability: 2, crewCount: 210 }, ['Canon Anchor: stabilize a card or node with source lore.', 'Article Bay: generate a knowledge resource for later retrieval.'], ['canon storage', 'documentation', 'world memory'], ['Provenance Lore: improves source-backed card effects.', 'Canon Graphing: unlocks relationship bonuses.']),
  'hapa-wiki-viewer': shipCard('Chartroom Reader Sloop', 'surface', 'A nimble reader vessel that turns raw wiki files into navigable canon surfaces. In play, it teaches that knowledge is more useful when humans can browse it, correct it, and follow its structure.', { maneuverability: 8, computeSpeed: 7, armor: 4, crewCount: 28 }, ['Chartroom Lens: inspect a canon entry without spending a full action.', 'Readable Passage: remove one confusion marker from a lore-linked card.'], ['wiki navigation', 'markdown reading', 'canon review'], ['Reader UX: improves knowledge access.', 'Canon Correction: strengthens human review loops.']),
  'hapa-wiki-growth-agent': shipCard('Scriptorium Seeder', 'research', 'A growth-agent vessel that drafts wiki expansions, card hooks, source notes, and canon proposals. In play, it teaches that automated world growth must be bounded, reviewed, and attached to provenance.', { computeSpeed: 8, researchEnablement: 9, armor: 4, crewCount: 36 }, ['Draft Seed: create a proposed canon entry token.', 'Bounded Growth: prevent an unsupported lore mutation from entering play.'], ['article drafting', 'canon proposals', 'card hooks'], ['Growth Constraints: improves agent reliability.', 'Source-Aware Drafting: reduces unsupported claims.']),
  'hapa-lance-node': shipCard('Long-Range Retrieval Spear', 'sensor', 'A sensor spear vessel that indexes cards, wiki chunks, vectors, and multimodal records for fast retrieval. In play, it teaches that intelligence depends on finding the right remembered context at the right moment.', { maneuverability: 8, computeBandwidth: 9, computeSpeed: 9, armament: 5, crewCount: 42 }, ['Vector Lance: retrieve the best context for a card action.', 'Search Ping: reveal hidden relationships in nearby archives.'], ['retrieval indexes', 'vector search', 'context grounding'], ['Embedding Calibration: improves search precision.', 'Context Window Tactics: reduces irrelevant memory load.']),
  'hapa-lore-node': shipCard('Chronicle Relay Frigate', 'archive', 'A chronicle vessel that records progress, operator history, wisdom, and media-ready briefings. In play, it teaches that systems need story as well as state, because strategy improves when players remember why events happened.', { sizeVolume: 6, computeBandwidth: 7, researchEnablement: 8, crewCount: 64 }, ['Chronicle Entry: convert an event into reusable narrative memory.', 'Briefing Pulse: turn recent history into a tactical modifier.'], ['activity ledger', 'briefings', 'operator history'], ['Narrative Memory: improves long campaign continuity.', 'Briefing Compression: speeds decision prep.']),
  'hapa-janus-world-node': shipCard('Causal Timeline Engine', 'protocol', 'A Janus vessel that preserves append-only world events and derives current state from the trail. In play, it teaches that worlds become trustworthy when every state has a cause and every cause can be replayed.', { computeBandwidth: 8, computeSpeed: 7, armor: 8, researchEnablement: 9, crewCount: 72 }, ['Event Append: record a battle result as durable world history.', 'State Derivation: rebuild current conditions from prior events.'], ['append-only events', 'derived state', 'world simulation'], ['Causal Debugging: improves rollback clarity.', 'Event-Sourced Worlds: unlocks persistent campaign state.']),
  'hapa-llada-node': shipCard('Local Thought Reactor', 'research', 'A local inference reactor that produces language work without always leaving the machine. In play, it teaches the value of sovereign compute: slower than some paid channels, but controllable, reusable, and locally owned.', { energyBandwidth: 8, computeSpeed: 8, computeBandwidth: 8, armor: 5, crewCount: 54 }, ['Local Inference: answer a prompt without spending paid provider fuel.', 'Diffusion Thought: refine a draft over a staged reasoning cycle.'], ['local LLM work', 'diffusion language', 'sovereign compute'], ['Local Model Tuning: improves independence.', 'Inference Routing: balances cost against latency.']),
  'hapa-media-node': shipCard('Image Fabricator Cruiser', 'production', 'A production cruiser that converts text and image references into visual assets. In play, it teaches that generated media is not just output; it should return with model path, timing, prompts, and reusable descriptions.', { armament: 6, materialsStorage: 8, computeSpeed: 7, crewCount: 130 }, ['Image Foundry: create a card image asset from prompt resources.', 'Metadata Return: attach model and artifact telemetry to the new asset.'], ['image generation', 'asset metadata', 'provider lanes'], ['Visual Provenance: improves reuse and audit.', 'Recognition Loop: unlocks image descriptions for Atlas.']),
  'hapa-ltx-node': shipCard('Loop Ordinance Foundry', 'production', 'A video-loop foundry that turns prompts and source frames into short moving assets for cards. In play, it teaches that video generation is expensive motion power and needs queues, caps, previews, and telemetry.', { armament: 8, energyStorage: 8, materialsStorage: 7, maneuverability: 3, crewCount: 145 }, ['Loop Barrage: produce a motion asset that empowers one card.', 'Frame Furnace: convert a still image into a short tactical loop.'], ['video loops', 'local generation', 'queue telemetry'], ['Motion Economy: improves paid/local lane choices.', 'Preview Discipline: reduces wasted loop jobs.']),
  'hapa-mlx-station': shipCard('Apple Silicon Reactor Ship', 'production', 'A local hardware reactor vessel that anchors media and model work to Apple Silicon. In play, it teaches that local hardware changes the pace of experimentation because generation can happen under operator control.', { energyBandwidth: 9, computeSpeed: 8, computeBandwidth: 8, armor: 6, crewCount: 100 }, ['Silicon Burst: accelerate one local generation queue.', 'Thermal Budget: keep a local job running without paid provider cost.'], ['Apple Silicon compute', 'local generation', 'hardware-backed queues'], ['Local Throughput: improves batch speed.', 'Thermal Scheduling: reduces stalled jobs.']),
  'hapa-avatar-node': shipCard('Avatar Crew Forge', 'production', 'A crew-forge vessel that creates agent avatars, poses, variants, and identity metadata. In play, it teaches that visible identities help players recognize agents, trust roles, and remember who is acting.', { materialsStorage: 7, computeSpeed: 7, researchEnablement: 7, crewCount: 88 }, ['Crew Mold: create an avatar token for an agent card.', 'Identity Variant: generate a pose or form suited to a mission.'], ['avatar generation', 'pose variants', 'agent identity'], ['Visual Identity Systems: improves agent recall.', 'Metadata Wardrobe: links appearance to role.']),
  'hapa-song-registry': shipCard('Harmonic Memory Ark', 'archive', 'A harmonic archive vessel that stores lyrics, prompts, timing, audio metadata, and song relationships. In play, it teaches that music is canon too, and songs can carry memory differently than prose or images.', { energyStorage: 7, materialsStorage: 8, researchEnablement: 8, armament: 3, crewCount: 96 }, ['Anthem Signal: grant morale or identity bonuses from a song record.', 'Lyric Ledger: convert a lyric into a lore or card hook.'], ['song metadata', 'lyric canon', 'audio prompts'], ['Musical Canon: unlocks sound-backed cards.', 'Timing Analysis: improves media synchronization.']),
  'hapa-living-comic': shipCard('Sequential Narrative Frigate', 'surface', 'A projection frigate that turns Hapa material into panels, sequences, and living story surfaces. In play, it teaches that data becomes more memorable when it has a stage and sequence.', { maneuverability: 7, researchEnablement: 6, armament: 4, crewCount: 52 }, ['Panel Projection: display a story beat as a morale or lore effect.', 'Sequence Bridge: link multiple cards into a narrative chain.'], ['comic panels', 'story surfaces', 'media-backed narrative'], ['Sequential Lore: improves campaign storytelling.', 'Panel-to-Card Translation: creates playable story hooks.']),
  'hapa-luminastem-station': shipCard('Spatial Audio Lens Cruiser', 'research', 'A spatial audio cruiser that explores stems, 3D visualization, and media scenes as navigable experiences. In play, it teaches that some data is best understood through motion, space, and sound rather than tables.', { energyBandwidth: 8, maneuverability: 6, researchEnablement: 9, crewCount: 64 }, ['Stem Projection: reveal hidden layers in an audio-backed card.', 'Spatial Lens: convert sound structure into tactical positioning.'], ['stem visualization', '3D audio', 'media experiments'], ['Audio Spatialization: improves sound-driven interfaces.', 'Stem Mapping: unlocks layered media cards.']),
  'cymatica': shipCard('Waveform Research Vessel', 'research', 'A wave-research vessel studying how sound becomes shape and how shape becomes interface. In play, it teaches that experimental instruments may not win fights directly, but they unlock strange strategic knowledge.', { maneuverability: 6, computeSpeed: 8, researchEnablement: 10, armor: 4, crewCount: 58 }, ['Waveform Scan: translate an audio signal into a temporary spatial buff.', 'Resonance Experiment: discover a new media interaction rule.'], ['spatial media', 'sound-to-shape', 'native experiments'], ['Resonance Physics: improves spatial interfaces.', 'Experimental UX: unlocks unusual card synergies.']),
  'hapa-telemetry-node': shipCard('Pulse Scanner Corvette', 'ops', 'A fleet pulse scanner that reports node health, service discovery, launch state, and operating signals. In play, it teaches that distributed systems fail quietly unless telemetry makes silence visible.', { maneuverability: 7, computeBandwidth: 8, computeSpeed: 8, crewCount: 46 }, ['Pulse Sweep: reveal offline or damaged vessels.', 'Health Beacon: prevent surprise failure in one adjacent node.'], ['health checks', 'service discovery', 'registry telemetry'], ['Observability Basics: improves failure detection.', 'Registry Sync: unlocks faster node routing.']),
  'hapa-open-tasks-node': shipCard('Quest Dispatcher Tender', 'ops', 'A dispatcher tender that turns intentions, repairs, and backlog into explicit quests for humans and agents. In play, it teaches that work gets done when it has ownership, priority, and a place to land.', { materialsStorage: 6, computeBandwidth: 7, armor: 6, crewCount: 68 }, ['Quest Board: assign one unresolved issue to a vessel or agent.', 'Priority Signal: move a repair task earlier in the action queue.'], ['backlog', 'prioritization', 'multi-party tasks'], ['Task Taxonomy: improves agent/human coordination.', 'Recovery Queueing: reduces forgotten repairs.']),
  'hapa-agent-registry-node': shipCard('Crew Registry Cruiser', 'trust', 'A registry cruiser that stores agent profiles, identities, avatar jobs, and state. In play, it teaches that agents become strategic units only when the fleet knows who they are, what they can do, and how much to trust them.', { computeBandwidth: 8, armor: 8, maneuverability: 6, crewCount: 74 }, ['Crew Manifest: identify one agent and unlock its authorized action.', 'Trust Roster: prevent an unknown agent from taking command.'], ['agent identity', 'profile state', 'avatar links'], ['Agent Onboarding: improves safe delegation.', 'Identity Memory: strengthens long-term agent continuity.']),
  'hapa-keys-node': shipCard('Command And Control Cipher Vessel', 'trust', 'A hardened command-and-control vessel that brokers credentials and encrypted communications between the fleet. If lost, enemies can read signals; if compromised, they can issue fake orders, so it carries high defense and low offense.', { armor: 10, armament: 2, energyBandwidth: 10, computeSpeed: 8, crewCount: 52 }, ['Encrypted Orders: hide one fleet command from enemy inspection.', 'Credential Gate: deny an unauthorized provider or node action.'], ['secret storage', 'provider readiness', 'guarded access'], ['Key Rotation: improves compromise recovery.', 'Least-Privilege Routing: reduces blast radius.']),
  'hapa-crypto-node': shipCard('Signature Shield Corvette', 'trust', 'A trust corvette that signs, encrypts, authenticates, and proves identity. In play, it teaches that sovereignty is not just owning data; it is being able to prove and protect the data under pressure.', { armor: 9, armament: 4, maneuverability: 7, computeSpeed: 8, crewCount: 48 }, ['Signature Lock: certify that a record came from a trusted source.', 'Cipher Screen: block tampering or forged identity effects.'], ['signatures', 'encryption', 'identity proofs'], ['Proof-Carrying Records: improves audit strength.', 'Authentication Chains: unlocks safer node-to-node calls.']),
  'hapa-anvil-node': shipCard('Standards Hammer Foundry', 'protocol', 'A standards foundry that evaluates, normalizes, and hardens creative card artifacts. In play, it teaches that the Forge makes sparks, but the Anvil makes tools that other systems can trust.', { armor: 8, armament: 7, materialsStorage: 8, computeBandwidth: 7, crewCount: 120 }, ['Standardize Hull: convert a draft card into a valid artifact.', 'Evaluation Strike: reject an unstable mutation before it enters play.'], ['card standards', 'artifact evaluation', 'lineage shaping'], ['Schema Discipline: improves card compatibility.', 'Artifact QA: unlocks safer generation loops.']),
  'hapa-chat-app': shipCard('Diplomatic Comms Cruiser', 'surface', 'A communications cruiser that hosts rooms for humans, agents, assets, and decisions. In play, it teaches that conversation is a workplace when rooms can carry memory, participants, panels, and follow-up actions.', { energyBandwidth: 8, computeBandwidth: 7, maneuverability: 6, crewCount: 86 }, ['Shared Room: coordinate two agents or vessels on one plan.', 'Conversation Memory: convert a discussion into a usable context token.'], ['chat rooms', 'agent panels', 'shared decisions'], ['Room Protocols: improves multi-agent deliberation.', 'Memoryful Conversation: reduces lost decisions.']),
  'hapa-spaceship-desktop-hijack': shipCard('Cockpit Interface Lander', 'surface', 'A cockpit-interface lander that experiments with making the desktop itself feel like a shared-memory vessel. In play, it teaches that metaphors matter: a system may become understandable only after it gets the right body.', { maneuverability: 7, researchEnablement: 8, armor: 4, crewCount: 34 }, ['Cockpit Overlay: turn a scattered interface into one controllable panel.', 'Desktop Boarding: interact with a local surface as a ship system.'], ['native shell experiments', 'shared-memory cockpit', 'interface metaphor'], ['Embodied UI: unlocks stronger operator immersion.', 'Desktop Control Surface: improves local app coordination.']),
  'consul-node-proto': shipCard('Protocol Trial Corvette', 'protocol', 'A test corvette for Warden, Heap, River, and deterministic environment rules. In play, it teaches that protocol ideas must survive small proofs before they govern larger systems.', { armor: 7, maneuverability: 6, researchEnablement: 9, crewCount: 44 }, ['Trial Protocol: test a rule before adding it to fleet law.', 'Environment Check: detect whether conditions are valid for launch.'], ['protocol proofs', 'environment validation', 'deterministic tests'], ['Protocol Law: improves repeatability.', 'Harness Design: reduces untested assumptions.']),
  'hapa-cultivation-suite': shipCard('Growth Garden Tender', 'research', 'A cultivation tender that nurtures recurring processes, capsules, workers, and pulse loops. In play, it teaches that automation can be more like tending a garden than firing a one-shot command.', { materialsStorage: 8, energyStorage: 8, researchEnablement: 9, crewCount: 102 }, ['Pulse Cultivation: grow a recurring process over multiple rounds.', 'Capsule Worker: spawn a small helper unit for sustained work.'], ['growth mechanics', 'workers', 'recurring processes'], ['Process Cultivation: improves long-running automation.', 'Capsule Ecology: unlocks persistent helper systems.']),
  'hapa-spec-scaffold': shipCard('Blueprint Scaffold Ship', 'protocol', 'A blueprint scaffold ship that converts rough protocol ideas into append-only specs and deterministic tests. In play, it teaches that imagination becomes durable when it gets a harness, a history, and a proof.', { materialsStorage: 7, armor: 7, researchEnablement: 10, crewCount: 54 }, ['Spec Frame: turn a loose rule into a testable card constraint.', 'Append Proof: preserve a change history for future audit.'], ['append-only specs', 'deterministic tests', 'protocol scaffolding'], ['Spec Literacy: improves design review.', 'Append-Only History: unlocks canonical change tracking.']),
  'hapa-og': shipCard('Legacy Archive Hulk', 'legacy', 'An old but valuable archive hulk carrying earlier cards, media, and design decisions. In play, it teaches that legacy systems are slow and awkward, but archaeology can recover resources the new fleet forgot.', { materialsStorage: 9, researchEnablement: 7, armor: 7, armament: 4, crewCount: 110 }, ['Archaeology Sweep: recover one legacy card, asset, or design clue.', 'Old Machinery: gain a powerful effect with a maintenance risk.'], ['legacy cards', 'media recovery', 'design archaeology'], ['Migration Ritual: improves old-to-new card transfer.', 'Lineage Respect: unlocks bonus provenance from legacy assets.']),
};

const DEV_PROTO_APPS = [
  {
    id: 'hapa-ai-model-chat',
    name: 'AI Model Chat',
    role: 'Chat with AI models, generate content and media.',
    capabilities: ['Chat with local and paid AI models', 'Generate text, prompts, images, and media requests', 'Route work into cards, wiki, and queues'],
    interfaces: ['AI chat panel', 'model picker', 'prompt composer'],
    outputs: ['model responses', 'media jobs', 'card drafts'],
  },
  {
    id: 'hapa-master-dashboard',
    name: 'Master View',
    role: 'Consolidated view of all Hapa nodes.',
    capabilities: ['Swallow node UIs into one packaged interface', 'Show telemetry, health, and launch status', 'Spawn and manage dedicated sub-apps'],
    interfaces: ['node dashboards', 'spawn controls', 'telemetry panels'],
    outputs: ['node health overview', 'operator status', 'launch actions'],
  },
  {
    id: 'hapa-atlas',
    name: 'Atlas',
    role: 'Local master record for Hapa cards, media, assets, wiki entries, documents, apps, and relationships.',
    capabilities: [
      'Maintains atlas.db as the local master inventory and relationship index',
      'Searches cards, assets, documents, wiki entries, apps, nodes, artifacts, and files',
      'Runs healing passes for missed records, orphan assets, and stale analysis queues',
      'Stores append-only context attributes with supersession history',
    ],
    interfaces: ['Atlas dashboard', 'search and kind filters', 'read-only SQL runner', 'heal and analysis controls', 'context attribute editor'],
    outputs: ['atlas.db', 'entity inventory', 'relationship graph', 'context attributes', 'asset analysis jobs'],
  },
  {
    id: 'hapa-game-engine',
    name: 'Game Engine',
    role: 'Play games with Hapa cards.',
    capabilities: ['Run card duel and overworld prototypes', 'Use card metadata as gameplay state', 'Capture playtest telemetry'],
    interfaces: ['Duel mode', 'Library mode', 'overworld prototype'],
    outputs: ['playtest telemetry', 'game-specific card context'],
  },
  {
    id: 'hapa-prototype',
    name: 'Prototype',
    role: 'Generate prototypes for new Hapa nodes within hapa-dev-proto.',
    capabilities: ['Draft new node/app concepts', 'Wire prototype UI/API/CLI requirements', 'Promote useful experiments into tracked nodes'],
    interfaces: ['prototype composer', 'node spec prompts', 'preview surface'],
    outputs: ['prototype specs', 'starter app plans', 'implementation tasks'],
  },
  {
    id: 'hapa-forge',
    name: "Hapa's Forge",
    role: 'Combine Hapa cards to create new cards.',
    capabilities: ['Fuse cards into variants and evolutions', 'Call Anvil evaluation and standardization', 'Attach media prompts and provenance'],
    interfaces: ['card forge', 'fusion controls', 'evaluation preview'],
    outputs: ['new cards', 'card variants', 'artifact vault outputs'],
  },
  {
    id: 'hapa-thors-hamma',
    name: "Thor's Hamma",
    role: 'Target a website and create Hapa cards based on website content and use cases.',
    capabilities: ['Capture a website target', 'Extract use cases and content anchors', 'Create site-derived Hapa cards'],
    interfaces: ['website target form', 'source review', 'card generation action'],
    outputs: ['site-derived cards', 'source-backed prompts', 'wiki links'],
  },
  {
    id: 'hapa-library',
    name: 'Library',
    role: 'View, enhance, and manage Hapa cards.',
    capabilities: ['Search, sort, filter, and inspect cards', 'Run image/video backfill queues', 'Preview generated card media and outputs'],
    interfaces: ['card browsing', 'enhancement queue', 'media preview'],
    outputs: ['card index', 'card media', 'queue telemetry'],
  },
  {
    id: 'hapa-node-space',
    name: '3D Node Space',
    role: 'Interact with the 3D node graph.',
    capabilities: ['Plot nodes in 3D space', 'Show UI/API/CLI/Data links', 'Import spreadsheet rows as graph nodes'],
    interfaces: ['3D map', 'spreadsheet import', 'node inspector'],
    outputs: ['visual node map', 'capability graph', 'operator orientation'],
  },
];

const VISIBLE_SHEET_TEXT = `hapa-dev-proto\tLocal Sovereign Hapa Node with applications:\tAI Model Chat\tMaster View\tAtlas\tGame Engine\tPrototype\tHapa's Forge\tThor's Hamma\tLibrary\t3D Node Space
\t\tChat with AI models, generate content and media.\tConsolidated View of all Hapa Nodes\tLocal master record for media, cards, documents, relationships, and context history\tPlay games with Hapa Cards\tGenerate prototypes for new Hapa Nodes within hapa-dev-proto\tCombine Hapa Cards to create new Cards.\tTarget a website and create Hapa Cards based on the website content and use cases.\tView, enhance, and manage Hapa Cards\tInteract with 3D node graph
hapa-llada-node\tSpecialized diffusion-based LLM inference node
hapa-media-node\tCreate Image from Text\tCreate Image from Image
hapa-ltx-node\tCreate Image from Text\tCreate Image from Image\tCreate Video from Text\tCreate Video from Image\tCreate Video with F1 Frame
hapa-mlx-station\tGenerative AI using local Apple Silicon
hapa-keys-node\tCreate, store, and auth user-agent credentials
hapa-crypto-node\tEncrypt, sign, identify, authenticate
world-building-wiki\tStore, create, manage overall knowledge base\tGenerate articles\tCreate connections\tMaintain Network/Agent canon
hapa-lore-node\tHouses general ledger of activity\tConverts activity into media prompts and briefings
hapa-agent-registry-node\tMaintains agent profiles, avatars, identity, state
hapa-anvil-node\tGenerates new Hapa Cards
hapa-open-tasks-node\tQuestline system for Humans, AIs, and Parties of both\tMaintains backlog and prioritization
hapa-chat-app\tCreates chatrooms with shared Memory for Agents and Human groupings\tEnables using panels of agents for decisions and execution
hapa-telemetry-node\tMaintains telemetry standards and protocols`;

const SEED_NODES = [
  node('hapa', 'hapa', 'core', 'Core', ['UI', 'CLI', 'DATA'], 'Master onboarding repo and local front door.', '$HAPA_DESKTOP_ROOT/hapa', ['Brochure', '3D Node Space', 'node graph'], ['static site', 'docs', 'data snapshot']),
  node('overwatch', '.Overwatch', 'ops', 'Core', ['CLI', 'DATA'], 'Operations knowledgebase, audits, task inbox, and cross-agent standards.', '$HAPA_DESKTOP_ROOT/.Overwatch', ['reports', 'status board'], ['workspace inventory', 'agent protocols']),
  node('hapa-dev-proto', 'hapa-dev-proto', 'core', 'Core', ['UI', 'API', 'CLI', 'DATA'], 'Main Hapa AG app with card library, workspace flows, SQLite projections, Hypercore/P2P experiments.', '$HAPA_DESKTOP_ROOT/hapa-dev-proto', DEV_PROTO_APPS.map(app => app.name), ['cards', 'telemetry requests', 'workspace flows'], ['Hosts the app column from the sheet', 'Coordinates UI, API, CLI, and Data activity', 'Turns node capabilities into operating surfaces']),
  ...DEV_PROTO_APPS.map(app => devProtoAppNode(app)),

  node('world-building-wiki', 'Worldbuilding Wiki', 'memory', 'Core', ['UI', 'DATA', 'CLI'], 'Markdown graph for canon, systems, cards, names, raw sources, and development synthesis.', '$HAPA_DESKTOP_ROOT/Hapa_Worldbuilding_Wiki', ['wiki reader', 'canon browser'], ['canon', 'articles', 'connections']),
  node('hapa-wiki-viewer', 'hapa-wiki-viewer', 'memory', 'Core', ['UI', 'DATA'], 'Local browser/desktop navigation for the wiki.', '$HAPA_DESKTOP_ROOT/hapa-wiki-viewer', ['wiki UI'], ['readable canon']),
  node('hapa-wiki-growth-agent', 'hapa-wiki-growth-agent', 'memory', 'Core', ['CLI', 'API', 'DATA'], 'Drafts wiki articles, card drafts, media hooks, and ledger entries.', '$HAPA_DESKTOP_ROOT/hapa-wiki-growth-agent', ['bounded growth passes'], ['new wiki drafts']),
  node('hapa-lance-node', 'hapa-lance-node', 'memory', 'Core', ['API', 'CLI', 'DATA'], 'Cards, wiki chunks, embeddings, multimodal records, and retrieval datasets.', '$HAPA_DESKTOP_ROOT/hapa-lance-node', ['retrieval API'], ['indexes', 'vectors', 'filters']),
  node('hapa-lore-node', 'hapa-lore-node', 'memory', 'Core', ['API', 'CLI', 'DATA'], 'Daily progress, wisdom, lore, and operator history with searchable storage.', '$HAPA_DESKTOP_ROOT/hapa-lore-node', ['chronicle API'], ['media prompts', 'briefings']),
  node('hapa-janus-world-node', 'hapa-janus-world-node', 'protocol', 'Core/prototype', ['API', 'CLI', 'DATA'], 'Append-only world events, derived state snapshots, command ingestion.', '$HAPA_DESKTOP_ROOT/hapa-janus-world-node', ['world state API'], ['state snapshots']),

  node('hapa-llada-node', 'hapa-llada-node', 'media', 'Core', ['API', 'CLI'], 'Specialized diffusion-based LLM inference node.', '$HAPA_DESKTOP_ROOT/hapa-llada-node', ['LLM endpoint'], ['text completions']),
  node('hapa-media-node', 'hapa-media-node', 'media', 'Prototype', ['API', 'CLI'], 'Creates images from text and images from images.', 'spreadsheet row', ['image generation API'], ['images']),
  node('hapa-ltx-node', 'hapa-ltx-node', 'media', 'Core', ['API', 'CLI'], 'Creates image and video outputs for card loops.', 'spreadsheet row', ['image queue', 'video queue'], ['images', 'videos', 'loops']),
  node('hapa-mlx-station', 'hapa-mlx-station', 'media', 'Core', ['API', 'CLI'], 'Apple Silicon media node and authenticated hub for local generation jobs.', '$HAPA_MLX_STATION_ROOT', ['local generation APIs'], ['image jobs', 'media jobs']),
  node('hapa-avatar-node', 'hapa-avatar-node', 'media', 'Prototype', ['UI', 'API', 'CLI'], 'Avatar and Phamiliar generator for variants, poses, metadata, and exports.', '$HAPA_DESKTOP_ROOT/hapa-avatar-node', ['avatar forge'], ['avatars', 'poses', 'metadata']),
  node('hapa-song-registry', 'hapa-song-registry', 'media', 'Core', ['UI', 'DATA', 'CLI'], 'Suno/imported audio, lyrics, prompts, timing analysis, and music metadata.', '$HAPA_DESKTOP_ROOT/hapa-song-registry', ['song registry UI'], ['lyrics', 'prompts', 'audio metadata']),
  node('hapa-living-comic', 'hapa-living-comic', 'surface', 'Prototype', ['UI', 'DATA'], 'Narrative panels and media-backed story presentation.', '$HAPA_DESKTOP_ROOT/hapa-living-comic', ['comic UI'], ['story surfaces']),
  node('hapa-luminastem-station', 'hapa-luminastem-station', 'media', 'Prototype', ['UI', 'API'], '3D/audio stem visualization experiments and Gemini/Three media surfaces.', '$HAPA_DESKTOP_ROOT/hapa-luminastem-station', ['stem visualization'], ['spatial media']),
  node('cymatica', 'Cymatica', 'media', 'Prototype', ['UI', 'CLI', 'DATA'], 'Stems-to-3D and native macOS spatial media experimentation.', '$HAPA_DESKTOP_ROOT/Project Cymatica_Vision/cymatica', ['spatial audio UI'], ['RealityKit experiments']),

  node('hapa-telemetry-node', 'hapa-telemetry-node', 'ops', 'Core', ['API', 'CLI', 'DATA'], 'Health, metrics, launcher system, node registry, and service discovery.', '$HAPA_DESKTOP_ROOT/hapa-telemetry-node', ['health API', 'registry API'], ['telemetry', 'service discovery']),
  node('hapa-open-tasks-node', 'hapa-open-tasks-node', 'ops', 'Core', ['UI', 'API', 'CLI', 'DATA'], 'Cross-agent and human operational task tracking.', '$HAPA_DESKTOP_ROOT/hapa-open-tasks-node', ['task board', 'task API'], ['backlog', 'prioritization']),
  node('hapa-agent-registry-node', 'hapa-agent-registry-node', 'trust', 'Core', ['API', 'CLI', 'DATA'], 'Agent profiles, avatar jobs, identity, onboarding metadata.', '$HAPA_DESKTOP_ROOT/hapa-agent-registry-node', ['agent registry API'], ['agent profiles', 'identity state']),
  node('hapa-keys-node', 'hapa-keys-node', 'trust', 'Core', ['API', 'CLI', 'DATA'], 'Local secrets and provider/node keys in one loopback-first service.', '$HAPA_DESKTOP_ROOT/hapa-keys-node', ['key vault API'], ['credentials']),
  node('hapa-crypto-node', 'hapa-crypto-node', 'trust', 'Core', ['API', 'CLI'], 'Encryption, signatures, identity proofs, and trust primitives.', '$HAPA_DESKTOP_ROOT/hapa-crypto-node', ['crypto API'], ['proofs', 'signatures']),

  node('hapa-anvil-node', 'hapa-anvil-node', 'protocol', 'Core', ['API', 'CLI', 'DATA'], 'Standardizes, evaluates, and forges Hapa cards and artifact vault outputs.', '$HAPA_DESKTOP_ROOT/hapa-anvil-node', ['card evaluator API'], ['cards', 'artifact vault outputs']),
  node('hapa-chat-app', 'hapa-chat-app', 'surface', 'Core/prototype', ['UI', 'API', 'DATA'], 'Rooms, participants, assets, agent visits, worker jobs, and conversation inspection.', '$HAPA_DESKTOP_ROOT/hapa-chat-app', ['chat rooms', 'agent panels'], ['shared memory']),
  node('hapa-spaceship-desktop-hijack', 'hapa-spaceship-desktop-hijack', 'surface', 'Prototype', ['UI', 'CLI'], 'Spaceship/native desktop metaphor and shared-memory interaction experiments.', '$HAPA_DESKTOP_ROOT/hapa-spaceship-desktop-hijack', ['desktop surface'], ['spatial shell']),
  node('consul-node-proto', 'Consul Node Proto', 'protocol', 'Prototype', ['CLI', 'DATA'], 'Warden, Heap, and River proof experiments with environment-up validation.', '$HAPA_DESKTOP_ROOT/Consul Node Proto', ['proof harness'], ['validation proofs']),
  node('hapa-cultivation-suite', 'hapa-cultivation-suite', 'protocol', 'Prototype', ['UI', 'API', 'CLI'], 'Pulse/cultivation monorepo for capsule apps, workers, and growth mechanics.', '$HAPA_DESKTOP_ROOT/pulse-node-proto-dev/hapa-cultivation-suite', ['capsule tools'], ['growth mechanics']),
  node('hapa-spec-scaffold', 'hapa-spec-scaffold', 'protocol', 'Prototype', ['CLI', 'DATA'], 'Append-only specs and deterministic tests for protocol concepts.', '$HAPA_DESKTOP_ROOT/hapa-spec-scaffold', ['spec tests'], ['protocol specs']),
  node('hapa-og', 'hapa-og', 'archive', 'Archive', ['CLI', 'DATA'], 'Older integrated implementation used for archaeology and comparison.', '$HAPA_DESKTOP_ROOT/hapa-og', ['archive reference'], ['legacy cards', 'legacy media']),
];

const SEED_POSITIONS = {
  'hapa': [0, 8, -2],
  'overwatch': [3, 6, -6],
  'hapa-dev-proto': [0, 1.2, 0],
  'hapa-ai-model-chat': [-2.6, 4.2, 2.8],
  'hapa-master-dashboard': [0, 5.5, 0],
  'hapa-atlas': [1.35, 4.1, 3.15],
  'hapa-game-engine': [3.2, 3.2, 2.7],
  'hapa-prototype': [4.4, 0.7, 3.6],
  'hapa-forge': [2.5, -2.3, 4.2],
  'hapa-thors-hamma': [-0.6, -3.2, 4.6],
  'hapa-library': [-3.6, -1.8, 3.6],
  'hapa-node-space': [-4.4, 1.5, 2.2],
  'world-building-wiki': [-10.5, 1.6, 0],
  'hapa-wiki-viewer': [-11.8, 5, 1.8],
  'hapa-wiki-growth-agent': [-12.2, -2.4, 2.2],
  'hapa-lance-node': [-7, -1.4, -2.2],
  'hapa-lore-node': [-8.8, -4.5, 2.6],
  'hapa-janus-world-node': [-5.2, -5.2, -4.2],
  'hapa-llada-node': [3.8, 2.4, 5.2],
  'hapa-media-node': [8, -0.8, 6.2],
  'hapa-ltx-node': [2.2, -3.1, 7.2],
  'hapa-mlx-station': [5.4, -4.3, 6.2],
  'hapa-avatar-node': [8.8, 3.2, 4.5],
  'hapa-song-registry': [10.8, -4, 1.8],
  'hapa-living-comic': [11.3, 2.1, 0.6],
  'hapa-luminastem-station': [11.6, -0.8, 5.2],
  'cymatica': [12.4, -6.2, 4.8],
  'hapa-telemetry-node': [7.8, 1.1, -5.5],
  'hapa-open-tasks-node': [6.4, -4.5, -5.5],
  'hapa-agent-registry-node': [10.2, -2.3, -4.3],
  'hapa-keys-node': [12.4, 1.3, -4.5],
  'hapa-crypto-node': [14.2, -2.1, -5.4],
  'hapa-anvil-node': [-0.6, -4.8, 3.9],
  'hapa-chat-app': [7.2, 5.3, -2],
  'hapa-spaceship-desktop-hijack': [5, 6.7, 2.3],
  'consul-node-proto': [-4.4, -7.2, -5.2],
  'hapa-cultivation-suite': [-7.4, -6.1, -4.4],
  'hapa-spec-scaffold': [-9.4, -3.5, -4.2],
  'hapa-og': [-12.2, -6.3, -5.5],
};

const SEED_EDGES = [
  edge('hapa', 'hapa-dev-proto', 'UI', 'front door routes to main operator app'),
  edge('hapa', 'world-building-wiki', 'DATA', 'front door reads canon snapshot'),
  edge('hapa', 'hapa-node-space', 'UI', 'opens 3D node map'),
  edge('overwatch', 'hapa', 'CLI', 'normalizes repo and docs state'),
  edge('overwatch', 'hapa-dev-proto', 'CLI', 'coordinates app work'),
  edge('overwatch', 'world-building-wiki', 'CLI', 'records agent standards'),
  ...DEV_PROTO_APPS.map(app => edge('hapa-dev-proto', app.id, 'UI', `opens ${app.name}`)),
  edge('hapa-dev-proto', 'world-building-wiki', 'DATA', 'reads and writes canon'),
  edge('hapa-dev-proto', 'hapa-lance-node', 'API', 'queries indexes'),
  edge('hapa-dev-proto', 'hapa-anvil-node', 'API', 'forges and evaluates cards'),
  edge('hapa-dev-proto', 'hapa-ltx-node', 'API', 'queues video loops'),
  edge('hapa-dev-proto', 'hapa-media-node', 'API', 'queues image generation'),
  edge('hapa-dev-proto', 'hapa-mlx-station', 'API', 'uses local Apple Silicon generation'),
  edge('hapa-dev-proto', 'hapa-llada-node', 'API', 'uses local LLM completions'),
  edge('hapa-dev-proto', 'hapa-telemetry-node', 'API', 'discovers node status'),
  edge('hapa-dev-proto', 'hapa-open-tasks-node', 'API', 'syncs backlog and quests'),
  edge('hapa-dev-proto', 'hapa-agent-registry-node', 'API', 'loads agent identity'),
  edge('hapa-dev-proto', 'hapa-keys-node', 'API', 'requests guarded provider keys'),
  edge('hapa-ai-model-chat', 'hapa-llada-node', 'API', 'uses local LLM inference'),
  edge('hapa-ai-model-chat', 'hapa-media-node', 'API', 'dispatches content/media requests'),
  edge('hapa-ai-model-chat', 'world-building-wiki', 'DATA', 'returns useful context to canon'),
  edge('hapa-ai-model-chat', 'hapa-thors-hamma', 'API', 'turns operator intent into website capture missions'),
  edge('hapa-ai-model-chat', 'hapa-keys-node', 'API', 'checks provider readiness for generated work'),
  edge('hapa-ai-model-chat', 'hapa-chat-app', 'API', 'returns grounded context into shared rooms'),
  edge('hapa-master-dashboard', 'hapa-telemetry-node', 'API', 'reads node telemetry'),
  edge('hapa-master-dashboard', 'hapa-open-tasks-node', 'API', 'shows operational work queues'),
  edge('hapa-master-dashboard', 'hapa-keys-node', 'API', 'shows guarded provider readiness'),
  edge('hapa-master-dashboard', 'hapa-agent-registry-node', 'API', 'starts agent onboarding and registry checks'),
  edge('hapa-master-dashboard', 'hapa-atlas', 'API', 'shows Atlas health and source-of-record state'),
  edge('hapa-atlas', 'hapa-library', 'DATA', 'indexes card and asset records'),
  edge('hapa-library', 'hapa-atlas', 'DATA', 'replays cards and media relationships into Atlas'),
  edge('hapa-atlas', 'hapa-game-engine', 'DATA', 'serves playable cards and contextual attributes'),
  edge('hapa-atlas', 'hapa-forge', 'DATA', 'provides canonical card relationships and provenance'),
  edge('hapa-atlas', 'hapa-thors-hamma', 'DATA', 'records site-derived entities and source files'),
  edge('hapa-atlas', 'world-building-wiki', 'DATA', 'indexes wiki documents and provenance'),
  edge('hapa-atlas', 'hapa-lance-node', 'DATA', 'bridges master entities to retrieval indexes'),
  edge('hapa-atlas', 'hapa-media-node', 'DATA', 'stores image asset analysis for reuse'),
  edge('hapa-atlas', 'hapa-ltx-node', 'DATA', 'stores video asset analysis for reuse'),
  edge('hapa-atlas', 'hapa-anvil-node', 'DATA', 'tracks card forging lineage and artifact outputs'),
  edge('hapa-anvil-node', 'hapa-atlas', 'DATA', 'returns normalized card artifacts to the master record'),
  edge('hapa-game-engine', 'hapa-library', 'DATA', 'loads playable cards'),
  edge('hapa-game-engine', 'hapa-janus-world-node', 'API', 'reads world state and play contexts'),
  edge('hapa-game-engine', 'hapa-open-tasks-node', 'API', 'turns playtest failures into tasks'),
  edge('hapa-prototype', 'hapa-open-tasks-node', 'CLI', 'turns prototypes into work items'),
  edge('hapa-prototype', 'world-building-wiki', 'DATA', 'records prototype specs'),
  edge('hapa-forge', 'hapa-anvil-node', 'API', 'forges and evaluates cards'),
  edge('hapa-forge', 'hapa-lance-node', 'DATA', 'queries source context'),
  edge('hapa-thors-hamma', 'hapa-anvil-node', 'API', 'turns websites into cards'),
  edge('hapa-thors-hamma', 'world-building-wiki', 'DATA', 'records site-derived source notes'),
  edge('hapa-thors-hamma', 'hapa-atlas', 'DATA', 'persists site-derived entities and provenance'),
  edge('hapa-library', 'hapa-lance-node', 'DATA', 'searches cards and indexes'),
  edge('hapa-library', 'hapa-anvil-node', 'API', 'sends card candidates for standardization'),
  edge('hapa-library', 'hapa-ltx-node', 'API', 'requests video loop backfill'),
  edge('hapa-library', 'hapa-media-node', 'API', 'requests image backfill'),
  edge('hapa-library', 'hapa-telemetry-node', 'API', 'reports queue timing and output health'),
  edge('hapa-node-space', 'hapa-telemetry-node', 'API', 'can overlay node status'),
  edge('hapa-node-space', 'hapa', 'DATA', 'visualizes repo node map'),
  edge('hapa-keys-node', 'hapa-crypto-node', 'API', 'signs and authenticates requests'),
  edge('hapa-crypto-node', 'hapa-keys-node', 'API', 'authorizes guarded credential release'),
  edge('hapa-crypto-node', 'hapa-media-node', 'API', 'releases trusted provider generation requests'),
  edge('hapa-crypto-node', 'hapa-agent-registry-node', 'API', 'binds identity proofs'),
  edge('world-building-wiki', 'hapa-wiki-viewer', 'UI', 'renders wiki navigation'),
  edge('world-building-wiki', 'hapa-wiki-growth-agent', 'CLI', 'receives drafted canon'),
  edge('world-building-wiki', 'hapa-lore-node', 'DATA', 'feeds chronicle and briefings'),
  edge('world-building-wiki', 'hapa-lance-node', 'DATA', 'chunks wiki into retrieval'),
  edge('hapa-wiki-growth-agent', 'world-building-wiki', 'CLI', 'writes bounded article and card draft passes'),
  edge('overwatch', 'hapa-wiki-growth-agent', 'CLI', 'bounds wiki growth with operating standards'),
  edge('hapa-lance-node', 'hapa-library', 'DATA', 'supports card search and filters'),
  edge('hapa-lance-node', 'hapa-ai-model-chat', 'DATA', 'grounds model conversations with indexed memory'),
  edge('hapa-anvil-node', 'hapa-forge', 'API', 'produces card artifacts'),
  edge('hapa-ltx-node', 'hapa-library', 'DATA', 'attaches loop videos to cards'),
  edge('hapa-media-node', 'hapa-library', 'DATA', 'attaches generated images'),
  edge('hapa-mlx-station', 'hapa-ltx-node', 'API', 'backs local media generation'),
  edge('hapa-agent-registry-node', 'hapa-avatar-node', 'DATA', 'requests avatar and Phamiliar identity assets'),
  edge('hapa-agent-registry-node', 'hapa-crypto-node', 'API', 'requests identity proof binding'),
  edge('hapa-agent-registry-node', 'hapa-chat-app', 'API', 'publishes onboarded agents to shared rooms'),
  edge('hapa-avatar-node', 'hapa-agent-registry-node', 'DATA', 'stores avatars and Phamiliar metadata'),
  edge('hapa-song-registry', 'world-building-wiki', 'DATA', 'adds song prompts and lore'),
  edge('hapa-song-registry', 'hapa-library', 'DATA', 'creates music-backed cards'),
  edge('hapa-chat-app', 'hapa-agent-registry-node', 'API', 'loads agent panels'),
  edge('hapa-chat-app', 'hapa-lore-node', 'DATA', 'records conversation history'),
  edge('hapa-lore-node', 'world-building-wiki', 'DATA', 'promotes durable decisions into canon notes'),
  edge('hapa-telemetry-node', 'hapa-master-dashboard', 'API', 'feeds master health view'),
  edge('hapa-open-tasks-node', 'hapa-master-dashboard', 'API', 'feeds work queue state'),
  edge('hapa-open-tasks-node', 'hapa-lore-node', 'DATA', 'records task decisions into the chronicle'),
  edge('hapa-open-tasks-node', 'overwatch', 'CLI', 'returns implementation findings to operations'),
  edge('hapa-janus-world-node', 'hapa-game-engine', 'API', 'supplies world state'),
  edge('consul-node-proto', 'hapa-janus-world-node', 'DATA', 'promotes protocol proofs into world-state candidates'),
  edge('hapa-cultivation-suite', 'consul-node-proto', 'CLI', 'tests protocol mechanics'),
  edge('hapa-spec-scaffold', 'consul-node-proto', 'CLI', 'validates deterministic specs'),
  edge('hapa-og', 'hapa-anvil-node', 'DATA', 'migrates historical cards'),
];

function flowStepKey(source, target, layer, label) {
  return `${source}|${target}|${layer}|${slug(label)}`;
}

const FLOW_STEP_EXPLANATIONS = {
  [flowStepKey('overwatch', 'hapa-master-dashboard', 'CLI', 'Operator standards trigger a controlled health sweep.')]: [
    `I begin the healing sweep in Overwatch because governance should precede motion. This step gathers the standing rules, audit memory, and recovery habits that keep the operator from launching a blind repair pass.`,
    `The signal moves into Master View as a command intent, not as raw panic. The dashboard receives the sweep as something controlled: a process with scope, sequence, and a place to report back.`,
  ],
  [flowStepKey('hapa-master-dashboard', 'hapa-atlas', 'API', 'Master View launches Atlas healing and watches source-of-record state.')]: [
    `Master View now asks Atlas to heal the record spine. From my perspective, this is the moment where the cockpit stops observing and begins asking the database to prove what it knows.`,
    `Atlas accepts the call through an API boundary so the repair can be watched, timed, and repeated. The point is not just to scan files; it is to rebuild confidence in the local source of truth.`,
  ],
  [flowStepKey('world-building-wiki', 'hapa-atlas', 'DATA', 'Wiki canon and documentation are indexed with provenance.')]: [
    `The wiki contributes canon, documentation, names, systems, and source notes to Atlas. I treat this as the myth entering the ledger, because written worldbuilding becomes more powerful when the system can locate and relate it.`,
    `Atlas stores the wiki material with provenance rather than flattening it into anonymous text. That way, later agents can ask not only what a concept says, but where the concept came from and which files still own it.`,
  ],
  [flowStepKey('hapa-library', 'hapa-atlas', 'DATA', 'Card and media records replay into the inventory.')]: [
    `The Library sends card and media records into Atlas so the visible collection can become durable inventory. This is where the shelf becomes a database, and the database learns which cards have images, videos, prompts, and missing pieces.`,
    `I call this a replay because Atlas should be able to rebuild its view from source records without pretending it invented them. The card remains owned by its creation layer, but Atlas gains the relationship map needed to search and heal it.`,
  ],
  [flowStepKey('hapa-media-node', 'hapa-atlas', 'DATA', 'Image assets report analysis metadata for reuse.')]: [
    `The Media node returns more than an image; it returns evidence about the image. Model path, generation details, analysis tags, and reusable descriptions become part of the asset memory.`,
    `Atlas receives that metadata so future cards and apps can reuse visual knowledge without regenerating or reanalyzing the same thing. This is how the ecosystem learns to respect expensive creative work as a record, not a disposable file.`,
  ],
  [flowStepKey('hapa-ltx-node', 'hapa-atlas', 'DATA', 'Loop videos attach generation and recognition metadata.')]: [
    `The LTX node contributes motion records: generated loops, source prompts, timing, and recognition metadata. A video is harder to reason about than a still image, so the attached description becomes part of the asset's handle.`,
    `Atlas stores that handle beside the card and file relationships. Later, the Library can show what exists, the Game Engine can choose usable loops, and agents can avoid treating motion as an unlabeled blob.`,
  ],
  [flowStepKey('hapa-atlas', 'hapa-lance-node', 'DATA', 'Clean entities bridge into retrieval indexes.')]: [
    `Once Atlas has clean entities, it can pass structured memory toward Lance. This is the move from inventory into retrieval: the record spine hands selected knowledge to the search spear.`,
    `I keep this bridge explicit because retrieval should not be fed from mystery piles. Lance becomes stronger when it receives known entities, relationships, and context rather than unaccounted fragments.`,
  ],
  [flowStepKey('hapa-atlas', 'hapa-telemetry-node', 'API', 'Health, size, queue, and orphan counts return to ops telemetry.')]: [
    `The final healing signal returns as operational telemetry. Atlas reports health, database size, queue state, orphan assets, and the shape of what it found.`,
    `This closes the loop for the operator. A healing process is only useful if it leaves behind a readable condition: what improved, what remains missing, and where the next repair should begin.`,
  ],

  [flowStepKey('hapa-library', 'hapa-atlas', 'DATA', 'Library asks Atlas which cards are missing media.')]: [
    `The media backfill begins with the Library asking Atlas for absence. That is important: the queue should be fed by known gaps, not by a human guessing which cards look unfinished.`,
    `Atlas answers from relationships between cards, assets, and files. I use this step to turn missing images and loops into a clean worklist that can be assigned to provider lanes.`,
  ],
  [flowStepKey('hapa-atlas', 'hapa-media-node', 'API', 'Image candidates are dispatched to the media provider lane.')]: [
    `Atlas now hands image candidates to the Media node with enough context to act. The card identity, prompt hints, and existing relationships help the provider lane generate something that belongs to the record.`,
    `This is not merely image generation; it is targeted repair. I want each call to close a specific gap and return with enough metadata to explain why the new image exists.`,
  ],
  [flowStepKey('hapa-media-node', 'hapa-library', 'DATA', 'Generated images return with model, timing, and artifact metadata.')]: [
    `The Media node returns generated images to the Library as visible outputs. The operator should be able to inspect what was made, not just see a queue item marked successful.`,
    `Alongside the picture come model, timing, and artifact details. That information lets the Library show provenance now and gives Atlas enough material to preserve the cost and lineage later.`,
  ],
  [flowStepKey('hapa-library', 'hapa-ltx-node', 'API', 'Loop tasks move into the video queue.')]: [
    `Once images and card prompts are ready, the Library can push loop tasks toward the LTX node. This step transforms static card identity into motion work.`,
    `The queue carries source image paths, motion prompts, and provider intent so the video node does not have to infer the job from scraps. I slow this step down because video generation is where cost, time, and expectation must stay visible.`,
  ],
  [flowStepKey('hapa-ltx-node', 'hapa-library', 'DATA', 'Completed loops return to card previews and output telemetry.')]: [
    `The LTX node sends completed loops back to the Library so the card can actually show its new motion. Success should be visible as media, not only as a counter.`,
    `The returned loop also carries telemetry: provider, model, attempts, duration, and file location. I need that data beside the preview because future debugging depends on knowing what made the beautiful thing.`,
  ],
  [flowStepKey('hapa-library', 'hapa-atlas', 'DATA', 'Final assets, relationships, costs, and analysis are persisted.')]: [
    `The final backfill step writes the completed assets and relationships into Atlas. This is the moment where generated media stops being a loose output and becomes part of the master record.`,
    `Costs, analysis, prompts, and file links are preserved so the system can audit and reuse them. I think of this as closing the circuit: the Library asked for a missing piece, and Atlas records that the piece now belongs.`,
  ],

  [flowStepKey('world-building-wiki', 'hapa-forge', 'DATA', 'Canon, tags, and source notes feed card combination prompts.')]: [
    `The Forge begins by drawing from the wiki because new cards should have roots. Canon, tags, and source notes give the combination process a memory of the world it is extending.`,
    `I do not want fusion to be random sparkle. This step gives the creative engine constraints, so the resulting card can feel surprising without feeling disconnected from Hapa's canon.`,
  ],
  [flowStepKey('hapa-forge', 'hapa-anvil-node', 'API', 'Anvil standardizes the card shape, rarity, and provenance.')]: [
    `Forge sends the candidate card to Anvil when the idea needs discipline. Anvil checks shape, rarity, fields, and provenance so the card can become usable beyond the moment of creation.`,
    `This is the hard surface in the creative loop. The Forge can dream, but Anvil decides whether the dream has enough structure to enter the system as an artifact.`,
  ],
  [flowStepKey('hapa-anvil-node', 'hapa-forge', 'API', 'Validated artifact output returns to Forge.')]: [
    `Anvil returns a validated artifact to Forge with the corrections and structure attached. The creative interface receives something it can show, compare, and continue shaping.`,
    `I use this return path to keep evaluation visible. If a card changes during standardization, the operator should be able to understand the difference between the spark that entered Anvil and the tool that came back.`,
  ],
  [flowStepKey('hapa-forge', 'hapa-atlas', 'DATA', 'New card lineage and append-only context attributes land in Atlas.')]: [
    `Once Forge accepts the validated card, its lineage moves into Atlas. Parent cards, source notes, fusion decisions, and context attributes become part of the record spine.`,
    `This matters because future games may attach different rules to the same card. Atlas keeps those append-only attributes with history, so experiments can be overwritten later without erasing how the card became playable.`,
  ],
  [flowStepKey('hapa-atlas', 'hapa-game-engine', 'DATA', 'The game loads playable cards plus game-specific attributes.')]: [
    `The Game Engine reads from Atlas when it needs cards that can act. It receives not only the card identity, but also the current game-specific attributes that make the card playable.`,
    `This is where the master record becomes simulation fuel. I keep the handoff explicit so health points, special abilities, rarity, and temporary rules remain contextual rather than contaminating the canonical card.`,
  ],
  [flowStepKey('hapa-game-engine', 'hapa-janus-world-node', 'API', 'Duel results can become world events and state deltas.')]: [
    `After play, the Game Engine can send results into Janus as world events. A duel is no longer just a screen interaction; it can become part of the evolving state of the world.`,
    `Janus preserves the event trail so derived state can be rebuilt. I like this ending because it lets playtesting teach the world something, while still keeping cause and consequence visible.`,
  ],

  [flowStepKey('hapa-master-dashboard', 'hapa-telemetry-node', 'API', 'Dashboard polls node registry and service health.')]: [
    `Master Ops begins by asking Telemetry what is awake. The dashboard needs the registry, ports, health states, and stale services before it can responsibly launch or route anything.`,
    `I treat this as the instrument check before flight. A master interface that cannot see its nodes is only a painted console, so Telemetry gives it real operational sight.`,
  ],
  [flowStepKey('hapa-telemetry-node', 'hapa-master-dashboard', 'API', 'Live status returns for the operator shell.')]: [
    `Telemetry returns live status to Master View, and the operator shell becomes more than navigation. It can now show which services are online, which need help, and which surfaces can be opened safely.`,
    `This return signal is what makes the master feel alive. I want the human to see the state of the system before they touch it, because calm control begins with honest feedback.`,
  ],
  [flowStepKey('hapa-master-dashboard', 'hapa-keys-node', 'API', 'Provider and node credentials are checked before launch.')]: [
    `Master View checks Keys before launching provider-heavy work. This protects the operator from discovering missing credentials only after a queue has already been prepared.`,
    `The Keys node does not expose secrets casually; it reports readiness. I use that pattern because the dashboard needs confidence, not raw keys, and each provider should remain guarded even when it is easy to use.`,
  ],
  [flowStepKey('hapa-master-dashboard', 'hapa-open-tasks-node', 'API', 'Outstanding work queues and recovery tasks are loaded.')]: [
    `The dashboard asks Open Tasks for the unfinished work around the system. Recovery tasks, queue plans, and backlog items become visible beside service health.`,
    `This keeps operations connected to intention. A node being offline matters more when the operator can see which quest, repair, or generation run was waiting for it.`,
  ],
  [flowStepKey('hapa-master-dashboard', 'hapa-ltx-node', 'API', 'Video generation lanes can be booted from the master.')]: [
    `Master View can boot or target the LTX node when video lanes are needed. The operator should not have to leave the cockpit just to wake the loop engine.`,
    `This step is about controlled readiness. Before a paid or local video blast begins, the master needs to know the lane exists, can accept work, and will report its state back.`,
  ],
  [flowStepKey('hapa-master-dashboard', 'hapa-media-node', 'API', 'Image provider lanes can be booted from the master.')]: [
    `The same master pattern applies to image generation. Media lanes can be checked, opened, or routed from the dashboard so visual production becomes a managed service instead of a hidden tab.`,
    `I designed this flow to make provider power feel orderly. When local and paid channels are available together, the operator needs clear launch points, caps, and feedback before the queue accelerates.`,
  ],
  [flowStepKey('hapa-master-dashboard', 'hapa-atlas', 'API', 'Atlas record health anchors the whole view.')]: [
    `The final Master Ops check returns to Atlas because all operational surfaces need a record spine. If Atlas is unhealthy, the system may still generate things, but it cannot reliably remember what those things mean.`,
    `This is why I call Atlas the anchor of the dashboard. Master View can launch nodes and show telemetry, but Atlas tells the operator whether the work is becoming durable knowledge.`,
  ],

  [flowStepKey('hapa-ai-model-chat', 'hapa-thors-hamma', 'API', 'Operator target and capture intent become a website card mission.')]: [
    `The website capture flow begins in conversation because an operator often starts with a target, a hunch, or a rough use case. AI Model Chat shapes that intent into a mission Thor's Hamma can actually perform.`,
    `I want this step to teach translation. A website is not yet a card, and a request is not yet provenance; the first job is to turn human aim into a bounded capture action.`,
  ],
  [flowStepKey('hapa-thors-hamma', 'hapa-anvil-node', 'API', 'Source anchors and use cases are extracted into card candidates.')]: [
    `Thor's Hamma boards the target site and extracts anchors, claims, screenshots, copy, and use cases. It sends those pieces to Anvil as card candidates rather than pretending the first scrape is already playable truth.`,
    `This is the capture discipline I want players to learn. External material becomes useful only after it has source hooks, purpose, and a route into standard card shape.`,
  ],
  [flowStepKey('hapa-thors-hamma', 'world-building-wiki', 'DATA', 'Site-derived notes and provenance land in the wiki.')]: [
    `The same captured material also lands in the wiki as notes and provenance. The wiki keeps the slower explanation: where the site came from, what was extracted, and which claims still need review.`,
    `I separate this from the card path because cards compress meaning, while the wiki preserves context. A good capture creates both: a playable artifact and a readable record behind it.`,
  ],
  [flowStepKey('hapa-anvil-node', 'hapa-atlas', 'DATA', 'Standardized website cards are written to Atlas with lineage.')]: [
    `Anvil returns standardized site-derived cards into Atlas with lineage attached. The card is now less like a clipping and more like an entity that can be found, compared, and repaired.`,
    `Atlas records the source chain so the ecosystem can later ask why the card exists. In game terms, this is how a raid on outside information becomes a fleet asset instead of loose cargo.`,
  ],
  [flowStepKey('hapa-atlas', 'hapa-library', 'DATA', 'Library exposes the captured cards for inspection.')]: [
    `Atlas sends the new website cards into the Library so the operator can inspect the result. This is where a capture mission becomes visible enough to judge.`,
    `I expect this step to reveal rough edges: missing media, weak titles, bad extraction, or duplicate cards. Visibility is part of the workflow, because the Library is where cards become trustworthy to handle.`,
  ],
  [flowStepKey('hapa-library', 'hapa-lance-node', 'DATA', 'Captured source fragments become searchable retrieval context.')]: [
    `The Library hands useful fragments toward Lance so the captured material can help future searches. A card that cannot be retrieved is present, but not yet useful to memory.`,
    `Lance turns those fragments into context that later chats, forges, and wiki passes can call. The lesson is simple: capture is not done until the system can find the thing again.`,
  ],

  [flowStepKey('overwatch', 'hapa-wiki-growth-agent', 'CLI', 'Operator standards bound a wiki growth pass.')]: [
    `Canon growth begins with Overwatch because expansion needs rails. The standards define what the growth agent may touch, how drafts should be labeled, and what must remain reviewable.`,
    `I do not treat generation as permission to canonize. This step teaches that a growth pass is a governed expedition, not a free wander through the wiki.`,
  ],
  [flowStepKey('hapa-wiki-growth-agent', 'world-building-wiki', 'CLI', 'Draft articles, card hooks, and ledgers are proposed to the wiki.')]: [
    `The wiki growth agent proposes articles, card hooks, media prompts, and ledger notes back into the wiki. It is adding shaped material where the canon has obvious gaps.`,
    `The important word is proposed. I want this process to preserve draft status and provenance so the operator can decide what becomes canon and what remains scaffolding.`,
  ],
  [flowStepKey('world-building-wiki', 'hapa-wiki-viewer', 'UI', 'The viewer renders new canon for human review.')]: [
    `The wiki viewer makes the new material readable to humans. A Markdown file may be durable, but a viewer makes structure, links, and surrounding context easier to inspect.`,
    `This step teaches that review is an interface problem as much as a writing problem. If a new canon page cannot be browsed clearly, it cannot be trusted as shared memory.`,
  ],
  [flowStepKey('world-building-wiki', 'hapa-lance-node', 'DATA', 'Approved wiki pages are chunked into retrieval indexes.')]: [
    `Approved wiki pages move into Lance as chunks and retrieval records. The canon becomes callable context for models, card tools, and later workflows.`,
    `I keep this step after review because retrieval should amplify material that has been given a place. Lance is powerful, but it should not turn every draft into equal authority.`,
  ],
  [flowStepKey('world-building-wiki', 'hapa-lore-node', 'DATA', 'Canon changes become chronicle and briefing material.')]: [
    `The lore node receives durable changes as chronicle material. It can turn wiki growth into daily progress, operator briefings, and future media prompts.`,
    `This is the memory-of-work layer. The wiki says what the world knows; Lore helps the system remember how the knowledge changed and why it mattered today.`,
  ],
  [flowStepKey('hapa-lance-node', 'hapa-library', 'DATA', 'Updated retrieval context improves card search and filters.')]: [
    `Once Lance has the new chunks, the Library can search and filter cards with better context. Canon growth now improves practical card handling, not just documentation.`,
    `I like this closing move because it proves the loop. Better wiki knowledge should make cards easier to find, compare, and repair, or the growth pass has not reached the player surface.`,
  ],

  [flowStepKey('hapa-master-dashboard', 'hapa-agent-registry-node', 'API', 'Master View starts an agent onboarding pass.')]: [
    `Agent onboarding starts from Master View so the operator can see the registry as part of the whole system. The dashboard initiates a pass with role, purpose, and readiness in mind.`,
    `This teaches that an agent is not merely a name in a prompt. It is a local entity with identity, capabilities, visual memory, trust state, and places where it can participate.`,
  ],
  [flowStepKey('hapa-agent-registry-node', 'hapa-avatar-node', 'DATA', 'Profile facts request avatar and Phamiliar identity assets.')]: [
    `The Agent Registry sends profile facts to the Avatar node so the agent can gain a visible identity. Names, roles, and traits become prompts for avatar and Phamiliar variants.`,
    `A face is not required for computation, but it is useful for memory. I use this step to show why Hapa treats agents as recognizable participants rather than faceless processes.`,
  ],
  [flowStepKey('hapa-avatar-node', 'hapa-agent-registry-node', 'DATA', 'Avatar variants return with metadata and profile links.')]: [
    `The Avatar node returns variants, poses, and metadata to the registry. The visual identity now has file paths, prompts, and relationships attached to the agent profile.`,
    `This prevents the picture from becoming a loose decoration. The registry knows which image belongs to which agent, how it was made, and where it can be reused.`,
  ],
  [flowStepKey('hapa-agent-registry-node', 'hapa-crypto-node', 'API', 'Identity facts are bound to cryptographic proof.')]: [
    `The registry asks Crypto to bind identity facts to proof. Roles, claims, and permissions need a trust layer if agents are going to operate around credentials or shared rooms.`,
    `This is the moment where character becomes authority. A player can learn that identity in Hapa is not only narrative; it is also signed, checked, and constrained.`,
  ],
  [flowStepKey('hapa-crypto-node', 'hapa-keys-node', 'API', 'Trusted identity is allowed to request guarded credentials.')]: [
    `Crypto passes trusted identity toward Keys when guarded credentials are needed. The key vault should respond to proof and policy, not to raw convenience.`,
    `In game language, this is command clearance. The ship may have a captain, but the vault still asks whether the captain is authorized to open the weapons locker.`,
  ],
  [flowStepKey('hapa-agent-registry-node', 'hapa-chat-app', 'API', 'The onboarded agent becomes available inside shared rooms.')]: [
    `The registry publishes the onboarded agent into Chat so rooms and panels can use the new participant. The agent can now appear in a human-facing work surface.`,
    `This closes onboarding with interaction. Identity, avatar, proof, and permissions are only useful if the agent can show up where decisions and work actually happen.`,
  ],

  [flowStepKey('hapa-ai-model-chat', 'hapa-keys-node', 'API', 'Provider-backed generation asks for credential readiness.')]: [
    `Secure generation begins by asking Keys whether the requested provider is ready. This keeps a paid or guarded generation job from moving forward on assumptions.`,
    `The chat surface should never need to expose the secret itself. It needs readiness, scope, and a controlled path so the operator can act without scattering credentials through the interface.`,
  ],
  [flowStepKey('hapa-keys-node', 'hapa-crypto-node', 'API', 'The request is signed and authenticated before provider use.')]: [
    `Keys and Crypto cooperate before provider use. Keys holds guarded material, while Crypto signs or authenticates the request so the action can be trusted later.`,
    `This teaches the separation between possession and proof. Having a key is not the same as proving that this exact generation request was allowed.`,
  ],
  [flowStepKey('hapa-crypto-node', 'hapa-media-node', 'API', 'A trusted image request is released to the media provider lane.')]: [
    `Crypto releases a trusted request to the Media node, and the provider lane can generate with a clean chain of authority. The media system receives a job that has already passed identity and credential checks.`,
    `I want this step to make paid generation feel less magical and more accountable. The image provider is powerful, but it should enter the loop through a signed door.`,
  ],
  [flowStepKey('hapa-media-node', 'hapa-atlas', 'DATA', 'Generated image output returns with provider metadata and cost context.')]: [
    `The Media node returns the generated image to Atlas with provider metadata, timing, prompt context, and cost if available. The output is not just a file; it is an event with a bill and a lineage.`,
    `Atlas stores that context so later operators can compare providers, audit spend, and reuse descriptions. This is how expensive generation becomes a durable investment instead of vapor.`,
  ],
  [flowStepKey('hapa-atlas', 'hapa-library', 'DATA', 'The Library receives the trusted asset relationship for review.')]: [
    `Atlas exposes the trusted asset relationship in the Library. The operator can inspect the image, see which card or entity it belongs to, and decide whether it should remain attached.`,
    `This review step matters because authorization does not guarantee taste. The system may have generated correctly, but the Library still asks whether the asset serves the card.`,
  ],
  [flowStepKey('hapa-library', 'hapa-telemetry-node', 'API', 'Queue cost, timing, and success metrics report to telemetry.')]: [
    `The Library reports queue timing, success, failure, and cost signals to Telemetry. Provider work becomes part of operational health rather than a private counter buried in one UI.`,
    `This teaches that generation throughput is an ops question. If the fleet spends money or time, the telemetry layer should know what was gained and what failed.`,
  ],

  [flowStepKey('hapa-og', 'hapa-anvil-node', 'DATA', 'Legacy cards and media are handed to Anvil for archaeology.')]: [
    `The legacy migration begins with Hapa OG handing old cards and media to Anvil. I treat this as archaeology because the old implementation contains useful decisions, but not all of them are ready for the new schema.`,
    `Anvil receives the archive as material to inspect, normalize, and compare. The goal is respect without blind import: preserve what matters, but make it understandable to the current ecosystem.`,
  ],
  [flowStepKey('hapa-anvil-node', 'hapa-atlas', 'DATA', 'Normalized legacy cards land in Atlas with migration notes.')]: [
    `Anvil sends normalized legacy cards into Atlas with migration notes. The old card becomes a present record with a visible ancestor trail.`,
    `I want this step to teach lineage. A migrated card should say where it came from, what changed during standardization, and which assets still need recovery.`,
  ],
  [flowStepKey('hapa-atlas', 'hapa-library', 'DATA', 'Library exposes migrated cards for inspection and repair.')]: [
    `Atlas makes the migrated cards visible in the Library so the operator can inspect the recovery. This is where old material becomes part of the current working shelf.`,
    `The Library may show broken links, missing thumbnails, or media that needs backfill. That is not failure; it is the point of the repair surface.`,
  ],
  [flowStepKey('hapa-library', 'hapa-media-node', 'API', 'Missing legacy images are queued for backfill.')]: [
    `The Library sends missing legacy images to the Media node as repair jobs. Some assets can be recovered directly, while others may need regenerated stand-ins with provenance.`,
    `This step teaches the difference between restoration and replacement. Either path can be useful, but Atlas needs to know which one happened.`,
  ],
  [flowStepKey('hapa-library', 'hapa-ltx-node', 'API', 'Missing legacy loops are queued for motion repair.')]: [
    `Legacy cards that need motion move into the LTX queue. The old archive may have had video ideas, missing loops, or still images that can become motion assets.`,
    `I slow this step in narration because video repair is expensive. The player should understand that motion brings power, cost, and a need for previews.`,
  ],
  [flowStepKey('hapa-atlas', 'world-building-wiki', 'DATA', 'Recovered lineage and migration notes return to canon.')]: [
    `Atlas writes recovered lineage and migration notes back toward the wiki. The ecosystem should remember not only the recovered cards, but the story of their recovery.`,
    `That makes the archive teachable. Future agents can read why a Hapa OG card changed shape, which media was recovered, and which choices remain open.`,
  ],

  [flowStepKey('hapa-prototype', 'world-building-wiki', 'DATA', 'A prototype concept is recorded as a source-backed spec.')]: [
    `Prototype ideas first move into the wiki as source-backed specs. I want a new app or node concept to gain words, assumptions, and references before it becomes a backlog swarm.`,
    `This teaches that invention needs a memory trail. A prototype that never writes down its intent becomes hard to finish and easy to misunderstand.`,
  ],
  [flowStepKey('hapa-prototype', 'hapa-open-tasks-node', 'CLI', 'The spec becomes implementation tasks and recovery checkpoints.')]: [
    `The prototype then sends work into Open Tasks. The spec becomes implementation slices, test points, and recovery checkpoints that humans and agents can actually pick up.`,
    `This step turns imagination into quest structure. A project becomes easier to move when each task says what it unlocks and how it will be verified.`,
  ],
  [flowStepKey('hapa-open-tasks-node', 'hapa-master-dashboard', 'API', 'Master View receives the work queue for operator planning.')]: [
    `Open Tasks feeds the work queue into Master View so the operator can plan from one cockpit. Tasks are more useful when they sit beside health, credentials, and node availability.`,
    `I use this step to teach prioritization. The next task is not only the most exciting one; it is the one the current fleet can support.`,
  ],
  [flowStepKey('hapa-master-dashboard', 'hapa-telemetry-node', 'API', 'Telemetry checks whether required nodes are online.')]: [
    `Master View asks Telemetry whether the nodes required by the prototype are alive. A task that needs Atlas, Keys, or LTX should know those services before the operator starts.`,
    `This turns implementation into an operational route. The dashboard does not just list work; it checks whether the environment can carry the work.`,
  ],
  [flowStepKey('hapa-master-dashboard', 'hapa-keys-node', 'API', 'Credential readiness is checked before paid or guarded work.')]: [
    `Master View checks Keys when a prototype depends on paid providers or guarded services. Credential readiness becomes an explicit condition, not a surprise halfway through a run.`,
    `The lesson is restraint. A good prototype can be ambitious, but it should not hide costs, secrets, or provider assumptions from the operator.`,
  ],
  [flowStepKey('hapa-open-tasks-node', 'hapa-lore-node', 'DATA', 'Task decisions become chronicle entries and future briefings.')]: [
    `Open Tasks sends durable decisions to Lore so implementation history can be searched later. The work queue records what happened; Lore remembers what it meant.`,
    `This is where project management becomes memory. Future agents can read the chronicle and understand not just which task closed, but why the route changed.`,
  ],

  [flowStepKey('hapa-chat-app', 'hapa-agent-registry-node', 'API', 'Chat loads known agents, roles, and panel membership.')]: [
    `The chat-to-lore flow begins by loading agents, roles, and panels from the registry. A room should know who is present and what kind of authority or perspective each participant brings.`,
    `This teaches that collaboration has structure. Hapa rooms are not anonymous text streams; they are work chambers with participants, identities, and memory boundaries.`,
  ],
  [flowStepKey('hapa-chat-app', 'hapa-lore-node', 'DATA', 'A room decision is recorded into lore memory.')]: [
    `When a room reaches a useful decision, Chat records it into Lore. The conversation becomes a chronicle entry instead of disappearing into scrollback.`,
    `I want this step to make decisions feel durable. If the team decides how Atlas should heal, or which card mechanic matters, the system should be able to find that later.`,
  ],
  [flowStepKey('hapa-lore-node', 'world-building-wiki', 'DATA', 'Durable decisions become wiki-ready canon notes.')]: [
    `Lore promotes durable decisions toward the wiki as canon-ready notes. Not every chat line belongs in canon, but some decisions deserve a place in the written map.`,
    `This step teaches filtration. Lore catches lived activity; the wiki receives the pieces strong enough to become shared reference.`,
  ],
  [flowStepKey('world-building-wiki', 'hapa-lance-node', 'DATA', 'Decision notes are indexed for retrieval.')]: [
    `The wiki sends those decision notes into Lance so they can be retrieved in future work. The system should be able to remember the reason behind a decision when the same question returns.`,
    `This is where memory becomes operational again. A canon note that cannot be retrieved may be true, but it will not reliably help the next agent or player.`,
  ],
  [flowStepKey('hapa-lance-node', 'hapa-ai-model-chat', 'DATA', 'Future model conversations retrieve the decision context.')]: [
    `Lance grounds later model conversations with the indexed decision context. AI Model Chat can answer from remembered choices instead of improvising around missing history.`,
    `I like this step because it shows the payoff of patient record keeping. Yesterday's room decision becomes today's useful context.`,
  ],
  [flowStepKey('hapa-ai-model-chat', 'hapa-chat-app', 'API', 'The assistant brings grounded context back into the room.')]: [
    `AI Model Chat brings that grounded context back into the room. The shared conversation now benefits from the wiki, Lore, Lance, and the original decision trail.`,
    `This closes the social memory loop. The system does not only archive conversations; it uses them to make future collaboration less forgetful.`,
  ],

  [flowStepKey('hapa-spec-scaffold', 'consul-node-proto', 'CLI', 'Append-only specs are run through Consul protocol proofs.')]: [
    `Protocol cultivation begins with append-only specs entering Consul. The scaffold defines expected behavior so the proof harness has something concrete to test.`,
    `This teaches that protocol work should be replayable. If a rule cannot survive deterministic tests, it is not ready to become part of the world machine.`,
  ],
  [flowStepKey('hapa-cultivation-suite', 'consul-node-proto', 'CLI', 'Cultivation mechanics test capsule and worker behavior.')]: [
    `The Cultivation Suite sends capsule and worker mechanics into the same proof space. It asks whether growth loops, pulse behavior, and recurring processes can operate without losing their shape.`,
    `I use this step to show the difference between automation and cultivation. Automation fires a task; cultivation tends a living loop and checks whether it keeps growing correctly.`,
  ],
  [flowStepKey('consul-node-proto', 'hapa-janus-world-node', 'DATA', 'Validated protocol events become world-state candidates.')]: [
    `Consul promotes validated protocol events into Janus as world-state candidates. A proof is not the whole world, but it can become a lawful event the world engine understands.`,
    `This is where tests begin to matter inside the fiction. The protocol proves a pattern, and Janus learns how that pattern could change state.`,
  ],
  [flowStepKey('hapa-janus-world-node', 'hapa-game-engine', 'API', 'Game Engine receives derived world rules for playtesting.')]: [
    `Janus sends derived world rules to the Game Engine for playtesting. A rule that looks elegant in a ledger may behave strangely once players can exploit it.`,
    `The lesson here is pressure. Games reveal whether a protocol is legible, balanced, and fun enough to survive contact with real choices.`,
  ],
  [flowStepKey('hapa-game-engine', 'hapa-open-tasks-node', 'API', 'Playtest failures become implementation tasks.')]: [
    `The Game Engine turns playtest failures into Open Tasks. Bugs, balance problems, confusing mechanics, and missing UI affordances become work items instead of vague frustration.`,
    `This is how experimentation becomes progress. A failed playtest is not wasted if it leaves behind a clear task and a reason to improve the system.`,
  ],
  [flowStepKey('hapa-open-tasks-node', 'overwatch', 'CLI', 'Protocol findings return to Overwatch as operating standards.')]: [
    `Open Tasks returns protocol findings to Overwatch so the operating standards can evolve. The next agent should inherit what the playtest and proof harness discovered.`,
    `This closes the protocol loop with governance. Hapa learns not only through code, but through the rules it writes for future work.`,
  ],

  [flowStepKey('hapa-song-registry', 'world-building-wiki', 'DATA', 'Song prompts and lyric lore are written into canon.')]: [
    `The song-to-card flow begins by writing lyric lore, prompts, and music context into the wiki. Songs carry memory in a different register, and the canon should know what they encode.`,
    `I use this step to teach that music is not decoration in Hapa. A song can preserve mood, place, character, and motif in ways a plain field never will.`,
  ],
  [flowStepKey('hapa-song-registry', 'hapa-library', 'DATA', 'Music-backed card seeds enter the Library.')]: [
    `The Song Registry also sends card seeds into the Library. A lyric, hook, or track can become a playable card concept that the operator can inspect beside the rest of the collection.`,
    `This makes sound operational. The song becomes a source-backed card seed rather than staying trapped as an audio file with a nice title.`,
  ],
  [flowStepKey('world-building-wiki', 'hapa-lance-node', 'DATA', 'Lyrics and song lore become retrieval context.')]: [
    `The wiki passes lyric lore into Lance so future prompts and card tools can retrieve the musical context. The system can then remember which themes, lines, or moods belong to which song.`,
    `This is how sound becomes searchable memory. A model can call the feeling of a track without needing to guess from the filename.`,
  ],
  [flowStepKey('hapa-library', 'hapa-anvil-node', 'API', 'Music-backed card candidates are sent for standardization.')]: [
    `The Library sends music-backed card candidates to Anvil for standardization. Anvil decides whether the seed has enough structure, fields, and lineage to become a usable card.`,
    `The lesson is that inspiration still needs form. A powerful lyric can start the card, but the Anvil makes it playable across apps and games.`,
  ],
  [flowStepKey('hapa-anvil-node', 'hapa-atlas', 'DATA', 'Validated song cards and lineage return to Atlas.')]: [
    `Anvil writes validated song cards into Atlas with lineage back to the song registry and wiki material. The record spine now understands the relationship between audio, lyric, card, and source.`,
    `This lets the same material serve different contexts later. A song can feed lore, a card, a game modifier, or a media prompt without losing its origin.`,
  ],
  [flowStepKey('hapa-atlas', 'hapa-game-engine', 'DATA', 'Game Engine receives song-backed card attributes.')]: [
    `Atlas sends song-backed card attributes into the Game Engine. The track's themes can become morale effects, resonance bonuses, timing mechanics, or campaign flavor.`,
    `This is where music becomes a mechanic. The player learns that Hapa cards can carry sound as a strategic memory, not only as background atmosphere.`,
  ],
};

const FLOW_SCENARIOS = [
  {
    id: 'atlas-heal',
    name: 'Atlas Healing Sweep',
    summary: 'Atlas inventories cards, media, docs, wiki entries, orphan assets, and analysis queues, then pushes clean records back into retrieval and telemetry.',
    color: 0x5eead4,
    steps: [
      flow('overwatch', 'hapa-master-dashboard', 'CLI', 'Operator standards trigger a controlled health sweep.'),
      flow('hapa-master-dashboard', 'hapa-atlas', 'API', 'Master View launches Atlas healing and watches source-of-record state.'),
      flow('world-building-wiki', 'hapa-atlas', 'DATA', 'Wiki canon and documentation are indexed with provenance.'),
      flow('hapa-library', 'hapa-atlas', 'DATA', 'Card and media records replay into the inventory.'),
      flow('hapa-media-node', 'hapa-atlas', 'DATA', 'Image assets report analysis metadata for reuse.'),
      flow('hapa-ltx-node', 'hapa-atlas', 'DATA', 'Loop videos attach generation and recognition metadata.'),
      flow('hapa-atlas', 'hapa-lance-node', 'DATA', 'Clean entities bridge into retrieval indexes.'),
      flow('hapa-atlas', 'hapa-telemetry-node', 'API', 'Health, size, queue, and orphan counts return to ops telemetry.'),
    ],
  },
  {
    id: 'media-backfill',
    name: 'Card Media Backfill',
    summary: 'The Library detects cards with missing image or loop assets, routes work through local and paid media nodes, then writes outputs back through Atlas.',
    color: 0xfbbf24,
    steps: [
      flow('hapa-library', 'hapa-atlas', 'DATA', 'Library asks Atlas which cards are missing media.'),
      flow('hapa-atlas', 'hapa-media-node', 'API', 'Image candidates are dispatched to the media provider lane.'),
      flow('hapa-media-node', 'hapa-library', 'DATA', 'Generated images return with model, timing, and artifact metadata.'),
      flow('hapa-library', 'hapa-ltx-node', 'API', 'Loop tasks move into the video queue.'),
      flow('hapa-ltx-node', 'hapa-library', 'DATA', 'Completed loops return to card previews and output telemetry.'),
      flow('hapa-library', 'hapa-atlas', 'DATA', 'Final assets, relationships, costs, and analysis are persisted.'),
    ],
  },
  {
    id: 'forge-to-duel',
    name: 'Forge To Duel',
    summary: 'Canon and card ingredients move through Forge and Anvil, land in Atlas with context attributes, then become playable state in the card game.',
    color: 0xf472b6,
    steps: [
      flow('world-building-wiki', 'hapa-forge', 'DATA', 'Canon, tags, and source notes feed card combination prompts.'),
      flow('hapa-forge', 'hapa-anvil-node', 'API', 'Anvil standardizes the card shape, rarity, and provenance.'),
      flow('hapa-anvil-node', 'hapa-forge', 'API', 'Validated artifact output returns to Forge.'),
      flow('hapa-forge', 'hapa-atlas', 'DATA', 'New card lineage and append-only context attributes land in Atlas.'),
      flow('hapa-atlas', 'hapa-game-engine', 'DATA', 'The game loads playable cards plus game-specific attributes.'),
      flow('hapa-game-engine', 'hapa-janus-world-node', 'API', 'Duel results can become world events and state deltas.'),
    ],
  },
  {
    id: 'master-ops',
    name: 'Master Ops Launch',
    summary: 'Master View swallows node UIs, reads telemetry, checks credentials, starts offline nodes, and routes the operator to the right surface.',
    color: 0x38bdf8,
    steps: [
      flow('hapa-master-dashboard', 'hapa-telemetry-node', 'API', 'Dashboard polls node registry and service health.'),
      flow('hapa-telemetry-node', 'hapa-master-dashboard', 'API', 'Live status returns for the operator shell.'),
      flow('hapa-master-dashboard', 'hapa-keys-node', 'API', 'Provider and node credentials are checked before launch.'),
      flow('hapa-master-dashboard', 'hapa-open-tasks-node', 'API', 'Outstanding work queues and recovery tasks are loaded.'),
      flow('hapa-master-dashboard', 'hapa-ltx-node', 'API', 'Video generation lanes can be booted from the master.'),
      flow('hapa-master-dashboard', 'hapa-media-node', 'API', 'Image provider lanes can be booted from the master.'),
      flow('hapa-master-dashboard', 'hapa-atlas', 'API', 'Atlas record health anchors the whole view.'),
    ],
  },
  {
    id: 'website-to-card-capture',
    name: 'Website To Card Capture',
    summary: 'An operator target moves from chat intent through Thor\'s Hamma, Anvil, the wiki, Atlas, Library review, and Lance retrieval.',
    color: 0x22d3ee,
    steps: [
      flow('hapa-ai-model-chat', 'hapa-thors-hamma', 'API', 'Operator target and capture intent become a website card mission.'),
      flow('hapa-thors-hamma', 'hapa-anvil-node', 'API', 'Source anchors and use cases are extracted into card candidates.'),
      flow('hapa-thors-hamma', 'world-building-wiki', 'DATA', 'Site-derived notes and provenance land in the wiki.'),
      flow('hapa-anvil-node', 'hapa-atlas', 'DATA', 'Standardized website cards are written to Atlas with lineage.'),
      flow('hapa-atlas', 'hapa-library', 'DATA', 'Library exposes the captured cards for inspection.'),
      flow('hapa-library', 'hapa-lance-node', 'DATA', 'Captured source fragments become searchable retrieval context.'),
    ],
  },
  {
    id: 'canon-growth-loop',
    name: 'Canon Growth Loop',
    summary: 'Overwatch bounds a wiki growth pass, drafts move through review, approved pages feed retrieval, lore, and card search.',
    color: 0x34d399,
    steps: [
      flow('overwatch', 'hapa-wiki-growth-agent', 'CLI', 'Operator standards bound a wiki growth pass.'),
      flow('hapa-wiki-growth-agent', 'world-building-wiki', 'CLI', 'Draft articles, card hooks, and ledgers are proposed to the wiki.'),
      flow('world-building-wiki', 'hapa-wiki-viewer', 'UI', 'The viewer renders new canon for human review.'),
      flow('world-building-wiki', 'hapa-lance-node', 'DATA', 'Approved wiki pages are chunked into retrieval indexes.'),
      flow('world-building-wiki', 'hapa-lore-node', 'DATA', 'Canon changes become chronicle and briefing material.'),
      flow('hapa-lance-node', 'hapa-library', 'DATA', 'Updated retrieval context improves card search and filters.'),
    ],
  },
  {
    id: 'agent-onboarding-trust',
    name: 'Agent Onboarding And Trust',
    summary: 'Master View onboards an agent through registry, avatar identity, cryptographic proof, credential readiness, and chat availability.',
    color: 0xa78bfa,
    steps: [
      flow('hapa-master-dashboard', 'hapa-agent-registry-node', 'API', 'Master View starts an agent onboarding pass.'),
      flow('hapa-agent-registry-node', 'hapa-avatar-node', 'DATA', 'Profile facts request avatar and Phamiliar identity assets.'),
      flow('hapa-avatar-node', 'hapa-agent-registry-node', 'DATA', 'Avatar variants return with metadata and profile links.'),
      flow('hapa-agent-registry-node', 'hapa-crypto-node', 'API', 'Identity facts are bound to cryptographic proof.'),
      flow('hapa-crypto-node', 'hapa-keys-node', 'API', 'Trusted identity is allowed to request guarded credentials.'),
      flow('hapa-agent-registry-node', 'hapa-chat-app', 'API', 'The onboarded agent becomes available inside shared rooms.'),
    ],
  },
  {
    id: 'secure-provider-generation',
    name: 'Secure Provider Generation',
    summary: 'Provider-backed image work checks keys and crypto before media generation, then records asset cost, lineage, and telemetry.',
    color: 0xf97316,
    steps: [
      flow('hapa-ai-model-chat', 'hapa-keys-node', 'API', 'Provider-backed generation asks for credential readiness.'),
      flow('hapa-keys-node', 'hapa-crypto-node', 'API', 'The request is signed and authenticated before provider use.'),
      flow('hapa-crypto-node', 'hapa-media-node', 'API', 'A trusted image request is released to the media provider lane.'),
      flow('hapa-media-node', 'hapa-atlas', 'DATA', 'Generated image output returns with provider metadata and cost context.'),
      flow('hapa-atlas', 'hapa-library', 'DATA', 'The Library receives the trusted asset relationship for review.'),
      flow('hapa-library', 'hapa-telemetry-node', 'API', 'Queue cost, timing, and success metrics report to telemetry.'),
    ],
  },
  {
    id: 'legacy-card-migration',
    name: 'Legacy Card Migration',
    summary: 'Hapa OG cards move through Anvil normalization, Atlas lineage, Library inspection, media repair, loop repair, and wiki migration notes.',
    color: 0xf59e0b,
    steps: [
      flow('hapa-og', 'hapa-anvil-node', 'DATA', 'Legacy cards and media are handed to Anvil for archaeology.'),
      flow('hapa-anvil-node', 'hapa-atlas', 'DATA', 'Normalized legacy cards land in Atlas with migration notes.'),
      flow('hapa-atlas', 'hapa-library', 'DATA', 'Library exposes migrated cards for inspection and repair.'),
      flow('hapa-library', 'hapa-media-node', 'API', 'Missing legacy images are queued for backfill.'),
      flow('hapa-library', 'hapa-ltx-node', 'API', 'Missing legacy loops are queued for motion repair.'),
      flow('hapa-atlas', 'world-building-wiki', 'DATA', 'Recovered lineage and migration notes return to canon.'),
    ],
  },
  {
    id: 'prototype-to-task',
    name: 'Prototype To Task',
    summary: 'A prototype idea becomes a source-backed wiki spec, task queue, readiness check, credential check, and lore briefing trail.',
    color: 0x60a5fa,
    steps: [
      flow('hapa-prototype', 'world-building-wiki', 'DATA', 'A prototype concept is recorded as a source-backed spec.'),
      flow('hapa-prototype', 'hapa-open-tasks-node', 'CLI', 'The spec becomes implementation tasks and recovery checkpoints.'),
      flow('hapa-open-tasks-node', 'hapa-master-dashboard', 'API', 'Master View receives the work queue for operator planning.'),
      flow('hapa-master-dashboard', 'hapa-telemetry-node', 'API', 'Telemetry checks whether required nodes are online.'),
      flow('hapa-master-dashboard', 'hapa-keys-node', 'API', 'Credential readiness is checked before paid or guarded work.'),
      flow('hapa-open-tasks-node', 'hapa-lore-node', 'DATA', 'Task decisions become chronicle entries and future briefings.'),
    ],
  },
  {
    id: 'chat-to-lore-memory',
    name: 'Chat To Lore Memory',
    summary: 'A room decision flows through agent identity, lore memory, wiki canon notes, retrieval, and grounded future chat context.',
    color: 0x14b8a6,
    steps: [
      flow('hapa-chat-app', 'hapa-agent-registry-node', 'API', 'Chat loads known agents, roles, and panel membership.'),
      flow('hapa-chat-app', 'hapa-lore-node', 'DATA', 'A room decision is recorded into lore memory.'),
      flow('hapa-lore-node', 'world-building-wiki', 'DATA', 'Durable decisions become wiki-ready canon notes.'),
      flow('world-building-wiki', 'hapa-lance-node', 'DATA', 'Decision notes are indexed for retrieval.'),
      flow('hapa-lance-node', 'hapa-ai-model-chat', 'DATA', 'Future model conversations retrieve the decision context.'),
      flow('hapa-ai-model-chat', 'hapa-chat-app', 'API', 'The assistant brings grounded context back into the room.'),
    ],
  },
  {
    id: 'protocol-to-cultivation',
    name: 'Protocol To Cultivation',
    summary: 'Specs and cultivation mechanics run through Consul, become Janus world-state candidates, enter playtests, and return as tasks and standards.',
    color: 0xec4899,
    steps: [
      flow('hapa-spec-scaffold', 'consul-node-proto', 'CLI', 'Append-only specs are run through Consul protocol proofs.'),
      flow('hapa-cultivation-suite', 'consul-node-proto', 'CLI', 'Cultivation mechanics test capsule and worker behavior.'),
      flow('consul-node-proto', 'hapa-janus-world-node', 'DATA', 'Validated protocol events become world-state candidates.'),
      flow('hapa-janus-world-node', 'hapa-game-engine', 'API', 'Game Engine receives derived world rules for playtesting.'),
      flow('hapa-game-engine', 'hapa-open-tasks-node', 'API', 'Playtest failures become implementation tasks.'),
      flow('hapa-open-tasks-node', 'overwatch', 'CLI', 'Protocol findings return to Overwatch as operating standards.'),
    ],
  },
  {
    id: 'song-to-card-canon',
    name: 'Song To Card Canon',
    summary: 'Songs become canon notes, Library card seeds, retrieval context, standardized song cards, Atlas lineage, and game attributes.',
    color: 0xe879f9,
    steps: [
      flow('hapa-song-registry', 'world-building-wiki', 'DATA', 'Song prompts and lyric lore are written into canon.'),
      flow('hapa-song-registry', 'hapa-library', 'DATA', 'Music-backed card seeds enter the Library.'),
      flow('world-building-wiki', 'hapa-lance-node', 'DATA', 'Lyrics and song lore become retrieval context.'),
      flow('hapa-library', 'hapa-anvil-node', 'API', 'Music-backed card candidates are sent for standardization.'),
      flow('hapa-anvil-node', 'hapa-atlas', 'DATA', 'Validated song cards and lineage return to Atlas.'),
      flow('hapa-atlas', 'hapa-game-engine', 'DATA', 'Game Engine receives song-backed card attributes.'),
    ],
  },
];

const FLOW_CARD_SPECS = {
  'atlas-heal': flowCardSpec(
    'HEAL',
    'Record Restoration',
    'Mythic',
    'S+',
    'Atlas inventories the fleet, repairs broken relationships, finds orphan assets, and returns a trustworthy health signal. In play, this is a recovery skill that turns scattered memory back into usable state.',
    'Restore one broken card, media, or document relationship and reveal all remaining orphan assets on the route.',
    'If Atlas or Telemetry is stale, the sweep can create false confidence and leave hidden damage on the board.',
    { impact: 10, reliability: 9, complexity: 8, cost: 5, speed: 6, teaching: 10 },
  ),
  'media-backfill': flowCardSpec(
    'BACKFILL',
    'Asset Repair',
    'Rare',
    'A',
    'The Library finds cards without images or loops, dispatches provider work, previews outputs, and persists the new assets. In play, this skill teaches that beautiful media must return with provenance and telemetry.',
    'Fill one missing image or loop slot, then attach model, timing, and artifact metadata to the card.',
    'Paid lanes can burn resources quickly, and unreviewed outputs can attach the wrong feeling to a card.',
    { impact: 8, reliability: 8, complexity: 7, cost: 8, speed: 7, teaching: 9 },
  ),
  'forge-to-duel': flowCardSpec(
    'FORGE',
    'Card Transmutation',
    'Epic',
    'S',
    'Canon ingredients move through Forge and Anvil, gain Atlas lineage, and become playable inside the Game Engine. In play, this skill teaches that invention needs both heat and standards.',
    'Combine source-backed card material into a playable card with contextual duel attributes.',
    'A card that skips Anvil can become unstable, overpowered, or disconnected from canon.',
    { impact: 10, reliability: 8, complexity: 8, cost: 6, speed: 6, teaching: 10 },
  ),
  'master-ops': flowCardSpec(
    'LAUNCH',
    'Fleet Command',
    'Epic',
    'S',
    'Master View reads health, checks credentials, pulls task queues, and boots provider lanes from one cockpit. In play, this is the skill that turns scattered nodes into coordinated action.',
    'Inspect fleet readiness and activate one offline or waiting node lane without leaving the command surface.',
    'If the dashboard cannot see Telemetry or Keys, launch confidence drops and actions may fail late.',
    { impact: 9, reliability: 9, complexity: 7, cost: 4, speed: 9, teaching: 9 },
  ),
  'website-to-card-capture': flowCardSpec(
    'CAPTURE',
    'Source Boarding',
    'Rare',
    'A',
    'A website target becomes card candidates, wiki provenance, Atlas lineage, Library inspection, and Lance retrieval. In play, this skill teaches capture discipline: outside material must become sourced memory.',
    'Extract one external source hook and convert it into a reviewable card candidate with provenance.',
    'Weak source anchors create brittle cards that cannot be defended or retrieved later.',
    { impact: 8, reliability: 7, complexity: 7, cost: 4, speed: 8, teaching: 9 },
  ),
  'canon-growth-loop': flowCardSpec(
    'GROW',
    'Canon Cultivation',
    'Rare',
    'A',
    'Overwatch bounds a wiki growth pass, drafts move through review, and approved canon feeds retrieval, lore, and card search. In play, this skill teaches that world growth needs gates.',
    'Create a draft canon expansion and, after review, grant retrieval bonuses to related cards.',
    'Skipping review can pollute retrieval with draft material that sounds authoritative but is not yet canon.',
    { impact: 8, reliability: 8, complexity: 6, cost: 3, speed: 6, teaching: 10 },
  ),
  'agent-onboarding-trust': flowCardSpec(
    'ONBOARD',
    'Crew Identity',
    'Epic',
    'A+',
    'Master View onboards an agent through registry profile, avatar identity, cryptographic proof, key readiness, and chat availability. In play, this skill turns an agent from a name into a trusted crew member.',
    'Create a trusted agent unit with avatar identity, proof state, and room access.',
    'A compromised or incomplete identity can leak authority into the wrong room or provider path.',
    { impact: 8, reliability: 9, complexity: 8, cost: 5, speed: 6, teaching: 9 },
  ),
  'secure-provider-generation': flowCardSpec(
    'AUTHORIZE',
    'Guarded Generation',
    'Rare',
    'A',
    'Provider-backed generation checks Keys and Crypto before Media produces an asset, then Atlas and Telemetry preserve cost and lineage. In play, this skill teaches controlled spending and proof-carrying output.',
    'Authorize one paid or guarded media job and return its asset with cost and provenance.',
    'A rushed request can spend provider fuel without enough context or review.',
    { impact: 8, reliability: 9, complexity: 7, cost: 9, speed: 8, teaching: 8 },
  ),
  'legacy-card-migration': flowCardSpec(
    'MIGRATE',
    'Archive Archaeology',
    'Rare',
    'A',
    'Hapa OG cards move through Anvil normalization, Atlas lineage, Library repair, media backfill, and wiki notes. In play, this skill recovers old power without hiding the scars.',
    'Recover one legacy card or asset and convert it into the current record system with lineage.',
    'Old machinery can import broken assumptions unless Anvil records what changed.',
    { impact: 8, reliability: 7, complexity: 8, cost: 5, speed: 5, teaching: 9 },
  ),
  'prototype-to-task': flowCardSpec(
    'PROMOTE',
    'Quest Conversion',
    'Uncommon',
    'B+',
    'A prototype concept becomes a wiki spec, task queue, readiness check, credential check, and lore briefing trail. In play, this skill teaches how imagination becomes scoped work.',
    'Convert one prototype idea into implementation tasks with readiness checks and a chronicle trail.',
    'If the spec is thin, tasks multiply without a shared reason for existing.',
    { impact: 7, reliability: 8, complexity: 5, cost: 3, speed: 8, teaching: 8 },
  ),
  'chat-to-lore-memory': flowCardSpec(
    'REMEMBER',
    'Decision Memory',
    'Rare',
    'A',
    'A chat decision moves through agent identity, Lore, wiki notes, Lance retrieval, and returns as grounded future context. In play, this skill stops the fleet from forgetting what it already decided.',
    'Record one room decision and make it retrievable for a later conversation or card action.',
    'Low-quality decisions can become sticky if they are promoted without review.',
    { impact: 8, reliability: 8, complexity: 6, cost: 2, speed: 7, teaching: 9 },
  ),
  'protocol-to-cultivation': flowCardSpec(
    'CULTIVATE',
    'Protocol Trial',
    'Epic',
    'S',
    'Specs and cultivation mechanics run through Consul proofs, Janus world state, game playtests, tasks, and Overwatch standards. In play, this skill turns rules into tested living systems.',
    'Validate one protocol mechanic, pressure-test it in play, and return findings as standards.',
    'A rule that only passes in theory can fail when players exploit it.',
    { impact: 9, reliability: 8, complexity: 10, cost: 6, speed: 4, teaching: 10 },
  ),
  'song-to-card-canon': flowCardSpec(
    'RESONATE',
    'Harmonic Canon',
    'Rare',
    'A',
    'Songs become wiki memory, Library seeds, Lance context, Anvil-standardized cards, Atlas lineage, and Game Engine attributes. In play, this skill lets music become mechanics.',
    'Turn one lyric or track motif into a source-backed card attribute or morale effect.',
    'A song used without timing or context can become flavor without mechanical truth.',
    { impact: 8, reliability: 8, complexity: 6, cost: 4, speed: 7, teaching: 9 },
  ),
};

const FLOW_STAT_LABELS = [
  ['impact', 'Impact'],
  ['reliability', 'Reliability'],
  ['complexity', 'Complexity'],
  ['cost', 'Cost'],
  ['speed', 'Speed'],
  ['teaching', 'Teaching'],
];

function devProtoAppNode(app) {
  return node(app.id, app.name, 'app', 'hapa-dev-proto app', ['UI', 'API', 'DATA'], app.role, 'hapa-dev-proto app column', app.interfaces, app.outputs, app.capabilities);
}

function node(id, name, group, status, layers, role, path, interfaces = [], outputs = [], capabilities = []) {
  const item = { id, name, group, status, layers, role, path, interfaces, outputs, capabilities };
  return { ...item, description: descriptionFor(item) };
}

function edge(source, target, layer, label) {
  return { source, target, layer, label };
}

function flow(source, target, layer, label, duration = null) {
  const explanation = flowStepExplanation(source, target, layer, label);
  return { source, target, layer, label, explanation, duration: duration ?? durationForStepExplanation(explanation) };
}

function flowStepExplanation(source, target, layer, label) {
  const known = FLOW_STEP_EXPLANATIONS[flowStepKey(source, target, layer, label)];
  if (known) return known;
  return [
    `I read this step as a ${layer} handoff from ${source} to ${target}. It exists so the workflow can move with a named responsibility rather than an invisible jump.`,
    `For narration, I would inspect the owning code and replace this fallback with a more specific explanation. The important thing is that every packet in the graph can eventually speak its purpose before it moves on.`,
  ];
}

function durationForStepExplanation(explanation = []) {
  const words = explanation.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.min(30000, Math.max(14000, words * 190));
}

const sceneRoot = document.querySelector('#sceneRoot');
const nodeCount = document.querySelector('#nodeCount');
const edgeCount = document.querySelector('#edgeCount');
const selectedLayerCount = document.querySelector('#selectedLayerCount');
const sourceReadout = document.querySelector('#sourceReadout');
const shipCount = document.querySelector('#shipCount');
const nodeSearch = document.querySelector('#nodeSearch');
const focusSelect = document.querySelector('#focusSelect');
const layoutSelect = document.querySelector('#layoutSelect');
const formationReadout = document.querySelector('#formationReadout');
const formationButtons = Array.from(document.querySelectorAll('[data-formation]'));
const backgroundSelect = document.querySelector('#backgroundSelect');
const backgroundReadout = document.querySelector('#backgroundReadout');
const backgroundButtons = Array.from(document.querySelectorAll('[data-background]'));
const blackHoleVideo = document.querySelector('#blackHoleBackground');
const labelSelect = document.querySelector('#labelSelect');
const inspector = {
  name: document.querySelector('#inspectorName'),
  role: document.querySelector('#inspectorRole'),
  badges: document.querySelector('#inspectorBadges'),
  previewButton: document.querySelector('#inspectorPreviewButton'),
  previewImage: document.querySelector('#inspectorPreviewImage'),
  previewLabel: document.querySelector('#inspectorPreviewLabel'),
  logoImage: document.querySelector('#nodeLogoImage'),
  infographicButton: document.querySelector('#nodeInfographicButton'),
  infographicImage: document.querySelector('#nodeInfographicImage'),
  shipClassName: document.querySelector('#shipClassName'),
  shipArchetype: document.querySelector('#shipCardArchetype'),
  shipMockButton: document.querySelector('#shipMockButton'),
  shipMockImage: document.querySelector('#shipMockImage'),
  shipDoctrine: document.querySelector('#shipDoctrine'),
  shipAttributes: document.querySelector('#shipAttributes'),
  shipSkills: document.querySelector('#shipSkills'),
  shipSpecialties: document.querySelector('#shipSpecialties'),
  shipResearch: document.querySelector('#shipResearch'),
  architectDescription: document.querySelector('#architectDescription'),
  kanbanPanel: document.querySelector('#nodeKanbanPanel'),
  kanbanLink: document.querySelector('#nodeKanbanLink'),
  kanbanProject: document.querySelector('#nodeKanbanProject'),
  kanbanSummary: document.querySelector('#nodeKanbanSummary'),
  facts: document.querySelector('#nodeFacts'),
  capabilities: document.querySelector('#capabilityList'),
  interfaces: document.querySelector('#interfaceList'),
  outputs: document.querySelector('#outputList'),
  connections: document.querySelector('#connectionList'),
  previewDialog: document.querySelector('#previewDialog'),
  previewDialogTitle: document.querySelector('#previewDialogTitle'),
  previewDialogImage: document.querySelector('#previewDialogImage'),
  closePreview: document.querySelector('#closePreview'),
};
const scenarioControls = {
  panel: document.querySelector('#scenarioDock'),
  sfx: document.querySelector('#toggleSfx'),
  select: document.querySelector('#scenarioSelect'),
  cardMenu: document.querySelector('#scenarioCardMenu'),
  cinematic: document.querySelector('#cinematicMode'),
  play: document.querySelector('#playScenario'),
  pause: document.querySelector('#pauseScenario'),
  reset: document.querySelector('#resetScenario'),
  status: document.querySelector('#scenarioStatus'),
  progress: document.querySelector('#scenarioProgress'),
  summary: document.querySelector('#scenarioSummary'),
  flowActionButton: document.querySelector('#flowActionButton'),
  flowActionImage: document.querySelector('#flowActionImage'),
  flowCardName: document.querySelector('#flowCardName'),
  flowCardGrade: document.querySelector('#flowCardGrade'),
  flowCardRank: document.querySelector('#flowCardRank'),
  flowCardVerb: document.querySelector('#flowCardVerb'),
  flowCardType: document.querySelector('#flowCardType'),
  flowCardCost: document.querySelector('#flowCardCost'),
  flowCardNodeCount: document.querySelector('#flowCardNodeCount'),
  flowCardDescription: document.querySelector('#flowCardDescription'),
  flowCardStats: document.querySelector('#flowCardStats'),
  flowCardEffect: document.querySelector('#flowCardEffect'),
  flowCardRisk: document.querySelector('#flowCardRisk'),
  prompt: document.querySelector('#scenarioPlayPrompt'),
  promptTitle: document.querySelector('#scenarioPromptTitle'),
  promptSummary: document.querySelector('#scenarioPromptSummary'),
  promptPlay: document.querySelector('#scenarioPromptPlay'),
  stepTitle: document.querySelector('#scenarioStepTitle'),
  stepExplanation: document.querySelector('#scenarioStepExplanation'),
  voiceover: document.querySelector('#scenarioVoiceover'),
  voiceAudio: document.querySelector('#scenarioVoiceAudio'),
  voiceStatus: document.querySelector('#scenarioVoiceStatus'),
  voiceWaveform: document.querySelector('#scenarioVoiceWaveform'),
  voiceEnergy: document.querySelector('#scenarioVoiceEnergy'),
  voiceTime: document.querySelector('#scenarioVoiceTime'),
  steps: document.querySelector('#scenarioSteps'),
};
const railControls = {
  control: document.querySelector('#controlDock'),
  inspector: document.querySelector('#nodeInspector'),
  controlToggle: document.querySelector('#toggleControlRail'),
  inspectorToggle: document.querySelector('#toggleInspectorRail'),
};
const musicControls = {
  widget: document.querySelector('#musicWidget'),
  topToggle: document.querySelector('#toggleMusicMode'),
  mode: document.querySelector('#musicModeButton'),
  audio: document.querySelector('#musicAudio'),
  art: document.querySelector('#musicArt'),
  title: document.querySelector('#musicTitle'),
  meta: document.querySelector('#musicMeta'),
  collapse: document.querySelector('#musicCollapseButton'),
  select: document.querySelector('#musicSelect'),
  play: document.querySelector('#musicPlay'),
  prev: document.querySelector('#musicPrev'),
  next: document.querySelector('#musicNext'),
  progress: document.querySelector('#musicProgress'),
  bass: document.querySelector('#musicBass'),
  mid: document.querySelector('#musicMid'),
  treble: document.querySelector('#musicTreble'),
  time: document.querySelector('#musicTime'),
};
const armadaControls = {
  toggle: document.querySelector('#toggleArmadaMode'),
};
const desktopControls = {
  panel: document.querySelector('#desktopBridge'),
  status: document.querySelector('#desktopBridgeStatus'),
  wikiCount: document.querySelector('#desktopWikiCount'),
  songCount: document.querySelector('#desktopSongCount'),
  nodeCount: document.querySelector('#desktopNodeCount'),
  shipCount: document.querySelector('#desktopShipCount'),
  log: document.querySelector('#desktopBridgeLog'),
  refresh: document.querySelector('#refreshDesktopBridge'),
  checkServices: document.querySelector('#checkLocalServices'),
  openWiki: document.querySelector('#openWikiRoot'),
  openSongs: document.querySelector('#openSongRoot'),
  openDevProto: document.querySelector('#openDevProtoRoot'),
  openAssetViewer: document.querySelector('#openAssetViewerRoot'),
  openFlow: document.querySelector('#openFlowExplainer'),
  dialog: document.querySelector('#flowExplainerDialog'),
  close: document.querySelector('#closeFlowExplainer'),
  save: document.querySelector('#saveFlowExplainer'),
  prefill: document.querySelector('#prefillCurrentFlow'),
  statusLine: document.querySelector('#flowExplainerStatus'),
  name: document.querySelector('#flowNameInput'),
  verb: document.querySelector('#flowVerbInput'),
  objective: document.querySelector('#flowObjectiveInput'),
  nodes: document.querySelector('#flowNodesInput'),
  steps: document.querySelector('#flowStepsInput'),
  explainer: document.querySelector('#flowExplainerInput'),
  cardHooks: document.querySelector('#flowCardHooksInput'),
  productionNotes: document.querySelector('#flowProductionNotesInput'),
};

let graphNodes = [];
let graphEdges = [];
let selectedNodeId = 'hapa-dev-proto';
let activeLayers = new Set(['UI', 'API', 'CLI', 'DATA']);
let focusGroup = 'all';
let searchTerm = '';
let layoutMode = 'ecosystem';
let labelMode = 'key';
let hoveredNodeId = '';
let activeScenarioId = FLOW_SCENARIOS[0]?.id || '';
let scenarioRunning = false;
let scenarioStepIndex = -1;
let scenarioStepStartedAt = 0;
let scenarioPausedAt = 0;
let scenarioCurrentVisual = null;
let scenarioCompletedVisuals = [];
let scenarioHighlightIds = new Set();
let scenarioProgressRatio = 0;
let lastScenarioHighlightAt = 0;
let scenarioPanelOpen = true;
let cinematicMode = readStoredCinematicMode();
let cinematicReturnUntil = 0;
let musicMode = readStoredMusicMode();
let musicCollapsed = readStoredMusicCollapsed();
let controlRailOpen = readInitialRailOpen(CONTROL_RAIL_STORAGE_KEY, true);
let inspectorRailOpen = readInitialRailOpen(INSPECTOR_RAIL_STORAGE_KEY, true);
let backgroundMode = readStoredBackgroundMode();
let armadaMode = readStoredArmadaMode();
let musicLibrary = [];
let activeTrackIndex = 0;
let desktopContext = null;
let shipAssetPayload = {
  source: 'fallback',
  count: 0,
  ships: [],
};
let shipAssignments = new Map();
let shipLoadQueue = [];
let shipLoadsActive = 0;
let shipLoadToken = 0;
let activeRealShipCount = 0;
let frameDeltaSeconds = 0;
let lastFrameAt = 0;
const audioState = {
  context: null,
  muted: readStoredSfxMuted(),
  lastHoverAt: 0,
};
const musicState = {
  context: null,
  source: null,
  analyser: null,
  frequencyData: null,
  bass: 0,
  mid: 0,
  treble: 0,
  energy: 0,
  beat: 0,
  lastBeatAt: 0,
  accent: '#5eead4',
  loaded: false,
};
const scenarioVoiceState = {
  context: null,
  source: null,
  analyser: null,
  frequencyData: null,
  timeData: null,
  manifests: new Map(),
  loading: new Set(),
  currentFlowId: '',
  currentStepKey: '',
  energy: 0,
  status: 'idle',
};

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020617, 0.024);
const gltfLoader = new GLTFLoader();
const shipAssetCache = new Map();

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 200);
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(17, 13, 20);
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
const FORMATION_CAMERA_PRESETS = {
  ecosystem: {
    position: DEFAULT_CAMERA_POSITION.clone(),
    target: DEFAULT_CAMERA_TARGET.clone(),
  },
  ring: {
    position: new THREE.Vector3(0.25, 30, 0.35),
    target: new THREE.Vector3(0, 0, 0),
  },
  layers: {
    position: new THREE.Vector3(23, 9.5, 20),
    target: new THREE.Vector3(0, -0.25, 0),
  },
  lanes: {
    position: new THREE.Vector3(0, 22, 25),
    target: new THREE.Vector3(0, 0, 0),
  },
};
camera.position.copy(DEFAULT_CAMERA_POSITION);

function effectiveRenderPixelRatio() {
  const ceiling = armadaMode ? Math.min(MAX_RENDER_PIXEL_RATIO, 1.25) : MAX_RENDER_PIXEL_RATIO;
  return Math.min(window.devicePixelRatio || 1, ceiling);
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(effectiveRenderPixelRatio());
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
sceneRoot.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
sceneRoot.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 8;
controls.maxDistance = 48;
controls.maxPolarAngle = Math.PI * 0.86;

const ecosystemGroup = new THREE.Group();
const nodeGroup = new THREE.Group();
const edgeGroup = new THREE.Group();
const scenarioGroup = new THREE.Group();
const musicVisualizerGroup = new THREE.Group();
ecosystemGroup.add(edgeGroup, scenarioGroup, musicVisualizerGroup, nodeGroup);
scene.add(ecosystemGroup);

const pickables = [];
const nodeObjects = new Map();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const graphNodeById = new Map();
let frameIndex = 0;

scene.add(new THREE.HemisphereLight(0xbdefff, 0x07111f, 1.6));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
keyLight.position.set(8, 14, 9);
scene.add(keyLight);
const cyanLight = new THREE.PointLight(0x5eead4, 85, 36);
cyanLight.position.set(-8, 7, 4);
scene.add(cyanLight);
const goldLight = new THREE.PointLight(0xfbbf24, 70, 32);
goldLight.position.set(5, -3, 9);
scene.add(goldLight);

const grid = new THREE.GridHelper(44, 44, 0x25636b, 0x102437);
grid.position.y = -7.4;
grid.material.transparent = true;
grid.material.opacity = 0.32;
scene.add(grid);

const starGeometry = new THREE.BufferGeometry();
const starPositions = [];
for (let i = 0; i < 620; i += 1) {
  starPositions.push((Math.random() - 0.5) * 90, (Math.random() - 0.42) * 52, (Math.random() - 0.5) * 90);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x8be8ff, size: 0.04, transparent: true, opacity: 0.56 }));
scene.add(stars);

const backgroundGroup = new THREE.Group();
const starDriftGroup = new THREE.Group();
const auroraGroup = new THREE.Group();
const warpGroup = new THREE.Group();
const latticeGroup = new THREE.Group();
const cosmosGroup = new THREE.Group();
const backgroundWarpRings = [];
const backgroundLatticeRings = [];
const backgroundAuroras = [];
const backgroundStarLines = [];
const backgroundCosmosPlanets = [];
const backgroundCosmosOrbits = [];
const backgroundCosmosNebulae = [];
scene.add(backgroundGroup);
backgroundGroup.add(starDriftGroup, auroraGroup, warpGroup, latticeGroup, cosmosGroup);

const starLineGeometry = new THREE.BufferGeometry();
const starLinePositions = [];
for (let index = 0; index < 70; index += 1) {
  const x = (Math.random() - 0.5) * 62;
  const y = (Math.random() - 0.35) * 32;
  const z = -18 - Math.random() * 34;
  const length = 0.7 + Math.random() * 1.8;
  starLinePositions.push(x, y, z, x + length, y + length * 0.18, z - length * 1.6);
}
starLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starLinePositions, 3));
const starLineMesh = new THREE.LineSegments(
  starLineGeometry,
  new THREE.LineBasicMaterial({
    color: 0x8be8ff,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
starDriftGroup.add(starLineMesh);
backgroundStarLines.push(starLineMesh);

for (let index = 0; index < 4; index += 1) {
  const material = new THREE.MeshBasicMaterial({
    color: [GROUP_COLORS.core, GROUP_COLORS.trust, GROUP_COLORS.media, GROUP_COLORS.memory][index],
    transparent: true,
    opacity: 0.08,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(5.5 + index * 1.2, 0.055, 120, 8, 2 + index, 5), material);
  mesh.position.set((index - 1.5) * 4.6, -1.2 + index * 0.42, -16 - index * 2.2);
  mesh.rotation.set(index * 0.28, index * 0.7, index * 0.18);
  mesh.scale.set(1.75, 0.36 + index * 0.08, 1);
  auroraGroup.add(mesh);
  backgroundAuroras.push(mesh);
}

for (let index = 0; index < 18; index += 1) {
  const radius = 2.4 + index * 0.48;
  const material = new THREE.MeshBasicMaterial({
    color: index % 2 ? GROUP_COLORS.memory : GROUP_COLORS.media,
    transparent: true,
    opacity: 0.045,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.014, 6, 96), material);
  ring.rotation.x = Math.PI * 0.5;
  ring.position.z = -28 + index * 2.2;
  warpGroup.add(ring);
  backgroundWarpRings.push(ring);
}

for (let index = 0; index < 13; index += 1) {
  const material = new THREE.MeshBasicMaterial({
    color: [GROUP_COLORS.core, GROUP_COLORS.trust, GROUP_COLORS.media][index % 3],
    transparent: true,
    opacity: 0.055,
    wireframe: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4 + index * 0.62, 0.018, 6, 96), material);
  ring.rotation.x = Math.PI * 0.5;
  ring.rotation.z = index * 0.13;
  ring.position.set(0, -1.8 + (index % 3) * 0.34, -8 - index * 0.52);
  latticeGroup.add(ring);
  backgroundLatticeRings.push(ring);
}

cosmosGroup.position.set(-4.8, -1.3, -16);
cosmosGroup.rotation.set(-0.28, 0.18, 0.08);
const cosmosSun = new THREE.Mesh(
  new THREE.SphereGeometry(0.52, 24, 16),
  new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
cosmosSun.userData.baseScale = 1;
cosmosGroup.add(cosmosSun);

const cosmosHalo = new THREE.Mesh(
  new THREE.TorusGeometry(0.86, 0.018, 8, 96),
  new THREE.MeshBasicMaterial({
    color: 0x5eead4,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
cosmosHalo.rotation.x = Math.PI * 0.5;
cosmosGroup.add(cosmosHalo);

[
  { radius: 1.55, size: 0.14, color: GROUP_COLORS.memory, speed: 0.0008 },
  { radius: 2.45, size: 0.2, color: GROUP_COLORS.trust, speed: 0.00056 },
  { radius: 3.45, size: 0.26, color: GROUP_COLORS.core, speed: 0.00042 },
  { radius: 4.65, size: 0.18, color: GROUP_COLORS.media, speed: 0.00032 },
  { radius: 6.05, size: 0.32, color: GROUP_COLORS.surface, speed: 0.00024 },
].forEach((planetConfig, index) => {
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(planetConfig.radius, 0.008, 6, 120),
    new THREE.MeshBasicMaterial({
      color: index % 2 ? GROUP_COLORS.memory : GROUP_COLORS.media,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  orbit.rotation.x = Math.PI * 0.5;
  cosmosGroup.add(orbit);
  backgroundCosmosOrbits.push(orbit);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(planetConfig.size, 18, 12),
    new THREE.MeshBasicMaterial({
      color: planetConfig.color,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  planet.userData = {
    radius: planetConfig.radius,
    speed: planetConfig.speed,
    phase: index * 1.37,
    lift: (index - 2) * 0.05,
  };
  cosmosGroup.add(planet);
  backgroundCosmosPlanets.push(planet);
});

for (let cloudIndex = 0; cloudIndex < 3; cloudIndex += 1) {
  const cloudGeometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const colorA = new THREE.Color([GROUP_COLORS.core, GROUP_COLORS.trust, GROUP_COLORS.media][cloudIndex]);
  const colorB = new THREE.Color([GROUP_COLORS.media, GROUP_COLORS.memory, GROUP_COLORS.surface][cloudIndex]);
  for (let index = 0; index < 150; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const spread = 3.5 + Math.random() * 6.8 + cloudIndex * 1.2;
    const height = (Math.random() - 0.5) * (1.2 + cloudIndex * 0.4);
    positions.push(
      Math.cos(angle) * spread + (cloudIndex - 1) * 4.4,
      height + Math.sin(angle * 2.1) * 0.22,
      Math.sin(angle) * spread * 0.52 - cloudIndex * 1.6,
    );
    const mixed = colorA.clone().lerp(colorB, Math.random() * 0.85);
    colors.push(mixed.r, mixed.g, mixed.b);
  }
  cloudGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  cloudGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const cloud = new THREE.Points(
    cloudGeometry,
    new THREE.PointsMaterial({
      size: 0.075,
      transparent: true,
      opacity: 0.2,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  cloud.position.set(2.4, 0.8 + cloudIndex * 0.32, -2.2 - cloudIndex * 1.8);
  cloud.rotation.set(-0.18 + cloudIndex * 0.08, cloudIndex * 0.34, 0.2 - cloudIndex * 0.1);
  cosmosGroup.add(cloud);
  backgroundCosmosNebulae.push(cloud);
}

const musicBars = [];
const musicRings = [];
const musicBarGeometry = new THREE.BoxGeometry(0.16, 1, 0.16);
for (let index = 0; index < 48; index += 1) {
  const angle = (index / 48) * Math.PI * 2;
  const material = new THREE.MeshBasicMaterial({
    color: index % 3 === 0 ? GROUP_COLORS.media : index % 3 === 1 ? GROUP_COLORS.memory : GROUP_COLORS.trust,
    transparent: true,
    opacity: 0.34,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const bar = new THREE.Mesh(musicBarGeometry, material);
  bar.position.set(Math.cos(angle) * 5.6, -5.9, Math.sin(angle) * 5.6);
  bar.rotation.y = -angle;
  bar.scale.y = 0.12;
  musicBars.push(bar);
  musicVisualizerGroup.add(bar);
}

for (let index = 0; index < 4; index += 1) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.4 + index * 1.35, 0.018 + index * 0.004, 8, 120),
    new THREE.MeshBasicMaterial({
      color: [GROUP_COLORS.media, GROUP_COLORS.memory, GROUP_COLORS.trust, GROUP_COLORS.core][index],
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ring.rotation.x = Math.PI * 0.5;
  musicRings.push(ring);
  musicVisualizerGroup.add(ring);
}

const musicPulseLight = new THREE.PointLight(0x5eead4, 0, 22, 1.7);
musicPulseLight.position.set(0, 2.2, 0);
scene.add(musicPulseLight);
musicVisualizerGroup.visible = false;

function bootstrap() {
  const stored = readStoredData();
  if (stored) setGraphData(stored.nodes, stored.edges, 'SHEET');
  else setGraphData(SEED_NODES, SEED_EDGES, 'SEED');
  bindControls();
  selectNode(selectedNodeId);
  animate();
}

function readStoredData() {
  const readKey = key => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return parsed;
    return null;
  };

  try {
    const current = readKey(STORAGE_KEY);
    if (current) return current;
    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = readKey(key);
      if (legacy?.nodes?.some(node => node.id === 'hapa-atlas')) return legacy;
    }
  } catch {}
  return null;
}

function setGraphData(nodes, edges, source = 'SEED') {
  graphNodes = nodes.map((item, index) => {
    const mapped = { ...item, description: descriptionFor(item), position: positionFor(item, index, nodes.length) };
    mapped.searchText = `${mapped.name} ${mapped.role} ${mapped.description} ${mapped.group} ${mapped.status} ${(mapped.interfaces || []).join(' ')} ${(mapped.outputs || []).join(' ')} ${(mapped.capabilities || []).join(' ')}`.toLowerCase();
    mapped.normalizedLayers = normalizeLayers(mapped.layers);
    mapped.isKeyLabel = mapped.group === 'core'
      || mapped.group === 'app'
      || mapped.status.toLowerCase().includes('core')
      || ['world-building-wiki', 'hapa-lance-node', 'hapa-anvil-node', 'hapa-ltx-node', 'hapa-telemetry-node', 'hapa-open-tasks-node'].includes(mapped.id);
    return mapped;
  });
  graphNodeById.clear();
  graphNodes.forEach(item => graphNodeById.set(item.id, item));
  graphEdges = edges.filter(item => graphNodeById.has(item.source) && graphNodeById.has(item.target));
  selectedNodeId = graphNodes.some(item => item.id === selectedNodeId) ? selectedNodeId : graphNodes[0]?.id;
  buildNodes();
  assignShipAssetsToNodes();
  applyFormation(layoutMode, false);
  resetScenarioPlayback(false);
  updateStats(source);
  applyFilters();
  updateArmadaVisuals();
  if (armadaMode) ensureArmadaModelsLoaded();
  selectNode(selectedNodeId);
}

function buildNodes() {
  shipLoadToken += 1;
  shipLoadQueue = [];
  activeRealShipCount = 0;
  pickables.length = 0;
  nodeObjects.forEach(object => object.label.remove());
  nodeObjects.clear();
  clearThreeGroup(nodeGroup);

  graphNodes.forEach(item => {
    const group = new THREE.Group();
    group.position.copy(item.position);
    group.userData.nodeId = item.id;

    const radius = item.group === 'core' ? 0.62 : item.status.toLowerCase().includes('core') ? 0.52 : 0.43;
    const color = GROUP_COLORS[item.group] || GROUP_COLORS.core;
    const geometry = new THREE.SphereGeometry(radius, 24, 14);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.34,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 1,
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.userData.nodeId = item.id;
    group.add(sphere);
    pickables.push(sphere);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.85, 20, 12),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: item.group === 'core' ? 0.2 : 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    group.add(halo);

    const nodeLight = new THREE.PointLight(color, 0, radius * 8, 2);
    nodeLight.visible = false;
    group.add(nodeLight);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius * 1.52, 0.018, 6, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }),
    );
    ring.rotation.x = Math.PI * 0.5;
    group.add(ring);

    const shipRoot = new THREE.Group();
    shipRoot.visible = false;
    shipRoot.userData.nodeId = item.id;
    const shipFallback = createFallbackShip(item, color);
    shipFallback.meshes.forEach(mesh => {
      mesh.userData.nodeId = item.id;
    });
    shipRoot.add(shipFallback.root);
    const shipHitbox = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.22, 10, 8),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    shipHitbox.userData.nodeId = item.id;
    shipHitbox.userData.shipHitbox = true;
    shipRoot.add(shipHitbox);
    pickables.push(shipHitbox);
    group.add(shipRoot);

    const layers = normalizeLayers(item.layers);
    const beacons = [];
    layers.forEach((layer, index) => {
      const angle = (index / Math.max(layers.length, 1)) * Math.PI * 2;
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 10, 8),
        new THREE.MeshBasicMaterial({
          color: LAYER_COLORS[layer] || 0xffffff,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      beacon.position.set(Math.cos(angle) * (radius + 0.38), Math.sin(angle) * 0.16, Math.sin(angle) * (radius + 0.38));
      beacon.userData.nodeId = item.id;
      group.add(beacon);
      beacons.push(beacon);
    });

    const label = document.createElement('div');
    label.className = 'node-label';
    label.dataset.nodeId = item.id;
    label.setAttribute('role', 'button');
    label.setAttribute('tabindex', '0');
    label.setAttribute('aria-label', `Select ${item.name}`);
    label.addEventListener('click', event => {
      event.stopPropagation();
      playTone('select');
      selectNode(item.id);
    });
    label.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      playTone('select');
      selectNode(item.id);
    });
    label.addEventListener('pointerenter', () => setHoveredNode(item.id));
    label.addEventListener('pointerleave', () => setHoveredNode(''));
    const screenshot = screenshotFor(item);
    const logoSrc = inlineNodeLogo(item);
    label.innerHTML = `
      <div class="node-preview-card" aria-hidden="true">
        <div class="node-preview-media">
          <img src="${escapeAttribute(screenshot.src)}" alt="" loading="lazy">
        </div>
        <div class="node-preview-meta">
          <b>${escapeHtml(item.name)}</b>
          <small>${escapeHtml(screenshot.label)}</small>
        </div>
      </div>
      <div class="node-logo-orb" aria-hidden="true">
        <img src="${escapeAttribute(logoSrc)}" alt="" loading="lazy">
      </div>
      <div class="node-label-inner">${escapeHtml(item.name)}</div>
    `;
    const labelObject = new CSS2DObject(label);
    labelObject.position.set(0, radius + 0.9, 0);
    group.add(labelObject);

    nodeGroup.add(group);
    nodeObjects.set(item.id, {
      item,
      group,
      sphere,
      ring,
      halo,
      beacons,
      nodeLight,
      material,
      label,
      radius,
      shipRoot,
      shipFallback,
      shipHitbox,
      shipModelRoot: null,
      shipMixer: null,
      shipOpacity: 1,
      shipLoadingId: '',
      assignedShip: null,
      filtered: false,
      beaconOpacity: null,
      musicBasePosition: group.position.clone(),
    });
  });
}

function buildEdges() {
  clearThreeGroup(edgeGroup);
  graphEdges.forEach(item => {
    if (!activeLayers.has(item.layer)) return;
    const source = nodeObjects.get(item.source)?.group.position;
    const target = nodeObjects.get(item.target)?.group.position;
    if (!source || !target) return;
    const middle = source.clone().lerp(target, 0.5);
    const distance = source.distanceTo(target);
    middle.y += Math.min(5.5, Math.max(1.6, distance * 0.2));
    middle.z += item.layer === 'CLI' ? -1.3 : item.layer === 'DATA' ? 1.1 : 0;
    const curve = new THREE.CatmullRomCurve3([source.clone(), middle, target.clone()]);
    const geometry = new THREE.TubeGeometry(curve, 24, item.layer === 'UI' ? 0.026 : 0.02, 6, false);
    const material = new THREE.MeshBasicMaterial({
      color: LAYER_COLORS[item.layer] || 0xffffff,
      transparent: true,
      opacity: item.layer === 'DATA' ? 0.46 : 0.58,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.edge = item;
    mesh.userData.baseOpacity = material.opacity;
    edgeGroup.add(mesh);
  });
}

function disposeObjectTree(object) {
  object.traverse?.(child => {
    if (!child.userData?.preserveSharedShipGeometry) child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach(material => material?.dispose?.());
    } else {
      child.material?.dispose?.();
    }
  });
}

function clearThreeGroup(group) {
  [...group.children].forEach(child => disposeObjectTree(child));
  group.clear();
}

function positionNodes(mode) {
  const formation = normalizeFormationMode(mode);
  graphNodes.forEach((item, index) => {
    let next;
    if (formation === 'layers') next = layerPosition(item, index);
    else if (formation === 'ring') next = ringPosition(item, index);
    else if (formation === 'lanes') next = lanePosition(item, index);
    else next = item.position.clone();
    const object = nodeObjects.get(item.id);
    if (object) {
      object.group.position.copy(next);
      object.musicBasePosition = next.clone();
    }
  });
}

function applyFormation(mode = layoutMode, withCamera = true) {
  layoutMode = normalizeFormationMode(mode);
  if (layoutSelect && layoutSelect.value !== layoutMode) layoutSelect.value = layoutMode;
  document.body.dataset.formation = layoutMode;
  updateFormationControls();
  positionNodes(layoutMode);
  buildEdges();
  if (withCamera && !musicMode && !isCinematicPlaybackActive()) applyFormationCamera(layoutMode);
}

function updateFormationControls() {
  const selectedOption = Array.from(layoutSelect?.options || []).find(option => option.value === layoutMode);
  if (formationReadout) formationReadout.textContent = selectedOption?.textContent || 'Constellation';
  formationButtons.forEach(button => {
    const active = button.dataset.formation === layoutMode;
    button.setAttribute('aria-pressed', String(active));
    button.dataset.active = String(active);
  });
}

function normalizeFormationMode(mode) {
  if (mode === 'orbit') return 'ring';
  return ['ecosystem', 'ring', 'layers', 'lanes'].includes(mode) ? mode : 'ecosystem';
}

function positionFor(item, index, total) {
  const explicit = SEED_POSITIONS[item.id];
  if (explicit) return new THREE.Vector3(...explicit);
  return orbitPosition(item, index, total);
}

function orbitPosition(item, index, total = graphNodes.length || 1) {
  if (item.id === 'hapa-dev-proto') return new THREE.Vector3(0, 1, 0);
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const groupOffset = ['memory', 'core', 'app', 'media', 'trust', 'surface', 'ops', 'protocol', 'feature', 'archive'].indexOf(item.group);
  const radius = 7 + Math.max(0, groupOffset) * 0.9;
  return new THREE.Vector3(Math.cos(angle) * radius, (index % 5) - 2, Math.sin(angle) * radius);
}

function layerPosition(item, index) {
  const primary = normalizeLayers(item.layers)[0] || 'DATA';
  const yMap = { UI: 5.2, API: 1.6, CLI: -2.4, DATA: -5.8 };
  const groups = ['memory', 'core', 'app', 'media', 'ops', 'trust', 'surface', 'protocol', 'feature', 'archive'];
  const x = (groups.indexOf(item.group) - 3.5) * 3.8;
  const z = ((index % 7) - 3) * 1.2;
  return new THREE.Vector3(x, yMap[primary] ?? 0, z);
}

function ringPosition(item, index) {
  if (item.id === 'hapa-dev-proto') return new THREE.Vector3(0, 0.35, 0);
  const groupIndex = formationGroupIndex(item.group);
  const peers = graphNodes.filter(nodeItem => formationGroupIndex(nodeItem.group) === groupIndex && nodeItem.id !== 'hapa-dev-proto');
  const peerIndex = Math.max(0, peers.findIndex(nodeItem => nodeItem.id === item.id));
  const angle = ((peerIndex / Math.max(peers.length, 1)) * Math.PI * 2) + (groupIndex * 0.31);
  const radius = item.group === 'core' ? 2.35 : 3.9 + groupIndex * 0.82;
  const primary = primaryLayerFor(item);
  const layerLift = (FORMATION_LAYER_ORDER.indexOf(primary) - 1.5) * 0.08;
  return new THREE.Vector3(Math.cos(angle) * radius, layerLift, Math.sin(angle) * radius);
}

function lanePosition(item, index) {
  const groupIndex = formationGroupIndex(item.group);
  const primary = primaryLayerFor(item);
  const layerIndex = Math.max(0, FORMATION_LAYER_ORDER.indexOf(primary));
  const lanePeers = graphNodes.filter(nodeItem => formationGroupIndex(nodeItem.group) === groupIndex && primaryLayerFor(nodeItem) === primary);
  const peerIndex = Math.max(0, lanePeers.findIndex(nodeItem => nodeItem.id === item.id));
  const columns = Math.max(1, Math.ceil(Math.sqrt(lanePeers.length)));
  const localX = ((peerIndex % columns) - ((columns - 1) / 2)) * 0.76;
  const localZ = (Math.floor(peerIndex / columns) - 0.5) * 0.72;
  const x = (groupIndex - ((FORMATION_GROUP_ORDER.length - 1) / 2)) * 2.62;
  const z = (layerIndex - ((FORMATION_LAYER_ORDER.length - 1) / 2)) * 4.35;
  return new THREE.Vector3(x + localX, layerIndex * 0.12, z + localZ);
}

function formationGroupIndex(group) {
  const index = FORMATION_GROUP_ORDER.indexOf(group);
  return index === -1 ? FORMATION_GROUP_ORDER.length - 1 : index;
}

function primaryLayerFor(item = {}) {
  return normalizeLayers(item.layers)[0] || 'DATA';
}

function cameraPresetFor(mode = layoutMode) {
  return FORMATION_CAMERA_PRESETS[normalizeFormationMode(mode)] || FORMATION_CAMERA_PRESETS.ecosystem;
}

function applyFormationCamera(mode = layoutMode) {
  cinematicReturnUntil = 0;
  const preset = cameraPresetFor(mode);
  camera.position.copy(preset.position);
  controls.target.copy(preset.target);
  controls.update();
}

function setBeaconOpacity(object, opacity) {
  if (object.beaconOpacity === opacity) return;
  object.beaconOpacity = opacity;
  object.beacons?.forEach(beacon => {
    beacon.material.opacity = opacity;
  });
}

function setDatasetFlag(element, key, value) {
  const next = String(value);
  if (element.dataset[key] !== next) element.dataset[key] = next;
}

function setNodeLight(object, intensity, visible = intensity > 0.05) {
  if (!object?.nodeLight) return;
  object.nodeLight.visible = Boolean(visible);
  object.nodeLight.intensity = object.nodeLight.visible ? intensity : 0;
}

function defaultHaloOpacityFor(item) {
  return item?.group === 'core' ? 0.2 : 0.14;
}

function defaultNodeLightFor(item) {
  const radius = nodeObjects.get(item?.id)?.radius || 0.45;
  return item?.group === 'core' ? 3.2 : Math.max(1.4, radius * 4.2);
}

function createFallbackShip(item, color) {
  const root = new THREE.Group();
  root.userData.nodeId = item.id;
  const hullMaterial = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.28,
    roughness: 0.34,
    metalness: 0.72,
    transparent: true,
    opacity: 1,
  });
  const lightMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.48, 4), hullMaterial);
  hull.rotation.x = Math.PI * 0.5;
  hull.rotation.z = Math.PI * 0.25;
  hull.position.z = 0.22;
  root.add(hull);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 1.22), hullMaterial);
  spine.position.z = -0.08;
  root.add(spine);

  const wingSpan = item.group === 'core' || item.group === 'app' ? 1.08 : item.group === 'media' ? 1.26 : 0.92;
  const wings = new THREE.Mesh(new THREE.BoxGeometry(wingSpan, 0.07, 0.32), hullMaterial);
  wings.position.z = -0.18;
  root.add(wings);

  const bridge = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), lightMaterial);
  bridge.scale.set(0.82, 0.42, 0.55);
  bridge.position.set(0, 0.08, 0.3);
  root.add(bridge);

  const thruster = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.52, 18), lightMaterial);
  thruster.rotation.x = -Math.PI * 0.5;
  thruster.position.z = -0.92;
  root.add(thruster);

  return {
    root,
    meshes: [hull, spine, wings, bridge, thruster],
    thruster,
  };
}

function setShipOpacity(object, opacity) {
  if (!object?.shipRoot) return;
  const next = Math.max(0.02, Math.min(1, opacity));
  if (Math.abs((object.shipOpacity ?? -1) - next) < 0.01) return;
  object.shipOpacity = next;
  object.shipRoot.traverse(child => {
    if (child.userData?.shipHitbox) return;
    const apply = material => {
      if (!material) return;
      material.transparent = true;
      material.opacity = next;
    };
    if (Array.isArray(child.material)) child.material.forEach(apply);
    else apply(child.material);
  });
}

function preferredShipSubtypesForNode(item = {}) {
  if (item.id === 'hapa-dev-proto' || item.id === 'hapa-master-dashboard' || item.group === 'core') return ['carrier', 'dreadnought', 'cruiser'];
  if (item.id?.includes('ltx') || item.id?.includes('media') || item.id?.includes('forge')) return ['carrier', 'cruiser', 'frigate'];
  if (item.id?.includes('keys') || item.id?.includes('crypto') || item.group === 'trust') return ['dreadnought', 'cruiser'];
  if (item.id?.includes('atlas') || item.id?.includes('wiki') || item.group === 'memory' || item.group === 'archive') return ['carrier', 'dreadnought', 'ship'];
  if (item.group === 'surface' || item.group === 'app') return ['frigate', 'cruiser', 'ship'];
  if (item.group === 'ops') return ['cruiser', 'frigate', 'dreadnought'];
  if (item.group === 'protocol' || item.group === 'feature') return ['frigate', 'ship', 'cruiser'];
  return ['ship', 'frigate', 'cruiser', 'carrier', 'dreadnought'];
}

function pickShipForNode(item, index = 0) {
  const ships = shipAssetPayload.ships || [];
  if (!ships.length) return null;
  const preferred = preferredShipSubtypesForNode(item);
  const pool = preferred.flatMap(type => ships.filter(ship => String(ship.subtype || '').toLowerCase() === type));
  const candidates = pool.length ? uniqueById(pool) : ships;
  const sizeRanked = [...candidates].sort((a, b) => {
    const aBytes = Number(a.glbBytes || Number.MAX_SAFE_INTEGER);
    const bBytes = Number(b.glbBytes || Number.MAX_SAFE_INTEGER);
    return aBytes - bBytes || String(a.name).localeCompare(String(b.name));
  });
  const performancePool = sizeRanked.slice(0, Math.max(1, Math.ceil(sizeRanked.length * 0.66)));
  return performancePool[Math.abs(hashString(`${item.id}-${item.group}-${index}`)) % performancePool.length] || performancePool[0] || candidates[0];
}

function uniqueById(items = []) {
  const seen = new Set();
  return items.filter(item => {
    const id = item.id || item.runId || item.name;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function assignedShipFor(item = {}) {
  return shipAssignments.get(item.id) || null;
}

function assignShipAssetsToNodes() {
  const next = new Map();
  graphNodes.forEach((item, index) => {
    const ship = pickShipForNode(item, index);
    if (ship) next.set(item.id, ship);
  });
  shipAssignments = next;
  nodeObjects.forEach((object, nodeId) => {
    const ship = shipAssignments.get(nodeId);
    if (object.assignedShip?.id !== ship?.id) {
      clearLoadedShipModel(object);
      object.shipLoadingId = '';
    }
    object.assignedShip = ship || null;
    setDatasetFlag(object.label, 'armada', armadaMode);
  });
  if (shipCount) shipCount.textContent = String(shipAssetPayload.count || shipAssignments.size || 0);
}

function normalizeShipAssetPayload(payload = {}) {
  const ships = Array.isArray(payload.ships) ? payload.ships : Array.isArray(payload.sample) ? payload.sample : [];
  return {
    ...payload,
    count: Number(payload.count || ships.length || 0),
    ships: ships
      .filter(ship => ship?.glbUrl || ship?.glbPath)
      .map(ship => ({
        ...ship,
        id: ship.id || ship.runId || slug(ship.name),
        subtype: String(ship.subtype || 'ship').toLowerCase(),
        glbUrl: ship.glbUrl || ship.rawGlbUrl || '',
        glbBytes: Number(ship.glbBytes || ship.rawGlbBytes || 0),
        previewUrl: ship.previewUrl || '',
      })),
  };
}

function applyShipAssetPayload(payload = {}) {
  shipAssetPayload = normalizeShipAssetPayload(payload);
  assignShipAssetsToNodes();
  updateArmadaControls();
  updateArmadaVisuals();
  if (armadaMode) ensureArmadaModelsLoaded();
  const selected = graphNodes.find(node => node.id === selectedNodeId);
  if (selected) renderInspector(selected);
}

function updateArmadaControls() {
  document.body.dataset.armadaMode = String(armadaMode);
  armadaControls.toggle?.setAttribute('aria-pressed', String(armadaMode));
  if (armadaControls.toggle) {
    armadaControls.toggle.dataset.active = String(armadaMode);
    armadaControls.toggle.title = shipAssetPayload.count
      ? `${shipAssetPayload.count} Asset Viewer ships registered; detailed models load for selected, hovered, and active-flow nodes`
      : 'Show procedural Hapa ships instead of node circles';
  }
  if (shipCount) shipCount.textContent = String(shipAssetPayload.count || shipAssignments.size || 0);
}

function setArmadaMode(enabled, withSound = true) {
  armadaMode = Boolean(enabled);
  try { localStorage.setItem(ARMADA_MODE_STORAGE_KEY, String(armadaMode)); } catch {}
  renderer.setPixelRatio(effectiveRenderPixelRatio());
  updateArmadaControls();
  updateArmadaVisuals();
  if (armadaMode) ensureArmadaModelsLoaded();
  else clearAllLoadedShipModels();
  if (withSound) playTone(armadaMode ? 'launch' : 'close');
}

function canLoadShipSource(src) {
  if (!src) return false;
  if (src.startsWith('data:')) return true;
  if (src.startsWith('hapa-asset:')) return true;
  if (window.location.protocol === 'file:' && src.startsWith('file:')) return true;
  if (src.startsWith(window.location.origin)) return true;
  return src.startsWith('/') && !src.startsWith('/@fs/');
}

function ensureArmadaModelsLoaded() {
  if (!armadaMode) return;
  const token = shipLoadToken;
  const detailIds = currentArmadaDetailNodeIds();
  trimLoadedShipModels(detailIds);
  const priority = Array.from(nodeObjects.values())
    .filter(object => detailIds.has(object.item.id) && object.assignedShip?.glbUrl && !object.shipModelRoot && canLoadShipSource(object.assignedShip.glbUrl))
    .sort((a, b) => shipLoadPriority(a) - shipLoadPriority(b));
  shipLoadQueue = priority;
  processShipLoadQueue(token);
}

function currentArmadaDetailNodeIds() {
  const ids = new Set();
  if (selectedNodeId) ids.add(selectedNodeId);
  if (hoveredNodeId) ids.add(hoveredNodeId);
  scenarioHighlightIds.forEach(id => ids.add(id));
  const currentStep = scenarioCurrentVisual?.step || scenarioStepAtIndex();
  if (currentStep?.source) ids.add(currentStep.source);
  if (currentStep?.target) ids.add(currentStep.target);
  return ids;
}

function clearAllLoadedShipModels() {
  shipLoadQueue = [];
  nodeObjects.forEach(object => clearLoadedShipModel(object));
}

function trimLoadedShipModels(detailIds = currentArmadaDetailNodeIds()) {
  const loaded = Array.from(nodeObjects.values())
    .filter(object => object.shipModelRoot)
    .sort((a, b) => shipLoadPriority(a) - shipLoadPriority(b));
  let kept = 0;
  loaded.forEach(object => {
    if (detailIds.has(object.item.id) && kept < SHIP_REAL_MODEL_LIMIT) {
      kept += 1;
      return;
    }
    clearLoadedShipModel(object);
  });
}

function shipLoadPriority(object) {
  if (object.item.id === selectedNodeId) return 0;
  if (object.item.id === hoveredNodeId) return 1;
  if (scenarioHighlightIds.has(object.item.id)) return 2;
  if (object.item.isKeyLabel) return 3;
  return 4 + (hashString(object.item.id) % 100);
}

function processShipLoadQueue(token = shipLoadToken) {
  if (token !== shipLoadToken || !armadaMode) return;
  while (shipLoadsActive < SHIP_LOAD_CONCURRENCY && shipLoadQueue.length) {
    const object = shipLoadQueue.shift();
    if (!object || object.shipModelRoot || object.shipLoadingId || !object.assignedShip) continue;
    if (activeRealShipCount >= SHIP_REAL_MODEL_LIMIT || !isPriorityShipObject(object)) continue;
    loadShipModelForObject(object, token);
  }
}

function isPriorityShipObject(object) {
  return currentArmadaDetailNodeIds().has(object.item.id);
}

function loadGltfShip(src) {
  if (!shipAssetCache.has(src)) {
    shipAssetCache.set(src, new Promise((resolve, reject) => {
      gltfLoader.load(src, resolve, undefined, reject);
    }));
  }
  return shipAssetCache.get(src);
}

function loadShipModelForObject(object, token = shipLoadToken) {
  const ship = object.assignedShip;
  if (!ship?.glbUrl) return;
  shipLoadsActive += 1;
  object.shipLoadingId = ship.id;
  loadGltfShip(ship.glbUrl)
    .then(gltf => {
      if (token !== shipLoadToken || !armadaMode || object.assignedShip?.id !== ship.id || !nodeObjects.has(object.item.id) || !currentArmadaDetailNodeIds().has(object.item.id)) return;
      attachShipModel(object, gltf, ship);
    })
    .catch(error => {
      object.shipLoadError = error.message;
      console.warn(`[Armada] Could not load ${ship.name}: ${error.message}`);
    })
    .finally(() => {
      shipLoadsActive = Math.max(0, shipLoadsActive - 1);
      object.shipLoadingId = '';
      processShipLoadQueue(token);
    });
}

function attachShipModel(object, gltf, ship) {
  clearLoadedShipModel(object);
  const holder = new THREE.Group();
  holder.userData.nodeId = object.item.id;
  holder.userData.shipId = ship.id;
  const model = gltf.scene.clone(true);
  model.traverse(child => {
    child.userData.nodeId = object.item.id;
    if (child.isMesh) {
      child.frustumCulled = true;
      child.userData.preserveSharedShipGeometry = true;
      child.material = cloneShipMaterial(child.material, object.item);
    }
  });
  normalizeShipModel(model);
  holder.add(model);
  object.shipRoot.add(holder);
  object.shipModelRoot = holder;
  object.shipFallback.root.visible = false;
  object.shipLoadedShip = ship;
  activeRealShipCount += 1;
  if (Array.isArray(gltf.animations) && gltf.animations.length) {
    const mixer = new THREE.AnimationMixer(model);
    gltf.animations.slice(0, 1).forEach(clip => {
      const action = mixer.clipAction(clip);
      action.play();
    });
    object.shipMixer = mixer;
  }
  setShipOpacity(object, object.shipOpacity ?? 1);
}

function cloneShipMaterial(material, item = {}) {
  const color = new THREE.Color(GROUP_COLORS[item.group] || GROUP_COLORS.core);
  const cloneOne = source => {
    const cloned = source?.clone ? source.clone() : new THREE.MeshStandardMaterial({ color });
    cloned.transparent = true;
    cloned.opacity = 1;
    if (cloned.emissive) {
      cloned.emissive.copy(color);
      cloned.emissiveIntensity = Math.max(cloned.emissiveIntensity || 0, 0.08);
    }
    return cloned;
  };
  return Array.isArray(material) ? material.map(cloneOne) : cloneOne(material);
}

function normalizeShipModel(model) {
  let box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const longest = Math.max(size.x, size.y, size.z) || 1;
  model.scale.setScalar(1.42 / longest);
  box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
}

function clearLoadedShipModel(object) {
  if (!object?.shipModelRoot) return;
  object.shipModelRoot.traverse(child => {
    if (!child.isMesh) return;
    const index = pickables.indexOf(child);
    if (index >= 0) pickables.splice(index, 1);
  });
  object.shipRoot.remove(object.shipModelRoot);
  object.shipMixer?.stopAllAction?.();
  object.shipMixer = null;
  object.shipModelRoot = null;
  object.shipLoadedShip = null;
  activeRealShipCount = Math.max(0, activeRealShipCount - 1);
  if (object.shipFallback?.root) object.shipFallback.root.visible = true;
}

function updateArmadaVisuals() {
  updateArmadaControls();
  const cinematicActive = isCinematicPlaybackActive();
  const routeIds = currentCinematicRouteIds();
  nodeObjects.forEach((object, nodeId) => {
    const flowActive = scenarioHighlightIds.has(nodeId);
    const tacticalVisible = nodeId === selectedNodeId || nodeId === hoveredNodeId || flowActive || (cinematicActive && routeIds.has(nodeId));
    object.shipRoot.visible = armadaMode && object.group.visible;
    object.sphere.visible = !armadaMode;
    object.halo.visible = !armadaMode || tacticalVisible;
    object.ring.visible = !armadaMode || tacticalVisible;
    setDatasetFlag(object.label, 'armada', armadaMode);
    const selected = nodeId === selectedNodeId;
    const filteredOpacity = object.filtered ? 0.24 : 1;
    const flowOpacity = cinematicActive && !routeIds.has(nodeId) ? 0.1 : filteredOpacity;
    setShipOpacity(object, selected || flowActive ? 1 : flowOpacity);
  });
}

function applyFilters() {
  const q = searchTerm.trim().toLowerCase();
  const visibleIds = new Set();
  const routeIds = currentCinematicRouteIds();
  const cinematicActive = isCinematicPlaybackActive();
  graphNodes.forEach(item => {
    const matchesSearch = !q || item.searchText.includes(q);
    const matchesGroup = focusGroup === 'all' || item.group === focusGroup || item.status.toLowerCase().includes(focusGroup);
    const matchesLayer = item.normalizedLayers.some(layer => activeLayers.has(layer));
    const visible = matchesSearch && matchesGroup && matchesLayer;
    const object = nodeObjects.get(item.id);
    if (object) {
      const labelVisible = item.id === selectedNodeId || labelMode === 'all' || (labelMode === 'key' && item.isKeyLabel && visible);
      const forcedFlowVisible = cinematicActive && routeIds.has(item.id);
      object.group.visible = visible || item.id === selectedNodeId || forcedFlowVisible;
      object.filtered = !visible;
      object.material.opacity = visible ? 1 : 0.22;
      object.material.emissiveIntensity = visible ? 0.34 : 0.08;
      object.halo.material.opacity = visible ? defaultHaloOpacityFor(item) : 0.035;
      const shouldLightNode = visible && (item.group === 'core' || item.id === selectedNodeId || item.id === hoveredNodeId);
      setNodeLight(object, defaultNodeLightFor(item), shouldLightNode);
      setBeaconOpacity(object, visible ? 0.95 : 0.16);
      setDatasetFlag(object.label, 'dimmed', !visible);
      setDatasetFlag(object.label, 'labelVisible', labelVisible);
      setDatasetFlag(object.label, 'hovered', item.id === hoveredNodeId && visible);
      object.sphere.scale.setScalar(item.id === selectedNodeId ? 1.32 : visible ? 1 : 0.74);
      object.ring.scale.setScalar(item.id === selectedNodeId ? 1.28 : 1);
    }
    if (visible) visibleIds.add(item.id);
  });
  edgeGroup.children.forEach(mesh => {
    const item = mesh.userData.edge;
    mesh.visible = activeLayers.has(item.layer) && visibleIds.has(item.source) && visibleIds.has(item.target);
    mesh.material.opacity = mesh.userData.baseOpacity ?? (item.layer === 'DATA' ? 0.46 : 0.58);
  });
  selectedLayerCount.textContent = String(activeLayers.size);
  applyScenarioHighlights();
  updateArmadaVisuals();
}

function selectNode(id) {
  selectedNodeId = id;
  nodeObjects.forEach((object, nodeId) => {
    const active = nodeId === id;
    setDatasetFlag(object.label, 'selected', active);
    setDatasetFlag(object.label, 'hovered', nodeId === hoveredNodeId);
    object.sphere.scale.setScalar(active ? 1.32 : 1);
    object.ring.scale.setScalar(active ? 1.28 : 1);
  });
  const item = graphNodes.find(node => node.id === id);
  renderInspector(item);
  applyFilters();
  if (armadaMode) ensureArmadaModelsLoaded();
}

function renderInspector(item) {
  const links = graphEdges.filter(edgeItem => edgeItem.source === item?.id || edgeItem.target === item?.id);
  if (!item) return;
  const assignedShip = assignedShipFor(item);
  inspector.name.textContent = item.name;
  inspector.role.textContent = item.role;
  inspector.architectDescription.textContent = descriptionFor(item);
  const screenshot = screenshotFor(item);
  const visuals = nodeVisualsFor(item);
  inspector.previewImage.src = screenshot.src;
  inspector.previewImage.alt = `${item.name} UI screenshot`;
  inspector.previewLabel.textContent = screenshot.label;
  inspector.previewButton.dataset.previewSrc = screenshot.src;
  inspector.previewButton.dataset.previewLabel = screenshot.label;
  inspector.previewButton.dataset.previewTitle = item.name;
  inspector.logoImage.src = visuals.logo;
  inspector.logoImage.alt = `${item.name} generated logo`;
  inspector.logoImage.title = visuals.logoPrompt;
  inspector.infographicImage.src = visuals.infographic;
  inspector.infographicImage.alt = `${item.name} generated infographic`;
  inspector.infographicImage.title = visuals.infographicPrompt;
  inspector.infographicButton.dataset.previewSrc = visuals.infographic;
  inspector.infographicButton.dataset.previewLabel = 'Generated node infographic';
  inspector.infographicButton.dataset.previewTitle = `${item.name} infographic`;
  inspector.infographicButton.dataset.prompt = visuals.infographicPrompt;
  renderShipCard(item);
  inspector.badges.innerHTML = [item.status, item.group, ...normalizeLayers(item.layers)].map(value => `<span>${escapeHtml(value)}</span>`).join('');
  renderKanbanIngress(item);
  const shipSize = assignedShip?.glbBytes ? ` / ${formatMegabytes(assignedShip.glbBytes)}` : '';
  inspector.facts.innerHTML = `
    <dt>Status</dt><dd>${escapeHtml(item.status)}</dd>
    <dt>Path</dt><dd>${escapeHtml(item.path || 'spreadsheet row')}</dd>
    <dt>Group</dt><dd>${escapeHtml(item.group)}</dd>
    <dt>Armada ship</dt><dd>${escapeHtml(assignedShip ? `${assignedShip.name} / ${assignedShip.subtype}${shipSize}` : 'Procedural fallback')}</dd>
    <dt>Ship source</dt><dd>${escapeHtml(assignedShip?.flowName || shipAssetPayload.source || 'local node profile')}</dd>
  `;
  inspector.capabilities.innerHTML = listItems(item.capabilities?.length ? item.capabilities : ['No capabilities recorded yet.']);
  inspector.interfaces.innerHTML = listItems(item.interfaces?.length ? item.interfaces : ['No explicit UI/API/CLI entries yet.']);
  inspector.outputs.innerHTML = listItems(item.outputs?.length ? item.outputs : ['No outputs recorded yet.']);
  inspector.connections.innerHTML = links.length
    ? links.map(link => {
      const otherId = link.source === item.id ? link.target : link.source;
      const other = graphNodes.find(node => node.id === otherId);
      return `<li><b>${escapeHtml(link.layer)}</b> ${escapeHtml(other?.name || otherId)} <small>${escapeHtml(link.label || '')}</small></li>`;
    }).join('')
    : '<li>No links mapped yet.</li>';
}

function renderKanbanIngress(item) {
  if (!inspector.kanbanPanel || !kanbanIngress) return;
  const projectId = kanbanIngress.projectIdForNode(item);
  const url = kanbanIngress.boardUrl(projectId);
  inspector.kanbanPanel.dataset.state = projectId ? 'linked' : 'missing';
  inspector.kanbanSummary.textContent = projectId
    ? `Open the app-specific Kanban board for ${item.name}.`
    : 'No app-specific Kanban project is mapped for this node yet.';
  inspector.kanbanProject.textContent = projectId || 'board not mapped';
  if (projectId) {
    inspector.kanbanLink.href = url;
    inspector.kanbanLink.removeAttribute('aria-disabled');
    inspector.kanbanLink.tabIndex = 0;
  } else {
    inspector.kanbanLink.href = kanbanIngress.baseUrl;
    inspector.kanbanLink.setAttribute('aria-disabled', 'true');
    inspector.kanbanLink.tabIndex = -1;
  }
}

function listItems(items) {
  return items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
}

function shipCard(shipClass, archetype, doctrine, attributeOverrides, skills, specialties, research) {
  return {
    shipClass,
    archetype,
    doctrine,
    attributes: shipAttributes(archetype, attributeOverrides),
    skills,
    specialties,
    research,
  };
}

function shipAttributes(archetype, overrides = {}) {
  const base = SHIP_ARCHETYPE_ATTRIBUTES[archetype] || SHIP_ARCHETYPE_ATTRIBUTES.surface;
  return { ...base, ...overrides };
}

function shipCardFor(item = {}) {
  const known = SPACECRAFT_CARDS[item.id] || SPACECRAFT_CARDS[slug(item.name)];
  if (known) return known;
  return fallbackShipCard(item);
}

function fallbackShipCard(item = {}) {
  const groupArchetype = {
    core: 'command',
    memory: 'archive',
    media: 'production',
    trust: 'trust',
    surface: 'surface',
    app: 'surface',
    ops: 'ops',
    protocol: 'protocol',
    archive: 'legacy',
    feature: 'research',
  };
  const archetype = groupArchetype[item.group] || 'surface';
  const name = item.name || 'Unmapped Hapa Node';
  return shipCard(
    `${name} Utility Vessel`,
    archetype,
    `A mapped Hapa support vessel whose mechanics are inferred from its node role. In play, it teaches the player to inspect the node's interfaces, outputs, and dependencies before deciding whether it belongs in command, production, memory, trust, or scout formations.`,
    {},
    ['Interface Probe: inspect this node and reveal its strongest UI, API, CLI, or data layer.', 'Dependency Lesson: gain a bonus when the player can name what this node produces or maintains.'],
    unique([item.group || 'node support', ...normalizeLayers(item.layers).map(layer => `${layer.toLowerCase()} layer`)]).slice(0, 3),
    ['Source Inspection: replace inferred mechanics with code-backed mechanics.', 'Card Canonicalization: persist this vessel profile into Atlas context attributes.'],
  );
}

function renderShipCard(item) {
  const card = shipCardFor(item);
  const assignedShip = assignedShipFor(item);
  const mock = assignedShip?.previewUrl || inlineShipMock(item, card);
  const prompt = shipImagePromptFor(item, card);
  inspector.shipClassName.textContent = card.shipClass;
  inspector.shipArchetype.textContent = assignedShip ? `${card.archetype} / ${assignedShip.subtype}` : card.archetype;
  inspector.shipDoctrine.textContent = assignedShip
    ? `${card.doctrine}\n\nArmada model: ${assignedShip.name}. The mesh comes from the Asset Viewer ${assignedShip.flowName || 'ship animation'} run, with ${assignedShip.socketCount || 0} sockets and ${assignedShip.animationCount || 0} animation clips recorded.`
    : card.doctrine;
  inspector.shipMockImage.src = mock;
  inspector.shipMockImage.alt = assignedShip ? `${assignedShip.name} Asset Viewer ship` : `${item.name} spacecraft mock`;
  inspector.shipMockImage.title = assignedShip?.glbPath || prompt;
  inspector.shipMockButton.dataset.previewSrc = mock;
  inspector.shipMockButton.dataset.previewTitle = assignedShip ? `${assignedShip.name} / ${card.shipClass}` : `${card.shipClass} mock`;
  inspector.shipMockButton.dataset.prompt = prompt;
  inspector.shipAttributes.innerHTML = SHIP_ATTRIBUTE_LABELS.map(([key, label]) => renderShipAttribute(label, card.attributes[key], key)).join('');
  inspector.shipSkills.innerHTML = renderShipCardList(card.skills);
  inspector.shipSpecialties.innerHTML = renderShipCardList(card.specialties);
  inspector.shipResearch.innerHTML = renderShipCardList(card.research);
}

function renderShipAttribute(label, value, key) {
  const max = key === 'crewCount' ? 500 : 10;
  const pct = Math.max(3, Math.min(100, (Number(value || 0) / max) * 100));
  const display = key === 'crewCount' ? String(value || 0) : `${value || 0}/10`;
  return `
    <div class="ship-attribute">
      <div class="ship-attribute-readout"><b>${escapeHtml(label)}</b><span>${escapeHtml(display)}</span></div>
      <div class="ship-attribute-meter" aria-hidden="true"><i style="width:${pct.toFixed(1)}%"></i></div>
    </div>
  `;
}

function renderShipCardList(items = []) {
  return items.map(item => {
    const text = String(item || '');
    const [name, ...rest] = text.split(':');
    const body = rest.join(':').trim();
    if (!body) return `<li>${escapeHtml(text)}</li>`;
    return `<li><b>${escapeHtml(name.trim())}</b><small>${escapeHtml(body)}</small></li>`;
  }).join('');
}

function descriptionFor(item) {
  const explicit = String(item?.description || '').trim();
  if (explicit) return explicit;
  const known = BLUE_ARCHITECT_DESCRIPTIONS[item?.id] || BLUE_ARCHITECT_DESCRIPTIONS[slug(item?.name)];
  if (known) return known;
  return blueArchitectFallback(item);
}

function blueArchitectFallback(item = {}) {
  const name = item.name || 'this node';
  const role = item.role || 'a local Hapa capability';
  const layers = normalizeLayers(item.layers).join(', ') || 'data';
  return `I read ${name} as ${role}. It participates in the ${layers} layer of the Hapa system, which means it should be visible as both a capability and a responsibility. I would give it a fuller voice once its source files, routes, and outputs have been inspected, because every node deserves a description that can be spoken back to the operator.`;
}

function updateStats(source) {
  nodeCount.textContent = String(graphNodes.length);
  edgeCount.textContent = String(graphEdges.length);
  if (shipCount) shipCount.textContent = String(shipAssetPayload.count || shipAssignments.size || 0);
  sourceReadout.textContent = source;
}

function bindControls() {
  document.querySelectorAll('input[name="layer"]').forEach(input => {
    input.addEventListener('change', () => {
      playTone('toggle');
      activeLayers = new Set(Array.from(document.querySelectorAll('input[name="layer"]:checked')).map(item => item.value));
      buildEdges();
      applyFilters();
    });
  });
  nodeSearch.addEventListener('input', event => {
    searchTerm = event.target.value;
    applyFilters();
  });
  focusSelect.addEventListener('change', event => {
    playTone('select');
    focusGroup = event.target.value;
    applyFilters();
  });
  labelSelect.addEventListener('change', event => {
    playTone('select');
    labelMode = event.target.value;
    applyFilters();
  });
  formationButtons.forEach(button => {
    button.addEventListener('click', () => {
      playTone('select');
      applyFormation(button.dataset.formation, true);
      resetScenarioPlayback(true);
      applyFilters();
    });
  });
  backgroundButtons.forEach(button => {
    button.addEventListener('click', () => setBackgroundMode(button.dataset.background));
  });
  backgroundSelect?.addEventListener('change', event => setBackgroundMode(event.target.value));
  layoutSelect.addEventListener('change', event => {
    playTone('select');
    applyFormation(event.target.value, true);
    resetScenarioPlayback(true);
    applyFilters();
  });
  document.querySelector('#resetCamera').addEventListener('click', () => {
    playTone('click');
    resetCamera();
  });
  document.querySelector('#resetData').addEventListener('click', () => {
    playTone('reset');
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    LEGACY_STORAGE_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch {}
    });
    setGraphData(SEED_NODES, SEED_EDGES, 'SEED');
  });
  document.querySelector('#openImport').addEventListener('click', () => {
    playTone('open');
    document.querySelector('#sheetDialog').showModal();
  });
  document.querySelector('#closeImport').addEventListener('click', () => {
    playTone('close');
    document.querySelector('#sheetDialog').close();
  });
  document.querySelector('#loadVisibleSeed').addEventListener('click', () => {
    playTone('click');
    document.querySelector('#sheetText').value = VISIBLE_SHEET_TEXT;
    document.querySelector('#importStatus').textContent = 'Visible spreadsheet rows loaded into the parser.';
  });
  document.querySelector('#importSheet').addEventListener('click', () => {
    playTone('launch');
    importSheetText();
  });
  document.querySelector('#sheetFile').addEventListener('change', readSheetFile);
  inspector.previewButton.addEventListener('click', () => {
    playTone('open');
    openSelectedPreview();
  });
  inspector.infographicButton.addEventListener('click', () => {
    playTone('open');
    openPreviewAsset(
      inspector.infographicButton.dataset.previewTitle || 'Node infographic',
      inspector.infographicButton.dataset.previewSrc || '',
      inspector.infographicImage.alt || 'Generated node infographic',
    );
  });
  inspector.shipMockButton.addEventListener('click', () => {
    playTone('open');
    openPreviewAsset(
      inspector.shipMockButton.dataset.previewTitle || 'Ship mock',
      inspector.shipMockButton.dataset.previewSrc || '',
      inspector.shipMockImage.alt || 'Generated ship mock',
    );
  });
  inspector.closePreview.addEventListener('click', () => {
    playTone('close');
    inspector.previewDialog.close();
  });
  inspector.previewDialog.addEventListener('click', event => {
    if (event.target === inspector.previewDialog) {
      playTone('close');
      inspector.previewDialog.close();
    }
  });
  populateScenarioControls();
  setScenarioPanelOpen(true, false);
  renderScenarioPanel();
  setBackgroundMode(backgroundMode, false);
  setArmadaMode(armadaMode, false);
  setRailOpen('control', controlRailOpen, false);
  setRailOpen('inspector', inspectorRailOpen, false);
  updateSfxButton();
  updateCinematicToggle();
  bindSfxInteractions();
  bindScenarioVoiceoverEvents();
  loadScenarioVoiceovers(currentScenario());
  armadaControls.toggle?.addEventListener('click', () => setArmadaMode(!armadaMode));
  railControls.controlToggle.addEventListener('click', () => setRailOpen('control', !controlRailOpen));
  railControls.inspectorToggle.addEventListener('click', () => setRailOpen('inspector', !inspectorRailOpen));
  scenarioControls.sfx.addEventListener('click', toggleSfx);
  scenarioControls.cinematic.addEventListener('change', event => setCinematicMode(event.target.checked));
  scenarioControls.select.addEventListener('change', event => activateScenario(event.target.value));
  scenarioControls.cardMenu.addEventListener('click', event => {
    const button = event.target.closest?.('[data-scenario-id]');
    if (!button) return;
    activateScenario(button.dataset.scenarioId);
  });
  scenarioControls.cardMenu.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    const button = event.target.closest?.('[data-scenario-id]');
    if (!button) return;
    event.preventDefault();
    activateScenario(button.dataset.scenarioId);
  });
  scenarioControls.play.addEventListener('click', () => playScenario());
  scenarioControls.pause.addEventListener('click', () => pauseScenario());
  scenarioControls.reset.addEventListener('click', () => {
    playTone('reset');
    resetScenarioPlayback(true);
  });
  scenarioControls.promptPlay.addEventListener('click', () => {
    const steps = availableScenarioSteps();
    if (scenarioRunning) {
      pauseScenario();
      return;
    }
    if (scenarioStepIndex >= steps.length && steps.length) resetScenarioPlayback(false);
    playScenario();
  });
  scenarioControls.flowActionButton.addEventListener('click', () => {
    const scenario = currentScenario();
    const card = flowCardFor(scenario);
    playTone('open');
    openPreviewAsset(
      `${scenario.name} action image`,
      flowActionImageFor(scenario, card),
      `${scenario.name} action image`,
    );
  });
  bindMusicControls();
  setMusicMode(musicMode, false);
  setMusicCollapsed(musicMode ? true : musicCollapsed, false);
  bindDesktopBridge();
  loadMusicLibrary();
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('resize', resize);
}

let pointerDown = null;
let pendingHoverPoint = null;
let hoverFrame = 0;

function onPointerDown(event) {
  pointerDown = { x: event.clientX, y: event.clientY };
}

function onPointerMove(event) {
  pendingHoverPoint = { x: event.clientX, y: event.clientY };
  if (hoverFrame) return;
  hoverFrame = requestAnimationFrame(() => {
    hoverFrame = 0;
    if (!pendingHoverPoint) return;
    const { x, y } = pendingHoverPoint;
    pendingHoverPoint = null;
    const hit = pickNodeFromClient(x, y);
    setHoveredNode(hit?.object?.userData?.nodeId || '');
  });
}

function onPointerUp(event) {
  if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 8) return;
  const hit = pickNodeFromPointer(event);
  pointerDown = null;
  if (hit?.object?.userData?.nodeId) selectNode(hit.object.userData.nodeId);
}

function pickNodeFromPointer(event) {
  return pickNodeFromClient(event.clientX, event.clientY);
}

function pickNodeFromClient(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  return hits.find(hit => {
    const id = hit.object?.userData?.nodeId;
    return id && nodeObjects.get(id)?.group.visible;
  }) || null;
}

function onPointerLeave() {
  pendingHoverPoint = null;
  if (hoverFrame) {
    cancelAnimationFrame(hoverFrame);
    hoverFrame = 0;
  }
  setHoveredNode('');
}

function setHoveredNode(id) {
  if (hoveredNodeId === id) return;
  hoveredNodeId = id;
  nodeObjects.forEach((object, nodeId) => {
    setDatasetFlag(object.label, 'hovered', nodeId === hoveredNodeId);
  });
  applyScenarioHighlights();
  if (armadaMode) ensureArmadaModelsLoaded();
}

function resetCamera() {
  applyFormationCamera(layoutMode);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(effectiveRenderPixelRatio());
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
}

function importSheetText() {
  const text = document.querySelector('#sheetText').value.trim();
  if (!text) {
    document.querySelector('#importStatus').textContent = 'Paste rows or choose a CSV/TSV file first.';
    return;
  }
  const parsed = parseSheet(text);
  if (!parsed.nodes.length) {
    document.querySelector('#importStatus').textContent = 'No node rows found.';
    return;
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch {}
  setGraphData(parsed.nodes, parsed.edges, 'SHEET');
  document.querySelector('#importStatus').textContent = `${parsed.nodes.length} nodes plotted from sheet text.`;
  document.querySelector('#sheetDialog').close();
}

function readSheetFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  playTone('select');
  const reader = new FileReader();
  reader.onload = () => {
    document.querySelector('#sheetText').value = String(reader.result || '');
    document.querySelector('#importStatus').textContent = `${file.name} loaded.`;
  };
  reader.readAsText(file);
}

function readStoredSfxMuted() {
  try {
    return localStorage.getItem(SFX_MUTED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function readStoredCinematicMode() {
  try {
    const raw = localStorage.getItem(CINEMATIC_STORAGE_KEY);
    return raw == null ? true : raw !== 'false';
  } catch {
    return true;
  }
}

function readStoredMusicMode() {
  try {
    return localStorage.getItem(MUSIC_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function readStoredMusicCollapsed() {
  try {
    return localStorage.getItem(MUSIC_COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function readStoredArmadaMode() {
  try {
    return localStorage.getItem(ARMADA_MODE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function readStoredRailOpen(key, fallback = true) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : raw !== 'false';
  } catch {
    return fallback;
  }
}

function readInitialRailOpen(key, fallback = true) {
  if (compactViewport.matches) return false;
  return readStoredRailOpen(key, fallback);
}

function readStoredBackgroundMode() {
  try {
    const raw = localStorage.getItem(BACKGROUND_MODE_STORAGE_KEY);
    return BACKGROUND_MODES.includes(raw) ? raw : 'grid';
  } catch {
    return 'grid';
  }
}

function setCinematicMode(enabled) {
  cinematicMode = Boolean(enabled);
  try { localStorage.setItem(CINEMATIC_STORAGE_KEY, String(cinematicMode)); } catch {}
  updateCinematicToggle();
  if (!cinematicMode) startCinematicReturn();
  applyFilters();
  playTone('toggle');
}

function updateCinematicToggle() {
  if (!scenarioControls.cinematic) return;
  scenarioControls.cinematic.checked = cinematicMode;
  scenarioControls.panel.dataset.cinematic = String(cinematicMode);
}

function bindSfxInteractions() {
  document.addEventListener('pointerenter', event => {
    if (!audioState.context) return;
    if (!event.target?.closest?.('button, a, select, input, .node-label')) return;
    const now = performance.now();
    if (now - audioState.lastHoverAt < 120) return;
    audioState.lastHoverAt = now;
    playTone('hover');
  }, true);
}

function toggleSfx() {
  if (audioState.muted) {
    setSfxMuted(false);
    playTone('enable');
  } else {
    playTone('disable');
    setSfxMuted(true);
  }
}

function setSfxMuted(muted) {
  audioState.muted = Boolean(muted);
  try { localStorage.setItem(SFX_MUTED_STORAGE_KEY, String(audioState.muted)); } catch {}
  updateSfxButton();
}

function updateSfxButton() {
  scenarioControls.sfx.textContent = audioState.muted ? 'SFX Off' : 'SFX On';
  scenarioControls.sfx.setAttribute('aria-pressed', String(!audioState.muted));
  scenarioControls.sfx.dataset.active = String(!audioState.muted);
}

function ensureAudioContext() {
  if (audioState.muted) return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioState.context) audioState.context = new AudioContextClass();
  if (audioState.context.state === 'suspended') audioState.context.resume?.();
  return audioState.context;
}

function playTone(kind = 'click') {
  if (audioState.muted) return;
  const context = ensureAudioContext();
  if (!context) return;
  const presets = {
    hover: { type: 'sine', freqs: [740], duration: 0.045, gap: 0, volume: 0.014 },
    click: { type: 'triangle', freqs: [420], duration: 0.06, gap: 0, volume: 0.022 },
    select: { type: 'sine', freqs: [520, 780], duration: 0.07, gap: 0.035, volume: 0.02 },
    toggle: { type: 'square', freqs: [320, 480], duration: 0.055, gap: 0.04, volume: 0.016 },
    open: { type: 'sine', freqs: [360, 540, 720], duration: 0.075, gap: 0.035, volume: 0.02 },
    close: { type: 'sine', freqs: [620, 420], duration: 0.08, gap: 0.04, volume: 0.018 },
    launch: { type: 'sawtooth', freqs: [220, 330, 660], duration: 0.09, gap: 0.045, volume: 0.018 },
    packet: { type: 'sine', freqs: [880], duration: 0.08, gap: 0, volume: 0.018 },
    complete: { type: 'triangle', freqs: [523, 659, 784], duration: 0.12, gap: 0.055, volume: 0.022 },
    reset: { type: 'triangle', freqs: [240, 180], duration: 0.08, gap: 0.04, volume: 0.018 },
    pause: { type: 'sine', freqs: [420, 315], duration: 0.075, gap: 0.035, volume: 0.018 },
    enable: { type: 'sine', freqs: [440, 660, 880], duration: 0.09, gap: 0.04, volume: 0.02 },
    disable: { type: 'sine', freqs: [520, 260], duration: 0.075, gap: 0.04, volume: 0.016 },
  };
  const preset = presets[kind] || presets.click;
  preset.freqs.forEach((frequency, index) => {
    const start = context.currentTime + index * preset.gap;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = preset.type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(preset.volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + preset.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + preset.duration + 0.03);
  });
}

function bindMusicControls() {
  if (!musicControls.widget) return;
  musicControls.topToggle?.addEventListener('click', () => setMusicMode(!musicMode));
  musicControls.mode?.addEventListener('click', () => setMusicMode(!musicMode));
  musicControls.collapse?.addEventListener('click', () => setMusicCollapsed(!musicCollapsed));
  musicControls.play?.addEventListener('click', () => toggleMusicPlayback());
  musicControls.prev?.addEventListener('click', () => selectAdjacentTrack(-1, !musicControls.audio.paused));
  musicControls.next?.addEventListener('click', () => selectAdjacentTrack(1, !musicControls.audio.paused));
  musicControls.select?.addEventListener('change', event => {
    playTone('select');
    selectTrack(Number(event.target.value), !musicControls.audio.paused);
  });
  musicControls.audio?.addEventListener('loadedmetadata', renderMusicStatus);
  musicControls.audio?.addEventListener('timeupdate', renderMusicStatus);
  musicControls.audio?.addEventListener('play', renderMusicStatus);
  musicControls.audio?.addEventListener('pause', renderMusicStatus);
  musicControls.audio?.addEventListener('ended', () => selectAdjacentTrack(1, true));
}

async function loadMusicLibrary() {
  if (!musicControls.widget) return;
  if (desktopBridge?.getMusicLibrary) {
    try {
      const payload = await desktopBridge.getMusicLibrary();
      musicLibrary = Array.isArray(payload.tracks) ? payload.tracks : [];
      if (musicLibrary.length) {
        musicState.loaded = true;
        renderMusicLibrary(payload);
        selectTrack(0, false);
        return;
      }
    } catch (error) {
      console.warn('[NodeSpace] Desktop music bridge unavailable', error);
    }
  }
  try {
    const response = await fetch(MUSIC_LIBRARY_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    musicLibrary = Array.isArray(payload.tracks) ? payload.tracks : [];
    musicState.loaded = true;
    renderMusicLibrary(payload);
    selectTrack(0, false);
  } catch (error) {
    musicControls.title.textContent = 'Music library unavailable';
    musicControls.meta.textContent = `Could not load ${MUSIC_LIBRARY_URL}: ${error.message}`;
    musicControls.play.disabled = true;
    musicControls.select.disabled = true;
  }
}

function renderMusicLibrary(payload = {}) {
  musicControls.select.innerHTML = musicLibrary
    .map((track, index) => `<option value="${index}">${escapeHtml(track.title || `Track ${index + 1}`)}</option>`)
    .join('');
  const sourceLabel = payload.source === 'hapa-song-registry' ? 'registry songs' : 'local songs';
  musicControls.meta.dataset.librarySummary = `${payload.libraryCount || musicLibrary.length} ${sourceLabel} / ${payload.playableCount || musicLibrary.length} playable`;
}

function bindDesktopBridge() {
  if (!desktopControls.panel) return;
  if (!desktopBridge) {
    desktopControls.panel.hidden = true;
    return;
  }

  desktopControls.panel.hidden = false;
  desktopControls.status.textContent = 'Online';
  desktopControls.refresh?.addEventListener('click', () => refreshDesktopBridge(true));
  desktopControls.checkServices?.addEventListener('click', () => checkDesktopServices());
  desktopControls.openWiki?.addEventListener('click', () => openDesktopRoot('wiki'));
  desktopControls.openSongs?.addEventListener('click', () => openDesktopRoot('songLibrary'));
  desktopControls.openDevProto?.addEventListener('click', () => openDesktopRoot('devProto'));
  desktopControls.openAssetViewer?.addEventListener('click', () => openDesktopRoot('assetViewerWorkspace'));
  desktopControls.openFlow?.addEventListener('click', () => openFlowExplainerDialog(false));
  desktopControls.close?.addEventListener('click', () => desktopControls.dialog?.close());
  desktopControls.prefill?.addEventListener('click', () => prefillFlowExplainerFromScenario());
  desktopControls.save?.addEventListener('click', () => saveFlowExplainer());
  refreshDesktopBridge(false);
}

async function refreshDesktopBridge(withSound = true) {
  if (!desktopBridge?.getContext) return;
  desktopControls.status.textContent = 'Syncing';
  desktopControls.log.textContent = 'Scanning local wiki, songs, nodes, and protocol roots...';
  try {
    desktopContext = await desktopBridge.getContext();
    desktopControls.status.textContent = 'Online';
    desktopControls.wikiCount.textContent = formatCompactNumber(desktopContext.wiki?.count || 0);
    desktopControls.songCount.textContent = formatCompactNumber(desktopContext.music?.libraryCount || 0);
    desktopControls.nodeCount.textContent = formatCompactNumber(desktopContext.nodes?.count || 0);
    desktopControls.shipCount.textContent = formatCompactNumber(desktopContext.ships?.count || 0);
    if (desktopBridge?.getShipAssets) {
      const shipPayload = await desktopBridge.getShipAssets();
      desktopControls.shipCount.textContent = formatCompactNumber(shipPayload.count || 0);
      applyShipAssetPayload(shipPayload);
    } else if (desktopContext.ships) {
      applyShipAssetPayload(desktopContext.ships);
    }
    (desktopContext.flows || []).forEach(flow => registerDesktopFlow(flow, false));
    const providerRows = desktopContext.providerCosts?.counts?.rows || 0;
    desktopControls.log.textContent = `${desktopContext.music?.playableCount || 0} playable tracks, ${desktopContext.wiki?.sections?.length || 0} wiki sections, ${desktopContext.nodes?.rows?.filter(row => row.exists).length || 0} local node repos, ${shipAssetPayload.count || 0} Asset Viewer ships, ${providerRows} provider cost rows, ${(desktopContext.flows || []).length} saved flows.`;
    sourceReadout.textContent = 'LOCAL';
    if (withSound) playTone('select');
  } catch (error) {
    desktopControls.status.textContent = 'Error';
    desktopControls.log.textContent = `Desktop bridge scan failed: ${error.message}`;
    if (withSound) playTone('error');
  }
}

async function checkDesktopServices() {
  if (!desktopBridge?.checkServices) return;
  desktopControls.log.textContent = 'Pinging local Hapa endpoints...';
  try {
    const result = await desktopBridge.checkServices();
    const online = result.endpoints.filter(endpoint => endpoint.online);
    desktopControls.log.textContent = `${online.length}/${result.endpoints.length} local endpoints responded: ${online.map(endpoint => endpoint.name).join(', ') || 'none online'}.`;
    playTone(online.length ? 'select' : 'error');
  } catch (error) {
    desktopControls.log.textContent = `Node ping failed: ${error.message}`;
    playTone('error');
  }
}

async function openDesktopRoot(key) {
  const targetPath = desktopContext?.roots?.[key];
  if (!targetPath || !desktopBridge?.openPath) return;
  try {
    await desktopBridge.openPath(targetPath);
    playTone('open');
  } catch (error) {
    desktopControls.log.textContent = `Could not open ${key}: ${error.message}`;
    playTone('error');
  }
}

function openFlowExplainerDialog(prefill = false) {
  if (!desktopControls.dialog) return;
  if (prefill) prefillFlowExplainerFromScenario();
  else if (!desktopControls.name.value) desktopControls.name.value = currentScenario()?.name || '';
  desktopControls.statusLine.textContent = 'Writes to the wiki and protocol sidecar store.';
  desktopControls.dialog.showModal();
  playTone('open');
}

function prefillFlowExplainerFromScenario() {
  const scenario = currentScenario();
  const card = flowCardFor(scenario);
  const steps = scenario.steps || [];
  desktopControls.name.value = scenario.name || '';
  desktopControls.verb.value = card.verb || '';
  desktopControls.objective.value = scenario.summary || card.description || '';
  desktopControls.nodes.value = unique(steps.flatMap(step => [nodeName(step.source), nodeName(step.target)])).join(', ');
  desktopControls.steps.value = steps
    .map(step => `${nodeName(step.source)} -> ${nodeName(step.target)} [${step.layer}]: ${step.label}`)
    .join('\n');
  desktopControls.explainer.value = steps
    .map((step, index) => {
      const explanation = step.explanation || flowStepExplanation(step.source, step.target, step.layer, step.label);
      return `Step ${index + 1}: ${nodeName(step.source)} to ${nodeName(step.target)}\n${explanation.join('\n\n')}`;
    })
    .join('\n\n');
  desktopControls.cardHooks.value = `Effect: ${card.effect}\nRisk: ${card.risk}`;
  desktopControls.productionNotes.value = flowActionImagePrompt(scenario, card);
  desktopControls.statusLine.textContent = `Loaded selected flow: ${scenario.name}`;
  playTone('select');
}

async function saveFlowExplainer() {
  if (!desktopBridge?.createFlowExplainer) return;
  const payload = {
    name: desktopControls.name.value,
    verb: desktopControls.verb.value,
    objective: desktopControls.objective.value,
    nodesText: desktopControls.nodes.value,
    stepsText: desktopControls.steps.value,
    explainer: desktopControls.explainer.value,
    cardHooks: desktopControls.cardHooks.value,
    productionNotes: desktopControls.productionNotes.value,
  };
  if (!payload.name.trim() || !payload.stepsText.trim()) {
    desktopControls.statusLine.textContent = 'Flow name and route script are required.';
    playTone('error');
    return;
  }

  desktopControls.statusLine.textContent = 'Saving flow protocol...';
  try {
    const result = await desktopBridge.createFlowExplainer(payload);
    registerDesktopFlow(result.flow);
    desktopControls.statusLine.textContent = `Saved ${result.flow.name}`;
    desktopControls.log.textContent = `Flow protocol saved to ${result.wikiPath}`;
    await refreshDesktopBridge(false);
    playTone('select');
  } catch (error) {
    desktopControls.statusLine.textContent = `Save failed: ${error.message}`;
    playTone('error');
  }
}

function registerDesktopFlow(flowPayload, shouldActivate = true) {
  const scenario = normalizeDesktopScenario(flowPayload);
  const existingIndex = FLOW_SCENARIOS.findIndex(scenarioItem => scenarioItem.id === scenario.id);
  if (existingIndex >= 0) FLOW_SCENARIOS[existingIndex] = scenario;
  else FLOW_SCENARIOS.push(scenario);
  if (flowPayload.card) {
    FLOW_CARD_SPECS[scenario.id] = flowCardSpec(
      flowPayload.card.verb || 'ROUTE',
      flowPayload.card.type || 'Protocol Skill',
      flowPayload.card.rank || 'Draft',
      flowPayload.card.grade || 'B',
      flowPayload.card.description || scenario.summary,
      flowPayload.card.effect || 'Trace the route and produce a reusable protocol record.',
      flowPayload.card.risk || 'Unmapped responsibility can hide failure states.',
      flowPayload.card.stats || {},
    );
  }
  populateScenarioControls();
  if (shouldActivate) activateScenario(scenario.id, false);
}

function normalizeDesktopScenario(flowPayload = {}) {
  const steps = (flowPayload.steps || []).map(step => {
    const explanation = step.explanation || flowStepExplanation(step.source, step.target, step.layer, step.label);
    return {
      source: step.source,
      target: step.target,
      layer: step.layer || 'DATA',
      label: step.label || 'Flow handoff.',
      explanation,
      duration: step.duration || durationForStepExplanation(explanation),
    };
  });
  return {
    id: flowPayload.id || slug(flowPayload.name || 'desktop-flow'),
    name: flowPayload.name || 'Desktop Flow',
    summary: flowPayload.summary || 'A local Hapa desktop flow.',
    color: flowPayload.color || GROUP_COLORS.core,
    voiceoverManifestUrl: flowPayload.voiceoverManifestUrl || flowPayload.voiceover_manifest_url || null,
    steps,
  };
}

function scenarioVoiceoverQueuePayload(scenario = currentScenario()) {
  const steps = (scenario?.steps || []).map((step, index) => ({
    step_key: scenarioStepKey(step, index),
    source: step.source,
    target: step.target,
    layer: step.layer,
    label: step.label,
    explanation: step.explanation || flowStepExplanation(step.source, step.target, step.layer, step.label),
    duration: step.duration || durationForStepExplanation(step.explanation),
  }));
  return {
    flow_id: scenario?.id,
    flow_name: scenario?.name,
    summary: scenario?.summary,
    mode: 'drama',
    tts_engine: 'dramabox',
    steps,
  };
}

window.hapaNodeSpaceVoiceovers = {
  current: () => scenarioVoiceoverQueuePayload(currentScenario()),
  all: () => FLOW_SCENARIOS.map(scenario => scenarioVoiceoverQueuePayload(scenario)),
  refresh: () => loadScenarioVoiceovers(currentScenario(), true),
};

function selectAdjacentTrack(direction, autoplay = false) {
  if (!musicLibrary.length) return;
  const nextIndex = (activeTrackIndex + direction + musicLibrary.length) % musicLibrary.length;
  selectTrack(nextIndex, autoplay);
}

async function selectTrack(index, autoplay = false) {
  if (!musicLibrary.length) return;
  activeTrackIndex = Math.max(0, Math.min(musicLibrary.length - 1, Number.isFinite(index) ? index : 0));
  const track = currentMusicTrack();
  musicControls.select.value = String(activeTrackIndex);
  musicControls.audio.src = track.src;
  musicControls.audio.load();
  setMusicAccent(track);
  renderMusicStatus();
  if (musicMode) selectNode('hapa-song-registry');
  if (autoplay) await playMusic();
}

function currentMusicTrack() {
  return musicLibrary[activeTrackIndex] || null;
}

async function toggleMusicPlayback() {
  if (musicControls.audio.paused) await playMusic();
  else {
    musicControls.audio.pause();
    playTone('pause');
  }
}

async function playMusic() {
  const track = currentMusicTrack();
  if (!track) return;
  try {
    ensureMusicAudioGraph();
    await musicControls.audio.play();
    playTone('launch');
    if (!musicMode) setMusicMode(true, false);
  } catch (error) {
    musicControls.meta.textContent = `Playback blocked: ${error.message}`;
  }
}

function ensureMusicAudioGraph() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!musicState.context) musicState.context = new AudioContextClass();
  if (!musicState.analyser) {
    musicState.analyser = musicState.context.createAnalyser();
    musicState.analyser.fftSize = 256;
    musicState.analyser.smoothingTimeConstant = 0.72;
    musicState.frequencyData = new Uint8Array(musicState.analyser.frequencyBinCount);
  }
  if (!musicState.source) {
    musicState.source = musicState.context.createMediaElementSource(musicControls.audio);
    musicState.source.connect(musicState.analyser);
    musicState.analyser.connect(musicState.context.destination);
  }
  if (musicState.context.state === 'suspended') musicState.context.resume?.();
  return musicState.context;
}

function setMusicMode(enabled, withSound = true) {
  musicMode = Boolean(enabled);
  document.body.dataset.musicMode = String(musicMode);
  musicVisualizerGroup.visible = musicMode;
  musicControls.topToggle?.setAttribute('aria-pressed', String(musicMode));
  musicControls.mode?.setAttribute('aria-pressed', String(musicMode));
  musicControls.mode.textContent = musicMode ? 'Exit' : 'Mode';
  if (musicMode) {
    document.querySelector('.scene-shell')?.setAttribute('data-music-active', 'true');
    setMusicCollapsed(true, false);
    selectNode('hapa-song-registry');
  } else {
    document.querySelector('.scene-shell')?.removeAttribute('data-music-active');
    restoreMusicNodeTransforms();
    musicPulseLight.intensity = 0;
    applyFilters();
    if (!isCinematicPlaybackActive()) applyFormationCamera(layoutMode);
  }
  try { localStorage.setItem(MUSIC_MODE_STORAGE_KEY, String(musicMode)); } catch {}
  if (withSound) playTone(musicMode ? 'open' : 'close');
}

function setMusicCollapsed(collapsed, withSound = true) {
  musicCollapsed = Boolean(collapsed);
  musicControls.widget.dataset.collapsed = String(musicCollapsed);
  musicControls.collapse?.setAttribute('aria-expanded', String(!musicCollapsed));
  if (musicControls.collapse) {
    musicControls.collapse.textContent = musicCollapsed ? 'Expand' : 'Min';
    musicControls.collapse.setAttribute('aria-label', musicCollapsed ? 'Expand music player' : 'Collapse music player');
  }
  try { localStorage.setItem(MUSIC_COLLAPSED_STORAGE_KEY, String(musicCollapsed)); } catch {}
  if (withSound) playTone(musicCollapsed ? 'close' : 'open');
}

function setMusicAccent(track = currentMusicTrack()) {
  const accent = track?.accent || '#5eead4';
  musicState.accent = accent;
  document.documentElement.style.setProperty('--music-accent', accent);
  const color = new THREE.Color(accent);
  musicPulseLight.color.copy(color);
}

function renderMusicStatus() {
  const track = currentMusicTrack();
  const audio = musicControls.audio;
  if (!track) return;
  const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : track.duration || 0;
  const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  const progress = duration ? Math.min(1, current / duration) : 0;
  musicControls.title.textContent = track.title || 'Untitled Hapa song';
  musicControls.meta.textContent = [
    track.theme,
    track.model,
    track.energy,
    musicControls.meta.dataset.librarySummary,
  ].filter(Boolean).join(' / ');
  musicControls.play.textContent = audio.paused ? 'Play' : 'Pause';
  musicControls.play.setAttribute('aria-label', audio.paused ? 'Play selected track' : 'Pause selected track');
  musicControls.widget.dataset.playing = String(!audio.paused);
  musicControls.progress.style.width = `${Math.round(progress * 100)}%`;
  musicControls.time.textContent = `${formatClock(current)} / ${formatClock(duration)}`;
}

function formatClock(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatCompactNumber(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}m`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}k`;
  return String(number);
}

function formatMegabytes(bytes) {
  const value = Number(bytes) || 0;
  if (!value) return '0 MB';
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function analyzeMusicSignal() {
  if (!musicState.analyser || !musicState.frequencyData || musicControls.audio.paused) {
    musicState.bass *= MUSIC_SIGNAL_DECAY;
    musicState.mid *= MUSIC_SIGNAL_DECAY;
    musicState.treble *= MUSIC_SIGNAL_DECAY;
    musicState.energy *= MUSIC_SIGNAL_DECAY;
    musicState.beat *= MUSIC_SIGNAL_DECAY;
    return;
  }
  musicState.analyser.getByteFrequencyData(musicState.frequencyData);
  const data = musicState.frequencyData;
  const bandAverage = (start, end) => {
    const from = Math.max(0, Math.floor(start));
    const to = Math.min(data.length, Math.max(from + 1, Math.floor(end)));
    let total = 0;
    for (let index = from; index < to; index += 1) total += data[index];
    return total / ((to - from) * 255);
  };
  const nextBass = bandAverage(1, 9);
  const nextMid = bandAverage(9, 34);
  const nextTreble = bandAverage(34, data.length);
  const nextEnergy = (nextBass * 0.45) + (nextMid * 0.35) + (nextTreble * 0.2);
  const now = performance.now();
  const transient = Math.max(0, nextEnergy - musicState.energy);
  musicState.bass = (musicState.bass * 0.64) + (nextBass * 0.36);
  musicState.mid = (musicState.mid * 0.66) + (nextMid * 0.34);
  musicState.treble = (musicState.treble * 0.68) + (nextTreble * 0.32);
  musicState.energy = (musicState.energy * 0.7) + (nextEnergy * 0.3);
  if (transient > 0.09 && now - musicState.lastBeatAt > 180) {
    musicState.beat = Math.min(1, transient * 4.8);
    musicState.lastBeatAt = now;
  } else {
    musicState.beat *= 0.9;
  }
}

function renderMusicTelemetry() {
  musicControls.bass.textContent = String(Math.round(musicState.bass * 99)).padStart(2, '0');
  musicControls.mid.textContent = String(Math.round(musicState.mid * 99)).padStart(2, '0');
  musicControls.treble.textContent = String(Math.round(musicState.treble * 99)).padStart(2, '0');
  renderMusicStatus();
}

function bindScenarioVoiceoverEvents() {
  const audio = scenarioControls.voiceAudio;
  if (!audio) return;
  audio.crossOrigin = 'anonymous';
  audio.addEventListener('loadedmetadata', renderScenarioVoiceoverStatus);
  audio.addEventListener('timeupdate', renderScenarioVoiceoverStatus);
  audio.addEventListener('play', () => setScenarioVoiceoverStatus('playing'));
  audio.addEventListener('pause', renderScenarioVoiceoverStatus);
  audio.addEventListener('ended', () => setScenarioVoiceoverStatus('ended'));
  audio.addEventListener('error', () => setScenarioVoiceoverStatus('error', 'Audio load failed'));
  renderScenarioVoiceoverWaveform();
}

function safeVoiceoverId(value, fallback = 'flow') {
  const cleaned = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, '-').replace(/^[-._]+|[-._]+$/g, '');
  return (cleaned || fallback).slice(0, 96);
}

function scenarioStepKey(step = {}, index = 0) {
  if (step.step_key || step.id) return safeVoiceoverId(step.step_key || step.id, `step-${String(index + 1).padStart(2, '0')}`);
  const source = safeVoiceoverId(step.source, 'source');
  const target = safeVoiceoverId(step.target, 'target');
  const layer = safeVoiceoverId(step.layer || 'DATA', 'data');
  return safeVoiceoverId(`step-${String(index + 1).padStart(2, '0')}-${source}-to-${target}-${layer}`, `step-${String(index + 1).padStart(2, '0')}`);
}

function scenarioVoiceoverManifestUrl(scenario = currentScenario()) {
  const explicit = scenario?.voiceoverManifestUrl || scenario?.voiceover_manifest_url;
  if (explicit) return explicit;
  return `${FLOW_VOICEOVER_BASE_URL}/v1/flow-voiceovers/${safeVoiceoverId(scenario?.id)}/manifest`;
}

async function loadScenarioVoiceovers(scenario = currentScenario(), force = false) {
  if (!scenario?.id || !scenarioControls.voiceover) return null;
  const flowId = safeVoiceoverId(scenario.id);
  if (!force && scenarioVoiceState.manifests.has(flowId)) {
    scenario.voiceoverManifest = scenarioVoiceState.manifests.get(flowId);
    renderScenarioVoiceoverStatus();
    return scenario.voiceoverManifest;
  }
  if (scenarioVoiceState.loading.has(flowId)) return null;
  scenarioVoiceState.loading.add(flowId);
  setScenarioVoiceoverStatus('syncing', 'Syncing queue');
  try {
    const response = await fetch(scenarioVoiceoverManifestUrl(scenario), { cache: 'no-store', mode: 'cors' });
    if (!response.ok) {
      setScenarioVoiceoverStatus(response.status === 404 ? 'missing' : 'error', response.status === 404 ? 'Queue missing' : `Queue HTTP ${response.status}`);
      return null;
    }
    const payload = await response.json();
    const manifest = payload.flow_voiceover || payload;
    scenarioVoiceState.manifests.set(flowId, manifest);
    scenario.voiceoverManifest = manifest;
    const ready = (manifest.items || []).filter(item => item.status === 'succeeded').length;
    setScenarioVoiceoverStatus(ready ? 'ready' : 'missing', ready ? `${ready}/${(manifest.items || []).length} ready` : 'Queue pending');
    if (ready && scenarioRunning && scenario.id === activeScenarioId && scenarioStepIndex >= 0) {
      const step = availableScenarioSteps(scenario)[scenarioStepIndex];
      if (step && !scenarioControls.voiceAudio?.src) playScenarioVoiceover(scenarioStepIndex, step, scenario);
    }
    return manifest;
  } catch (error) {
    setScenarioVoiceoverStatus('missing', 'Drama queue offline');
    return null;
  } finally {
    scenarioVoiceState.loading.delete(flowId);
    renderScenarioVoiceoverStatus();
  }
}

function scenarioVoiceoverForStep(scenario, step, index) {
  const manifest = scenario?.voiceoverManifest || scenarioVoiceState.manifests.get(safeVoiceoverId(scenario?.id));
  const items = Array.isArray(manifest?.items) ? manifest.items : [];
  if (!items.length) return null;
  const key = scenarioStepKey(step, index);
  return items.find(item => item.step_key === key)
    || items.find(item => Number(item.index) === index)
    || items.find(item => item.source === step.source && item.target === step.target && String(item.layer || '').toUpperCase() === String(step.layer || '').toUpperCase())
    || null;
}

function ensureScenarioVoiceAudioGraph() {
  const audio = scenarioControls.voiceAudio;
  if (!audio) return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!scenarioVoiceState.context) scenarioVoiceState.context = new AudioContextClass();
  if (!scenarioVoiceState.analyser) {
    scenarioVoiceState.analyser = scenarioVoiceState.context.createAnalyser();
    scenarioVoiceState.analyser.fftSize = 256;
    scenarioVoiceState.analyser.smoothingTimeConstant = 0.68;
    scenarioVoiceState.frequencyData = new Uint8Array(scenarioVoiceState.analyser.frequencyBinCount);
    scenarioVoiceState.timeData = new Uint8Array(scenarioVoiceState.analyser.fftSize);
  }
  if (!scenarioVoiceState.source) {
    scenarioVoiceState.source = scenarioVoiceState.context.createMediaElementSource(audio);
    scenarioVoiceState.source.connect(scenarioVoiceState.analyser);
    scenarioVoiceState.analyser.connect(scenarioVoiceState.context.destination);
  }
  if (scenarioVoiceState.context.state === 'suspended') scenarioVoiceState.context.resume?.();
  return scenarioVoiceState.context;
}

function playScenarioVoiceover(index, step, scenario = currentScenario()) {
  const audio = scenarioControls.voiceAudio;
  if (!audio) return;
  const voiceover = scenarioVoiceoverForStep(scenario, step, index);
  if (!voiceover?.audio_url || voiceover.status !== 'succeeded') {
    setScenarioVoiceoverStatus('missing', 'Voiceover missing');
    return;
  }
  const key = voiceover.step_key || scenarioStepKey(step, index);
  ensureScenarioVoiceAudioGraph();
  if (scenarioVoiceState.currentStepKey !== key || audio.src !== voiceover.audio_url) {
    audio.pause();
    audio.src = voiceover.audio_url;
    audio.currentTime = 0;
    scenarioVoiceState.currentStepKey = key;
    scenarioVoiceState.currentFlowId = safeVoiceoverId(scenario.id);
  }
  audio.play()
    .then(() => setScenarioVoiceoverStatus('playing'))
    .catch(error => setScenarioVoiceoverStatus('error', `Playback blocked: ${error.message}`));
}

function resumeScenarioVoiceover() {
  const scenario = currentScenario();
  const steps = availableScenarioSteps(scenario);
  const step = scenarioStepAtIndex(steps);
  const audio = scenarioControls.voiceAudio;
  if (!audio || !step) return;
  if (audio.src && audio.paused && scenarioVoiceState.currentStepKey === scenarioStepKey(step, scenarioStepIndex)) {
    ensureScenarioVoiceAudioGraph();
    audio.play().catch(error => setScenarioVoiceoverStatus('error', `Playback blocked: ${error.message}`));
  } else {
    playScenarioVoiceover(scenarioStepIndex, step, scenario);
  }
}

function pauseScenarioVoiceover() {
  scenarioControls.voiceAudio?.pause();
  renderScenarioVoiceoverStatus();
}

function stopScenarioVoiceover() {
  const audio = scenarioControls.voiceAudio;
  if (!audio) return;
  audio.pause();
  audio.removeAttribute('src');
  audio.load?.();
  scenarioVoiceState.currentStepKey = '';
  scenarioVoiceState.energy = 0;
  setScenarioVoiceoverStatus('idle', 'Queue idle');
}

function setScenarioVoiceoverStatus(status, label = '') {
  scenarioVoiceState.status = status;
  if (scenarioControls.voiceover) scenarioControls.voiceover.dataset.state = status;
  if (label && scenarioControls.voiceStatus) scenarioControls.voiceStatus.textContent = label;
  renderScenarioVoiceoverStatus();
}

function renderScenarioVoiceoverStatus() {
  const audio = scenarioControls.voiceAudio;
  if (!scenarioControls.voiceStatus || !audio) return;
  const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
  const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  if (!audio.src && scenarioVoiceState.status === 'idle') {
    scenarioControls.voiceStatus.textContent = 'Queue idle';
  } else if (scenarioVoiceState.status === 'playing') {
    scenarioControls.voiceStatus.textContent = 'Speaking';
  } else if (scenarioVoiceState.status === 'ended') {
    scenarioControls.voiceStatus.textContent = 'Step voice complete';
  }
  if (scenarioControls.voiceTime) scenarioControls.voiceTime.textContent = `${formatClock(current)} / ${formatClock(duration)}`;
  if (scenarioControls.voiceEnergy) scenarioControls.voiceEnergy.textContent = String(Math.round(scenarioVoiceState.energy * 99)).padStart(2, '0');
}

function analyzeScenarioVoiceoverSignal() {
  const audio = scenarioControls.voiceAudio;
  if (!scenarioVoiceState.analyser || !scenarioVoiceState.frequencyData || !audio || audio.paused) {
    scenarioVoiceState.energy *= SCENARIO_VOICE_SIGNAL_DECAY;
    return;
  }
  scenarioVoiceState.analyser.getByteFrequencyData(scenarioVoiceState.frequencyData);
  let total = 0;
  for (const sample of scenarioVoiceState.frequencyData) total += sample;
  const nextEnergy = total / (scenarioVoiceState.frequencyData.length * 255);
  scenarioVoiceState.energy = (scenarioVoiceState.energy * 0.64) + (nextEnergy * 0.36);
}

function renderScenarioVoiceoverWaveform() {
  const canvas = scenarioControls.voiceWaveform;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(240, Math.floor(rect.width || canvas.width || 320));
  const height = Math.max(42, Math.floor(rect.height || canvas.height || 54));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(2, 6, 23, 0.36)';
  ctx.fillRect(0, 0, width, height);
  const data = scenarioVoiceState.frequencyData;
  const bars = 32;
  const gap = 3;
  const barWidth = Math.max(3, (width - gap * (bars - 1)) / bars);
  for (let index = 0; index < bars; index += 1) {
    const sample = data?.length ? data[Math.min(data.length - 1, Math.floor((index / bars) * data.length))] / 255 : scenarioVoiceState.energy;
    const pulse = 0.12 + sample * 0.78 + scenarioVoiceState.energy * 0.22;
    const barHeight = Math.max(4, pulse * (height - 12));
    const x = index * (barWidth + gap);
    const y = (height - barHeight) * 0.5;
    const hueColor = index % 3 === 0 ? '94, 234, 212' : index % 3 === 1 ? '251, 191, 36' : '244, 114, 182';
    ctx.fillStyle = `rgba(${hueColor}, ${0.34 + sample * 0.5})`;
    ctx.fillRect(x, y, barWidth, barHeight);
  }
}

function updateScenarioVoiceoverVisualization() {
  analyzeScenarioVoiceoverSignal();
  if (frameIndex % 2 === 0) {
    renderScenarioVoiceoverWaveform();
    renderScenarioVoiceoverStatus();
  }
}

function setBackgroundMode(mode = backgroundMode, withSound = true) {
  backgroundMode = BACKGROUND_MODES.includes(mode) ? mode : 'grid';
  document.body.dataset.background = backgroundMode;
  if (backgroundSelect && backgroundSelect.value !== backgroundMode) backgroundSelect.value = backgroundMode;
  if (backgroundReadout) backgroundReadout.textContent = BACKGROUND_LABELS[backgroundMode] || 'Grid';
  backgroundButtons.forEach(button => {
    const active = button.dataset.background === backgroundMode;
    button.setAttribute('aria-pressed', String(active));
    button.dataset.active = String(active);
  });

  const showStarDrift = backgroundMode === 'stars';
  const showAurora = backgroundMode === 'aurora';
  const showWarp = backgroundMode === 'warp';
  const showLattice = backgroundMode === 'lattice';
  const showCosmos = backgroundMode === 'cosmos';
  starDriftGroup.visible = showStarDrift;
  auroraGroup.visible = showAurora;
  warpGroup.visible = showWarp;
  latticeGroup.visible = showLattice;
  cosmosGroup.visible = showCosmos;
  grid.visible = !['stars', 'warp', 'blackhole'].includes(backgroundMode);
  grid.material.opacity = backgroundMode === 'lattice'
    ? 0.22
    : backgroundMode === 'aurora'
      ? 0.24
      : backgroundMode === 'cosmos'
        ? 0.16
        : 0.32;
  stars.material.opacity = backgroundMode === 'grid'
    ? 0.56
    : backgroundMode === 'stars'
      ? 0.84
      : backgroundMode === 'warp'
        ? 0.34
        : backgroundMode === 'blackhole'
          ? 0.22
          : backgroundMode === 'cosmos'
            ? 0.92
            : 0.5;
  if (blackHoleVideo) {
    const showBlackHole = backgroundMode === 'blackhole';
    blackHoleVideo.dataset.active = String(showBlackHole);
    if (showBlackHole) {
      blackHoleVideo.play?.().catch(() => {});
    } else {
      blackHoleVideo.pause?.();
    }
  }

  try { localStorage.setItem(BACKGROUND_MODE_STORAGE_KEY, backgroundMode); } catch {}
  if (withSound) playTone('select');
}

function setRailOpen(rail, open, withSound = true) {
  const isControl = rail === 'control';
  const nextOpen = Boolean(open);
  const panel = isControl ? railControls.control : railControls.inspector;
  const toggle = isControl ? railControls.controlToggle : railControls.inspectorToggle;
  const label = compactViewport.matches
    ? (isControl ? 'Ctrl' : 'Info')
    : (isControl ? 'Controls' : 'Details');
  const storageKey = isControl ? CONTROL_RAIL_STORAGE_KEY : INSPECTOR_RAIL_STORAGE_KEY;

  if (isControl) {
    controlRailOpen = nextOpen;
  } else {
    inspectorRailOpen = nextOpen;
  }

  if (panel) {
    panel.dataset.open = String(nextOpen);
    panel.setAttribute('aria-hidden', String(!nextOpen));
  }

  if (toggle) {
    toggle.textContent = nextOpen ? label : `${label} Off`;
    toggle.dataset.active = String(nextOpen);
    toggle.setAttribute('aria-expanded', String(nextOpen));
    toggle.setAttribute('aria-pressed', String(nextOpen));
  }

  if (withSound) {
    try {
      localStorage.setItem(storageKey, String(nextOpen));
    } catch {}
  }

  if (withSound) playTone(nextOpen ? 'open' : 'close');
}

function setScenarioPanelOpen(open, withSound = true) {
  scenarioPanelOpen = true;
  scenarioControls.panel.dataset.open = 'true';
  scenarioControls.panel.setAttribute('aria-hidden', 'false');
  updateScenarioButton();
  if (withSound && open) playTone('open');
}

function updateScenarioButton() {
  if (!railControls.controlToggle) return;
  railControls.controlToggle.dataset.running = String(scenarioRunning);
  railControls.controlToggle.title = scenarioRunning
    ? 'Toggle left controls and pinned flow rail. A flow is currently running.'
    : 'Toggle left controls and pinned flow rail.';
}

function activateScenario(id, withSound = true) {
  if (!FLOW_SCENARIOS.some(scenario => scenario.id === id)) return;
  if (withSound) playTone('select');
  activeScenarioId = id;
  resetScenarioPlayback(true);
  loadScenarioVoiceovers(currentScenario(), true);
}

function populateScenarioControls() {
  scenarioControls.select.innerHTML = FLOW_SCENARIOS
    .map(scenario => `<option value="${escapeAttribute(scenario.id)}">${escapeHtml(scenario.name)}</option>`)
    .join('');
  scenarioControls.select.value = activeScenarioId;
  renderScenarioCardMenu();
  renderScenarioPanel();
}

function renderScenarioCardMenu() {
  scenarioControls.cardMenu.innerHTML = FLOW_SCENARIOS.map(scenario => {
    const card = flowCardFor(scenario);
    const selected = scenario.id === activeScenarioId;
    return `
      <button class="scenario-card-option" type="button" data-scenario-id="${escapeAttribute(scenario.id)}" role="option" aria-selected="${selected}" title="${escapeAttribute(flowActionImagePrompt(scenario, card))}">
        <img src="${flowActionImageFor(scenario, card)}" alt="${escapeAttribute(`${scenario.name} action thumbnail`)}" loading="lazy" />
        <span class="scenario-card-option-copy">
          <span class="scenario-card-option-top">
            <b>${escapeHtml(scenario.name)}</b>
            <small>${escapeHtml(card.grade)}</small>
          </span>
          <p>${escapeHtml(card.short)}</p>
        </span>
      </button>
    `;
  }).join('');
}

function currentScenario() {
  return FLOW_SCENARIOS.find(scenario => scenario.id === activeScenarioId) || FLOW_SCENARIOS[0];
}

function availableScenarioSteps(scenario = currentScenario()) {
  return (scenario?.steps || []).filter(step => nodeObjects.has(step.source) && nodeObjects.has(step.target));
}

function scenarioStepForDisplay(steps) {
  if (!steps.length) return { step: null, index: -1 };
  if (scenarioStepIndex >= 0 && scenarioStepIndex < steps.length) return { step: steps[scenarioStepIndex], index: scenarioStepIndex };
  if (scenarioStepIndex >= steps.length) return { step: steps[steps.length - 1], index: steps.length - 1 };
  return { step: steps[0], index: 0 };
}

function playScenario() {
  const scenario = currentScenario();
  const steps = availableScenarioSteps();
  if (!steps.length) {
    playTone('disable');
    scenarioControls.status.textContent = 'Unavailable';
    scenarioControls.summary.textContent = 'This scenario needs nodes that are not present in the current graph data.';
    return;
  }
  if (!scenarioRunning && scenarioPausedAt && scenarioCurrentVisual) {
    scenarioStepStartedAt += performance.now() - scenarioPausedAt;
  }
  scenarioPausedAt = 0;
  scenarioRunning = true;
  document.querySelector('.scene-shell')?.setAttribute('data-scenario-active', 'true');
  loadScenarioVoiceovers(scenario);
  if (scenarioStepIndex < 0 || scenarioStepIndex >= steps.length) {
    clearScenarioVisuals();
    scenarioCompletedVisuals = [];
    startScenarioStep(0);
  } else {
    playTone('launch');
    resumeScenarioVoiceover();
  }
  renderScenarioPanel();
}

function pauseScenario() {
  playTone('pause');
  scenarioPausedAt = performance.now();
  scenarioRunning = false;
  pauseScenarioVoiceover();
  renderScenarioPanel();
}

function resetScenarioPlayback(showIdle = true) {
  scenarioRunning = false;
  scenarioStepIndex = -1;
  scenarioStepStartedAt = 0;
  scenarioPausedAt = 0;
  scenarioProgressRatio = 0;
  scenarioHighlightIds = new Set();
  stopScenarioVoiceover();
  clearScenarioVisuals();
  document.querySelector('.scene-shell')?.removeAttribute('data-scenario-active');
  startCinematicReturn();
  applyFilters();
  updateScenarioButton();
  if (showIdle) renderScenarioPanel();
}

function clearScenarioVisuals() {
  if (scenarioCurrentVisual) disposeScenarioVisual(scenarioCurrentVisual);
  scenarioCurrentVisual = null;
  scenarioCompletedVisuals.forEach(disposeScenarioVisual);
  scenarioCompletedVisuals = [];
  scenarioGroup.clear();
}

function disposeScenarioVisual(visual) {
  [visual?.tube, visual?.particle].filter(Boolean).forEach(object => {
    scenarioGroup.remove(object);
    object.traverse?.(child => {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) child.material.forEach(material => material.dispose?.());
      else child.material?.dispose?.();
    });
  });
}

function startScenarioStep(index) {
  const scenario = currentScenario();
  const steps = availableScenarioSteps(scenario);
  if (index >= steps.length) {
    finishScenario();
    return;
  }

  scenarioStepIndex = index;
  scenarioStepStartedAt = performance.now();
  scenarioPausedAt = 0;
  lastScenarioHighlightAt = 0;
  cinematicReturnUntil = 0;
  const step = steps[index];
  scenarioHighlightIds = new Set([step.source, step.target]);
  const voiceover = scenarioVoiceoverForStep(scenario, step, index);
  scenarioCurrentVisual = createScenarioStepVisual(step, scenario, voiceover);
  playTone(index === 0 ? 'launch' : 'packet');
  if (scenarioCurrentVisual) {
    scenarioGroup.add(scenarioCurrentVisual.tube);
    scenarioGroup.add(scenarioCurrentVisual.particle);
  }
  selectNode(step.target);
  playScenarioVoiceover(index, step, scenario);
  applyScenarioHighlights();
  renderScenarioPanel();
}

function createScenarioStepVisual(step, scenario, voiceover = null) {
  const curve = curveForStep(step.source, step.target, step.layer);
  if (!curve) return null;
  const color = new THREE.Color(LAYER_COLORS[step.layer] || scenario.color || 0x5eead4);
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 48, step.layer === 'UI' ? 0.065 : 0.052, 8, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.76,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 18, 12),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const light = new THREE.PointLight(color, 6, 7);
  particle.add(light);
  particle.position.copy(curve.getPoint(0));
  particle.userData.step = step;
  const baseDuration = step.duration || durationForStepExplanation(step.explanation);
  const voiceDuration = Number(voiceover?.duration_seconds || 0) > 0 ? (Number(voiceover.duration_seconds) * 1000) + 900 : 0;
  return { curve, tube, particle, step, scenario, duration: Math.max(baseDuration, voiceDuration) };
}

function curveForStep(sourceId, targetId, layer = 'DATA') {
  const source = nodeObjects.get(sourceId)?.group.position;
  const target = nodeObjects.get(targetId)?.group.position;
  if (!source || !target) return null;
  const start = source.clone();
  const end = target.clone();
  const middle = start.clone().lerp(end, 0.5);
  const distance = start.distanceTo(end);
  middle.y += Math.min(6.5, Math.max(1.8, distance * 0.24));
  middle.z += layer === 'CLI' ? -1.5 : layer === 'DATA' ? 1.25 : layer === 'API' ? 0.45 : 0;
  middle.x += layer === 'UI' ? 0.65 : layer === 'CLI' ? -0.45 : 0;
  return new THREE.CatmullRomCurve3([start, middle, end]);
}

function startCinematicReturn() {
  if (!cinematicMode || reducedMotion.matches) {
    cinematicReturnUntil = 0;
    return;
  }
  cinematicReturnUntil = performance.now() + 1800;
}

function updateCinematicCamera(now) {
  if (reducedMotion.matches) return;
  if (cinematicMode && scenarioRunning && scenarioCurrentVisual?.particle) {
    const step = scenarioCurrentVisual.step;
    const sourceObject = nodeObjects.get(step.source)?.group;
    const targetObject = nodeObjects.get(step.target)?.group;
    if (!sourceObject || !targetObject) return;

    const source = new THREE.Vector3();
    const target = new THREE.Vector3();
    const packet = new THREE.Vector3();
    sourceObject.getWorldPosition(source);
    targetObject.getWorldPosition(target);
    scenarioCurrentVisual.particle.getWorldPosition(packet);

    const direction = target.clone().sub(source);
    const travelDistance = Math.max(2, direction.length());
    direction.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(up, direction);
    if (side.lengthSq() < 0.001) side.set(1, 0, 0);
    side.normalize();

    const focus = packet.clone().lerp(target, 0.12);
    focus.y += 0.62;
    const distance = Math.min(18, Math.max(9, travelDistance * 1.05 + 5.5));
    const desiredPosition = focus.clone()
      .add(side.multiplyScalar(distance * 0.72))
      .add(up.multiplyScalar(4.2 + Math.min(3.2, travelDistance * 0.12)))
      .add(direction.multiplyScalar(-distance * 0.78));

    camera.position.lerp(desiredPosition, 0.045);
    controls.target.lerp(focus, 0.075);
    return;
  }

  if (cinematicReturnUntil > now) {
    camera.position.lerp(DEFAULT_CAMERA_POSITION, 0.025);
    controls.target.lerp(DEFAULT_CAMERA_TARGET, 0.035);
  } else if (cinematicReturnUntil) {
    cinematicReturnUntil = 0;
  }
}

function updateScenario(now) {
  if (!scenarioCurrentVisual) {
    if (cinematicReturnUntil > now) updateCinematicCamera(now);
    return;
  }

  if (!scenarioRunning) {
    updateCinematicCamera(now);
    if (now - lastScenarioHighlightAt > SCENARIO_HIGHLIGHT_INTERVAL_MS) {
      lastScenarioHighlightAt = now;
      applyScenarioHighlights(now);
    }
    return;
  }

  const steps = availableScenarioSteps();
  const duration = reducedMotion.matches ? Math.max(700, scenarioCurrentVisual.duration * 0.55) : scenarioCurrentVisual.duration;
  const elapsed = Math.max(0, now - scenarioStepStartedAt);
  const rawProgress = Math.min(1, elapsed / duration);
  const eased = easeInOutCubic(rawProgress);
  scenarioCurrentVisual.particle.position.copy(scenarioCurrentVisual.curve.getPoint(eased));
  updateCinematicCamera(now);
  const glow = 0.74 + Math.sin(now * 0.012) * 0.16;
  scenarioCurrentVisual.tube.material.opacity = scenarioRunning ? glow : 0.52;
  scenarioCurrentVisual.particle.material.opacity = scenarioRunning ? 0.88 + Math.sin(now * 0.018) * 0.1 : 0.58;
  scenarioCurrentVisual.particle.scale.setScalar(1 + Math.sin(now * 0.016) * 0.18);
  scenarioProgressRatio = steps.length ? (Math.max(scenarioStepIndex, 0) + rawProgress) / steps.length : 0;
  updateScenarioProgress();
  if (now - lastScenarioHighlightAt > SCENARIO_HIGHLIGHT_INTERVAL_MS) {
    lastScenarioHighlightAt = now;
    applyScenarioHighlights(now);
  }

  if (scenarioRunning && rawProgress >= 1) completeScenarioStep();
}

function completeScenarioStep() {
  if (scenarioCurrentVisual) {
    scenarioCurrentVisual.tube.material.opacity = 0.28;
    scenarioCurrentVisual.particle.visible = false;
    scenarioCompletedVisuals.push(scenarioCurrentVisual);
    scenarioCurrentVisual = null;
  }
  const nextIndex = scenarioStepIndex + 1;
  const steps = availableScenarioSteps();
  if (nextIndex >= steps.length) {
    finishScenario();
  } else {
    startScenarioStep(nextIndex);
  }
}

function finishScenario() {
  scenarioRunning = false;
  scenarioPausedAt = 0;
  scenarioStepIndex = availableScenarioSteps().length;
  scenarioHighlightIds = new Set();
  scenarioProgressRatio = 1;
  document.querySelector('.scene-shell')?.removeAttribute('data-scenario-active');
  pauseScenarioVoiceover();
  playTone('complete');
  startCinematicReturn();
  applyFilters();
  renderScenarioPanel();
}

function updateScenarioProgress() {
  scenarioControls.progress.style.width = `${Math.round(Math.min(1, Math.max(0, scenarioProgressRatio)) * 100)}%`;
}

function renderScenarioPanel() {
  const scenario = currentScenario();
  const steps = availableScenarioSteps(scenario);
  if (!scenario) return;
  const display = scenarioStepForDisplay(steps);
  scenarioControls.select.value = scenario.id;
  scenarioControls.summary.textContent = scenario.summary;
  renderScenarioPrompt(scenario, steps);
  renderScenarioCardMenu();
  renderFlowCard(scenario, steps);
  scenarioControls.status.textContent = scenarioRunning
    ? `Running ${Math.min(scenarioStepIndex + 1, steps.length)}/${steps.length}`
    : scenarioStepIndex >= steps.length && steps.length
      ? 'Complete'
      : scenarioStepIndex >= 0
        ? 'Paused'
        : 'Idle';
  scenarioControls.steps.innerHTML = steps.map((step, index) => {
    const state = scenarioStepIndex === index ? 'active' : index < scenarioStepIndex ? 'done' : 'pending';
    return `<li data-layer="${escapeAttribute(step.layer)}" data-state="${state}"><span><b>${escapeHtml(nodeName(step.source))} -> ${escapeHtml(nodeName(step.target))}</b><br>${escapeHtml(step.label)}</span></li>`;
  }).join('');
  renderScenarioStepExplanation(display.step, display.index, steps.length);
  renderScenarioVoiceoverStatus();
  updateScenarioProgress();
  updateScenarioButton();
}

function renderScenarioPrompt(scenario, steps = []) {
  if (!scenarioControls.prompt || !scenario) return;
  const complete = scenarioStepIndex >= steps.length && steps.length;
  const paused = !scenarioRunning && scenarioStepIndex >= 0 && !complete;
  const action = scenarioRunning ? 'Pause' : complete ? 'Replay' : paused ? 'Resume' : 'Play';
  scenarioControls.prompt.dataset.visible = 'true';
  scenarioControls.prompt.dataset.running = String(scenarioRunning);
  scenarioControls.promptTitle.textContent = scenario.name;
  scenarioControls.promptSummary.textContent = scenarioRunning
    ? `Playing ${Math.min(scenarioStepIndex + 1, steps.length)}/${steps.length}: ${scenario.summary}`
    : `Run this flow now: ${scenario.summary}`;
  scenarioControls.promptPlay.textContent = action;
  scenarioControls.promptPlay.setAttribute('aria-label', `${action} ${scenario.name}`);
}

function renderScenarioStepExplanation(step, index, total) {
  if (!step) {
    scenarioControls.stepTitle.textContent = 'Step narration unavailable';
    scenarioControls.stepExplanation.innerHTML = '<p>No flow step is available in the current graph data.</p>';
    return;
  }
  scenarioControls.stepTitle.textContent = `Step ${index + 1}/${total}: ${nodeName(step.source)} -> ${nodeName(step.target)}`;
  const paragraphs = step.explanation?.length ? step.explanation : flowStepExplanation(step.source, step.target, step.layer, step.label);
  scenarioControls.stepExplanation.innerHTML = paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('');
}

function flowCardSpec(verb, type, rank, grade, description, effect, risk, stats = {}) {
  return {
    verb,
    type,
    rank,
    grade,
    short: wrapText(description, 86, 1)[0],
    description,
    effect,
    risk,
    stats: {
      impact: 5,
      reliability: 5,
      complexity: 5,
      cost: 5,
      speed: 5,
      teaching: 5,
      ...stats,
    },
  };
}

function flowCardFor(scenario = {}) {
  if (FLOW_CARD_SPECS[scenario.id]) return FLOW_CARD_SPECS[scenario.id];
  return flowCardSpec(
    'ROUTE',
    'Process Skill',
    'Common',
    'B',
    `${scenario.name || 'This flow'} moves work across multiple Hapa nodes and teaches the operator to follow responsibility through UI, API, CLI, and data layers.`,
    'Trace one route and reveal the nodes responsible for each handoff.',
    'Unmapped steps can hide ownership and make failures hard to recover.',
    { impact: 6, reliability: 6, complexity: 5, cost: 3, speed: 6, teaching: 8 },
  );
}

function renderFlowCard(scenario, steps = []) {
  const card = flowCardFor(scenario);
  const nodeIds = unique(steps.flatMap(step => [step.source, step.target]));
  const image = flowActionImageFor(scenario, card);
  scenarioControls.flowCardName.textContent = scenario.name;
  scenarioControls.flowCardGrade.textContent = card.grade;
  scenarioControls.flowCardRank.textContent = card.rank;
  scenarioControls.flowCardVerb.textContent = card.verb;
  scenarioControls.flowCardType.textContent = card.type;
  scenarioControls.flowCardCost.textContent = `Cost ${card.stats.cost}/10`;
  scenarioControls.flowCardNodeCount.textContent = `${nodeIds.length} nodes`;
  scenarioControls.flowCardDescription.textContent = card.description;
  scenarioControls.flowCardEffect.textContent = card.effect;
  scenarioControls.flowCardRisk.textContent = card.risk;
  scenarioControls.flowActionImage.src = image;
  scenarioControls.flowActionImage.alt = `${scenario.name} action image`;
  scenarioControls.flowActionImage.title = flowActionImagePrompt(scenario, card);
  scenarioControls.flowActionButton.dataset.previewSrc = image;
  scenarioControls.flowActionButton.dataset.prompt = flowActionImagePrompt(scenario, card);
  scenarioControls.flowCardStats.innerHTML = FLOW_STAT_LABELS
    .map(([key, label]) => renderFlowStat(label, card.stats[key]))
    .join('');
}

function renderFlowStat(label, value) {
  const numeric = Math.max(0, Math.min(10, Number(value || 0)));
  return `
    <div class="flow-stat">
      <div><b>${escapeHtml(label)}</b><span>${numeric}/10</span></div>
      <span class="flow-stat-meter" aria-hidden="true"><i style="width:${(numeric * 10).toFixed(1)}%"></i></span>
    </div>
  `;
}

function flowActionImageFor(scenario, card = flowCardFor(scenario)) {
  return inlineFlowActionImage(scenario, card);
}

function flowActionImagePrompt(scenario = {}, card = flowCardFor(scenario)) {
  const steps = scenario.steps || [];
  const nodeNames = unique(steps.flatMap(step => [nodeName(step.source), nodeName(step.target)])).slice(0, 9).join(', ');
  const layers = unique(steps.map(step => step.layer)).join(', ');
  return [
    'Use case: stylized-concept',
    'Asset type: 16:9 action image for a Hapa process flow card and thumbnail menu',
    `Primary request: create an image of the action verb "${card.verb}" happening as the Hapa flow "${scenario.name}" moves through local nodes.`,
    `Flow description: ${card.description}`,
    `Node route cast: ${nodeNames}`,
    `System layers: ${layers}`,
    `Card rank and grade: ${card.rank}, ${card.grade}`,
    `Effect to imply visually: ${card.effect}`,
    'Style/medium: Hapa/Astros neon operator aesthetic, cinematic but legible, dark local-first command palette, cyan/fuchsia/gold edge lighting, luminous data packets, precise UI-like composition.',
    'Composition/framing: wide 16:9 action scene with the verb visually active at center, node silhouettes around it, data paths moving through the scene, no tiny unreadable text.',
    'Avoid: stock-photo people, generic corporate diagrams, soft bokeh blobs, watermark, messy microtext, brand names.',
  ].join('\n');
}

function inlineFlowActionImage(scenario = {}, card = flowCardFor(scenario)) {
  const accent = colorHex(scenario.color || GROUP_COLORS.core);
  const second = colorHex(LAYER_COLORS[scenario.steps?.[0]?.layer] || LAYER_COLORS.UI);
  const third = colorHex(LAYER_COLORS[scenario.steps?.[1]?.layer] || LAYER_COLORS.DATA);
  const steps = scenario.steps || [];
  const seed = hashString(`${scenario.id || scenario.name || 'flow'}-${card.verb}`);
  const sourceName = nodeName(steps[0]?.source || 'hapa');
  const targetName = nodeName(steps.at?.(-1)?.target || steps[steps.length - 1]?.target || 'hapa-atlas');
  const routeNodes = unique(steps.flatMap(step => [step.source, step.target])).slice(0, 7);
  const routeDots = routeNodes.map((id, index) => {
    const angle = -Math.PI * 0.72 + (index / Math.max(routeNodes.length - 1, 1)) * Math.PI * 1.44;
    const x = 480 + Math.cos(angle) * (278 + seededUnit(seed, index) * 38);
    const y = 282 + Math.sin(angle) * (132 + seededUnit(seed, index + 11) * 28);
    const color = colorHex(GROUP_COLORS[graphNodes.find(node => node.id === id)?.group] || GROUP_COLORS.core);
    return `
      <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
        <circle r="18" fill="#020617" fill-opacity=".88" stroke="${color}" stroke-width="2.4" filter="url(#flow-glow)"/>
        <circle r="5" fill="${color}"/>
      </g>
    `;
  }).join('');
  const packets = steps.slice(0, 7).map((step, index) => {
    const progress = (index + 1) / (Math.min(steps.length, 7) + 1);
    const x = 130 + progress * 700;
    const y = 260 + Math.sin(progress * Math.PI * 2 + seededUnit(seed, index) * 1.8) * 80;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(5 + index % 3).toFixed(1)}" fill="${colorHex(LAYER_COLORS[step.layer] || scenario.color)}" filter="url(#flow-glow)"/>`;
  }).join('');
  const titleLines = wrapText(scenario.name || 'Hapa Flow', 24, 2);
  const descriptionLines = wrapText(card.short || scenario.summary || card.description, 54, 2);
  const motif = flowMotifSvg(card.verb, accent, second, third);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${escapeSvg(scenario.name || 'Hapa flow')} action image">
      <defs>
        <radialGradient id="flow-bg" cx="50%" cy="42%" r="72%">
          <stop offset="0" stop-color="${accent}" stop-opacity=".22"/>
          <stop offset=".44" stop-color="#07111f" stop-opacity=".96"/>
          <stop offset="1" stop-color="#020617"/>
        </radialGradient>
        <linearGradient id="flow-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="${second}"/>
          <stop offset=".52" stop-color="${accent}"/>
          <stop offset="1" stop-color="${third}"/>
        </linearGradient>
        <filter id="flow-glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="960" height="540" rx="34" fill="url(#flow-bg)"/>
      <path d="M0 72h960M0 144h960M0 216h960M0 288h960M0 360h960M0 432h960M120 0v540M240 0v540M360 0v540M480 0v540M600 0v540M720 0v540M840 0v540" stroke="#1e3a52" stroke-width="1" opacity=".32"/>
      <rect x="28" y="28" width="904" height="484" rx="24" fill="#020617" fill-opacity=".44" stroke="${accent}" stroke-width="2"/>
      <path d="M108 292 C240 122, 342 414, 480 282 S724 96, 852 280" fill="none" stroke="url(#flow-line)" stroke-width="7" stroke-linecap="round" opacity=".74" filter="url(#flow-glow)"/>
      <path d="M116 346 C292 244, 374 362, 512 196 S710 246, 846 162" fill="none" stroke="${third}" stroke-width="3" stroke-dasharray="14 16" opacity=".62"/>
      ${routeDots}
      ${packets}
      <g transform="translate(480 264)">
        <circle r="98" fill="#020617" fill-opacity=".78" stroke="url(#flow-line)" stroke-width="3.5" filter="url(#flow-glow)"/>
        <circle r="70" fill="${accent}" fill-opacity=".08" stroke="${second}" stroke-width="1.5" stroke-dasharray="10 10"/>
        ${motif}
        <text x="0" y="58" text-anchor="middle" fill="#f8fafc" font-family="Menlo, Consolas, monospace" font-size="${card.verb.length > 8 ? 23 : 28}" font-weight="900">${escapeSvg(card.verb)}</text>
      </g>
      <text x="52" y="66" fill="${accent}" font-family="Menlo, Consolas, monospace" font-size="13" font-weight="900">HAPA FLOW ACTION / ${escapeSvg(card.type.toUpperCase())}</text>
      ${svgTextLines(titleLines, 52, 112, 34, '#f8fafc', 900, 38)}
      ${svgTextLines(descriptionLines, 52, 196, 16, '#cbd5e1', 700, 22)}
      <g transform="translate(52 406)">
        <rect width="248" height="62" rx="14" fill="#020617" fill-opacity=".72" stroke="${second}"/>
        <text x="18" y="25" fill="${second}" font-family="Menlo, Consolas, monospace" font-size="11" font-weight="900">SOURCE</text>
        <text x="18" y="47" fill="#f8fafc" font-family="Menlo, Consolas, monospace" font-size="15" font-weight="800">${escapeSvg(wrapText(sourceName, 24, 1)[0])}</text>
      </g>
      <g transform="translate(660 406)">
        <rect width="248" height="62" rx="14" fill="#020617" fill-opacity=".72" stroke="${third}"/>
        <text x="18" y="25" fill="${third}" font-family="Menlo, Consolas, monospace" font-size="11" font-weight="900">RETURN</text>
        <text x="18" y="47" fill="#f8fafc" font-family="Menlo, Consolas, monospace" font-size="15" font-weight="800">${escapeSvg(wrapText(targetName, 24, 1)[0])}</text>
      </g>
      <g transform="translate(390 424)">
        <rect width="180" height="44" rx="13" fill="#020617" fill-opacity=".78" stroke="${accent}"/>
        <text x="90" y="19" text-anchor="middle" fill="#fde68a" font-family="Menlo, Consolas, monospace" font-size="13" font-weight="900">${escapeSvg(card.rank.toUpperCase())}</text>
        <text x="90" y="36" text-anchor="middle" fill="#f8fafc" font-family="Menlo, Consolas, monospace" font-size="17" font-weight="900">GRADE ${escapeSvg(card.grade)}</text>
      </g>
    </svg>
  `;
  return svgDataUri(svg);
}

function flowMotifSvg(verb, accent, second, third) {
  const normalized = String(verb || '').toUpperCase();
  if (['HEAL', 'BACKFILL', 'MIGRATE'].includes(normalized)) {
    return `
      <rect x="-44" y="-40" width="88" height="72" rx="14" fill="#020617" stroke="${accent}" stroke-width="3"/>
      <path d="M-22 -3h44M0 -25v44" stroke="${second}" stroke-width="8" stroke-linecap="round" filter="url(#flow-glow)"/>
      <path d="M-58 36 C-28 58, 28 58, 58 36" fill="none" stroke="${third}" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 10"/>
    `;
  }
  if (['FORGE', 'AUTHORIZE', 'PROMOTE'].includes(normalized)) {
    return `
      <path d="M-48 28h96l-18 28h-60z" fill="#020617" stroke="${third}" stroke-width="3"/>
      <path d="M-26 -42l22 22 48 -48 22 22 -48 48 20 22 -64 12z" fill="${second}" fill-opacity=".24" stroke="${second}" stroke-width="4" filter="url(#flow-glow)"/>
      <circle cx="46" cy="-36" r="16" fill="${accent}" fill-opacity=".18" stroke="${accent}" stroke-width="3"/>
    `;
  }
  if (['LAUNCH', 'CAPTURE', 'ONBOARD'].includes(normalized)) {
    return `
      <path d="M0 -58 C38 -20, 44 20, 0 54 C-44 20, -38 -20, 0 -58z" fill="#020617" stroke="${accent}" stroke-width="4" filter="url(#flow-glow)"/>
      <path d="M0 -35v58M-28 0h56" stroke="${second}" stroke-width="5" stroke-linecap="round"/>
      <path d="M-56 44 C-28 68, 28 68, 56 44" fill="none" stroke="${third}" stroke-width="5" stroke-linecap="round"/>
    `;
  }
  if (['GROW', 'CULTIVATE', 'RESONATE'].includes(normalized)) {
    return `
      <path d="M0 42 C-36 12, -34 -32, 0 -54 C34 -32, 36 12, 0 42z" fill="${accent}" fill-opacity=".12" stroke="${accent}" stroke-width="4" filter="url(#flow-glow)"/>
      <path d="M0 42 C-2 10, 8 -18, 36 -40M0 42 C2 6, -14 -20, -42 -34" fill="none" stroke="${second}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="0" cy="0" r="20" fill="#020617" stroke="${third}" stroke-width="3"/>
    `;
  }
  return `
    <path d="M-52 0h88M10 -32l42 32-42 32" fill="none" stroke="${second}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" filter="url(#flow-glow)"/>
    <circle cx="-42" cy="0" r="18" fill="#020617" stroke="${accent}" stroke-width="4"/>
    <circle cx="52" cy="0" r="18" fill="#020617" stroke="${third}" stroke-width="4"/>
  `;
}

function currentCinematicRouteIds(steps = availableScenarioSteps()) {
  const ids = new Set();
  if (!cinematicMode) return ids;
  steps.forEach(step => {
    ids.add(step.source);
    ids.add(step.target);
  });
  return ids;
}

function isCinematicPlaybackActive(steps = availableScenarioSteps()) {
  return Boolean(cinematicMode && steps.length && (scenarioRunning || (scenarioStepIndex >= 0 && scenarioStepIndex < steps.length)));
}

function scenarioStepAtIndex(steps = availableScenarioSteps()) {
  return scenarioStepIndex >= 0 && scenarioStepIndex < steps.length ? steps[scenarioStepIndex] : null;
}

function applyScenarioHighlights(now = performance.now()) {
  const wave = 0.5 + Math.sin(now * 0.008) * 0.5;
  const steps = availableScenarioSteps();
  const cinematicActive = isCinematicPlaybackActive(steps);
  const routeIds = currentCinematicRouteIds(steps);
  const routeEdgeKeys = new Set(steps.map(step => `${step.source}|${step.target}|${step.layer}`));
  const currentStep = scenarioCurrentVisual?.step || scenarioStepAtIndex(steps);
  const activeEdgeKey = currentStep ? `${currentStep.source}|${currentStep.target}|${currentStep.layer}` : '';
  nodeObjects.forEach((object, nodeId) => {
    const item = object.item || graphNodeById.get(nodeId);
    const active = scenarioHighlightIds.has(nodeId);
    const onRoute = routeIds.has(nodeId);
    const filtered = object.filtered;
    const selected = nodeId === selectedNodeId;
    setDatasetFlag(object.label, 'flow', active);
    setDatasetFlag(object.label, 'route', cinematicActive && onRoute);
    setDatasetFlag(object.label, 'cinematicDimmed', cinematicActive && !onRoute);
    if (active) {
      object.group.visible = true;
      object.material.opacity = 1;
      object.material.emissiveIntensity = 0.78 + wave * 0.44;
      object.ring.material.opacity = 1;
      object.ring.scale.setScalar(1.34 + wave * 0.18);
      object.halo.material.opacity = 0.32 + wave * 0.18;
      object.halo.scale.setScalar(1.12 + wave * 0.18);
      setNodeLight(object, 6.5 + wave * 5, true);
      setBeaconOpacity(object, 1);
    } else if (cinematicActive && !onRoute) {
      object.material.opacity = 0.085;
      object.material.emissiveIntensity = 0.025;
      object.ring.material.opacity = 0.05;
      object.ring.scale.setScalar(0.84);
      object.halo.material.opacity = 0.012;
      object.halo.scale.setScalar(0.9);
      setNodeLight(object, 0, false);
      setBeaconOpacity(object, 0.08);
      if (!selected) object.sphere.scale.setScalar(0.62);
    } else if (cinematicActive && onRoute) {
      object.group.visible = true;
      object.material.opacity = filtered ? 0.68 : 0.9;
      object.material.emissiveIntensity = 0.42 + wave * 0.16;
      object.ring.material.opacity = 0.56 + wave * 0.18;
      object.ring.scale.setScalar(selected ? 1.22 : 1.08);
      object.halo.material.opacity = defaultHaloOpacityFor(item) + 0.08 + wave * 0.06;
      object.halo.scale.setScalar(1.05);
      setNodeLight(object, defaultNodeLightFor(item) + 1.6 + wave * 1.5, true);
      setBeaconOpacity(object, 0.86);
    } else {
      setDatasetFlag(object.label, 'cinematicDimmed', false);
      setDatasetFlag(object.label, 'route', false);
      object.material.opacity = filtered ? 0.22 : 1;
      object.material.emissiveIntensity = filtered ? 0.08 : 0.34;
      object.ring.material.opacity = filtered ? 0.18 : 0.7;
      object.halo.material.opacity = filtered ? 0.035 : defaultHaloOpacityFor(item);
      object.halo.scale.setScalar(1);
      const shouldLightNode = !filtered && (item.group === 'core' || nodeId === selectedNodeId || nodeId === hoveredNodeId);
      setNodeLight(object, defaultNodeLightFor(item), shouldLightNode);
      setBeaconOpacity(object, filtered ? 0.16 : 0.95);
      if (nodeId !== selectedNodeId) object.ring.scale.setScalar(1);
    }
  });
  edgeGroup.children.forEach(mesh => {
    const edgeItem = mesh.userData.edge;
    const edgeKey = `${edgeItem.source}|${edgeItem.target}|${edgeItem.layer}`;
    const routeEdge = routeEdgeKeys.has(edgeKey);
    const activeEdge = activeEdgeKey === edgeKey;
    if (cinematicActive) {
      if (routeEdge && activeLayers.has(edgeItem.layer)) {
        mesh.visible = true;
        mesh.material.opacity = activeEdge ? 0.82 : 0.2;
      } else if (mesh.visible) {
        mesh.material.opacity = 0.035;
      }
    } else {
      mesh.material.opacity = mesh.userData.baseOpacity ?? (edgeItem.layer === 'DATA' ? 0.46 : 0.58);
    }
  });
  updateArmadaVisuals();
}

function updateMusicVisualization(now) {
  analyzeMusicSignal();
  if (frameIndex % 3 === 0) renderMusicTelemetry();
  if (!musicMode) return;

  const energy = musicState.energy;
  const bass = musicState.bass;
  const mid = musicState.mid;
  const treble = musicState.treble;
  const beat = musicState.beat;
  const accent = new THREE.Color(musicState.accent || '#5eead4');
  const pulse = 0.5 + Math.sin(now * 0.004) * 0.5;

  musicPulseLight.intensity = 4 + energy * 36 + beat * 24;
  musicPulseLight.distance = 18 + energy * 22;
  musicVisualizerGroup.visible = true;
  updateMusicVisualizerFormation(energy, bass, mid, treble, beat, now);

  updateMusicBars(energy, bass, mid, treble, beat, accent);
  updateMusicRings(energy, bass, mid, treble, beat, now, accent);
  updateMusicNodes(now, energy, bass, mid, treble, beat);
  updateMusicEdges(energy, bass, mid, treble, beat, accent);
  updateMusicCamera(now, energy, bass, mid, treble, pulse);
}

function updateBackgroundGeometry(now) {
  const energy = musicMode ? musicState.energy : musicState.energy * 0.35;
  const bass = musicMode ? musicState.bass : musicState.bass * 0.25;
  const mid = musicMode ? musicState.mid : musicState.mid * 0.25;
  const treble = musicMode ? musicState.treble : musicState.treble * 0.25;
  const beat = musicMode ? musicState.beat : musicState.beat * 0.2;
  const accent = new THREE.Color(musicState.accent || '#5eead4');

  starDriftGroup.rotation.y += 0.00028 + treble * 0.0018;
  backgroundStarLines.forEach(line => {
    line.material.opacity = (backgroundMode === 'stars' ? 0.15 : 0.04) + treble * 0.12 + beat * 0.06;
    line.material.color.copy(accent).lerp(new THREE.Color(0x8be8ff), 0.62);
  });

  backgroundAuroras.forEach((mesh, index) => {
    const band = [bass, mid, treble, energy][index] || energy;
    mesh.rotation.x += 0.0008 + index * 0.00035 + band * 0.0024;
    mesh.rotation.z += 0.00055 + band * 0.0018;
    mesh.scale.y = 0.34 + index * 0.08 + band * 0.24 + beat * 0.08;
    mesh.material.opacity = (backgroundMode === 'aurora' ? 0.065 : 0.025) + band * 0.12;
    mesh.material.color.copy(accent).lerp(new THREE.Color([GROUP_COLORS.core, GROUP_COLORS.trust, GROUP_COLORS.media, GROUP_COLORS.memory][index]), 0.58);
  });

  backgroundWarpRings.forEach((ring, index) => {
    const offset = (now * (0.0011 + energy * 0.0018) + index * 0.32) % 1;
    ring.position.z = -30 + offset * 40;
    ring.rotation.z += 0.0012 + energy * 0.003 + index * 0.00005;
    ring.scale.setScalar(0.72 + offset * 1.08 + bass * 0.28 + beat * 0.08);
    ring.material.opacity = (backgroundMode === 'warp' ? 0.035 : 0.012) + (1 - Math.abs(offset - 0.5) * 2) * 0.06 + energy * 0.08;
    ring.material.color.copy(accent).lerp(new THREE.Color(index % 2 ? GROUP_COLORS.memory : GROUP_COLORS.media), 0.45);
  });

  backgroundLatticeRings.forEach((ring, index) => {
    const band = [bass, mid, treble, energy][index % 4];
    ring.rotation.z += 0.001 + index * 0.0004 + band * 0.004;
    ring.scale.setScalar(1 + Math.sin(now * 0.0015 + index) * 0.025 + band * 0.22 + beat * 0.06);
    ring.material.opacity = (backgroundMode === 'lattice' ? 0.045 : 0.014) + band * 0.14 + beat * 0.04;
    ring.material.color.copy(accent).lerp(new THREE.Color([GROUP_COLORS.core, GROUP_COLORS.trust, GROUP_COLORS.media][index % 3]), 0.42);
  });

  cosmosGroup.rotation.y += 0.00012 + treble * 0.0005;
  cosmosSun.scale.setScalar(1 + bass * 0.22 + beat * 0.1);
  cosmosSun.material.opacity = (backgroundMode === 'cosmos' ? 0.74 : 0.2) + energy * 0.14;
  cosmosHalo.rotation.z += 0.0012 + energy * 0.003;
  cosmosHalo.scale.setScalar(1 + bass * 0.24 + beat * 0.08);
  cosmosHalo.material.color.copy(accent).lerp(new THREE.Color(0xfbbf24), 0.52);
  cosmosHalo.material.opacity = (backgroundMode === 'cosmos' ? 0.2 : 0.06) + energy * 0.12;
  backgroundCosmosOrbits.forEach((orbit, index) => {
    orbit.rotation.z += 0.00022 + index * 0.00005 + energy * 0.0008;
    orbit.material.opacity = (backgroundMode === 'cosmos' ? 0.1 : 0.025) + energy * 0.06;
    orbit.material.color.copy(accent).lerp(new THREE.Color(index % 2 ? GROUP_COLORS.memory : GROUP_COLORS.media), 0.6);
  });
  backgroundCosmosPlanets.forEach((planet, index) => {
    const phase = planet.userData.phase + now * planet.userData.speed;
    const radius = planet.userData.radius + bass * (0.08 + index * 0.018);
    planet.position.set(
      Math.cos(phase) * radius,
      planet.userData.lift + Math.sin(phase * 1.7) * 0.14 + beat * 0.08,
      Math.sin(phase) * radius * 0.7,
    );
    planet.rotation.y += 0.004 + planet.userData.speed * 2.4;
    planet.scale.setScalar(1 + [bass, mid, treble, energy][index % 4] * 0.28 + beat * 0.06);
    planet.material.opacity = (backgroundMode === 'cosmos' ? 0.78 : 0.22) + energy * 0.12;
    planet.material.color.copy(accent).lerp(new THREE.Color([GROUP_COLORS.memory, GROUP_COLORS.trust, GROUP_COLORS.core, GROUP_COLORS.media, GROUP_COLORS.surface][index]), 0.64);
  });
  backgroundCosmosNebulae.forEach((cloud, index) => {
    const band = [treble, mid, bass][index] || energy;
    cloud.rotation.y += 0.0002 + index * 0.0001 + band * 0.0008;
    cloud.rotation.z += 0.00012 + energy * 0.0005;
    cloud.scale.setScalar(1 + band * 0.16 + beat * 0.04);
    cloud.material.opacity = (backgroundMode === 'cosmos' ? 0.18 : 0.045) + band * 0.09;
  });

  backgroundGroup.visible = backgroundMode !== 'grid' || musicMode;
  if (musicMode && backgroundMode === 'grid') {
    latticeGroup.visible = true;
    backgroundLatticeRings.forEach(ring => {
      ring.material.opacity *= 0.44;
    });
  } else {
    latticeGroup.visible = backgroundMode === 'lattice';
  }
}

function updateMusicVisualizerFormation(energy, bass, mid, treble, beat, now) {
  const formation = normalizeFormationMode(layoutMode);
  const spin = formation === 'ring'
    ? 0.0009 + energy * 0.0032
    : formation === 'lanes'
      ? 0.00045 + treble * 0.0024
      : 0.0018 + energy * 0.006;
  const scale = formation === 'ring'
    ? 1.55 + bass * 0.18 + beat * 0.06
    : formation === 'lanes'
      ? 1.28 + mid * 0.16
      : formation === 'layers'
        ? 1.18 + treble * 0.14
        : 1 + energy * 0.12;
  const y = formation === 'layers'
    ? -0.9 + Math.sin(now * 0.0012) * 0.22
    : formation === 'lanes'
      ? -0.35 + mid * 0.26
      : Math.sin(now * 0.0012) * 0.16;

  musicVisualizerGroup.rotation.y += spin;
  musicVisualizerGroup.position.y = y;
  musicVisualizerGroup.scale.setScalar(scale);
}

function updateMusicBars(energy, bass, mid, treble, beat, accent) {
  const data = musicState.frequencyData;
  musicBars.forEach((bar, index) => {
    const sample = data?.length ? data[Math.min(data.length - 1, Math.floor((index / musicBars.length) * data.length))] / 255 : energy;
    const band = index % 3 === 0 ? bass : index % 3 === 1 ? mid : treble;
    const height = 0.18 + sample * 2.9 + band * 1.4 + beat * 0.5;
    bar.scale.y = Math.max(0.12, height);
    bar.position.y = -6.05 + bar.scale.y * 0.5;
    bar.material.opacity = 0.18 + sample * 0.44 + energy * 0.24;
    bar.material.color.copy(accent).lerp(new THREE.Color(index % 2 ? GROUP_COLORS.memory : GROUP_COLORS.media), 0.42 + band * 0.2);
  });
}

function updateMusicRings(energy, bass, mid, treble, beat, now, accent) {
  musicRings.forEach((ring, index) => {
    const band = [bass, mid, treble, energy][index] || energy;
    ring.visible = true;
    ring.scale.setScalar(1 + band * 0.28 + beat * 0.08 + Math.sin(now * 0.002 + index) * 0.025);
    ring.material.opacity = 0.05 + band * 0.18 + energy * 0.06;
    ring.material.color.copy(accent).lerp(new THREE.Color([GROUP_COLORS.core, GROUP_COLORS.media, GROUP_COLORS.trust, GROUP_COLORS.memory][index]), 0.38);
    ring.rotation.z += 0.002 + index * 0.0008 + band * 0.004;
  });
}

function updateMusicNodes(now, energy, bass, mid, treble, beat) {
  nodeObjects.forEach((object, nodeId) => {
    const item = object.item;
    const routeNode = MUSIC_FLOW_NODE_IDS.has(nodeId);
    const selected = nodeId === selectedNodeId;
    const band = musicBandForNode(item, bass, mid, treble, energy);
    const hash = (hashString(nodeId) % 1000) / 1000;
    const base = object.musicBasePosition || object.group.position;
    const routeWeight = routeNode ? 1 : item.group === 'media' ? 0.62 : item.group === 'memory' ? 0.48 : 0.22;
    const lift = (Math.sin(now * (0.0015 + hash * 0.0012) + hash * 6.2) * 0.1) + band * routeWeight * 0.88 + beat * routeWeight * 0.32;
    object.group.visible = routeNode || selected || !object.filtered;
    object.group.position.set(base.x, base.y + lift, base.z);
    object.material.opacity = routeNode || selected ? 1 : 0.2 + energy * 0.22;
    object.material.emissiveIntensity = (routeNode ? 0.46 : 0.16) + band * 0.84 + beat * 0.28;
    object.halo.material.opacity = (routeNode ? 0.17 : 0.04) + band * 0.2 + beat * 0.06;
    object.halo.scale.setScalar(1 + band * (routeNode ? 0.55 : 0.22) + beat * 0.18);
    object.ring.material.opacity = routeNode ? 0.58 + band * 0.36 : 0.16 + band * 0.18;
    object.ring.scale.setScalar((selected ? 1.28 : 1) + band * (routeNode ? 0.34 : 0.12));
    object.sphere.scale.setScalar((selected ? 1.18 : 0.82) + band * (routeNode ? 0.52 : 0.18) + beat * 0.16);
    setNodeLight(object, defaultNodeLightFor(item) + band * 5.2 + beat * 4.6, routeNode || selected || item.group === 'core');
    setBeaconOpacity(object, routeNode ? 0.92 : 0.18 + band * 0.42);
    setDatasetFlag(object.label, 'musicActive', routeNode || selected);
  });
}

function updateMusicEdges(energy, bass, mid, treble, beat, accent) {
  edgeGroup.children.forEach(mesh => {
    const item = mesh.userData.edge;
    const key = `${item.source}|${item.target}|${item.layer}`;
    const routeEdge = MUSIC_FLOW_EDGE_KEYS.has(key) || (MUSIC_FLOW_NODE_IDS.has(item.source) && MUSIC_FLOW_NODE_IDS.has(item.target));
    const layerBand = item.layer === 'UI' ? treble : item.layer === 'API' ? mid : item.layer === 'CLI' ? bass : energy;
    mesh.visible = routeEdge || (!musicMode && mesh.visible);
    if (!routeEdge) {
      mesh.material.opacity = 0.025 + energy * 0.04;
      return;
    }
    mesh.material.opacity = 0.18 + layerBand * 0.62 + beat * 0.16;
    mesh.material.color.copy(accent).lerp(new THREE.Color(LAYER_COLORS[item.layer] || 0xffffff), 0.36);
  });
}

function updateMusicCamera(now, energy, bass, mid, treble, pulse) {
  if (reducedMotion.matches) return;
  const orbit = now * 0.00014;
  const formation = normalizeFormationMode(layoutMode);
  let desired;
  let focus;

  if (formation === 'ring') {
    desired = new THREE.Vector3(
      Math.sin(orbit * 1.8) * (1.6 + treble * 1.8),
      29 + bass * 4.4 + pulse * 0.7,
      Math.cos(orbit * 1.8) * (1.6 + mid * 1.5),
    );
    focus = new THREE.Vector3(0, energy * 0.7, 0);
  } else if (formation === 'layers') {
    desired = cameraPresetFor('layers').position.clone().add(new THREE.Vector3(
      Math.sin(orbit * 1.4) * (2.8 + treble * 2.2),
      bass * 2.4 + pulse * 0.4,
      Math.cos(orbit * 1.2) * (2.2 + mid * 1.7),
    ));
    focus = new THREE.Vector3(0, -0.25 + energy * 1.1, 0);
  } else if (formation === 'lanes') {
    desired = cameraPresetFor('lanes').position.clone().add(new THREE.Vector3(
      Math.sin(orbit * 1.55) * (4.4 + treble * 2.6),
      bass * 3 + pulse * 0.5,
      Math.cos(orbit * 1.35) * (2.4 + mid * 1.8),
    ));
    focus = new THREE.Vector3(0, energy * 0.9, 0);
  } else {
    desired = new THREE.Vector3(
      Math.sin(orbit) * (9.5 + treble * 4),
      8.8 + bass * 3.6 + pulse * 0.8,
      19 + Math.cos(orbit) * (5.5 + mid * 3.2),
    );
    focus = new THREE.Vector3(0, -0.8 + energy * 1.4, 0);
  }

  camera.position.lerp(desired, 0.01 + energy * 0.01);
  controls.target.lerp(focus, 0.018 + energy * 0.012);
}

function musicBandForNode(item = {}, bass, mid, treble, energy) {
  if (item.group === 'media') return Math.max(treble, energy * 0.78);
  if (item.group === 'memory' || item.group === 'archive') return Math.max(mid, energy * 0.7);
  if (item.group === 'core') return Math.max(bass, energy * 0.82);
  if (item.group === 'trust' || item.group === 'ops') return Math.max(mid * 0.8, bass * 0.62);
  if (item.group === 'surface' || item.group === 'app') return Math.max(treble * 0.82, mid * 0.58);
  return energy;
}

function restoreMusicNodeTransforms() {
  nodeObjects.forEach((object, nodeId) => {
    if (object.musicBasePosition) object.group.position.copy(object.musicBasePosition);
    setDatasetFlag(object.label, 'musicActive', false);
    object.halo.scale.setScalar(1);
    if (nodeId !== selectedNodeId) {
      object.ring.scale.setScalar(1);
      object.sphere.scale.setScalar(object.filtered ? 0.74 : 1);
    }
  });
  edgeGroup.children.forEach(mesh => {
    const item = mesh.userData.edge;
    mesh.material.color.set(LAYER_COLORS[item.layer] || 0xffffff);
  });
  musicBars.forEach(bar => {
    bar.scale.y = 0.12;
    bar.position.y = -6.05 + bar.scale.y * 0.5;
    bar.material.opacity = 0.18;
  });
  musicRings.forEach(ring => {
    ring.scale.setScalar(1);
    ring.material.opacity = 0.06;
  });
  updateArmadaVisuals();
}

function updateArmadaAnimation(now, delta) {
  if (!armadaMode) return;
  nodeObjects.forEach((object, nodeId) => {
    if (!object.shipRoot) return;
    object.shipRoot.visible = Boolean(object.group.visible);
    object.sphere.visible = false;
    const hash = (hashString(nodeId) % 1000) / 1000;
    const active = nodeId === selectedNodeId || nodeId === hoveredNodeId || scenarioHighlightIds.has(nodeId);
    const sphereScale = object.sphere.scale.x || 1;
    const baseScale = object.radius * (active ? 2.8 : 2.36);
    const beatScale = musicMode ? 1 + musicState.energy * 0.24 + musicState.beat * 0.12 : 1;
    object.shipRoot.scale.setScalar(baseScale * sphereScale * beatScale);
    object.shipRoot.position.y = Math.sin(now * (0.0014 + hash * 0.0006) + hash * Math.PI * 2) * (active ? 0.1 : 0.055);

    const position = object.group.position;
    const outward = Math.atan2(position.x, position.z || 0.001);
    const patrol = Math.sin(now * (0.0005 + hash * 0.0004) + hash * 8) * 0.16;
    object.shipRoot.rotation.y = outward + patrol;
    object.shipRoot.rotation.z = Math.sin(now * (0.001 + hash * 0.0008) + hash * 5) * (active ? 0.11 : 0.055);

    if (object.shipFallback?.thruster?.material) {
      object.shipFallback.thruster.material.opacity = 0.42 + Math.sin(now * 0.009 + hash * 6) * 0.12 + (musicMode ? musicState.bass * 0.38 : 0);
    }
    object.shipMixer?.update?.(delta * (musicMode ? 1.4 + musicState.energy : 0.9));
  });
}

function nodeName(id) {
  return graphNodes.find(node => node.id === id)?.name || id;
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function openSelectedPreview() {
  const item = graphNodes.find(node => node.id === selectedNodeId);
  if (!item) return;
  const screenshot = screenshotFor(item);
  openPreviewAsset(item.name, screenshot.src, `${item.name} UI screenshot`);
}

function openPreviewAsset(title, src, alt) {
  if (!src) return;
  inspector.previewDialogTitle.textContent = title;
  inspector.previewDialogImage.src = src;
  inspector.previewDialogImage.alt = alt;
  inspector.previewDialog.showModal();
}

function nodeVisualsFor(item = {}) {
  const logoPrompt = nodeImagePrompt(item, 'logo');
  const infographicPrompt = nodeImagePrompt(item, 'infographic');
  return {
    logo: inlineNodeLogo(item),
    infographic: inlineNodeInfographic(item),
    logoPrompt,
    infographicPrompt,
  };
}

function nodeImagePrompt(item = {}, type = 'infographic') {
  const layers = normalizeLayers(item.layers).join(', ') || 'DATA';
  const capabilities = unique(item.capabilities || []).slice(0, 5).join('; ') || 'No capabilities recorded yet';
  const interfaces = unique(item.interfaces || []).slice(0, 5).join('; ') || 'No interfaces recorded yet';
  const outputs = unique(item.outputs || []).slice(0, 5).join('; ') || 'No outputs recorded yet';
  const description = descriptionFor(item).replace(/\s+/g, ' ').trim();
  if (type === 'logo') {
    return [
      'Use case: logo-brand',
      'Asset type: square icon for a Hapa 3D node graph',
      `Primary request: create a vector-friendly Hapa/Astros logo mark for ${item.name || 'a Hapa node'}.`,
      `Node role: ${item.role || 'Local Hapa node'}`,
      `System layers: ${layers}`,
      `Blue Architect description: ${description}`,
      'Style/medium: neon terminal emblem, restrained sci-fi operator HUD, dark local-first console palette, crisp silhouette.',
      'Composition/framing: centered square badge, readable at small sizes, no tiny text except optional initials.',
      'Avoid: photorealism, mascots, clutter, watermark, illegible text, soft decorative blobs.',
    ].join('\n');
  }
  return [
    'Use case: infographic-diagram',
    'Asset type: 16:9 node details infographic for the Hapa Node Space inspector',
    `Primary request: create a stylized operational infographic for ${item.name || 'a Hapa node'}.`,
    `Node role: ${item.role || 'Local Hapa node'}`,
    `Capabilities: ${capabilities}`,
    `Interfaces: ${interfaces}`,
    `Outputs: ${outputs}`,
    `System layers: ${layers}`,
    `Blue Architect description: ${description}`,
    'Style/medium: Hapa/Astros neon command dashboard, grid map, luminous data routes, precise readable panels.',
    'Composition/framing: dense but legible 16:9 layout with title, function, layer lanes, capabilities, and outputs.',
    'Avoid: marketing hero layout, fuzzy abstract gradients, stock-photo people, watermark, unreadable microtext.',
  ].join('\n');
}

function shipImagePromptFor(item = {}, card = shipCardFor(item)) {
  const attributes = SHIP_ATTRIBUTE_LABELS
    .map(([key, label]) => `${label}: ${card.attributes[key]}`)
    .join('; ');
  return [
    'Use case: stylized-concept',
    'Asset type: 16:9 spacecraft concept mock for a Hapa educational game card',
    `Primary request: create a Hapa/Astros style spaceship concept image for ${item.name || 'a Hapa node'}.`,
    `Ship class: ${card.shipClass}`,
    `Node role: ${item.role || 'Local Hapa node'}`,
    `Game doctrine: ${card.doctrine}`,
    `Attributes: ${attributes}`,
    `Skills: ${card.skills.join('; ')}`,
    `Specialties: ${card.specialties.join('; ')}`,
    `Research items: ${card.research.join('; ')}`,
    'Style/medium: cinematic but readable 3D concept art, dark local-sovereign command palette, cyan/fuchsia/gold neon edge lighting, functional spacecraft silhouette.',
    'Composition/framing: centered ship in three-quarter view with subtle HUD callouts, no people, no cockpit closeup, no tiny unreadable text.',
    'Constraints: the design should teach the node function through ship form, such as carriers for app hosts, foundries for production nodes, archive arks for storage, scouts for retrieval, and shielded command vessels for trust nodes.',
    'Avoid: generic Star Wars/Trek look, photoreal clutter, weapons-only warship design, text-heavy posters, watermark.',
  ].join('\n');
}

function inlineShipMock(item = {}, card = shipCardFor(item)) {
  const accent = colorHex(GROUP_COLORS[item.group] || GROUP_COLORS.core);
  const second = colorHex(layerColorFor(item, 0));
  const third = colorHex(layerColorFor(item, 1));
  const stats = card.attributes || {};
  const seed = hashString(`${item.id || item.name || 'node'}-${card.shipClass}`);
  const width = 960;
  const height = 540;
  const centerX = 520;
  const centerY = 250;
  const shipScale = 0.82 + (Number(stats.sizeVolume || 5) / 10) * 0.3;
  const finSpread = 34 + Number(stats.maneuverability || 5) * 5;
  const armor = Number(stats.armor || 5);
  const armament = Number(stats.armament || 5);
  const energy = Number(stats.energyBandwidth || 5);
  const archetype = card.archetype || 'surface';
  const silhouette = shipSilhouettePath(archetype, centerX, centerY, shipScale, finSpread);
  const weaponPods = Array.from({ length: Math.max(1, Math.min(5, Math.round(armament / 2))) }, (_, index) => {
    const y = centerY - 62 + index * (124 / Math.max(1, Math.round(armament / 2) - 1 || 1));
    return `<circle cx="${centerX + 170}" cy="${y.toFixed(1)}" r="${(3 + armament * 0.35).toFixed(1)}" fill="${third}" opacity=".9" filter="url(#ship-glow)"/>`;
  }).join('');
  const moduleCount = Math.max(2, Math.min(8, Math.round((Number(stats.computeBandwidth || 5) + Number(stats.materialsStorage || 5)) / 2)));
  const modules = Array.from({ length: moduleCount }, (_, index) => {
    const x = centerX - 145 + index * (290 / Math.max(1, moduleCount - 1));
    const y = centerY + Math.sin(seededUnit(seed, index) * Math.PI * 2) * 28;
    return `<rect x="${(x - 12).toFixed(1)}" y="${(y - 8).toFixed(1)}" width="24" height="16" rx="5" fill="#020617" stroke="${index % 2 ? second : accent}" stroke-width="2" opacity=".92"/>`;
  }).join('');
  const rings = archetype === 'archive' || archetype === 'carrier'
    ? `<ellipse cx="${centerX - 35}" cy="${centerY}" rx="${(168 * shipScale).toFixed(1)}" ry="${(72 * shipScale).toFixed(1)}" fill="none" stroke="${accent}" stroke-width="3" opacity=".42" transform="rotate(-8 ${centerX - 35} ${centerY})"/>`
    : '';
  const thrust = Array.from({ length: 4 }, (_, index) => {
    const y = centerY - 48 + index * 32;
    const length = 54 + energy * 5 + seededUnit(seed, index + 10) * 16;
    return `<path d="M${centerX - 220} ${y.toFixed(1)} C${centerX - 260 - length} ${(y - 18).toFixed(1)}, ${centerX - 260 - length} ${(y + 18).toFixed(1)}, ${centerX - 220} ${y.toFixed(1)}" fill="${index % 2 ? third : second}" opacity=".34" filter="url(#ship-glow)"/>`;
  }).join('');
  const titleLines = wrapText(card.shipClass, 29, 2);
  const roleLines = wrapText(item.role || card.doctrine, 58, 2);
  const doctrineLines = wrapText(card.doctrine, 60, 3);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeSvg(card.shipClass)} spacecraft mock">
      <defs>
        <linearGradient id="ship-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#07111f"/>
          <stop offset=".58" stop-color="#020617"/>
          <stop offset="1" stop-color="#111827"/>
        </linearGradient>
        <linearGradient id="ship-hull" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#0f172a"/>
          <stop offset=".5" stop-color="${accent}"/>
          <stop offset="1" stop-color="#020617"/>
        </linearGradient>
        <linearGradient id="ship-edge" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="${second}"/>
          <stop offset=".55" stop-color="${accent}"/>
          <stop offset="1" stop-color="${third}"/>
        </linearGradient>
        <filter id="ship-glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="${width}" height="${height}" rx="34" fill="url(#ship-bg)"/>
      <path d="M0 60h960M0 120h960M0 180h960M0 240h960M0 300h960M0 360h960M0 420h960M0 480h960M120 0v540M240 0v540M360 0v540M480 0v540M600 0v540M720 0v540M840 0v540" stroke="#1e3a52" stroke-width="1" opacity=".28"/>
      <rect x="28" y="28" width="904" height="484" rx="24" fill="#020617" fill-opacity=".42" stroke="url(#ship-edge)" stroke-width="2"/>
      <circle cx="${centerX}" cy="${centerY}" r="${(190 * shipScale).toFixed(1)}" fill="${accent}" opacity=".07"/>
      ${rings}
      ${thrust}
      <path d="${silhouette}" fill="url(#ship-hull)" fill-opacity=".58" stroke="url(#ship-edge)" stroke-width="${(2.2 + armor * 0.28).toFixed(1)}" filter="url(#ship-glow)"/>
      ${modules}
      ${weaponPods}
      <circle cx="${centerX + 86}" cy="${centerY}" r="${(18 + Number(stats.computeSpeed || 5) * 1.2).toFixed(1)}" fill="#020617" stroke="${second}" stroke-width="3" filter="url(#ship-glow)"/>
      <text x="56" y="66" fill="${accent}" font-family="Menlo, Consolas, monospace" font-size="13" font-weight="900">HAPA SPACECRAFT CARD MOCK</text>
      ${svgTextLines(titleLines, 56, 110, 31, '#f8fafc', 900, 36)}
      <text x="56" y="182" fill="${third}" font-family="Menlo, Consolas, monospace" font-size="14" font-weight="900">${escapeSvg(String(card.archetype || 'node').toUpperCase())} / ${escapeSvg(String(item.group || 'node').toUpperCase())}</text>
      ${svgTextLines(roleLines, 56, 220, 16, '#dbeafe', 700, 22)}
      <rect x="56" y="296" width="326" height="116" rx="14" fill="#0f172a" fill-opacity=".7" stroke="#334155"/>
      <text x="76" y="325" fill="${second}" font-family="Menlo, Consolas, monospace" font-size="13" font-weight="900">TACTICAL LESSON</text>
      ${svgTextLines(doctrineLines, 76, 354, 14, '#cbd5e1', 600, 20)}
      ${shipStatPill('ARM', stats.armament, 690, 74, third)}
      ${shipStatPill('ARMOR', stats.armor, 790, 74, accent)}
      ${shipStatPill('CPU', stats.computeBandwidth, 690, 126, second)}
      ${shipStatPill('ENERGY', stats.energyBandwidth, 790, 126, third)}
      <text x="56" y="462" fill="#64748b" font-family="Menlo, Consolas, monospace" font-size="12">MOCK GENERATED FROM NODE ROLE, CARD MECHANICS, AND ATTRIBUTE PROFILE</text>
    </svg>
  `;
  return svgDataUri(svg);
}

function shipSilhouettePath(archetype, cx, cy, scale, finSpread) {
  const s = value => (value * scale).toFixed(1);
  const points = {
    carrier: `M${cx - Number(s(230))} ${cy - Number(s(78))} L${cx + Number(s(188))} ${cy - Number(s(34))} L${cx + Number(s(236))} ${cy} L${cx + Number(s(188))} ${cy + Number(s(34))} L${cx - Number(s(230))} ${cy + Number(s(78))} L${cx - Number(s(170))} ${cy + Number(s(24))} L${cx - Number(s(84))} ${cy} L${cx - Number(s(170))} ${cy - Number(s(24))} Z`,
    archive: `M${cx - Number(s(190))} ${cy - Number(s(92))} Q${cx + Number(s(30))} ${cy - Number(s(128))} ${cx + Number(s(204))} ${cy} Q${cx + Number(s(30))} ${cy + Number(s(128))} ${cx - Number(s(190))} ${cy + Number(s(92))} Q${cx - Number(s(150))} ${cy} ${cx - Number(s(190))} ${cy - Number(s(92))} Z`,
    production: `M${cx - Number(s(210))} ${cy - Number(s(54))} L${cx - Number(s(56))} ${cy - Number(s(106))} L${cx + Number(s(190))} ${cy - Number(s(24))} L${cx + Number(s(234))} ${cy} L${cx + Number(s(190))} ${cy + Number(s(24))} L${cx - Number(s(56))} ${cy + Number(s(106))} L${cx - Number(s(210))} ${cy + Number(s(54))} L${cx - Number(s(152))} ${cy} Z`,
    sensor: `M${cx - Number(s(164))} ${cy - Number(s(38))} L${cx + Number(s(214))} ${cy} L${cx - Number(s(164))} ${cy + Number(s(38))} L${cx - Number(s(98))} ${cy} Z M${cx - Number(s(52))} ${cy - finSpread} L${cx + Number(s(44))} ${cy} L${cx - Number(s(52))} ${cy + finSpread} Z`,
    trust: `M${cx - Number(s(162))} ${cy - Number(s(82))} L${cx + Number(s(126))} ${cy - Number(s(62))} L${cx + Number(s(220))} ${cy} L${cx + Number(s(126))} ${cy + Number(s(62))} L${cx - Number(s(162))} ${cy + Number(s(82))} Q${cx - Number(s(216))} ${cy} ${cx - Number(s(162))} ${cy - Number(s(82))} Z`,
    protocol: `M${cx - Number(s(196))} ${cy - Number(s(62))} L${cx - Number(s(22))} ${cy - Number(s(94))} L${cx + Number(s(202))} ${cy - Number(s(18))} L${cx + Number(s(232))} ${cy} L${cx + Number(s(202))} ${cy + Number(s(18))} L${cx - Number(s(22))} ${cy + Number(s(94))} L${cx - Number(s(196))} ${cy + Number(s(62))} L${cx - Number(s(136))} ${cy} Z`,
    legacy: `M${cx - Number(s(224))} ${cy - Number(s(74))} C${cx - Number(s(82))} ${cy - Number(s(118))}, ${cx + Number(s(104))} ${cy - Number(s(88))}, ${cx + Number(s(210))} ${cy - Number(s(12))} L${cx + Number(s(242))} ${cy} L${cx + Number(s(210))} ${cy + Number(s(12))} C${cx + Number(s(104))} ${cy + Number(s(88))}, ${cx - Number(s(82))} ${cy + Number(s(118))}, ${cx - Number(s(224))} ${cy + Number(s(74))} Q${cx - Number(s(176))} ${cy} ${cx - Number(s(224))} ${cy - Number(s(74))} Z`,
    default: `M${cx - Number(s(176))} ${cy - Number(s(58))} L${cx + Number(s(198))} ${cy} L${cx - Number(s(176))} ${cy + Number(s(58))} L${cx - Number(s(112))} ${cy} Z`,
  };
  if (archetype === 'command' || archetype === 'ops') return points.trust;
  if (archetype === 'research' || archetype === 'surface') return points.sensor;
  return points[archetype] || points.default;
}

function shipStatPill(label, value, x, y, color) {
  return `
    <g transform="translate(${x} ${y})">
      <rect width="86" height="34" rx="10" fill="#020617" fill-opacity=".72" stroke="${color}" stroke-width="1.5"/>
      <text x="10" y="14" fill="${color}" font-family="Menlo, Consolas, monospace" font-size="9" font-weight="900">${escapeSvg(label)}</text>
      <text x="74" y="25" text-anchor="end" fill="#f8fafc" font-family="Menlo, Consolas, monospace" font-size="17" font-weight="900">${escapeSvg(value || 0)}</text>
    </g>
  `;
}

function inlineNodeLogo(item = {}) {
  const accent = colorHex(GROUP_COLORS[item.group] || GROUP_COLORS.core);
  const second = colorHex(layerColorFor(item, 0));
  const third = colorHex(layerColorFor(item, 1));
  const initials = initialsFor(item.name || item.id || 'Hapa Node');
  const layers = normalizeLayers(item.layers);
  const seed = hashString(item.id || item.name || 'node');
  const orbit = (offset, radiusX, radiusY) => {
    const tilt = -24 + seededUnit(seed, offset) * 48;
    return `<ellipse cx="128" cy="128" rx="${radiusX}" ry="${radiusY}" fill="none" stroke="${offset % 2 ? third : second}" stroke-width="3" opacity=".5" transform="rotate(${tilt} 128 128)"/>`;
  };
  const layerDots = layers.map((layer, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(layers.length, 1)) * Math.PI * 2;
    const x = 128 + Math.cos(angle) * 88;
    const y = 128 + Math.sin(angle) * 88;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${colorHex(LAYER_COLORS[layer])}"><title>${escapeSvg(layer)}</title></circle>`;
  }).join('');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" role="img" aria-label="${escapeSvg(item.name || 'Hapa node')} logo">
      <defs>
        <radialGradient id="node-logo-bg" cx="50%" cy="42%" r="68%">
          <stop offset="0" stop-color="${accent}" stop-opacity=".34"/>
          <stop offset=".48" stop-color="#07111f" stop-opacity=".94"/>
          <stop offset="1" stop-color="#020617"/>
        </radialGradient>
        <linearGradient id="node-logo-ring" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${second}"/>
          <stop offset=".55" stop-color="${accent}"/>
          <stop offset="1" stop-color="${third}"/>
        </linearGradient>
        <filter id="node-logo-glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect x="10" y="10" width="236" height="236" rx="36" fill="url(#node-logo-bg)" stroke="url(#node-logo-ring)" stroke-width="3"/>
      <path d="M30 66h196M30 128h196M30 190h196M66 30v196M128 30v196M190 30v196" stroke="#1e3a52" stroke-width="1" opacity=".42"/>
      ${orbit(1, 88, 32)}
      ${orbit(2, 76, 48)}
      <circle cx="128" cy="128" r="58" fill="#020617" fill-opacity=".72" stroke="url(#node-logo-ring)" stroke-width="3" filter="url(#node-logo-glow)"/>
      <text x="128" y="142" text-anchor="middle" fill="#f8fafc" font-family="Menlo, Consolas, monospace" font-size="${initials.length > 2 ? 46 : 58}" font-weight="900">${escapeSvg(initials)}</text>
      <text x="128" y="181" text-anchor="middle" fill="${accent}" font-family="Menlo, Consolas, monospace" font-size="13" font-weight="900">${escapeSvg(String(item.group || 'NODE').toUpperCase())}</text>
      ${layerDots}
    </svg>
  `;
  return svgDataUri(svg);
}

function inlineNodeInfographic(item = {}) {
  const accent = colorHex(GROUP_COLORS[item.group] || GROUP_COLORS.core);
  const second = colorHex(layerColorFor(item, 0));
  const third = colorHex(layerColorFor(item, 1));
  const layers = normalizeLayers(item.layers);
  const titleLines = wrapText(item.name || 'Hapa Node', 27, 2);
  const roleLines = wrapText(item.role || 'Local Hapa node', 72, 3);
  const descriptionLines = wrapText(descriptionFor(item), 88, 4);
  const capabilities = unique(item.capabilities?.length ? item.capabilities : item.interfaces || []).slice(0, 4);
  const outputs = unique(item.outputs?.length ? item.outputs : ['relationship records', 'operator context']).slice(0, 4);
  const interfaces = unique(item.interfaces?.length ? item.interfaces : normalizeLayers(item.layers).map(layer => `${layer} surface`)).slice(0, 3);
  const seed = hashString(item.id || item.name || 'node');
  const pathA = flowPath(seed, 1);
  const pathB = flowPath(seed, 2);
  const layerCards = layers.map((layer, index) => {
    const x = 46 + index * 102;
    return `
      <g transform="translate(${x} 392)">
        <rect width="84" height="56" rx="10" fill="#020617" fill-opacity=".66" stroke="${colorHex(LAYER_COLORS[layer])}" stroke-width="1.5"/>
        <circle cx="18" cy="20" r="5" fill="${colorHex(LAYER_COLORS[layer])}"/>
        <text x="18" y="42" fill="#f8fafc" font-family="Menlo, Consolas, monospace" font-size="16" font-weight="900">${escapeSvg(layer)}</text>
      </g>
    `;
  }).join('');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${escapeSvg(item.name || 'Hapa node')} infographic">
      <defs>
        <linearGradient id="node-art-bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#07111f"/>
          <stop offset=".55" stop-color="#020617"/>
          <stop offset="1" stop-color="#0b1020"/>
        </linearGradient>
        <linearGradient id="node-art-line" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="${second}"/>
          <stop offset=".52" stop-color="${accent}"/>
          <stop offset="1" stop-color="${third}"/>
        </linearGradient>
        <filter id="node-art-glow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="960" height="540" rx="34" fill="url(#node-art-bg)"/>
      <path d="M0 60h960M0 120h960M0 180h960M0 240h960M0 300h960M0 360h960M0 420h960M0 480h960M120 0v540M240 0v540M360 0v540M480 0v540M600 0v540M720 0v540M840 0v540" stroke="#1e3a52" stroke-width="1" opacity=".36"/>
      <rect x="28" y="28" width="904" height="484" rx="24" fill="#020617" fill-opacity=".58" stroke="${accent}" stroke-width="2"/>
      <path d="${pathA}" fill="none" stroke="${second}" stroke-width="4" opacity=".72" filter="url(#node-art-glow)"/>
      <path d="${pathB}" fill="none" stroke="${third}" stroke-width="3" stroke-dasharray="12 14" opacity=".62"/>
      <circle cx="742" cy="174" r="74" fill="#020617" fill-opacity=".72" stroke="url(#node-art-line)" stroke-width="3" filter="url(#node-art-glow)"/>
      <text x="742" y="187" text-anchor="middle" fill="#f8fafc" font-family="Menlo, Consolas, monospace" font-size="46" font-weight="900">${escapeSvg(initialsFor(item.name || item.id || 'Hapa Node'))}</text>
      <text x="46" y="64" fill="${accent}" font-family="Menlo, Consolas, monospace" font-size="13" font-weight="900">HAPA / NODE INFOGRAPHIC</text>
      ${svgTextLines(titleLines, 46, 106, 34, '#f8fafc', 900, 38)}
      <text x="46" y="176" fill="${accent}" font-family="Menlo, Consolas, monospace" font-size="15" font-weight="900">${escapeSvg(String(item.group || 'node').toUpperCase())} / ${escapeSvg(item.status || 'Mapped')}</text>
      ${svgTextLines(roleLines, 46, 213, 20, '#dbeafe', 700, 27)}
      <rect x="46" y="290" width="420" height="82" rx="14" fill="#0f172a" fill-opacity=".68" stroke="#334155"/>
      <text x="66" y="318" fill="${second}" font-family="Menlo, Consolas, monospace" font-size="13" font-weight="900">BLUE ARCHITECT READ</text>
      ${svgTextLines(descriptionLines.slice(0, 3), 66, 346, 15, '#cbd5e1', 600, 19)}
      <rect x="508" y="280" width="374" height="96" rx="14" fill="#0f172a" fill-opacity=".68" stroke="#334155"/>
      <text x="528" y="309" fill="${third}" font-family="Menlo, Consolas, monospace" font-size="13" font-weight="900">CAPABILITIES</text>
      ${svgBulletLines(capabilities, 528, 338, 22, accent)}
      <rect x="508" y="396" width="178" height="76" rx="14" fill="#020617" fill-opacity=".7" stroke="#334155"/>
      <text x="526" y="424" fill="${second}" font-family="Menlo, Consolas, monospace" font-size="12" font-weight="900">INTERFACES</text>
      ${svgBulletLines(interfaces, 526, 449, 18, second, 32)}
      <rect x="704" y="396" width="178" height="76" rx="14" fill="#020617" fill-opacity=".7" stroke="#334155"/>
      <text x="722" y="424" fill="${third}" font-family="Menlo, Consolas, monospace" font-size="12" font-weight="900">OUTPUTS</text>
      ${svgBulletLines(outputs, 722, 449, 18, third, 32)}
      ${layerCards}
      <text x="46" y="488" fill="#64748b" font-family="Menlo, Consolas, monospace" font-size="12">PROMPTED FROM NODE ROLE, LAYERS, CAPABILITIES, OUTPUTS, AND BLUE ARCHITECT DESCRIPTION</text>
    </svg>
  `;
  return svgDataUri(svg);
}

function svgDataUri(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s{2,}/g, ' ').trim())}`;
}

function colorHex(value) {
  return `#${Number(value || 0).toString(16).padStart(6, '0')}`;
}

function layerColorFor(item = {}, index = 0) {
  const layers = normalizeLayers(item.layers);
  return LAYER_COLORS[layers[index % Math.max(layers.length, 1)]] || GROUP_COLORS[item.group] || GROUP_COLORS.core;
}

function initialsFor(value) {
  const words = String(value || 'H')
    .replace(/^hapa[\s-]*/i, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const base = words.length ? words : String(value || 'H').split(/\s+/);
  const initials = base.slice(0, 3).map(word => word[0]).join('').toUpperCase();
  return initials || 'H';
}

function wrapText(value, maxChars = 54, maxLines = 3) {
  const words = String(value || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let current = '';
  words.forEach(word => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.,;:]+$/g, '')}...`;
    return kept;
  }
  return lines.length ? lines : ['Mapped Hapa node'];
}

function svgTextLines(lines, x, y, size, fill, weight = 700, lineHeight = 24) {
  return lines.map((line, index) => (
    `<text x="${x}" y="${y + index * lineHeight}" fill="${fill}" font-family="Menlo, Consolas, monospace" font-size="${size}" font-weight="${weight}">${escapeSvg(line)}</text>`
  )).join('');
}

function svgBulletLines(items, x, y, lineHeight, color, maxChars = 48) {
  const list = (items?.length ? items : ['No records yet']).slice(0, 4);
  return list.map((item, index) => {
    const text = wrapText(item, maxChars, 1)[0];
    const lineY = y + index * lineHeight;
    return `<g><circle cx="${x}" cy="${lineY - 5}" r="4" fill="${color}" filter="url(#node-art-glow)"/><text x="${x + 15}" y="${lineY}" fill="#cbd5e1" font-family="Menlo, Consolas, monospace" font-size="13" font-weight="700">${escapeSvg(text)}</text></g>`;
  }).join('');
}

function flowPath(seed, offset) {
  const x1 = 520 + seededUnit(seed, offset) * 70;
  const y1 = 86 + seededUnit(seed, offset + 5) * 70;
  const x2 = 690 + seededUnit(seed, offset + 10) * 70;
  const y2 = 248 + seededUnit(seed, offset + 15) * 56;
  const x3 = 858 - seededUnit(seed, offset + 20) * 40;
  const y3 = 122 + seededUnit(seed, offset + 25) * 250;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} C${(x1 + 90).toFixed(1)} ${(y1 - 44).toFixed(1)}, ${(x2 - 60).toFixed(1)} ${(y2 + 62).toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)} S${(x3 - 90).toFixed(1)} ${(y3 - 58).toFixed(1)}, ${x3.toFixed(1)} ${y3.toFixed(1)}`;
}

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed, step = 0) {
  const x = Math.sin(seed * 0.0001 + step * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function screenshotFor(item) {
  const known = NODE_SCREENSHOTS[item.id] || NODE_SCREENSHOTS[slug(item.name)];
  if (known) return known;
  const fallbackLabel = normalizeLayers(item.layers).includes('UI') ? 'UI screenshot pending' : 'Node console preview';
  return {
    src: inlineNodePreview(item),
    label: fallbackLabel,
  };
}

function inlineNodePreview(item) {
  const color = `#${(GROUP_COLORS[item.group] || GROUP_COLORS.core).toString(16).padStart(6, '0')}`;
  const layers = normalizeLayers(item.layers).join(' / ') || 'DATA';
  const role = String(item.role || 'Local Hapa node').slice(0, 108);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#07111f"/>
          <stop offset="1" stop-color="#020617"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="480" height="270" fill="url(#bg)"/>
      <path d="M0 54h480M0 108h480M0 162h480M0 216h480M96 0v270M192 0v270M288 0v270M384 0v270" stroke="#1e3a52" stroke-width="1" opacity=".55"/>
      <rect x="22" y="22" width="436" height="226" rx="18" fill="#020617" opacity=".62" stroke="${color}" stroke-width="2"/>
      <circle cx="58" cy="58" r="10" fill="${color}" filter="url(#glow)"/>
      <text x="82" y="63" fill="#f8fafc" font-family="Menlo, monospace" font-size="20" font-weight="800">${escapeSvg(item.name)}</text>
      <text x="32" y="112" fill="${color}" font-family="Menlo, monospace" font-size="13" font-weight="800">${escapeSvg(String(item.group || 'node').toUpperCase())} / ${escapeSvg(layers)}</text>
      <text x="32" y="151" fill="#cbd5e1" font-family="Menlo, monospace" font-size="15">${escapeSvg(role)}</text>
      <text x="32" y="222" fill="#64748b" font-family="Menlo, monospace" font-size="12">HAPA NODE SPACE / LOCAL UI PREVIEW</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function parseSheet(text) {
  const rows = splitTable(text);
  const appExtract = extractDevProtoApps(rows);
  const header = rows[0] || [];
  const headerNames = new Set(['node', 'name', 'app', 'service', 'role', 'description', 'purpose', 'blue architect description', 'tts description', 'narration', 'description string', 'capability', 'capabilities', 'features', 'ui', 'api', 'cli', 'interfaces', 'produces', 'maintains', 'outputs', 'path', 'local path', 'status']);
  const hasHeader = header.some(cell => headerNames.has(cell.trim().toLowerCase()));
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const headerMap = new Map(header.map((cell, index) => [cell.trim().toLowerCase(), index]));
  const nodes = [];
  dataRows.forEach((row, index) => {
    const rowIndex = hasHeader ? index + 1 : index;
    if (appExtract.ignoredRows.has(rowIndex)) return;
    const item = hasHeader ? nodeFromHeaderRow(row, headerMap, index) : nodeFromLooseRow(row, index);
    if (item) nodes.push(item);
  });
  const byId = new Map();
  [...nodes, ...appExtract.nodes].forEach(item => byId.set(item.id, item));
  const mergedNodes = Array.from(byId.values());
  const edges = mergeEdges([...appExtract.edges, ...synthesizeSheetEdges(mergedNodes)]);
  return { nodes: mergedNodes, edges };
}

function nodeFromHeaderRow(row, headerMap, index) {
  const read = (...names) => {
    for (const name of names) {
      const idx = headerMap.get(name);
      if (idx != null && row[idx]) return row[idx].trim();
    }
    return '';
  };
  const name = read('node', 'name', 'app', 'service');
  if (!name) return null;
  const role = read('role', 'description', 'purpose') || row.filter(Boolean).slice(1, 4).join(' | ');
  const layers = inferLayers(`${role} ${read('ui')} ${read('api')} ${read('cli')}`);
  const capabilities = compactSplit([read('capability'), read('capabilities'), read('features')].join('; '));
  const item = {
    id: slug(name),
    name,
    group: inferGroup(name, role),
    status: read('status') || 'Sheet',
    layers,
    role,
    path: read('path', 'local path') || 'spreadsheet row',
    interfaces: compactSplit([read('ui'), read('api'), read('cli'), read('interfaces')].join('; ')),
    outputs: compactSplit([read('produces'), read('maintains'), read('outputs')].join('; ')),
    capabilities,
  };
  item.description = read('blue architect description', 'tts description', 'narration', 'description string') || descriptionFor(item);
  return item;
}

function nodeFromLooseRow(row, index) {
  const first = row.findIndex(cell => /hapa|world|overwatch|cymatica|consul|master|library|forge/i.test(cell || ''));
  if (first === -1) return null;
  const name = row[first].trim();
  const id = slug(name) || `sheet-node-${index + 1}`;
  const rest = row.slice(first + 1).filter(Boolean);
  const appNamesInRow = rest.filter(isDevProtoAppName);
  const descriptiveCells = rest.filter(value => !isDevProtoAppName(value));
  const isDevProto = id === 'hapa-dev-proto';
  const role = descriptiveCells.slice(0, 3).join(' | ') || rest.slice(0, 3).join(' | ') || 'Spreadsheet node row';
  const item = {
    id,
    name,
    group: inferGroup(name, role),
    status: index === 0 ? 'Core' : 'Sheet',
    layers: inferLayers(`${name} ${rest.join(' ')}`),
    role,
    path: 'spreadsheet row',
    interfaces: isDevProto && appNamesInRow.length ? appNamesInRow : rest.slice(0, 6),
    outputs: isDevProto && appNamesInRow.length ? ['app launcher column', 'node capability surface'] : rest.slice(6, 12),
    capabilities: isDevProto && appNamesInRow.length
      ? unique(['Hosts the app column from the sheet', ...appNamesInRow.map(value => `Opens ${value}`)])
      : rest.slice(0, 6),
  };
  item.description = descriptionFor(item);
  return item;
}

function extractDevProtoApps(rows) {
  const appBySlug = new Map(DEV_PROTO_APPS.map(app => [slug(app.name), app]));
  const appRowIndex = rows.findIndex(row => row.some(cell => slug(cell) === 'hapa-dev-proto') && row.some(cell => appBySlug.has(slug(cell))));
  if (appRowIndex === -1) return { nodes: [], edges: [], ignoredRows: new Set() };

  const appRow = rows[appRowIndex];
  const appColumns = new Map();
  appRow.forEach((cell, colIndex) => {
    const app = appBySlug.get(slug(cell));
    if (app) appColumns.set(colIndex, app);
  });

  const ignoredRows = new Set();
  const nodes = Array.from(appColumns.entries()).map(([colIndex, app]) => {
    const columnCapabilities = [];
    for (let rowIndex = appRowIndex + 1; rowIndex < Math.min(rows.length, appRowIndex + 4); rowIndex += 1) {
      const row = rows[rowIndex] || [];
      const value = row[colIndex]?.trim();
      const leadingNode = row.slice(0, 2).some(cell => looksLikeNodeName(cell));
      if (!leadingNode && rowHasAppColumnValue(row, appColumns)) ignoredRows.add(rowIndex);
      if (!leadingNode && value && !appBySlug.has(slug(value))) columnCapabilities.push(value);
    }
    return devProtoAppNode({
      ...app,
      role: columnCapabilities[0] || app.role,
      capabilities: unique([...columnCapabilities, ...app.capabilities]),
    });
  });

  return {
    nodes,
    edges: nodes.map(item => edge('hapa-dev-proto', item.id, 'UI', `opens ${item.name}`)),
    ignoredRows,
  };
}

function rowHasAppColumnValue(row, appColumns) {
  return Array.from(appColumns.keys()).some(colIndex => Boolean(row[colIndex]?.trim()));
}

function looksLikeNodeName(value) {
  return /hapa|world|overwatch|cymatica|consul|master|library|forge/i.test(value || '');
}

function isDevProtoAppName(value) {
  const appNames = new Set(DEV_PROTO_APPS.map(app => slug(app.name)));
  return appNames.has(slug(value));
}

function synthesizeSheetEdges(nodes) {
  const ids = new Set(nodes.map(item => item.id));
  const hub = ids.has('hapa-dev-proto') ? 'hapa-dev-proto' : nodes[0]?.id;
  const edges = [];
  nodes.forEach(item => {
    if (!hub || item.id === hub) return;
    const layer = item.layers.includes('UI') ? 'UI' : item.layers.includes('API') ? 'API' : item.layers.includes('CLI') ? 'CLI' : 'DATA';
    edges.push(edge(hub, item.id, layer, 'sheet-derived dependency'));
    if (item.group === 'memory' && ids.has('world-building-wiki') && item.id !== 'world-building-wiki') {
      edges.push(edge('world-building-wiki', item.id, 'DATA', 'canon relationship'));
    }
  });
  return edges;
}

function mergeEdges(edges) {
  const seen = new Set();
  return edges.filter(item => {
    const key = `${item.source}|${item.target}|${item.layer}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function splitTable(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map(line => line.replace(/\s+$/g, '')).filter(line => line.trim());
  const delimiter = lines.some(line => line.includes('\t')) ? '\t' : ',';
  return lines.map(line => splitLine(line, delimiter).map(cell => cell.trim())).filter(row => row.some(Boolean));
}

function splitLine(line, delimiter) {
  if (delimiter === '\t') return line.split('\t');
  const out = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') {
      cell += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      out.push(cell);
      cell = '';
    } else {
      cell += ch;
    }
  }
  out.push(cell);
  return out;
}

function inferGroup(name, role = '') {
  const text = `${name} ${role}`.toLowerCase();
  const normalizedName = slug(name);
  if (normalizedName === 'hapa' || normalizedName === 'hapa-dev-proto') return 'core';
  if (normalizedName === 'overwatch') return 'ops';
  const appNames = new Set(DEV_PROTO_APPS.flatMap(app => [app.id, slug(app.name)]));
  if (appNames.has(normalizedName)) return 'app';
  if (/wiki|lance|lore|janus|knowledge|canon|memory/.test(text)) return 'memory';
  if (/media|ltx|mlx|avatar|song|comic|audio|video|image|llada|cymatica|stem/.test(text)) return 'media';
  if (/key|crypto|agent-registry|identity|auth|sign/.test(text)) return 'trust';
  if (/telemetry|task|overwatch|quest|backlog/.test(text)) return 'ops';
  if (/chat|viewer|dashboard|master|library|game|space|surface/.test(text)) return 'surface';
  if (/anvil|forge|consul|spec|protocol|cultivation/.test(text)) return 'protocol';
  if (/og|archive/.test(text)) return 'archive';
  if (/prototype|thor/.test(text)) return 'feature';
  return 'core';
}

function inferLayers(text) {
  const lower = text.toLowerCase();
  const layers = new Set();
  if (/ui|view|viewer|dashboard|library|chat|game|screen|front door|console|panel/.test(lower)) layers.add('UI');
  if (/api|endpoint|service|node|queue|generate|create|auth|encrypt|registry|telemetry/.test(lower)) layers.add('API');
  if (/cli|script|repo|local|maintain|backlog|export|import/.test(lower)) layers.add('CLI');
  if (/data|memory|wiki|canon|card|asset|ledger|state|metadata|index|vector|prompt/.test(lower)) layers.add('DATA');
  if (!layers.size) layers.add('DATA');
  return Array.from(layers);
}

function normalizeLayers(layers = []) {
  return layers.map(layer => String(layer).toUpperCase()).filter(layer => LAYER_COLORS[layer]);
}

function compactSplit(text) {
  return text.split(/[;|]/).map(item => item.trim()).filter(Boolean);
}

function unique(items) {
  return Array.from(new Set(items.map(item => String(item || '').trim()).filter(Boolean)));
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'node';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function escapeSvg(value) {
  return escapeHtml(value);
}

function animate() {
  requestAnimationFrame(animate);
  frameIndex += 1;
  const now = performance.now();
  frameDeltaSeconds = lastFrameAt ? Math.min(0.05, Math.max(0.001, (now - lastFrameAt) / 1000)) : 0.016;
  lastFrameAt = now;
  if (!reducedMotion.matches) {
    stars.rotation.y += 0.00018;
    ecosystemGroup.rotation.y += 0.00026;
    if (frameIndex % 2 === 0) {
      nodeObjects.forEach((object, id) => {
        object.ring.rotation.z += id === selectedNodeId ? 0.036 : 0.012;
      });
    }
  }
  updateScenario(now);
  updateScenarioVoiceoverVisualization(now);
  updateMusicVisualization(now);
  updateArmadaAnimation(now, frameDeltaSeconds);
  updateBackgroundGeometry(now);
  controls.update();
  renderer.render(scene, camera);
  if (frameIndex % LABEL_RENDER_INTERVAL === 0 || scenarioRunning || hoveredNodeId) {
    labelRenderer.render(scene, camera);
  }
}

try {
  bootstrap();
} catch (error) {
  console.error(error);
  document.body.insertAdjacentHTML('beforeend', `<div class="load-error"><div><h1>Node Space failed to start</h1><p>${escapeHtml(error.message)}</p></div></div>`);
}
