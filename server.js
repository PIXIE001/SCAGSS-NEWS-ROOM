const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Serve the newsroom application
app.use(express.static(__dirname));

// ---------------------------------------------------------
// HEALTH CHECK
// ---------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    application: "AI Newsroom Studio",
    status: "online",
    time: new Date().toISOString()
  });
});

// ---------------------------------------------------------
// PROJECT ANALYSIS
// ---------------------------------------------------------

app.post("/api/analyze-story", async (req, res) => {
  try {
    const {
      headline = "",
      presenter = "",
      location = "",
      script = ""
    } = req.body;

    if (!script.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Story script is required."
      });
    }

    const words = script
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const wordCount = words.length;

    const hasQuote =
      /["“”]/.test(script) ||
      /\b(said|says|according to|reported)\b/i.test(script);

    const hasLocation =
      /\b(in|at|from|near|within|across)\b/i.test(script);

    const hasNumbers = /\d/.test(script);

    const scenes = [
      {
        id: "scene-01",
        type: "OPEN",
        title: "Presenter Introduction",
        purpose: "Establish the story and headline.",
        recommendedDuration: 8
      },
      {
        id: "scene-02",
        type: "MAIN",
        title: "Main Story",
        purpose: "Presenter delivers the central information.",
        recommendedDuration: 35
      },
      {
        id: "scene-03",
        type: "BROLL",
        title: "Supporting Visual",
        purpose: "Use relevant supporting footage or imagery.",
        recommendedDuration: 20
      },
      {
        id: "scene-04",
        type: "DEVELOPMENT",
        title: "Story Development",
        purpose: "Continue important details.",
        recommendedDuration: 30
      },
      {
        id: "scene-05",
        type: "CLOSE",
        title: "Story Close",
        purpose: "Conclude and transition.",
        recommendedDuration: 8
      }
    ];

    res.json({
      ok: true,

      story: {
        headline,
        presenter,
        location,
        wordCount
      },

      editorial: {
        hasQuote,
        hasLocation,
        hasNumbers,
        requiresHeadline: true,
        requiresLowerThird: true,
        requiresTicker: true
      },

      scenes,

      director: {
        recommendedFormat: "NEWS_PACKAGE",
        opening: "PRESENTER",
        supportingVisuals: "B_ROLL",
        closing: "PRESENTER",
        graphics: [
          "HEADLINE",
          "LOWER_THIRD",
          "TICKER",
          "LOGO"
        ]
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      error: "Story analysis failed."
    });
  }
});

// ---------------------------------------------------------
// AI DIRECTOR DECISION ENDPOINT
// ---------------------------------------------------------

app.post("/api/director", async (req, res) => {
  try {
    const {
      story = {},
      media = [],
      preferences = {}
    } = req.body;

    const decision = {
      format: "NEWS_BULLETIN",

      sequence: [
        {
          order: 1,
          scene: "OPEN",
          mediaRole: "PRESENTER",
          graphics: ["HEADLINE", "LOWER_THIRD"]
        },
        {
          order: 2,
          scene: "MAIN_STORY",
          mediaRole: "PRESENTER",
          graphics: ["LOWER_THIRD"]
        },
        {
          order: 3,
          scene: "SUPPORTING_VISUAL",
          mediaRole: "BROLL",
          graphics: ["HEADLINE"]
        },
        {
          order: 4,
          scene: "DEVELOPMENT",
          mediaRole: "BROLL_OR_PRESENTER",
          graphics: ["TICKER"]
        },
        {
          order: 5,
          scene: "CLOSE",
          mediaRole: "PRESENTER",
          graphics: ["TICKER"]
        }
      ],

      graphics: {
        headline:
          story.headline || "LATEST NEWS",

        lowerThird:
          story.presenter || "NEWS PRESENTER",

        title:
          story.location || "NEWS",

        ticker:
          preferences.ticker ||
          "LATEST NEWS • EDUCATION • COMMUNITY • SPORTS • WEATHER"
      },

      mediaCount: media.length,

      directorNotes: [
        "Prioritize presenter footage for the opening.",
        "Use supporting footage where editorially relevant.",
        "Avoid unnecessary visual changes.",
        "Keep headline readable.",
        "Maintain consistent lower-third placement.",
        "Preserve a clean broadcast hierarchy."
      ]
    };

    res.json({
      ok: true,
      decision
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      error: "AI Director failed."
    });
  }
});

// ---------------------------------------------------------
// BROADCAST QC
// ---------------------------------------------------------

app.post("/api/qc", (req, res) => {
  const {
    hasVideo,
    hasHeadline,
    hasScript,
    hasPresenter,
    graphics
  } = req.body;

  const checks = [
    {
      name: "Video",
      passed: !!hasVideo
    },
    {
      name: "Headline",
      passed: !!hasHeadline
    },
    {
      name: "Script",
      passed: !!hasScript
    },
    {
      name: "Presenter",
      passed: !!hasPresenter
    },
    {
      name: "Graphics",
      passed: graphics !== false
    }
  ];

  const failed = checks.filter(
    item => !item.passed
  );

  res.json({
    ok: true,
    passed: failed.length === 0,
    checks,
    issues: failed.map(item => item.name)
  });
});

// ---------------------------------------------------------
// PROJECT SAVE / LOAD
// ---------------------------------------------------------

const projects = new Map();

app.post("/api/projects", (req, res) => {
  const project = req.body;

  const id =
    project.id ||
    `project-${Date.now()}`;

  const savedProject = {
    ...project,
    id,
    updatedAt: new Date().toISOString()
  };

  projects.set(id, savedProject);

  res.json({
    ok: true,
    project: savedProject
  });
});

app.get("/api/projects/:id", (req, res) => {
  const project = projects.get(req.params.id);

  if (!project) {
    return res.status(404).json({
      ok: false,
      error: "Project not found."
    });
  }

  res.json({
    ok: true,
    project
  });
});

// ---------------------------------------------------------
// SPA FALLBACK
// ---------------------------------------------------------

app.get("*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "index.html")
  );
});

// ---------------------------------------------------------
// START
// ---------------------------------------------------------

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log("       AI NEWSROOM STUDIO");
  console.log("======================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("Status: ONLINE");
  console.log("======================================");
  console.log("");
});
