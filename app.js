/* =========================================================
   AI NEWSROOM STUDIO
   Production Controller
   ========================================================= */

const $ = (id) => document.getElementById(id);

const state = {
  videoUrl: null,
  logoUrl: null,
  videoFile: null,
  logoFile: null,
  projectName: "UNTITLED BULLETIN",
  analyzed: false,
  produced: false,
  scenes: [],
  theme: "classic",
  graphicsOpacity: 1,
  logoOpacity: 0.9
};

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initialise();
});

function initialise() {
  bindVideoControls();
  bindMediaImport();
  bindGraphicsControls();
  bindTabs();
  bindAIControls();
  bindProjectControls();

  updateClockDisplay();
  updateGraphics();
  updateStatus("READY");
}

/* =========================================================
   VIDEO IMPORT
   ========================================================= */

function bindMediaImport() {
  $("videoFile").addEventListener("change", handleVideoImport);
  $("logoFile").addEventListener("change", handleLogoImport);

  $("bulletinName").addEventListener("input", () => {
    const value = $("bulletinName").value.trim();

    state.projectName = value || "UNTITLED BULLETIN";
    $("projectName").textContent = state.projectName;
  });
}

function handleVideoImport(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("video/")) {
    alert("Please select a valid video file.");
    return;
  }

  if (state.videoUrl) {
    URL.revokeObjectURL(state.videoUrl);
  }

  state.videoFile = file;
  state.videoUrl = URL.createObjectURL(file);

  const video = $("video");

  video.src = state.videoUrl;
  video.style.display = "block";

  $("empty").style.display = "none";
  $("liveBadge").style.display = "block";

  $("mediaStatus").textContent = "Imported";
  $("videoClip").textContent = file.name;

  video.load();

  video.addEventListener(
    "loadedmetadata",
    () => {
      $("duration").textContent = formatTime(video.duration);
      $("seek").value = 0;

      updateMediaInfo(file, video);
      updateStatus("MEDIA READY");
    },
    { once: true }
  );
}

function handleLogoImport(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image logo.");
    return;
  }

  if (state.logoUrl) {
    URL.revokeObjectURL(state.logoUrl);
  }

  state.logoFile = file;
  state.logoUrl = URL.createObjectURL(file);

  createLogoGraphic();

  $("mediaStatus").textContent = "Video + Logo";
}

function updateMediaInfo(file, video) {
  const container = $("mediaInfo");

  const sizeMB = (file.size / 1024 / 1024).toFixed(1);

  container.innerHTML = `
    <div class="mediaCard">
      <strong>VIDEO</strong><br>
      ${escapeHTML(file.name)}<br>
      <small>${sizeMB} MB</small>
    </div>

    <div class="mediaCard">
      <strong>FORMAT</strong><br>
      ${video.videoWidth} × ${video.videoHeight}<br>
      <small>${formatTime(video.duration)}</small>
    </div>

    <div class="mediaCard">
      <strong>STATUS</strong><br>
      READY<br>
      <small>Playable</small>
    </div>
  `;
}

/* =========================================================
   VIDEO CONTROLS
   ========================================================= */

function bindVideoControls() {
  const video = $("video");

  $("play").addEventListener("click", () => {
    if (!video.src) {
      alert("Import a news video first.");
      return;
    }

    video.play();
    updateStatus("PLAYING");
  });

  $("pause").addEventListener("click", () => {
    video.pause();
    updateStatus("PAUSED");
  });

  $("back").addEventListener("click", () => {
    video.currentTime = Math.max(0, video.currentTime - 5);
  });

  $("forward").addEventListener("click", () => {
    video.currentTime = Math.min(
      video.duration || 0,
      video.currentTime + 5
    );
  });

  $("fullscreen").addEventListener("click", () => {
    const stage = document.querySelector(".stage");

    if (!document.fullscreenElement) {
      stage.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  });

  $("seek").addEventListener("input", () => {
    if (!video.duration) return;

    video.currentTime =
      (Number($("seek").value) / 100) * video.duration;
  });

  video.addEventListener("timeupdate", () => {
    if (!video.duration) return;

    $("seek").value =
      (video.currentTime / video.duration) * 100;

    $("current").textContent =
      formatTime(video.currentTime);
  });

  video.addEventListener("ended", () => {
    updateStatus("PLAYBACK COMPLETE");
  });
}

/* =========================================================
   GRAPHICS ENGINE
   ========================================================= */

function createLogoGraphic() {
  let logo = document.querySelector(".broadcast-logo");

  if (!logo) {
    logo = document.createElement("img");
    logo.className = "broadcast-logo";
    $(".stage").appendChild(logo);
  }

  logo.src = state.logoUrl;
  logo.style.opacity = state.logoOpacity;
  logo.style.display = $("showLogo").checked ? "block" : "none";
}

function createLowerThird() {
  let graphic = document.querySelector(".broadcast-lower-third");

  if (!graphic) {
    graphic = document.createElement("div");
    graphic.className = "broadcast-lower-third";

    graphic.innerHTML = `
      <div class="name"></div>
      <div class="title"></div>
    `;

    $(".stage").appendChild(graphic);
  }

  graphic.querySelector(".name").textContent =
    $("lowerText").value || "NEWS PRESENTER";

  graphic.querySelector(".title").textContent =
    $("lowerTitle").value || "NEWS";

  graphic.style.display =
    $("showLower").checked ? "block" : "none";
}

function createHeadline() {
  let graphic = document.querySelector(".broadcast-headline");

  if (!graphic) {
    graphic = document.createElement("div");
    graphic.className = "broadcast-headline";

    $(".stage").appendChild(graphic);
  }

  graphic.textContent =
    $("screenHeadline").value ||
    $("headline").value ||
    "LATEST NEWS";

  graphic.style.display =
    $("showHeadline").checked ? "block" : "none";
}

function createTicker() {
  let graphic = document.querySelector(".broadcast-ticker");

  if (!graphic) {
    graphic = document.createElement("div");
    graphic.className = "broadcast-ticker";

    const span = document.createElement("span");

    graphic.appendChild(span);
    $(".stage").appendChild(graphic);
  }

  graphic.querySelector("span").textContent =
    $("ticker").value ||
    "LATEST NEWS • EDUCATION • COMMUNITY • SPORTS • WEATHER";

  graphic.style.display =
    $("showTicker").checked ? "flex" : "none";
}

function updateGraphics() {
  createLowerThird();
  createHeadline();
  createTicker();

  const opacity = Number($("gfxOpacity").value);

  document
    .querySelectorAll(
      ".broadcast-lower-third, .broadcast-headline, .broadcast-ticker"
    )
    .forEach((element) => {
      element.style.opacity = opacity;
    });

  if (state.logoUrl) {
    createLogoGraphic();
  }
}

function bindGraphicsControls() {
  [
    "lowerText",
    "lowerTitle",
    "screenHeadline",
    "ticker",
    "gfxOpacity",
    "logoOpacity",
    "showLower",
    "showHeadline",
    "showTicker",
    "showLogo"
  ].forEach((id) => {
    $(id).addEventListener("input", updateGraphics);
    $(id).addEventListener("change", updateGraphics);
  });

  $("headline").addEventListener("input", () => {
    if (!$("screenHeadline").value) {
      updateGraphics();
    }
  });

  $("theme").addEventListener("change", () => {
    state.theme = $("theme").value;
    applyTheme(state.theme);
  });
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;

  if (theme === "dark") {
    document.documentElement.style.setProperty(
      "--blue",
      "#d31e2b"
    );
    document.documentElement.style.setProperty(
      "--sky",
      "#f04444"
    );
  } else if (theme === "light") {
    document.documentElement.style.setProperty(
      "--blue",
      "#086cb5"
    );
    document.documentElement.style.setProperty(
      "--sky",
      "#159ad6"
    );
  } else {
    document.documentElement.style.setProperty(
      "--blue",
      "#1688d4"
    );
    document.documentElement.style.setProperty(
      "--sky",
      "#35b8f4"
    );
  }
}

/* =========================================================
   TABS
   ========================================================= */

function bindTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) =>
        t.classList.remove("active")
      );

      document.querySelectorAll(".tabPanel").forEach((panel) =>
        panel.classList.remove("active")
      );

      tab.classList.add("active");

      const panel = $("tab-" + tab.dataset.tab);

      if (panel) {
        panel.classList.add("active");
      }
    });
  });
}

/* =========================================================
   AI STORY ANALYSIS
   ========================================================= */

function bindAIControls() {
  $("analyze").addEventListener("click", analyzeStory);
  $("aiProduce").addEventListener("click", aiProduce);
  $("apply").addEventListener("click", applyBroadcastLook);
  $("findShots").addEventListener("click", findBestShots);
}

function analyzeStory() {
  const script = $("script").value.trim();
  const headline =
    $("headline").value.trim() || "Untitled story";
  const location =
    $("location").value.trim() || "Location not supplied";

  if (!script) {
    alert("Paste the news story script first.");
    return;
  }

  updateStatus("AI ANALYZING");
  $("aiStatus").textContent = "Analyzing";

  const words = script.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const hasQuote =
    /["“”]/.test(script) ||
    /\b(said|says|according to|reported)\b/i.test(script);

  const hasLocation =
    /\b(in|at|from|near|across|within)\b/i.test(script);

  const hasNumbers =
    /\d/.test(script);

  state.analyzed = true;

  $("aiReport").innerHTML = `
    <strong>AI DIRECTOR ANALYSIS</strong><br><br>

    <b>Story:</b> ${escapeHTML(headline)}<br>
    <b>Location:</b> ${escapeHTML(location)}<br>
    <b>Words:</b> ${wordCount}<br><br>

    <b>Editorial structure</b><br>
    • Opening / presenter lead<br>
    • Main story development<br>
    • Supporting visual opportunity<br>
    • Closing / transition<br><br>

    <b>Detected elements</b><br>
    ${hasQuote ? "✓ Potential quote / attribution<br>" : ""}
    ${hasLocation ? "✓ Location reference<br>" : ""}
    ${hasNumbers ? "✓ Numerical information<br>" : ""}
    ✓ Suitable for newsroom graphics<br>
    ✓ Lower-third recommended<br>
    ✓ Headline recommended<br>
    ✓ Ticker recommended
  `;

  $("aiStatus").textContent = "Analyzed";
  updateStatus("AI ANALYSIS COMPLETE");

  generateScenes(script);
}

function generateScenes(script) {
  const words = script.split(/\s+/).filter(Boolean);

  state.scenes = [
    {
      name: "OPEN",
      description: "Presenter introduction / headline",
      duration: "00:00–00:08"
    },
    {
      name: "MAIN STORY",
      description: "Primary presenter delivery",
      duration: "00:08–01:00"
    },
    {
      name: "SUPPORTING VISUAL",
      description: "B-roll / relevant supporting footage",
      duration: "01:00–01:20"
    },
    {
      name: "DEVELOPMENT",
      description:
        words.length > 120
          ? "Extended story development"
          : "Additional story information",
      duration: "01:20–01:45"
    },
    {
      name: "CLOSE",
      description: "Presenter closing / transition",
      duration: "01:45–END"
    }
  ];

  renderScenes();
}

function renderScenes() {
  const container = $("sceneList");

  container.innerHTML = "";

  state.scenes.forEach((scene, index) => {
    const element = document.createElement("div");

    element.className = "scene";

    element.innerHTML = `
      <strong>${index + 1}. ${escapeHTML(scene.name)}</strong>
      <small>${escapeHTML(scene.description)}</small><br>
      <small>${escapeHTML(scene.duration)}</small>
    `;

    container.appendChild(element);
  });
}

/* =========================================================
   AI PRODUCER
   ========================================================= */

function aiProduce() {
  if (!state.videoFile) {
    alert("Import a presenter/news video before producing.");
    return;
  }

  if (!$("script").value.trim()) {
    alert("Add the story script before AI production.");
    return;
  }

  updateStatus("AI PRODUCING");
  $("aiStatus").textContent = "Producing";

  if (!state.analyzed) {
    analyzeStory();
  }

  $("screenHeadline").value =
    $("headline").value || "LATEST NEWS";

  $("lowerText").value =
    $("presenter").value || "NEWS PRESENTER";

  $("lowerTitle").value =
    $("location").value || "NEWS";

  createLowerThird();
  createHeadline();
  createTicker();

  state.produced = true;

  setTimeout(() => {
    $("aiStatus").textContent = "Produced";
    updateStatus("BROADCAST READY");

    runBroadcastQC();
  }, 700);
}

/* =========================================================
   BROADCAST LOOK
   ========================================================= */

function applyBroadcastLook() {
  $("showLower").checked = true;
  $("showHeadline").checked = true;
  $("showTicker").checked = true;

  $("gfxOpacity").value = "1";

  if (!$("screenHeadline").value) {
    $("screenHeadline").value =
      $("headline").value || "LATEST NEWS";
  }

  if (!$("lowerText").value) {
    $("lowerText").value =
      $("presenter").value || "NEWS PRESENTER";
  }

  updateGraphics();

  updateStatus("BROADCAST LOOK APPLIED");

  runBroadcastQC();
}

/* =========================================================
   BEST SHOTS
   ========================================================= */

function findBestShots() {
  if (!state.videoFile) {
    alert("Import a video first.");
    return;
  }

  const video = $("video");

  const duration = video.duration || 0;

  if (!duration) {
    alert("Video information is not ready yet.");
    return;
  }

  state.scenes = [
    {
      name: "BEST OPEN",
      description: "Beginning of presenter footage",
      duration: `00:00–${formatTime(Math.min(8, duration))}`
    },
    {
      name: "PRIMARY SHOT",
      description: "Main presenter shot",
      duration: `${formatTime(Math.min(8, duration))}–${formatTime(
        Math.min(35, duration)
      )}`
    },
    {
      name: "MID STORY",
      description: "Potential supporting segment",
      duration: `${formatTime(Math.min(35, duration))}–${formatTime(
        Math.min(65, duration)
      )}`
    },
    {
      name: "CLOSING",
      description: "Final usable presenter section",
      duration: `${formatTime(Math.max(0, duration - 15))}–${formatTime(
        duration
      )}`
    }
  ];

  renderScenes();

  updateStatus("BEST SHOTS IDENTIFIED");
}

/* =========================================================
   BROADCAST QC
   ========================================================= */

function runBroadcastQC() {
  const report = $("qcReport");

  const checks = [];

  checks.push({
    title: "VIDEO",
    value: state.videoFile ? "PASS" : "FAIL",
    type: state.videoFile ? "good" : "bad"
  });

  checks.push({
    title: "HEADLINE",
    value: $("screenHeadline").value ? "PASS" : "WARNING",
    type: $("screenHeadline").value ? "good" : "warning"
  });

  checks.push({
    title: "LOWER THIRD",
    value: $("showLower").checked ? "PASS" : "OFF",
    type: $("showLower").checked ? "good" : "warning"
  });

  checks.push({
    title: "TICKER",
    value: $("showTicker").checked ? "PASS" : "OFF",
    type: $("showTicker").checked ? "good" : "warning"
  });

  checks.push({
    title: "SCRIPT",
    value: $("script").value.trim() ? "PASS" : "FAIL",
    type: $("script").value.trim() ? "good" : "bad"
  });

  checks.push({
    title: "PRESENTER",
    value: $("presenter").value.trim()
      ? "PASS"
      : "OPTIONAL",
    type: $("presenter").value.trim()
      ? "good"
      : "warning"
  });

  report.innerHTML = checks
    .map(
      (check) => `
        <div class="qcItem ${check.type}">
          <strong>${check.title}</strong><br>
          ${check.value}
        </div>
      `
    )
    .join("");

  const failed = checks.filter(
    (check) => check.type === "bad"
  ).length;

  $("qcStatus").textContent =
    failed > 0 ? `${failed} issue(s)` : "Passed";

  if (failed === 0) {
    updateStatus("QC PASSED");
  }
}

/* =========================================================
   PROJECT SAVE
   ========================================================= */

function bindProjectControls() {
  $("save").addEventListener("click", saveProject);
  $("reset").addEventListener("click", resetEdits);
  $("record").addEventListener("click", exportBroadcast);
}

function saveProject() {
  const project = {
    projectName: state.projectName,

    story: {
      headline: $("headline").value,
      presenter: $("presenter").value,
      location: $("location").value,
      script: $("script").value
    },

    graphics: {
      lowerText: $("lowerText").value,
      lowerTitle: $("lowerTitle").value,
      headline: $("screenHeadline").value,
      ticker: $("ticker").value,
      theme: $("theme").value,
      opacity: $("gfxOpacity").value,
      logoOpacity: $("logoOpacity").value,
      showLower: $("showLower").checked,
      showHeadline: $("showHeadline").checked,
      showTicker: $("showTicker").checked,
      showLogo: $("showLogo").checked
    },

    scenes: state.scenes,

    createdAt: new Date().toISOString()
  };

  const blob = new Blob(
    [JSON.stringify(project, null, 2)],
    { type: "application/json" }
  );

  downloadBlob(
    blob,
    `${safeFilename(state.projectName)}.json`
  );

  updateStatus("PROJECT SAVED");
}

/* =========================================================
   RESET
   ========================================================= */

function resetEdits() {
  const confirmed = confirm(
    "Reset graphics and story edits?"
  );

  if (!confirmed) return;

  $("lowerText").value = "NEWS PRESENTER";
  $("lowerTitle").value = "NEWS";
  $("screenHeadline").value = "";
  $("ticker").value =
    "LATEST NEWS • EDUCATION • COMMUNITY • SPORTS • WEATHER";

  $("gfxOpacity").value = "1";
  $("logoOpacity").value = ".9";

  $("showLower").checked = true;
  $("showHeadline").checked = true;
  $("showTicker").checked = true;
  $("showLogo").checked = true;

  updateGraphics();

  state.analyzed = false;
  state.produced = false;

  $("aiStatus").textContent = "Idle";
  $("qcStatus").textContent = "Not checked";

  $("aiReport").textContent =
    "AI Director waiting for a story.";

  $("sceneList").innerHTML = "";

  updateStatus("EDITS RESET");
}

/* =========================================================
   EXPORT
   ========================================================= */

async function exportBroadcast() {
  const video = $("video");

  if (!state.videoFile || !video.src) {
    alert("Import a video before exporting.");
    return;
  }

  /*
    Browser export uses MediaRecorder.
    The source video is recorded together with the
    graphics canvas when supported by the browser.
  */

  if (!window.MediaRecorder) {
    alert(
      "This browser does not support direct browser recording. " +
      "Use the broadcast preview with a screen recorder."
    );
    return;
  }

  updateStatus("PREPARING EXPORT");

  const canvas = document.createElement("canvas");
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  const stream = canvas.captureStream(30);

  const recorder = new MediaRecorder(stream, {
    mimeType: getSupportedMimeType()
  });

  const chunks = [];

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, {
      type: recorder.mimeType
    });

    downloadBlob(
      blob,
      `${safeFilename(state.projectName)}-broadcast.webm`
    );

    updateStatus("EXPORT COMPLETE");
  };

  const drawFrame = () => {
    if (video.paused || video.ended) {
      if (recorder.state === "recording") {
        recorder.stop();
      }

      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    drawCanvasGraphics(ctx, width, height);

    requestAnimationFrame(drawFrame);
  };

  video.currentTime = 0;

  recorder.start();

  video.play();

  drawFrame();

  video.onended = () => {
    if (recorder.state === "recording") {
      recorder.stop();
    }
  };
}

/* =========================================================
   CANVAS BROADCAST GRAPHICS
   ========================================================= */

function drawCanvasGraphics(ctx, width, height) {
  const scale = width / 1280;

  ctx.save();

  ctx.globalAlpha = Number($("gfxOpacity").value);

  if ($("showLower").checked) {
    const x = width * 0.05;
    const y = height * 0.78;

    ctx.fillStyle = "#087fc7";

    ctx.fillRect(
      x,
      y,
      width * 0.58,
      48 * scale
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${22 * scale}px Arial`;

    ctx.fillText(
      $("lowerText").value || "NEWS PRESENTER",
      x + 18 * scale,
      y + 31 * scale
    );

    ctx.fillStyle = "rgba(5,17,30,.94)";

    ctx.fillRect(
      x,
      y + 48 * scale,
      width * 0.58,
      30 * scale
    );

    ctx.fillStyle = "#c7d9e8";
    ctx.font = `${14 * scale}px Arial`;

    ctx.fillText(
      $("lowerTitle").value || "NEWS",
      x + 18 * scale,
      y + 20 * scale + 48 * scale
    );
  }

  if ($("showHeadline").checked) {
    const x = width * 0.05;
    const y = height * 0.89;

    ctx.fillStyle = "rgba(5,15,27,.94)";

    ctx.fillRect(
      x,
      y,
      width * 0.9,
      43 * scale
    );

    ctx.fillStyle = "#d9aa3d";

    ctx.fillRect(
      x,
      y,
      5 * scale,
      43 * scale
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${22 * scale}px Arial`;

    ctx.fillText(
      $("screenHeadline").value ||
        $("headline").value ||
        "LATEST NEWS",
      x + 15 * scale,
      y + 29 * scale
    );
  }

  if ($("showTicker").checked) {
    const y = height - 27 * scale;

    ctx.fillStyle = "#071525";

    ctx.fillRect(
      0,
      y,
      width,
      27 * scale
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = `${13 * scale}px Arial`;

    ctx.fillText(
      $("ticker").value ||
        "LATEST NEWS • EDUCATION • COMMUNITY • SPORTS • WEATHER",
      15 * scale,
      y + 18 * scale
    );
  }

  ctx.restore();
}

/* =========================================================
   UTILITIES
   ========================================================= */

function updateStatus(message) {
  $("status").textContent = message;
}

function updateClockDisplay() {
  $("current").textContent = "00:00";
  $("duration").textContent = "00:00";
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(mins).padStart(2, "0")}:${String(
    secs
  ).padStart(2, "0")}`;
}

function safeFilename(name) {
  return (
    name
      .replace(/[^a-z0-9-_ ]/gi, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() ||
    "news-broadcast"
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function getSupportedMimeType() {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];

  return (
    types.find((type) =>
      MediaRecorder.isTypeSupported(type)
    ) || "video/webm"
  );
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
