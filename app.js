```javascript id="w6m2qa"
"use strict";

/*
=========================================================
 AI NEWSROOM STUDIO
 Frontend newsroom production controller
 GitHub Pages compatible
=========================================================
*/

const $ = (id) => document.getElementById(id);

const state = {
  videoUrl: "",
  logoUrl: "",
  videoName: "",
  logoName: "",
  projectName: "UNTITLED BULLETIN",

  headline: "",
  presenter: "",
  location: "",
  script: "",

  analyzed: false,
  produced: false,

  scenes: [],

  theme: "classic",
  graphicsOpacity: 1,
  logoOpacity: 0.9,

  showLower: true,
  showHeadline: true,
  showTicker: true,
  showLogo: true,

  analysis: null,

  mediaLoaded: false,
  qcPassed: false
};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  bindEvents();

  updateProjectName();
  updateStatus("READY");
  updateStatusCard();

  renderScenes();

  updateGraphics();

});


/* =========================================================
   EVENT BINDINGS
========================================================= */

function bindEvents() {

  /* VIDEO */

  $("videoFile")?.addEventListener("change", handleVideoImport);

  $("logoFile")?.addEventListener("change", handleLogoImport);


  /* PROJECT */

  $("bulletinName")?.addEventListener("input", () => {

    state.projectName =
      $("bulletinName").value.trim() ||
      "UNTITLED BULLETIN";

    updateProjectName();

  });


  /* STORY */

  ["headline", "presenter", "location", "script"].forEach(id => {

    $(id)?.addEventListener("input", () => {

      state[id] = $(id).value;

      if (id === "headline") {
        $("screenHeadline").value = state.headline;
      }

    });

  });


  $("analyze")?.addEventListener("click", analyzeStory);


  /* PLAYER */

  $("play")?.addEventListener("click", () => {

    if (!$("video").src) return;

    $("video").play();

  });


  $("pause")?.addEventListener("click", () => {

    $("video").pause();

  });


  $("back")?.addEventListener("click", () => {

    seekRelative(-5);

  });


  $("forward")?.addEventListener("click", () => {

    seekRelative(5);

  });


  $("fullscreen")?.addEventListener("click", fullscreenStage);


  $("seek")?.addEventListener("input", () => {

    const video = $("video");

    if (!video.duration) return;

    video.currentTime =
      (Number($("seek").value) / 100) *
      video.duration;

  });


  $("video")?.addEventListener("loadedmetadata", handleVideoMetadata);

  $("video")?.addEventListener("timeupdate", updateTransport);

  $("video")?.addEventListener("play", () => {
    updateStatus("PLAYING");
  });

  $("video")?.addEventListener("pause", () => {

    if (!$("video").ended) {
      updateStatus("PAUSED");
    }

  });

  $("video")?.addEventListener("ended", () => {
    updateStatus("READY");
  });


  /* AI */

  $("aiProduce")?.addEventListener("click", aiProduce);

  $("apply")?.addEventListener("click", applyBroadcastLook);

  $("findShots")?.addEventListener("click", findBestShots);


  /* SAVE / RESET */

  $("save")?.addEventListener("click", saveProject);

  $("reset")?.addEventListener("click", resetEdits);


  /* VISUAL CONTROLS */

  $("theme")?.addEventListener("change", () => {

    state.theme = $("theme").value;

    applyTheme();

  });


  $("gfxOpacity")?.addEventListener("input", () => {

    state.graphicsOpacity =
      Number($("gfxOpacity").value);

    updateGraphics();

  });


  $("logoOpacity")?.addEventListener("input", () => {

    state.logoOpacity =
      Number($("logoOpacity").value);

    updateGraphics();

  });


  $("showLower")?.addEventListener("change", () => {

    state.showLower =
      $("showLower").checked;

    updateGraphics();

  });


  $("showHeadline")?.addEventListener("change", () => {

    state.showHeadline =
      $("showHeadline").checked;

    updateGraphics();

  });


  $("showTicker")?.addEventListener("change", () => {

    state.showTicker =
      $("showTicker").checked;

    updateGraphics();

  });


  $("showLogo")?.addEventListener("change", () => {

    state.showLogo =
      $("showLogo").checked;

    updateGraphics();

  });


  /* GRAPHICS */

  ["lowerText", "lowerTitle", "screenHeadline", "ticker"]
    .forEach(id => {

      $(id)?.addEventListener("input", updateGraphics);

    });


  /* TABS */

  document.querySelectorAll(".tab").forEach(button => {

    button.addEventListener("click", () => {

      switchTab(button.dataset.tab);

    });

  });


  /* EXPORT */

  $("record")?.addEventListener("click", exportBroadcast);

}


/* =========================================================
   VIDEO IMPORT
========================================================= */

function handleVideoImport(event) {

  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("video/")) {

    alert("Please select a valid video file.");

    return;

  }

  if (state.videoUrl) {

    URL.revokeObjectURL(state.videoUrl);

  }

  state.videoUrl = URL.createObjectURL(file);
  state.videoName = file.name;
  state.mediaLoaded = true;

  const video = $("video");

  video.src = state.videoUrl;
  video.load();

  $("empty").style.display = "none";

  $("videoClip").textContent =
    file.name;

  $("mediaStatus").textContent =
    "Loaded";

  $("mediaInfo").innerHTML = `
    <div class="card">
      <strong>${escapeHtml(file.name)}</strong>
      <span>${formatBytes(file.size)}</span>
      <span>${file.type || "Video"}</span>
    </div>
  `;

  updateStatus("VIDEO LOADED");

  updateStatusCard();

  updateGraphics();

}


/* =========================================================
   LOGO IMPORT
========================================================= */

function handleLogoImport(event) {

  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith("image/")) {

    alert("Please select a valid image logo.");

    return;

  }

  if (state.logoUrl) {

    URL.revokeObjectURL(state.logoUrl);

  }

  state.logoUrl = URL.createObjectURL(file);
  state.logoName = file.name;

  updateGraphics();

  updateStatus("LOGO LOADED");

}


/* =========================================================
   VIDEO METADATA
========================================================= */

function handleVideoMetadata() {

  const video = $("video");

  $("duration").textContent =
    formatTime(video.duration);

  $("current").textContent =
    "00:00";

  $("seek").value = 0;

  updateStatusCard();

}


/* =========================================================
   TRANSPORT
========================================================= */

function updateTransport() {

  const video = $("video");

  if (!video.duration) return;

  $("current").textContent =
    formatTime(video.currentTime);

  $("duration").textContent =
    formatTime(video.duration);

  $("seek").value =
    (video.currentTime / video.duration) * 100;

}


function seekRelative(seconds) {

  const video = $("video");

  if (!video.duration) return;

  video.currentTime = Math.max(
    0,
    Math.min(
      video.duration,
      video.currentTime + seconds
    )
  );

}


/* =========================================================
   FULLSCREEN
========================================================= */

function fullscreenStage() {

  const stage = $("stage") || document.querySelector(".stage");

  if (!stage) return;

  if (document.fullscreenElement) {

    document.exitFullscreen();

  } else if (stage.requestFullscreen) {

    stage.requestFullscreen();

  }

}


/* =========================================================
   STORY ANALYSIS
========================================================= */

function analyzeStory() {

  state.headline =
    $("headline").value.trim();

  state.presenter =
    $("presenter").value.trim();

  state.location =
    $("location").value.trim();

  state.script =
    $("script").value.trim();

  if (!state.script && !state.headline) {

    alert(
      "Enter a headline or story script before analysis."
    );

    return;

  }

  updateStatus("ANALYZING");

  const analysis =
    createEditorialAnalysis();

  state.analysis = analysis;
  state.analyzed = true;

  renderAnalysis(analysis);

  generateScenes(analysis);

  $("aiStatus").textContent =
    "Analyzed";

  updateStatus("ANALYSIS COMPLETE");

  updateStatusCard();

}


/* =========================================================
   EDITORIAL ANALYSIS ENGINE
========================================================= */

function createEditorialAnalysis() {

  const script =
    state.script || "";

  const headline =
    state.headline ||
    "UNTITLED NEWS STORY";

  const words =
    script
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const wordCount =
    words.length;

  let estimatedDuration =
    Math.max(
      15,
      Math.round(wordCount / 2.4)
    );

  if (!script) {
    estimatedDuration = 30;
  }

  const lower =
    script.toLowerCase();

  let category = "GENERAL";

  if (
    /school|education|student|teacher|exam|university|learning/
      .test(lower)
  ) {

    category = "EDUCATION";

  } else if (
    /government|president|minister|county|parliament|politics/
      .test(lower)
  ) {

    category = "POLITICS";

  } else if (
    /business|market|economy|money|trade|company/
      .test(lower)
  ) {

    category = "BUSINESS";

  } else if (
    /football|sports|game|match|athlete|tournament/
      .test(lower)
  ) {

    category = "SPORTS";

  } else if (
    /weather|rain|drought|flood|climate|temperature/
      .test(lower)
  ) {

    category = "WEATHER";

  } else if (
    /health|hospital|doctor|disease|medical/
      .test(lower)
  ) {

    category = "HEALTH";

  }


  let priority = "STANDARD";

  if (
    /breaking|urgent|alert|latest|emergency|developing/
      .test(lower)
  ) {

    priority = "BREAKING";

  }


  const hasLocation =
    Boolean(state.location);

  const hasPresenter =
    Boolean(state.presenter);

  return {

    headline,

    category,

    priority,

    wordCount,

    estimatedDuration,

    hasLocation,

    hasPresenter,

    recommendedFormat:
      priority === "BREAKING"
        ? "BREAKING NEWS PACKAGE"
        : "STANDARD NEWS PACKAGE",

    editorialStructure: [
      "OPEN",
      "MAIN STORY",
      "SUPPORTING VISUAL",
      "DEVELOPMENT",
      "CLOSE"
    ]

  };

}


/* =========================================================
   DISPLAY ANALYSIS
========================================================= */

function renderAnalysis(analysis) {

  const report = $("aiReport");

  report.innerHTML = `

    <strong>AI EDITORIAL ANALYSIS</strong>

    <div class="analysisGrid">

      <span>Category</span>
      <b>${escapeHtml(analysis.category)}</b>

      <span>Priority</span>
      <b>${escapeHtml(analysis.priority)}</b>

      <span>Words</span>
      <b>${analysis.wordCount}</b>

      <span>Estimated Duration</span>
      <b>${formatTime(analysis.estimatedDuration)}</b>

      <span>Format</span>
      <b>${escapeHtml(analysis.recommendedFormat)}</b>

    </div>

    <p>
      Editorial structure prepared for
      professional news production.
    </p>
  `;

}


/* =========================================================
   SCENE GENERATION
========================================================= */

function generateScenes(analysis) {

  const duration =
    analysis.estimatedDuration;

  const openDuration =
    Math.min(8, Math.max(4, Math.round(duration * 0.12)));

  const mainDuration =
    Math.round(duration * 0.30);

  const supportDuration =
    Math.round(duration * 0.24);

  const developmentDuration =
    Math.round(duration * 0.22);

  const closeDuration =
    Math.max(
      4,
      duration -
      openDuration -
      mainDuration -
      supportDuration -
      developmentDuration
    );


  state.scenes = [

    {
      type: "OPEN",
      title: "OPEN",
      duration: openDuration,
      description:
        "Presenter introduction and headline."
    },

    {
      type: "MAIN STORY",
      title: "MAIN STORY",
      duration: mainDuration,
      description:
        "Primary presenter delivery."
    },

    {
      type: "SUPPORTING VISUAL",
      title: "SUPPORTING VISUAL",
      duration: supportDuration,
      description:
        "Recommended B-roll or supporting footage."
    },

    {
      type: "DEVELOPMENT",
      title: "DEVELOPMENT",
      duration: developmentDuration,
      description:
        "Additional facts, context or visuals."
    },

    {
      type: "CLOSE",
      title: "CLOSE",
      duration: closeDuration,
      description:
        "Presenter close and transition."
    }

  ];

  renderScenes();

}


/* =========================================================
   SCENE LIST
========================================================= */

function renderScenes() {

  const container =
    $("sceneList");

  if (!container) return;

  if (!state.scenes.length) {

    container.innerHTML = `
      <div class="scene emptyScene">
        AI scenes will appear here.
      </div>
    `;

    return;

  }

  container.innerHTML =
    state.scenes.map(
      (scene, index) => `

        <div
          class="scene"
          data-scene="${index}"
        >

          <div class="sceneNumber">
            ${String(index + 1).padStart(2, "0")}
          </div>

          <div class="sceneContent">

            <strong>
              ${escapeHtml(scene.title)}
            </strong>

            <small>
              ${escapeHtml(scene.description)}
            </small>

          </div>

          <span class="sceneTime">
            ${formatTime(scene.duration)}
          </span>

        </div>

      `
    ).join("");

}


/* =========================================================
   AI PRODUCE
========================================================= */

function aiProduce() {

  if (!state.mediaLoaded) {

    alert(
      "Import a news video before production."
    );

    return;

  }

  if (!state.analyzed) {

    analyzeStory();

  }

  updateStatus("AI PRODUCING");

  applyBroadcastLook();

  findBestShots();

  runBroadcastQC();

  state.produced = true;

  $("aiStatus").textContent =
    "Produced";

  updateStatus("PRODUCTION READY");

  updateStatusCard();

}


/* =========================================================
   BROADCAST LOOK
========================================================= */

function applyBroadcastLook() {

  if (!$("screenHeadline").value.trim()) {

    $("screenHeadline").value =
      state.headline ||
      "LATEST NEWS";

  }

  if (!$("lowerText").value.trim()) {

    $("lowerText").value =
      state.presenter ||
      "NEWS PRESENTER";

  }

  if (!$("lowerTitle").value.trim()) {

    $("lowerTitle").value =
      state.location ||
      "NEWS";

  }

  updateGraphics();

  applyTheme();

  updateStatus("BROADCAST LOOK APPLIED");

}


/* =========================================================
   GRAPHICS
========================================================= */

function updateGraphics() {

  const stage =
    document.querySelector(".stage");

  if (!stage) return;


  stage
    .querySelectorAll(
      ".broadcast-lower-third," +
      ".broadcast-headline," +
      ".broadcast-ticker," +
      ".broadcast-logo"
    )
    .forEach(element => element.remove());


  const opacity =
    state.graphicsOpacity;


  /* LOGO */

  if (
    state.showLogo &&
    state.logoUrl
  ) {

    const logo =
      document.createElement("img");

    logo.className =
      "broadcast-logo";

    logo.src =
      state.logoUrl;

    logo.style.opacity =
      state.logoOpacity;

    logo.alt =
      "Broadcast logo";

    stage.appendChild(logo);

  }


  /* HEADLINE */

  if (state.showHeadline) {

    const headline =
      document.createElement("div");

    headline.className =
      "broadcast-headline";

    headline.style.opacity =
      opacity;

    headline.textContent =
      $("screenHeadline")?.value ||
      state.headline ||
      "LATEST NEWS";

    stage.appendChild(headline);

  }


  /* LOWER THIRD */

  if (state.showLower) {

    const lower =
      document.createElement("div");

    lower.className =
      "broadcast-lower-third";

    lower.style.opacity =
      opacity;

    const title =
      $("lowerTitle")?.value ||
      "NEWS";

    const name =
      $("lowerText")?.value ||
      "NEWS PRESENTER";

    lower.innerHTML = `

      <div class="lowerTitle">
        ${escapeHtml(title)}
      </div>

      <div class="lowerName">
        ${escapeHtml(name)}
      </div>

    `;

    stage.appendChild(lower);

  }


  /* TICKER */

  if (state.showTicker) {

    const ticker =
      document.createElement("div");

    ticker.className =
      "broadcast-ticker";

    ticker.style.opacity =
      opacity;

    ticker.innerHTML = `

      <span>
        ${escapeHtml(
          $("ticker")?.value ||
          "LATEST NEWS"
        )}
      </span>

    `;

    stage.appendChild(ticker);

  }

}


/* =========================================================
   BEST SHOTS
========================================================= */

function findBestShots() {

  if (!state.mediaLoaded) {

    alert(
      "Import a video first."
    );

    return;

  }

  const video =
    $("video");

  const duration =
    video.duration || 60;

  const shots = [

    {
      label: "OPENING SHOT",
      start: 0,
      end: Math.min(8, duration)
    },

    {
      label: "MAIN PRESENTER",
      start: Math.min(8, duration),
      end: Math.min(25, duration)
    },

    {
      label: "SUPPORTING SHOT",
      start: Math.min(25, duration),
      end: Math.min(40, duration)
    },

    {
      label: "DEVELOPMENT SHOT",
      start: Math.min(40, duration),
      end: Math.min(55, duration)
    },

    {
      label: "CLOSING SHOT",
      start: Math.max(0, duration - 8),
      end: duration
    }

  ];


  state.scenes =
    shots.map((shot, index) => ({

      type:
        shot.label,

      title:
        shot.label,

      duration:
        Math.max(
          1,
          shot.end - shot.start
        ),

      start:
        shot.start,

      end:
        shot.end,

      description:
        `Suggested source segment ${formatTime(shot.start)} – ${formatTime(shot.end)}.`

    }));


  renderScenes();

  updateStatus("BEST SHOTS FOUND");

}


/* =========================================================
   BROADCAST QC
========================================================= */

function runBroadcastQC() {

  const checks = [];

  const video =
    $("video");

  checks.push({

    name: "Video imported",
    pass: Boolean(
      state.mediaLoaded
    )

  });


  checks.push({

    name: "Headline available",
    pass: Boolean(
      state.headline ||
      $("screenHeadline")?.value.trim()
    )

  });


  checks.push({

    name: "Presenter identified",
    pass: Boolean(
      state.presenter ||
      $("lowerText")?.value.trim()
    )

  });


  checks.push({

    name: "Broadcast graphics",
    pass:
      state.showLower ||
      state.showHeadline ||
      state.showTicker

  });


  checks.push({

    name: "Video duration",
    pass:
      Boolean(
        video.duration &&
        video.duration > 0
      )

  });


  checks.push({

    name: "Editorial structure",
    pass:
      state.scenes.length >= 3

  });


  const passed =
    checks.filter(
      check => check.pass
    ).length;


  state.qcPassed =
    passed === checks.length;


  const qc =
    $("qcReport");

  qc.innerHTML = `

    <h3>
      BROADCAST QUALITY CONTROL
    </h3>

    <div class="qcSummary">

      <strong>
        ${passed}/${checks.length}
        checks passed
      </strong>

      <span>
        ${
          state.qcPassed
            ? "READY FOR FINAL REVIEW"
            : "ATTENTION REQUIRED"
        }
      </span>

    </div>

    ${checks.map(
      check => `

        <div class="qcRow">

          <span>
            ${escapeHtml(check.name)}
          </span>

          <b class="${
            check.pass
              ? "qcPass"
              : "qcFail"
          }">

            ${
              check.pass
                ? "PASS"
                : "CHECK"
            }

          </b>

        </div>

      `
    ).join("")}

  `;


  $("qcStatus").textContent =
    state.qcPassed
      ? "Passed"
      : "Review";

  updateStatusCard();

}


/* =========================================================
   TABS
========================================================= */

function switchTab(tabName) {

  document
    .querySelectorAll(".tab")
    .forEach(tab => {

      tab.classList.toggle(
        "active",
        tab.dataset.tab === tabName
      );

    });


  document
    .querySelectorAll(".tabPanel")
    .forEach(panel => {

      panel.classList.toggle(
        "active",
        panel.id ===
        `tab-${tabName}`
      );

    });

}


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

  document.body.dataset.theme =
    state.theme;

}


/* =========================================================
   SAVE PROJECT
========================================================= */

function saveProject() {

  const project = {

    application:
      "AI Newsroom Studio",

    version:
      "1.0",

    savedAt:
      new Date().toISOString(),

    projectName:
      state.projectName,

    videoName:
      state.videoName,

    logoName:
      state.logoName,

    headline:
      state.headline,

    presenter:
      state.presenter,

    location:
      state.location,

    script:
      state.script,

    scenes:
      state.scenes,

    analysis:
      state.analysis,

    graphics: {

      lowerText:
        $("lowerText")?.value || "",

      lowerTitle:
        $("lowerTitle")?.value || "",

      screenHeadline:
        $("screenHeadline")?.value || "",

      ticker:
        $("ticker")?.value || ""

    },

    settings: {

      theme:
        state.theme,

      graphicsOpacity:
        state.graphicsOpacity,

      logoOpacity:
        state.logoOpacity,

      showLower:
        state.showLower,

      showHeadline:
        state.showHeadline,

      showTicker:
        state.showTicker,

      showLogo:
        state.showLogo

    }

  };


  const blob =
    new Blob(
      [
        JSON.stringify(
          project,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `${safeFilename(
      state.projectName
    )}.json`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);

  updateStatus("PROJECT SAVED");

}


/* =========================================================
   RESET
========================================================= */

function resetEdits() {

  $("lowerText").value =
    "NEWS PRESENTER";

  $("lowerTitle").value =
    "NEWS";

  $("screenHeadline").value =
    state.headline || "";

  $("ticker").value =
    "LATEST NEWS • EDUCATION • COMMUNITY • SPORTS • WEATHER";

  $("gfxOpacity").value =
    1;

  $("logoOpacity").value =
    .9;

  $("showLower").checked =
    true;

  $("showHeadline").checked =
    true;

  $("showTicker").checked =
    true;

  $("showLogo").checked =
    true;

  state.graphicsOpacity = 1;
  state.logoOpacity = .9;

  state.showLower = true;
  state.showHeadline = true;
  state.showTicker = true;
  state.showLogo = true;

  updateGraphics();

  applyTheme();

  updateStatus("EDITS RESET");

}


/* =========================================================
   EXPORT BROADCAST
========================================================= */

async function exportBroadcast() {

  const video =
    $("video");

  if (!video.src) {

    alert(
      "Import a video before exporting."
    );

    return;

  }


  /*
    Browser export is a preview/export function.
    A future server-side FFmpeg renderer will create
    the professional final MP4 master with full audio,
    graphics, transitions and scene composition.
  */

  updateStatus("EXPORTING");

  const canvas =
    document.createElement("canvas");

  canvas.width =
    video.videoWidth ||
    1280;

  canvas.height =
    video.videoHeight ||
    720;

  const ctx =
    canvas.getContext("2d");


  const stream =
    canvas.captureStream(30);


  let recorder;

  try {

    recorder =
      new MediaRecorder(
        stream,
        {
          mimeType:
            "video/webm;codecs=vp9"
        }
      );

  } catch {

    recorder =
      new MediaRecorder(stream);

  }


  const chunks = [];

  recorder.ondataavailable =
    event => {

      if (event.data.size) {
        chunks.push(event.data);
      }

    };


  recorder.onstop = () => {

    const blob =
      new Blob(
        chunks,
        {
          type:
            "video/webm"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `${safeFilename(
        state.projectName
      )}-preview.webm`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

    updateStatus(
      "EXPORT COMPLETE"
    );

  };


  const wasPlaying =
    !video.paused;


  video.currentTime = 0;


  const drawFrame = () => {

    if (video.ended) {

      recorder.stop();

      return;

    }


    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );


    drawExportGraphics(
      ctx,
      canvas.width,
      canvas.height
    );


    requestAnimationFrame(
      drawFrame
    );

  };


  recorder.start();

  video.play();

  drawFrame();


  const stopWhenEnded =
    () => {

      if (video.ended) {

        if (
          recorder.state !==
          "inactive"
        ) {

          recorder.stop();

        }

        video.removeEventListener(
          "ended",
          stopWhenEnded
        );

        if (!wasPlaying) {
          video.pause();
        }

      }

    };


  video.addEventListener(
    "ended",
    stopWhenEnded
  );

}


/* =========================================================
   EXPORT GRAPHICS
========================================================= */

function drawExportGraphics(
  ctx,
  width,
  height
) {

  const opacity =
    state.graphicsOpacity;


  /* HEADLINE */

  if (state.showHeadline) {

    const headline =
      $("screenHeadline")?.value ||
      state.headline ||
      "LATEST NEWS";

    ctx.save();

    ctx.globalAlpha =
      opacity;

    ctx.fillStyle =
      "rgba(5,20,45,.88)";

    ctx.fillRect(
      0,
      0,
      width,
      Math.round(height * .13)
    );

    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      `bold ${Math.max(
        22,
        width * .025
      )}px Arial`;

    ctx.fillText(
      headline,
      width * .035,
      height * .08
    );

    ctx.restore();

  }


  /* LOWER THIRD */

  if (state.showLower) {

    const title =
      $("lowerTitle")?.value ||
      "NEWS";

    const name =
      $("lowerText")?.value ||
      "NEWS PRESENTER";


    const x = 0;

    const y =
      height * .70;

    const w =
      width * .55;

    const h =
      height * .14;


    ctx.save();

    ctx.globalAlpha =
      opacity;

    ctx.fillStyle =
      "rgba(4,20,42,.94)";

    ctx.fillRect(
      x,
      y,
      w,
      h
    );


    ctx.fillStyle =
      "#61b9ff";

    ctx.fillRect(
      x,
      y,
      width * .008,
      h
    );


    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      `bold ${Math.max(
        18,
        width * .018
      )}px Arial`;

    ctx.fillText(
      name,
      width * .025,
      y + h * .58
    );


    ctx.fillStyle =
      "#61b9ff";

    ctx.font =
      `${Math.max(
        13,
        width * .012
      )}px Arial`;

    ctx.fillText(
      title,
      width * .025,
      y + h * .30
    );


    ctx.restore();

  }


  /* TICKER */

  if (state.showTicker) {

    const ticker =
      $("ticker")?.value ||
      "LATEST NEWS";


    ctx.save();

    ctx.globalAlpha =
      opacity;

    ctx.fillStyle =
      "rgba(2,12,28,.96)";

    ctx.fillRect(
      0,
      height * .92,
      width,
      height * .08
    );


    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      `bold ${Math.max(
        14,
        width * .014
      )}px Arial`;

    ctx.fillText(
      ticker,
      width * .025,
      height * .97
    );


    ctx.restore();

  }

}


/* =========================================================
   STATUS
========================================================= */

function updateStatus(text) {

  if ($("status")) {

    $("status").textContent =
      text;

  }

}


function updateProjectName() {

  if ($("projectName")) {

    $("projectName").textContent =
      state.projectName;

  }

}


function updateStatusCard() {

  if (!$("mediaStatus")) return;

  $("mediaStatus").textContent =
    state.mediaLoaded
      ? "Loaded"
      : "Waiting";

  $("aiStatus").textContent =
    state.produced
      ? "Produced"
      : state.analyzed
        ? "Analyzed"
        : "Idle";

  $("qcStatus").textContent =
    state.qcPassed
      ? "Passed"
      : "Not checked";

}


/* =========================================================
   UTILITIES
========================================================= */

function formatTime(seconds) {

  if (!Number.isFinite(seconds)) {
    return "00:00";
  }

  seconds =
    Math.max(
      0,
      Math.floor(seconds)
    );

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );

  const secs =
    seconds % 60;


  if (hours > 0) {

    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(secs).padStart(2, "0")
    ].join(":");

  }


  return [
    String(minutes).padStart(2, "0"),
    String(secs).padStart(2, "0")
  ].join(":");

}


function formatBytes(bytes) {

  if (!bytes) return "0 Bytes";

  const units =
    [
      "Bytes",
      "KB",
      "MB",
      "GB"
    ];

  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );

  return (
    parseFloat(
      (
        bytes /
        Math.pow(1024, index)
      ).toFixed(2)
    ) +
    " " +
    units[index]
  );

}


function safeFilename(name) {

  return (
    name
      .replace(
        /[^a-z0-9_\-]+/gi,
        "_"
      )
      .replace(
        /^_+|_+$/g,
        ""
      ) ||
    "news-bulletin"
  );

}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}
```
