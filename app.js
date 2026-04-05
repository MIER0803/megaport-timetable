(function () {
  const data = window.MEGAPORT_DATA;
  const full = window.MEGAPORT_FULL_SCHEDULE;
  if (!data || !data.stages) return;

  const days =
    full && full.days && full.days.length
      ? full.days
      : data.days || [];
  if (!days.length) return;

  const dayTabs = document.getElementById("day-tabs");
  const stagesRoot = document.getElementById("stages-root");
  const backdrop = document.getElementById("modal-backdrop");
  const modalTitle = document.getElementById("modal-title");
  const modalMeta = document.getElementById("modal-meta");
  const modalBio = document.getElementById("modal-bio");
  const modalArtistLinkWrap = document.getElementById("modal-artist-link-wrap");
  const modalArtistLink = document.getElementById("modal-artist-link");
  const closeBtn = document.getElementById("modal-close");

  let activeDayIndex = 0;
  let lastFocusEl = null;

  function parseTime(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function sortActs(acts) {
    return [...acts].sort((a, b) => parseTime(a.start) - parseTime(b.start));
  }

  function colorForName(name) {
    let h = 2166136261;
    const s = String(name);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const hue = (h >>> 0) % 360;
    return "hsl(" + hue + " 48% 40%)";
  }

  function renderStages(day) {
    stagesRoot.innerHTML = "";
    const byStage = {};
    data.stages.forEach(function (s) {
      byStage[s] = [];
    });
    day.acts.forEach(function (act) {
      if (byStage[act.stage]) byStage[act.stage].push(act);
    });

    data.stages.forEach(function (stageName) {
      const col = document.createElement("section");
      col.className = "stage-col";
      col.setAttribute("aria-label", stageName);

      const h3 = document.createElement("h3");
      h3.className = "stage-title";
      h3.textContent = stageName;
      col.appendChild(h3);

      const list = document.createElement("div");
      list.className = "act-list";

      const acts = sortActs(byStage[stageName]);
      acts.forEach(function (act) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "act-block";
        btn.style.background = act.color || colorForName(act.name);
        btn.setAttribute("aria-haspopup", "dialog");
        btn.dataset.actId = act.id;

        const timeEl = document.createElement("span");
        timeEl.className = "act-time";
        timeEl.textContent = act.start + " – " + act.end;

        const nameEl = document.createElement("span");
        nameEl.className = "act-name";
        nameEl.textContent = act.name;

        btn.appendChild(timeEl);
        btn.appendChild(nameEl);
        btn.addEventListener("click", function () {
          openModal(act, btn);
        });
        list.appendChild(btn);
      });

      col.appendChild(list);
      stagesRoot.appendChild(col);
    });
  }

  function setDay(index) {
    activeDayIndex = index;
    const tabs = dayTabs.querySelectorAll(".day-tab");
    tabs.forEach(function (tab, i) {
      const selected = i === index;
      tab.setAttribute("aria-selected", selected);
      tab.tabIndex = selected ? 0 : -1;
    });
    renderStages(days[index]);
  }

  function openModal(act, triggerEl) {
    lastFocusEl = triggerEl || null;
    modalTitle.textContent = act.name;
    modalMeta.textContent =
      days[activeDayIndex].label +
      " · " +
      act.stage +
      " · " +
      act.start +
      " – " +
      act.end;
    modalBio.textContent = "載入介紹中…";
    modalArtistLinkWrap.hidden = true;
    backdrop.classList.add("is-open");
    backdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    closeBtn.focus();

    if (typeof window.fetchMegaportArtistPage !== "function") {
      modalBio.textContent =
        act.bio ||
        "請至大港開唱官網「所有藝人」搜尋演出名稱。\n\n（未載入 bio-loader.js）";
      if (act.artistUrl) {
        modalArtistLink.href = act.artistUrl;
        modalArtistLinkWrap.hidden = false;
      }
      return;
    }

    window
      .fetchMegaportArtistPage(act.name)
      .then(function (res) {
        modalBio.textContent = res.bio || "（無內文）";
        if (res.link) {
          modalArtistLink.href = res.link;
          modalArtistLinkWrap.hidden = false;
        } else {
          modalArtistLinkWrap.hidden = true;
        }
      })
      .catch(function () {
        modalBio.textContent =
          "載入失敗。請以本機伺服器開啟此資料夾，或至官網搜尋：\n" + act.name;
        modalArtistLink.href =
          data.festival.artistsListUrl ||
          "https://megaportfest.com/artists/%e6%89%80%e6%9c%89%e8%97%9d%e4%ba%ba/";
        modalArtistLinkWrap.hidden = false;
      });
  }

  function closeModal() {
    backdrop.classList.remove("is-open");
    backdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (lastFocusEl && typeof lastFocusEl.focus === "function") {
      lastFocusEl.focus();
    }
    lastFocusEl = null;
  }

  closeBtn.addEventListener("click", closeModal);

  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && backdrop.classList.contains("is-open")) {
      e.preventDefault();
      closeModal();
    }
  });

  days.forEach(function (day, i) {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "day-tab";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", i === 0);
    tab.id = "tab-" + day.id;
    tab.textContent = day.label;
    tab.addEventListener("click", function () {
      setDay(i);
    });
    dayTabs.appendChild(tab);
  });

  setDay(0);
})();
