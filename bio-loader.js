/**
 * 自 megaportfest.com WordPress API 依演出名稱搜尋並擷取介紹（快取於記憶體）。
 */
(function () {
  const cache = Object.create(null);

  function stripHtml(raw) {
    if (!raw) return "";
    let t = String(raw);
    t = t.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ");
    t = t.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
    t = t.replace(/<br\s*\/?>/gi, "\n");
    t = t.replace(/<\/p>/gi, "\n");
    t = t.replace(/<[^>]+>/g, " ");
    t = t
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#(\d+);/g, function (_, n) {
        return String.fromCharCode(parseInt(n, 10));
      });
    t = t.replace(/[ \t\f\v]+/g, " ").replace(/\n\s*\n+/g, "\n\n");
    return t.trim();
  }

  function extractBio(html) {
    const re = /class=['"]avia_textblock['"][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    const parts = [];
    while ((m = re.exec(html)) !== null) {
      const inner = stripHtml(m[1]);
      if (
        inner.length > 25 &&
        inner.indexOf("T-lineup") === -1 &&
        inner.indexOf("width=") === -1
      ) {
        parts.push(inner);
      }
    }
    if (parts.length) {
      return parts.slice(0, 4).join("\n\n");
    }
    const full = stripHtml(html);
    const skip = {
      FACEBOOK: 1,
      INSTAGRAM: 1,
      YOUTUBE: 1,
      OFFICIAL: 1,
      SPOTIFY: 1,
      TWITTER: 1,
    };
    const lines = full
      .split("\n")
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 12 && !skip[s];
      });
    return lines.slice(0, 10).join("\n\n").slice(0, 2000);
  }

  function searchQueries(name) {
    const q = [];
    if (name) q.push(name.trim());
    const first = name.split(/[,，/／、]/)[0].trim();
    if (first && first !== name) q.push(first);
    const noParen = name.replace(/\s*[(（][^)）]*[)）]/g, "").trim();
    if (noParen && q.indexOf(noParen) === -1) q.push(noParen);
    const words = name.replace(/[a-zA-Z]{2,}/g, function (w) {
      return w;
    });
    const en = name.match(/[A-Za-z][A-Za-z0-9\s.&]+/);
    if (en) q.push(en[0].trim());
    return q.filter(Boolean).slice(0, 5);
  }

  window.fetchMegaportArtistPage = async function (actName) {
    const key = actName || "";
    if (cache[key]) return cache[key];

    const base =
      "https://megaportfest.com/wp-json/wp/v2/portfolio?per_page=1&search=";
    const queries = searchQueries(key);

    for (let i = 0; i < queries.length; i++) {
      const term = queries[i].slice(0, 48);
      const url = base + encodeURIComponent(term);
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const arr = await res.json();
        if (!arr || !arr.length) continue;
        const post = arr[0];
        const bio = extractBio(post.content.rendered || "");
        const out = {
          bio:
            bio ||
            "官網此筆藝人頁文字較少，請點下方連結於官網瀏覽。",
          link: post.link,
          title: post.title.rendered,
        };
        cache[key] = out;
        return out;
      } catch (e) {
        /* CORS 或離線時改走本地說明 */
      }
    }

    const fallback = {
      bio:
        "無法連線至官網 API 載入介紹（若用本機檔案開啟可能受瀏覽器限制）。請改用本機伺服器開啟，或至「所有藝人」頁搜尋：\n" +
        key,
      link:
        "https://megaportfest.com/artists/%e6%89%80%e6%9c%89%e8%97%9d%e4%ba%ba/",
      title: null,
    };
    cache[key] = fallback;
    return fallback;
  };
})();
