
const demoTracks = [
  { id: "demo-1", title: "Midnight Drive", artist: "Diskon Radio", demo: true, color: "#b9f56a" },
  { id: "demo-2", title: "Golden Hour", artist: "Diskon Radio", demo: true, color: "#e6a56d" },
  { id: "demo-3", title: "Afterglow", artist: "Diskon Radio", demo: true, color: "#a98be8" },
  { id: "demo-4", title: "Cloud Nine", artist: "Diskon Radio", demo: true, color: "#73c9c0" }
];

let tracks = [...demoTracks];
let liked = new Set();
let currentTrack = null;
let currentTab = "Home";

const audio = document.querySelector("#audioPlayer");
const list = document.querySelector("#trackList");
const search = document.querySelector("#searchInput");
const empty = document.querySelector("#emptyMessage");

function visibleTracks() {
  const query = search.value.trim().toLowerCase();

  return tracks.filter(track => {
    const matchesSearch =
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query);

    const matchesTab =
      currentTab !== "Liked" || liked.has(track.id);

    return matchesSearch && matchesTab;
  });
}

function renderTracks() {
  const shown = visibleTracks();

  list.innerHTML = "";
  document.querySelector("#trackCount").textContent =
    `${shown.length} track${shown.length === 1 ? "" : "s"}`;

  document.querySelector("#listTitle").textContent =
    currentTab === "Liked" ? "Your liked songs" :
    currentTab === "Search" ? "Search results" :
    "Made for your mood";

  empty.hidden = shown.length > 0;

  shown.forEach(track => {
    const row = document.createElement("div");
    row.className = "track-row";

    const cover = document.createElement("div");
    cover.className = "track-cover";
    cover.style.background = track.color;
    cover.textContent = "♫";

    const meta = document.createElement("div");
    meta.className = "track-meta";

    const title = document.createElement("strong");
    title.textContent = track.title;

    const artist = document.createElement("span");
    artist.textContent = track.artist;

    meta.append(title, artist);

    const play = document.createElement("button");
    play.className = "icon-btn";
    play.textContent =
      currentTrack?.id === track.id && !audio.paused ? "Ⅱ" : "▶";
    play.setAttribute("aria-label", `Play ${track.title}`);
    play.addEventListener("click", () => playTrack(track));

    const heart = document.createElement("button");
    heart.className = "icon-btn" +
      (liked.has(track.id) ? " liked" : "");
    heart.textContent = liked.has(track.id) ? "♥" : "♡";
    heart.setAttribute("aria-label", `Like ${track.title}`);
    heart.addEventListener("click", () => {
      if (liked.has(track.id)) {
        liked.delete(track.id);
      } else {
        liked.add(track.id);
      }
      renderTracks();
    });

    row.append(cover, meta, play, heart);
    list.append(row);
  });
}

async function playTrack(track) {
  if (track.demo) {
    setStatus("Demo track — add an audio file to hear music.");
    return;
  }

  if (currentTrack?.id === track.id) {
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setStatus("Couldn't play this file. Try another audio file.");
      }
    } else {
      audio.pause();
    }
    updatePlayer();
    renderTracks();
    return;
  }

  currentTrack = track;
  audio.src = track.url;

  document.querySelector("#playerTitle").textContent = track.title;
  document.querySelector("#playerArtist").textContent = track.artist;
  document.querySelector("#playerCover").textContent = "♫";

  try {
    await audio.play();
    setStatus("Now playing ♪");
  } catch {
    setStatus("Playback failed. Try another audio file.");
  }

  updatePlayer();
  renderTracks();
}

function updatePlayer() {
  document.querySelector("#playBtn").textContent =
    audio.paused ? "▶" : "Ⅱ";
  document.querySelector("#playBtn").setAttribute(
    "aria-label", audio.paused ? "Play" : "Pause"
  );
}

function setStatus(message) {
  document.querySelector("#playerStatus").textContent = message;
}

document.querySelector("#uploadBtn").addEventListener("click", () => {
  document.querySelector("#fileInput").click();
});

document.querySelector("#fileInput").addEventListener("change", event => {
  const files = Array.from(event.target.files || []);

  files.forEach(file => {
    if (!file.type.startsWith("audio/")) return;

    tracks.push({
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^.]+$/, ""),
      artist: "Your device",
      url: URL.createObjectURL(file),
      demo: false,
      color: "#b9f56a"
    });
  });

  currentTab = "Home";
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === "Home");
  });

  renderTracks();
  setStatus(files.length ? "Your music was added." : "No files selected.");
  event.target.value = "";
});

search.addEventListener("input", () => {
  currentTab = "Search";
  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === "Search");
  });
  renderTracks();
});

document.querySelectorAll(".nav-btn").forEach(button => {
  button.addEventListener("click", () => {
    currentTab = button.dataset.tab;
    document.querySelectorAll(".nav-btn").forEach(nav => {
      nav.classList.toggle("active", nav === button);
    });
    if (currentTab !== "Search") search.value = "";
    document.querySelector("#pageTitle").textContent =
      currentTab === "Liked" ? "Your favorites." :
      currentTab === "Search" ? "Find your next favorite." :
      "Your music. Your way.";
    renderTracks();
  });
});

document.querySelector("#exploreBtn").addEventListener("click", () => {
  document.querySelector(".section").scrollIntoView({
    behavior: "smooth"
  });
});

document.querySelector("#playBtn").addEventListener("click", async () => {
  if (!currentTrack) {
    setStatus("Add an audio file, then choose a track.");
    return;
  }
  await playTrack(currentTrack);
});

function playNext(direction) {
  const playable = tracks.filter(track => !track.demo);
  if (!playable.length) {
    setStatus("Add your own audio files to play music.");
    return;
  }

  let index = playable.findIndex(track => track.id === currentTrack?.id);
  index = index < 0 ? 0 : (index + direction + playable.length) % playable.length;
  playTrack(playable[index]);
}

document.querySelector("#nextBtn").addEventListener("click", () => playNext(1));
document.querySelector("#prevBtn").addEventListener("click", () => playNext(-1));

audio.addEventListener("play", () => {
  updatePlayer();
  renderTracks();
});
audio.addEventListener("pause", () => {
  updatePlayer();
  renderTracks();
});
audio.addEventListener("ended", () => playNext(1));
audio.addEventListener("error", () => {
  if (currentTrack) setStatus("Audio couldn't be loaded.");
});

renderTracks();
