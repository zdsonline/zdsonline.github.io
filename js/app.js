(() => {
  "use strict";

  const APP_VERSION = "radio-shell-v1.0.1";
  const audio = document.getElementById("audio");
  const playButton = document.getElementById("playButton");
  const playIcon = document.getElementById("playIcon");
  const stationName = document.getElementById("stationName");
  const stationDetail = document.getElementById("stationDetail");
  const status = document.getElementById("status");
  const stationList = document.getElementById("stationList");
  const customForm = document.getElementById("customForm");
  const customUrl = document.getElementById("customUrl");

  let currentStation = null;
  let currentButton = null;

  document.getElementById("appVersion").textContent = `版本 ${APP_VERSION} · 页面可离线打开`;
  audio.preload = "none";

  function setStatus(message) {
    status.textContent = message;
  }

  function updatePlayButton(playing) {
    playIcon.textContent = playing ? "Ⅱ" : "▶";
    playButton.setAttribute("aria-label", playing ? "暂停" : "播放");
  }

  function setSelectedButton(button) {
    if (currentButton) currentButton.classList.remove("active");
    currentButton = button || null;
    if (currentButton) currentButton.classList.add("active");
  }

  function updateMediaSession() {
    if (!("mediaSession" in navigator) || !currentStation) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentStation.name,
        artist: currentStation.detail || "网络广播",
        album: "简易收音机",
        artwork: [
          { src: "./icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "./icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
        ]
      });
      navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
    } catch (_) {}
  }

  async function startPlayback() {
    if (!currentStation) {
      setStatus("请先选择一个电台");
      return;
    }
    setStatus("正在连接…");
    try {
      await audio.play();
    } catch (error) {
      updatePlayButton(false);
      updateMediaSession();
      setStatus("播放失败：检查地址、网络或音频格式");
    }
  }

  function chooseStation(station, button = null) {
    currentStation = station;
    stationName.textContent = station.name;
    stationDetail.textContent = station.detail || station.url;
    setSelectedButton(button);
    playButton.disabled = false;

    // 保留同一个 audio 元素，便于系统媒体控制接管当前播放会话。
    audio.pause();
    audio.src = station.url;
    audio.load();
    updatePlayButton(false);
    updateMediaSession();
    startPlayback();
  }

  function renderStations() {
    const fragment = document.createDocumentFragment();
    (window.RADIO_STATIONS || []).forEach((station) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "station";
      button.innerHTML = '<span class="station-name-small"></span><span class="station-detail-small"></span>';
      button.querySelector(".station-name-small").textContent = station.name;
      button.querySelector(".station-detail-small").textContent = station.detail || "";
      button.addEventListener("click", () => chooseStation(station, button));
      fragment.appendChild(button);
    });
    stationList.replaceChildren(fragment);
  }

  playButton.addEventListener("click", () => {
    if (!currentStation) return;
    if (audio.paused) startPlayback();
    else audio.pause();
  });

  customForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = customUrl.value.trim();
    if (!url) return;
    let parsed;
    try { parsed = new URL(url); } catch (_) {
      setStatus("请输入有效的完整 URL");
      return;
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      setStatus("只支持 http 或 https 地址");
      return;
    }
    chooseStation({ name: "自定义电台", detail: parsed.hostname, url: parsed.href });
  });

  audio.addEventListener("playing", () => {
    updatePlayButton(true);
    setStatus("正在播放");
    updateMediaSession();
  });
  audio.addEventListener("pause", () => {
    updatePlayButton(false);
    if (currentStation) setStatus("已暂停");
    updateMediaSession();
  });
  audio.addEventListener("waiting", () => setStatus("正在缓冲…"));
  audio.addEventListener("stalled", () => setStatus("网络缓冲中…"));
  audio.addEventListener("error", () => {
    updatePlayButton(false);
    setStatus("无法播放此音频流，请尝试其他地址");
    updateMediaSession();
  });

  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.setActionHandler("play", () => startPlayback());
      navigator.mediaSession.setActionHandler("pause", () => audio.pause());
      navigator.mediaSession.setActionHandler("stop", () => audio.pause());
    } catch (_) {}
  }

  renderStations();

  // 注册一次即可；SW 文件变化时，浏览器会检查并安装新版。
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
        .then((registration) => {
          // 在线时主动检查更新；离线时失败不影响已缓存的应用。
          if (navigator.onLine) registration.update().catch(() => {});
          registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) {
                setStatus("新版本已缓存；关闭后重新打开即可使用新版");
              }
            });
          });
        })
        .catch(() => {});
    });
  }
})();
