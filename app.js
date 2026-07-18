/* ============================================================
   app.js — منطق لوحة الأداء التنفيذية
   قناة القرآن الكريم | هيئة الإذاعة والتلفزيون
   ============================================================ */
(function () {
  "use strict";
  const D = window.DATA;
  const hasChart = typeof Chart !== "undefined";
  const hasL = typeof L !== "undefined";

  /* ---------------- helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const cvar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const fmt = n => Math.round(n).toLocaleString("en-US");
  const fmtK = n => n >= 1e6 ? (n / 1e6).toFixed(n < 1e7 ? 2 : 1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "K" : String(n);
  const sign = v => (v > 0 ? "+" : "") + v;

  /* color helpers (تدرّج الخريطة/الحرارة) */
  const hex2rgb = h => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(c => c + c).join(""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  const mix = (c1, c2, t) => { const a = hex2rgb(c1), b = hex2rgb(c2); return `rgb(${lerp(a[0], b[0], t)},${lerp(a[1], b[1], t)},${lerp(a[2], b[2], t)})`; };
  function scaleColor(t) {   /* 0..1 عبر lo→mid→hi */
    t = Math.max(0, Math.min(1, t));
    const lo = cvar("--scale-lo"), mid = cvar("--scale-mid"), hi = cvar("--scale-hi");
    return t < .5 ? mix(lo, mid, t / .5) : mix(mid, hi, (t - .5) / .5);
  }

  const charts = {};
  const state = { sort: { k: "viewers", dir: -1 }, metric: "attention", peak: "week", search: "" };

  /* ============================================================
     LOGO (شعار عام مؤقت — غير رسمي)
     ============================================================ */
  const LOGO = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#12946e'/><stop offset='1' stop-color='#0a5c46'/></linearGradient></defs>
      <rect width='64' height='64' rx='15' fill='url(#g)'/>
      <path d='M20 44c0-13 6-22 15-27-3 6-4 11-4 16 0 8 5 13 12 13-5 4-11 6-16 6-4 0-7-3-7-8z' fill='#fff' opacity='.95'/>
      <circle cx='42' cy='20' r='6' fill='#e0b458'/>
    </svg>`);

  /* ============================================================
     KPI CARDS
     ============================================================ */
  function sparkSVG(vals, up) {
    const w = 180, h = 34, mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
    const pts = vals.map((v, i) => [i / (vals.length - 1) * w, h - 3 - (v - mn) / rng * (h - 6)]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = `M0 ${h} ` + pts.map(p => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") + ` L${w} ${h} Z`;
    const col = up ? "var(--good)" : "var(--bad)";
    const gid = "sp" + Math.random().toString(36).slice(2, 7);
    return `<svg class="kpi-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${gid})"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${pts[pts.length - 1][0].toFixed(1)}" cy="${pts[pts.length - 1][1].toFixed(1)}" r="2.6" fill="${col}"/></svg>`;
  }
  function renderKPIs() {
    const g = $("#kpiGrid"); g.innerHTML = "";
    D.kpis.forEach(k => {
      const up = k.dir === "up";
      const c = el("div", "kpi");
      c.innerHTML = `
        <div class="kpi-top">
          <span class="kpi-ic"><i class="${k.icon}"></i></span>
          <span class="kpi-dl ${up ? "up" : "down"}"><i class="fa-solid fa-caret-${up ? "up" : "down"}"></i>${sign(k.delta)}%</span>
        </div>
        <div class="kpi-v num">${k.value}<span class="kpi-u">${k.unit}</span></div>
        <div class="kpi-l">${k.label}</div>
        ${sparkSVG(k.spark, up)}`;
      g.appendChild(c);
    });
  }

  /* ============================================================
     COUNTRIES TABLE
     ============================================================ */
  const vRank = (() => { const s = [...D.countries].sort((a, b) => b.viewers - a.viewers); const m = new Map(); s.forEach((c, i) => m.set(c.ar, i)); return m; })();
  const maxViewers = Math.max(...D.countries.map(c => c.viewers));

  function renderTable() {
    const tb = $("#cTbl tbody"); tb.innerHTML = "";
    const q = state.search.trim();
    let rows = D.countries.filter(c => !q || c.ar.includes(q));
    const { k, dir } = state.sort;
    rows = rows.slice().sort((a, b) => (a[k] > b[k] ? 1 : a[k] < b[k] ? -1 : 0) * dir);
    rows.forEach((c, i) => {
      const top = vRank.get(c.ar) < 10;
      const tr = el("tr", top ? "top" : "");
      const medal = i < 3 && (k === "viewers") && dir === -1 ? "med" : "";
      tr.innerHTML = `
        <td class="t-rank ${medal}">${i + 1}</td>
        <td class="t-country"><span class="t-flag">${c.flag}</span>${c.ar}</td>
        <td class="t-num">${fmt(c.viewers)}<span class="t-bar"><span style="width:${(c.viewers / maxViewers * 100).toFixed(0)}%"></span></span></td>
        <td class="t-num">${c.pct}%</td>
        <td class="t-num">${c.watch} د</td>
        <td class="${c.growth >= 0 ? "t-up" : "t-down"}">${sign(c.growth)}%</td>`;
      tb.appendChild(tr);
    });
    $("#mapCount").textContent = D.countries.length;
    $("#legendMax").textContent = fmtK(maxViewers);
  }
  function initTableSort() {
    $$("#cTbl thead th").forEach(th => th.addEventListener("click", () => {
      const k = th.dataset.k; if (k === "rank" || k === "ar" && false) { }
      if (state.sort.k === k) state.sort.dir *= -1; else state.sort = { k: k === "rank" ? "viewers" : k, dir: k === "ar" ? 1 : -1 };
      $$("#cTbl thead th").forEach(t => { t.classList.remove("sorted"); const ic = $("i", t); if (ic) ic.className = "fa-solid fa-sort"; });
      th.classList.add("sorted"); const ic = $("i", th); if (ic) ic.className = "fa-solid fa-sort-" + (state.sort.dir === -1 ? "down" : "up");
      renderTable();
    }));
  }

  /* ============================================================
     MAP (Leaflet)
     ============================================================ */
  let map, tileLayer, markers = [];
  const tileURL = () => document.documentElement.dataset.theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  function initMap() {
    if (!hasL) { $("#map").innerHTML = "<div style='padding:24px;color:var(--muted)'>تعذّر تحميل مكتبة الخرائط.</div>"; return; }
    map = L.map("map", { center: [22, 50], zoom: 3, minZoom: 2, maxZoom: 7, zoomControl: true, attributionControl: true, scrollWheelZoom: false });
    tileLayer = L.tileLayer(tileURL(), { subdomains: "abcd", attribution: "© OpenStreetMap © CARTO" }).addTo(map);
    drawMarkers();
  }
  function drawMarkers() {
    markers.forEach(m => map.removeLayer(m)); markers = [];
    D.countries.forEach(c => {
      const t = c.viewers / maxViewers;
      const m = L.circleMarker([c.lat, c.lng], {
        radius: 6 + Math.sqrt(t) * 26, color: cvar("--surface"), weight: 1.5,
        fillColor: scaleColor(0.15 + t * 0.85), fillOpacity: .82
      }).addTo(map);
      m._ar = c.ar;
      m.bindTooltip(`<div class="map-tt"><b>${c.flag} ${c.ar}</b><br>${fmt(c.viewers)} مشاهد · <small>${c.pct}%</small><br><small>المدة ${c.watch} د · النمو ${sign(c.growth)}%</small></div>`, { direction: "top", offset: [0, -4], opacity: 1 });
      markers.push(m);
    });
  }
  function refreshMapTheme() { if (!map) return; tileLayer.setUrl(tileURL()); drawMarkers(); }
  function filterMap(q) {
    if (!map) return;
    markers.forEach(m => { const hit = !q || m._ar.includes(q); m.setStyle({ fillOpacity: hit ? .85 : .12, opacity: hit ? 1 : .3 }); if (hit && q) m.bringToFront(); });
    if (q) { const hit = D.countries.find(c => c.ar.includes(q)); if (hit) map.setView([hit.lat, hit.lng], 4, { animate: true }); }
    else map.setView([22, 50], 3, { animate: true });
  }

  /* ============================================================
     REGIONS
     ============================================================ */
  function renderRegions() {
    const box = $("#rgList"); box.innerHTML = "";
    const mx = Math.max(...D.regions.map(r => r.viewers));
    D.regions.forEach(r => {
      const row = el("div", "rg-row");
      row.dataset.region = r.name;
      row.innerHTML = `<div class="rg-lb">${r.name}</div>
        <div class="rg-track"><div class="rg-fill" style="width:0%"></div></div>
        <div class="rg-val">${fmtK(r.viewers)} <small>مشاهد</small></div>`;
      box.appendChild(row);
      requestAnimationFrame(() => { $(".rg-fill", row).style.width = (r.viewers / mx * 100).toFixed(1) + "%"; });
    });
  }

  /* ============================================================
     DEVICES
     ============================================================ */
  function renderDevices() {
    const g = $("#dvGrid"); g.innerHTML = "";
    const total = D.devices.reduce((s, d) => s + d.viewers, 0);
    const mx = Math.max(...D.devices.map(d => d.viewers));
    D.devices.forEach(d => {
      const up = d.delta >= 0, share = (d.viewers / total * 100).toFixed(1);
      const c = el("div", "dv");
      c.innerHTML = `
        <div class="dv-top"><span class="dv-ic"><i class="${d.icon}"></i></span><span class="dv-nm">${d.name}</span></div>
        <div class="dv-v num">${fmtK(d.viewers)}</div>
        <div class="dv-track"><span style="width:${(d.viewers / mx * 100).toFixed(0)}%"></span></div>
        <div class="dv-row"><span class="dv-share">${share}% من الإجمالي</span>
          <span class="dv-dl ${up ? "up" : "down"}"><i class="fa-solid fa-caret-${up ? "up" : "down"}"></i>${sign(d.delta)}%</span></div>`;
      g.appendChild(c);
    });
  }

  /* ============================================================
     STRIP DIAL (SVG) + stats + table
     ============================================================ */
  const metricMeta = {
    attention: { label: "الانتباه", unit: "%", key: "attention", agg: "avg" },
    retention: { label: "الاحتفاظ", unit: "%", key: "retention", agg: "avg" },
    reach: { label: "الوصول", unit: "", key: "reach", agg: "sum" },
    scans: { label: "المسح", unit: "", key: "scans", agg: "sum" }
  };
  function polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
  function sector(cx, cy, rIn, rOut, a0, a1) {
    const [x0, y0] = polar(cx, cy, rOut, a0), [x1, y1] = polar(cx, cy, rOut, a1);
    const [x2, y2] = polar(cx, cy, rIn, a1), [x3, y3] = polar(cx, cy, rIn, a0);
    const laf = a1 - a0 > 180 ? 1 : 0;
    return `M${x0} ${y0} A${rOut} ${rOut} 0 ${laf} 1 ${x1} ${y1} L${x2} ${y2} A${rIn} ${rIn} 0 ${laf} 0 ${x3} ${y3} Z`;
  }
  function renderDial() {
    const svg = $("#stripDial"); if (!svg) return;
    const m = metricMeta[state.metric];
    const vals = D.stripHours.map(h => h[m.key]);
    const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
    const cx = 260, cy = 260, rIn = 150, rOut = 232, gap = 1.4;
    let s = "";
    D.stripHours.forEach((h, i) => {
      const a0 = i * 15 + gap, a1 = (i + 1) * 15 - gap;
      const t = (h[m.key] - mn) / rng;
      s += `<path class="dial-seg" d="${sector(cx, cy, rIn, rOut, a0, a1)}" fill="${scaleColor(0.12 + t * 0.88)}"
              data-h="${h.h}" data-v="${h[m.key]}"></path>`;
    });
    /* علامات الساعات */
    for (let h = 0; h < 24; h += 3) {
      const [x, y] = polar(cx, cy, rOut + 14, h * 15 + 7.5);
      s += `<text class="dial-lbl" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle">${String(h).padStart(2, "0")}</text>`;
    }
    /* المركز */
    const agg = m.agg === "avg" ? (vals.reduce((a, b) => a + b, 0) / vals.length) : vals.reduce((a, b) => a + b, 0);
    const peakH = D.stripHours[vals.indexOf(mx)].h;
    const cval = m.agg === "avg" ? agg.toFixed(1) + m.unit : fmtK(agg);
    s += `<circle cx="${cx}" cy="${cy}" r="${rIn - 10}" fill="var(--surface-2)" stroke="var(--line)"/>
      <text class="dial-cl" x="${cx}" y="${cy - 34}" text-anchor="middle" style="font-size:12px">${m.agg === "avg" ? "متوسط " : "إجمالي "}${m.label}</text>
      <text class="dial-cv num" x="${cx}" y="${cy + 4}" text-anchor="middle" style="font-size:40px">${cval}</text>
      <text class="dial-cl" x="${cx}" y="${cy + 34}" text-anchor="middle" style="font-size:11px">الذروة عند الساعة ${String(peakH).padStart(2, "0")}:00</text>`;
    svg.innerHTML = s;
    $$(".dial-seg", svg).forEach(p => {
      p.addEventListener("mousemove", e => showTT(e, `${String(p.dataset.h).padStart(2, "0")}:00 — ${m.label}: ${(+p.dataset.v).toLocaleString("en-US")}${m.unit}`));
      p.addEventListener("mouseleave", hideTT);
    });
    renderStripStats();
  }
  function renderStripStats() {
    const box = $("#stripStats"); if (!box) return;
    const m = metricMeta[state.metric];
    const vals = D.stripHours.map(h => h[m.key]);
    const mx = Math.max(...vals), mn = Math.min(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const peakH = D.stripHours[vals.indexOf(mx)].h, lowH = D.stripHours[vals.indexOf(mn)].h;
    const f = v => m.agg === "avg" ? v.toFixed(1) + m.unit : fmt(v);
    const rows = [
      { ic: "fa-solid fa-arrow-up", l: `الذروة · ${String(peakH).padStart(2, "0")}:00`, v: f(mx), dl: "up", d: "+" + (mx / avg * 100 - 100).toFixed(0) + "%" },
      { ic: "fa-solid fa-equals", l: "المتوسط اليومي", v: f(avg), dl: "", d: "" },
      { ic: "fa-solid fa-arrow-down", l: `الأدنى · ${String(lowH).padStart(2, "0")}:00`, v: f(mn), dl: "down", d: (mn / avg * 100 - 100).toFixed(0) + "%" },
      { ic: "fa-solid fa-layer-group", l: "نوافذ العرض", v: "24", dl: "", d: "يومياً" }
    ];
    box.innerHTML = rows.map(r => `
      <div class="ss-row"><span class="ss-ic"><i class="${r.ic}"></i></span>
        <div class="ss-txt"><div class="ss-v num">${r.v}</div><div class="ss-l">${r.l}</div></div>
        ${r.d ? `<span class="ss-dl ${r.dl}">${r.d}</span>` : ""}</div>`).join("");
  }
  function renderStripTable() {
    const tb = $("#stripTbl tbody"); if (!tb) return; tb.innerHTML = "";
    D.stripHours.forEach(h => {
      const tr = el("tr");
      tr.innerHTML = `<td class="t-country num">${String(h.h).padStart(2, "0")}:00</td>
        <td class="t-num">${fmt(h.impressions)}</td><td class="t-num">${fmt(h.reach)}</td>
        <td class="t-num">${h.retention}%</td><td class="t-num">${h.dropoff}%</td>
        <td class="t-num">${h.return}%</td><td class="t-num">${h.attention}%</td>
        <td class="t-num">${fmt(h.scans)}</td>`;
      tb.appendChild(tr);
    });
  }
  function initDialTabs() {
    $$("#dialTabs .tab").forEach(t => t.addEventListener("click", () => {
      $$("#dialTabs .tab").forEach(x => x.classList.remove("on")); t.classList.add("on");
      state.metric = t.dataset.m; renderDial();
    }));
  }

  /* ============================================================
     HEATMAP
     ============================================================ */
  function renderHeatmap() {
    const box = $("#peakHm"); if (!box) return;
    const mtx = D.peak[state.peak];
    const g = el("div", "hm-grid");
    g.style.gridTemplateColumns = "52px repeat(24,1fr)";
    g.appendChild(el("div"));                              /* corner */
    for (let h = 0; h < 24; h++) g.appendChild(el("div", "hm-lbl hour", String(h).padStart(2, "0")));
    D.peak.days.forEach((day, d) => {
      g.appendChild(el("div", "hm-lbl day", day));
      for (let h = 0; h < 24; h++) {
        const v = mtx[d][h];
        const c = el("div", "hm-cell");
        c.style.background = scaleColor(v / 100);
        c.addEventListener("mousemove", e => showTT(e, `${day} · ${String(h).padStart(2, "0")}:00 — مؤشر ${v}`));
        c.addEventListener("mouseleave", hideTT);
        g.appendChild(c);
      }
    });
    box.innerHTML = ""; box.appendChild(g);
  }
  function initPeakTabs() {
    $$("#peakTabs .tab").forEach(t => t.addEventListener("click", () => {
      $$("#peakTabs .tab").forEach(x => x.classList.remove("on")); t.classList.add("on");
      state.peak = t.dataset.s;
      const titles = { week: "الخريطة الحرارية الأسبوعية", "عادي": "نمط الأيام العادية", "رمضان": "نمط شهر رمضان", "الحج": "نمط موسم الحج" };
      $("#peakTitle").textContent = titles[state.peak] || "الخريطة الحرارية";
      renderHeatmap();
    }));
  }

  /* ============================================================
     QR KPIs / FORECAST cards / FUNNEL / INSIGHTS
     ============================================================ */
  function renderMini(sel, arr) {
    const g = $(sel); g.innerHTML = "";
    arr.forEach(k => {
      const up = k.dir === "up";
      const c = el("div", "kpi");
      c.innerHTML = `<div class="kpi-top"><span class="kpi-ic"><i class="${k.icon}"></i></span>
        <span class="kpi-dl ${up ? "up" : "down"}"><i class="fa-solid fa-caret-${up ? "up" : "down"}"></i>${sign(k.delta)}%</span></div>
        <div class="kpi-v num" style="font-size:22px">${k.value}</div>
        <div class="kpi-l">${k.label}</div>`;
      g.appendChild(c);
    });
  }
  function renderFunnel() {
    const box = $("#fnList"); box.innerHTML = "";
    const top = D.funnel[0].value;
    D.funnel.forEach((s, i) => {
      const w = 40 + (s.value / top) * 60;
      const pct = (s.value / top * 100).toFixed(1);
      const stage = el("div", "fn-stage");
      stage.innerHTML = `<div class="fn-bar" style="width:${w}%">
          <span class="fn-ic"><i class="${s.icon}"></i></span>
          <span class="fn-nm">${s.stage}</span>
          <span class="fn-v">${fmtK(s.value)} <span class="fn-pct">(${pct}%)</span></span></div>`;
      box.appendChild(stage);
      if (i < D.funnel.length - 1) {
        const drop = (1 - D.funnel[i + 1].value / s.value) * 100;
        box.appendChild(el("div", "fn-drop", `<i class="fa-solid fa-arrow-down-long"></i> تسرّب ${drop.toFixed(1)}%`));
      }
    });
  }
  let insSeed = 0;
  function renderInsights() {
    const g = $("#insGrid"); g.innerHTML = "";
    const pool = D.insightsPool.slice();
    /* اختيار 6 بترتيب دوّار */
    const pick = [];
    for (let i = 0; i < 6; i++) pick.push(pool[(insSeed + i) % pool.length]);
    insSeed = (insSeed + 6) % pool.length;
    pick.forEach(ins => {
      const c = el("div", "ins " + ins.tone);
      c.innerHTML = `<span class="ins-ic"><i class="${ins.icon}"></i></span>
        <div><div class="ins-t">${ins.t}</div><div class="ins-x">${ins.x}</div></div>`;
      g.appendChild(c);
    });
  }

  /* ============================================================
     CHART.JS
     ============================================================ */
  function chartDefaults() {
    if (!hasChart) return;
    Chart.defaults.font.family = "'Cairo',sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = cvar("--ink-2");
    /* الرسم فوري (بدون رسوم متحركة): عرض تنفيذي بلا وميض، ويضمن ظهور الرسوم
       عند التصدير إلى PDF/صورة أو عند فتح التبويب في الخلفية */
    Chart.defaults.animation = false;
    Chart.defaults.animations.colors = false;
    Chart.defaults.animations.x = false;
    Chart.defaults.animations.y = false;
    Chart.defaults.plugins.legend.rtl = true;
    Chart.defaults.plugins.legend.textDirection = "rtl";
    Object.assign(Chart.defaults.plugins.legend.labels, { usePointStyle: true, boxWidth: 8, boxHeight: 8, padding: 12, font: { size: 11, weight: "600" } });
    const tp = Chart.defaults.plugins.tooltip;
    tp.rtl = true; tp.textDirection = "rtl"; tp.usePointStyle = true;
    tp.backgroundColor = cvar("--ink"); tp.titleColor = cvar("--surface"); tp.bodyColor = cvar("--surface");
    tp.borderColor = "transparent"; tp.padding = 10; tp.cornerRadius = 8; tp.boxPadding = 5;
    tp.titleFont = { family: "'Cairo'", weight: "700", size: 12.5 }; tp.bodyFont = { family: "'Cairo'", size: 12 };
  }
  const C = () => ({ grid: cvar("--grid"), axis: cvar("--muted"), ink: cvar("--ink"), ink2: cvar("--ink-2"), brand: cvar("--brand"), brand2: cvar("--brand-2"), gold: cvar("--gold"), good: cvar("--good"), bad: cvar("--bad"), surf: cvar("--surface"), cat: [cvar("--c1"), cvar("--c2"), cvar("--c3"), cvar("--c4"), cvar("--c5"), cvar("--c6"), cvar("--c7"), cvar("--c8")] });
  const scale = (extra = {}) => { const c = C(); return { grid: { color: c.grid, drawTicks: false }, border: { display: false }, ticks: { color: c.axis, font: { size: 10.5, family: "'IBM Plex Mono'" }, padding: 6, ...extra } }; };
  const gaugeCenter = (txt, sub) => ({
    id: "gc" + Math.random(), afterDraw(ch) {
      const { ctx } = ch, x = (ch.chartArea.left + ch.chartArea.right) / 2, y = ch.chartArea.bottom - 6;
      ctx.save(); ctx.textAlign = "center";
      ctx.fillStyle = cvar("--ink"); ctx.font = "700 27px 'IBM Plex Mono'"; ctx.fillText(txt, x, y - 14);
      if (sub) { ctx.fillStyle = cvar("--muted"); ctx.font = "600 11px 'Cairo'"; ctx.fillText(sub, x, y + 6); }
      ctx.restore();
    }
  });
  function gauge(id, value, max, txt, sub, col) {
    const c = C();
    charts[id] = new Chart($("#" + id), {
      type: "doughnut",
      data: { datasets: [{ data: [value, Math.max(0, max - value)], backgroundColor: [col || c.brand, cvar("--surface-3")], borderWidth: 0, circumference: 270, rotation: -135 }] },
      options: { cutout: "76%", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } },
      plugins: [gaugeCenter(txt, sub)]
    });
  }

  function makeCharts() {
    if (!hasChart) return;
    chartDefaults();
    const c = C();

    /* رادار الأقاليم */
    charts.rgRadar = new Chart($("#rgRadar"), {
      type: "radar",
      data: {
        labels: D.regionRadar.axes,
        datasets: D.regionRadar.series.map((s, i) => ({
          label: s.name, data: s.vals, borderColor: [c.brand, c.gold, c.cat[0]][i],
          backgroundColor: mixA([c.brand, c.gold, c.cat[0]][i], .12), borderWidth: 2, pointRadius: 3,
          pointBackgroundColor: [c.brand, c.gold, c.cat[0]][i]
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { r: { angleLines: { color: c.grid }, grid: { color: c.grid }, pointLabels: { color: c.ink2, font: { size: 12, weight: "600" } }, ticks: { display: false, stepSize: 25 }, suggestedMin: 0, suggestedMax: 100 } },
        plugins: { legend: { position: "bottom" } }
      }
    });

    /* دونات الأعمار */
    charts.ageDonut = new Chart($("#ageDonut"), {
      type: "doughnut",
      data: { labels: D.age.map(a => a.range), datasets: [{ data: D.age.map(a => a.pct), backgroundColor: c.cat, borderColor: c.surf, borderWidth: 2, hoverOffset: 6 }] },
      options: { cutout: "68%", responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { padding: 8, font: { size: 10 } } }, tooltip: { callbacks: { label: x => ` ${x.label}: ${x.raw}%` } } } }
    });
    /* دونات الجنس */
    charts.genDonut = new Chart($("#genDonut"), {
      type: "doughnut",
      data: { labels: D.gender.map(g => g.label), datasets: [{ data: D.gender.map(g => g.pct), backgroundColor: [c.brand, c.gold], borderColor: c.surf, borderWidth: 2, hoverOffset: 6 }] },
      options: { cutout: "68%", responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: x => ` ${x.label}: ${x.raw}%` } } } }
    });
    /* أعمدة العمر: المدة والاحتفاظ */
    charts.ageBars = new Chart($("#ageBars"), {
      type: "bar",
      data: {
        labels: D.age.map(a => a.range),
        datasets: [
          { label: "المدة (د)", data: D.age.map(a => a.watch), backgroundColor: c.brand, borderRadius: 4, maxBarThickness: 18 },
          { label: "الاحتفاظ (%)", data: D.age.map(a => a.retention), backgroundColor: c.gold, borderRadius: 4, maxBarThickness: 18 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: scale(), y: scale({ callback: v => v }) }, plugins: { legend: { position: "bottom" } } }
    });

    /* الشريط: الاحتفاظ مقابل التسرّب */
    charts.stripLine = new Chart($("#stripLine"), {
      type: "line",
      data: {
        labels: D.stripHours.map(h => String(h.h).padStart(2, "0")),
        datasets: [
          { label: "الاحتفاظ", data: D.stripHours.map(h => h.retention), borderColor: c.brand, backgroundColor: mixA(c.brand, .1), fill: true, tension: .4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
          { label: "التسرّب", data: D.stripHours.map(h => h.dropoff), borderColor: c.bad, backgroundColor: "transparent", fill: false, tension: .4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, borderDash: [4, 3] }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, scales: { x: scale(), y: scale({ callback: v => v + "%" }) }, plugins: { legend: { position: "bottom" } } }
    });
    /* الشريط: قياس الانتباه */
    const attAvg = +(D.stripHours.reduce((s, h) => s + h.attention, 0) / 24).toFixed(1);
    gauge("stripGauge", attAvg, 100, attAvg + "%", "الهدف 60%", attAvg >= 60 ? c.good : c.brand);

    /* QR: المسح والتبرعات */
    charts.qrTime = new Chart($("#qrTime"), {
      type: "line",
      data: {
        labels: D.qrTime.map(d => d.day),
        datasets: [
          { label: "المسح", data: D.qrTime.map(d => d.scans), borderColor: c.brand, backgroundColor: mixA(c.brand, .12), fill: true, tension: .35, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
          { label: "التبرعات", data: D.qrTime.map(d => d.donations), borderColor: c.gold, backgroundColor: "transparent", fill: false, tension: .35, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, scales: { x: scale({ maxTicksLimit: 10, callback: function (v) { return "ي" + this.getLabelForValue(v); } }), y: scale({ callback: v => fmtK(v) }) }, plugins: { legend: { position: "bottom" } } }
    });
    /* QR: الأجهزة */
    charts.qrOS = new Chart($("#qrOS"), {
      type: "doughnut",
      data: { labels: D.qrOS.map(o => o.name), datasets: [{ data: D.qrOS.map(o => o.pct), backgroundColor: [c.cat[3], c.cat[0], c.cat[4], c.cat[2]], borderColor: c.surf, borderWidth: 2, hoverOffset: 6 }] },
      options: { cutout: "62%", responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: x => ` ${x.label}: ${x.raw}%` } } } }
    });
    /* QR: أعلى المدن */
    charts.qrCities = new Chart($("#qrCities"), {
      type: "bar",
      data: { labels: D.qrCities.map(x => x.name), datasets: [{ label: "مسح", data: D.qrCities.map(x => x.scans), backgroundColor: c.brand, borderRadius: 4, maxBarThickness: 15 }] },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, scales: { x: scale({ callback: v => fmtK(v) }), y: scale() }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: x => " " + fmt(x.raw) + " مسح" } } } }
    });

    /* المشاهدة: قياس متوسط الجلسة */
    gauge("watchGauge", 26.4, 60, "26.4", "دقيقة / 60", c.brand);
    /* المشاهدة: توزيع الجلسات */
    charts.watchDist = new Chart($("#watchDist"), {
      type: "bar",
      data: { labels: D.watchDist.map(x => x.b), datasets: [{ label: "جلسات (بالآلاف)", data: D.watchDist.map(x => x.v), backgroundColor: c.brand, borderRadius: 4, maxBarThickness: 30 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: scale(), y: scale({ callback: v => v }) }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: x => " " + fmt(x.raw) + " ألف جلسة" } } } }
    });
    /* المشاهدة: منحنى الاحتفاظ */
    charts.retCurve = new Chart($("#retCurve"), {
      type: "line",
      data: { labels: D.retCurve.map(x => x.min), datasets: [{ label: "الاحتفاظ", data: D.retCurve.map(x => x.pct), borderColor: c.brand, backgroundColor: mixA(c.brand, .12), fill: true, tension: .35, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: scale({ callback: function (v) { return this.getLabelForValue(v) + "د"; } }), y: scale({ callback: v => v + "%" }) }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: x => x[0].label + " دقيقة", label: x => " احتفاظ " + x.raw + "%" } } } }
    });

    /* المواسم: المؤشر */
    const smax = Math.max(...D.seasons.map(s => s.index));
    charts.seasonBar = new Chart($("#seasonBar"), {
      type: "bar",
      data: {
        labels: D.seasons.map(s => s.name),
        datasets: [
          { type: "line", label: "الأساس (100)", data: D.seasons.map(() => 100), borderColor: c.axis, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0 },
          { label: "المؤشر", data: D.seasons.map(s => s.index), backgroundColor: D.seasons.map(s => s.index === smax ? c.gold : c.brand), borderRadius: 4, maxBarThickness: 34 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: scale({ font: { size: 9.5, family: "'Cairo'" } }), y: scale({ callback: v => v }) }, plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: x => x.dataset.type === "line" ? " الأساس 100" : " المؤشر " + x.raw } } } }
    });
    /* المواسم: المدة */
    charts.seasonWatch = new Chart($("#seasonWatch"), {
      type: "bar",
      data: { labels: D.seasons.map(s => s.name), datasets: [{ label: "متوسط المشاهدة (د)", data: D.seasons.map(s => s.watch), backgroundColor: c.brand, borderRadius: 4, maxBarThickness: 16 }] },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, scales: { x: scale({ callback: v => v + "د" }), y: scale({ font: { size: 10, family: "'Cairo'" } }) }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: x => " " + x.raw + " دقيقة" } } } }
    });

    /* اللغات */
    charts.langDonut = new Chart($("#langDonut"), {
      type: "doughnut",
      data: { labels: D.languages.map(l => l.name), datasets: [{ data: D.languages.map(l => l.pct), backgroundColor: c.cat, borderColor: c.surf, borderWidth: 2, hoverOffset: 6 }] },
      options: { cutout: "66%", responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { padding: 8, font: { size: 10.5 } } }, tooltip: { callbacks: { label: x => ` ${x.label}: ${x.raw}%` } } } }
    });
    /* المدن */
    const cmax = Math.max(...D.cities.map(x => x.watch));
    charts.cityBar = new Chart($("#cityBar"), {
      type: "bar",
      data: { labels: D.cities.map(x => x.name), datasets: [{ label: "متوسط المدة (د)", data: D.cities.map(x => x.watch), backgroundColor: D.cities.map(x => x.watch === cmax ? c.gold : c.brand), borderRadius: 4, maxBarThickness: 16 }] },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, scales: { x: scale({ callback: v => v + "د" }), y: scale({ font: { size: 10.5, family: "'Cairo'" } }) }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: x => " " + x.raw + " دقيقة" } } } }
    });

    /* الرحلة: معدلات التحويل */
    const rates = D.funnel.slice(1).map((s, i) => ({ nm: s.stage, v: +(s.value / D.funnel[i].value * 100).toFixed(1) }));
    charts.fnRates = new Chart($("#fnRates"), {
      type: "bar",
      data: { labels: rates.map(r => r.nm), datasets: [{ label: "معدل التحويل %", data: rates.map(r => r.v), backgroundColor: c.brand, borderRadius: 4, maxBarThickness: 20 }] },
      options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, scales: { x: scale({ callback: v => v + "%" }), y: scale({ font: { size: 9.5, family: "'Cairo'" } }) }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: x => " تحويل " + x.raw + "%" } } } }
    });

    /* الشهري + التنبؤ */
    const L15 = [...D.monthLabels, ...D.fcLabels];
    const pad = (arr, n) => [...arr, ...Array(n).fill(null)];
    const thisY = pad(D.thisYear, 3);
    const fcLine = Array(11).fill(null).concat([D.thisYear[11], ...D.forecast]);
    const lower = Array(11).fill(null).concat([D.thisYear[11], ...D.fcBand.map(b => b[0])]);
    const upper = Array(11).fill(null).concat([D.thisYear[11], ...D.fcBand.map(b => b[1])]);
    charts.monthChart = new Chart($("#monthChart"), {
      type: "line",
      data: {
        labels: L15,
        datasets: [
          { label: "_lo", data: lower, borderColor: "transparent", pointRadius: 0, fill: false },
          { label: "_hi", data: upper, borderColor: "transparent", pointRadius: 0, fill: "-1", backgroundColor: mixA(c.brand, .14) },
          { label: "العام السابق", data: pad(D.lastYear, 3), borderColor: c.axis, backgroundColor: "transparent", borderWidth: 1.8, borderDash: [6, 4], tension: .3, pointRadius: 0, pointHoverRadius: 4 },
          { label: "العام الحالي", data: thisY, borderColor: c.brand, backgroundColor: "transparent", borderWidth: 2.6, tension: .3, pointRadius: 0, pointHoverRadius: 5 },
          { label: "التنبؤ", data: fcLine, borderColor: c.gold, backgroundColor: "transparent", borderWidth: 2.6, borderDash: [5, 4], tension: .3, pointRadius: 0, pointHoverRadius: 5 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
        scales: { x: scale({ font: { size: 10, family: "'Cairo'" } }), y: scale({ callback: v => v + "M" }) },
        plugins: { legend: { position: "bottom", labels: { filter: it => !it.text.startsWith("_") } }, tooltip: { filter: it => !it.dataset.label.startsWith("_"), callbacks: { label: x => " " + x.dataset.label + ": " + (x.raw == null ? "—" : x.raw + "M") } } }
      }
    });
  }
  const mixA = (col, a) => { const [r, g, b] = hex2rgb(col.startsWith("#") ? col : rgbToHex(col)); return `rgba(${r},${g},${b},${a})`; };
  function rgbToHex(c) { const m = c.match(/\d+/g); if (!m) return "#000000"; return "#" + m.slice(0, 3).map(x => (+x).toString(16).padStart(2, "0")).join(""); }

  function destroyCharts() { Object.keys(charts).forEach(k => { try { charts[k].destroy(); } catch (e) { } delete charts[k]; }); }

  /* ============================================================
     FILTERS
     ============================================================ */
  const filterDefs = [
    { id: "period", label: "الفترة", icon: "fa-regular fa-calendar", opts: ["آخر ٧ أيام", "آخر ٣٠ يوماً", "الشهر الحالي", "الربع الحالي"], sel: 1 },
    { id: "region", label: "الإقليم", icon: "fa-solid fa-earth-asia", opts: ["كل الأقاليم", ...D.regions.map(r => r.name)], sel: 0 },
    { id: "platform", label: "المنصة", icon: "fa-solid fa-display", opts: ["كل المنصات", "التلفاز الذكي", "الجوال", "الويب", "الأقمار الصناعية"], sel: 0 },
    { id: "season", label: "الموسم", icon: "fa-solid fa-star-and-crescent", opts: ["كل المواسم", "عادي", "رمضان", "الحج"], sel: 0 }
  ];
  function renderFilters() {
    const box = $("#filters");
    filterDefs.forEach(f => {
      const wrap = el("div", "fl");
      wrap.innerHTML = `<button class="fl-btn" data-f="${f.id}"><i class="${f.icon}"></i> ${f.label}: <b>${f.opts[f.sel]}</b> <i class="fa-solid fa-chevron-down"></i></button>
        <div class="fl-menu">${f.opts.map((o, i) => `<button class="fl-opt ${i === f.sel ? "sel" : ""}" data-i="${i}">${o}<i class="fa-solid fa-check"></i></button>`).join("")}</div>`;
      box.appendChild(wrap);
      const btn = $(".fl-btn", wrap), menu = $(".fl-menu", wrap);
      btn.addEventListener("click", e => { e.stopPropagation(); const open = menu.classList.contains("open"); closeAllMenus(); if (!open) menu.classList.add("open"); });
      $$(".fl-opt", menu).forEach(o => o.addEventListener("click", () => {
        f.sel = +o.dataset.i;
        $("b", btn).textContent = f.opts[f.sel];
        $$(".fl-opt", menu).forEach(x => x.classList.remove("sel")); o.classList.add("sel");
        menu.classList.remove("open");
        applyFilter(f);
      }));
    });
    const reset = el("button", "fl-reset", `<i class="fa-solid fa-arrow-rotate-left"></i> إعادة تعيين`);
    reset.addEventListener("click", () => {
      filterDefs.forEach(f => { f.sel = 0; });
      filterDefs[0].sel = 1;
      $("#filters").querySelectorAll(".fl").forEach(w => w.remove());
      renderFilters();
      toast("تمت إعادة تعيين عوامل التصفية");
    });
    box.appendChild(reset);
  }
  function applyFilter(f) {
    if (f.id === "season" && f.sel > 0) {
      const map = { "عادي": "عادي", "رمضان": "رمضان", "الحج": "الحج" };
      const target = map[f.opts[f.sel]];
      if (target) { $$("#peakTabs .tab").forEach(t => t.classList.toggle("on", t.dataset.s === target)); state.peak = target; $("#peakTitle").textContent = { "عادي": "نمط الأيام العادية", "رمضان": "نمط شهر رمضان", "الحج": "نمط موسم الحج" }[target]; renderHeatmap(); }
    }
    if (f.id === "region" && f.sel > 0) {
      const name = f.opts[f.sel];
      $("#s-region").scrollIntoView({ behavior: "smooth", block: "center" });
      $$("#rgList .rg-row").forEach(r => { const hit = r.dataset.region === name; r.style.opacity = hit ? "1" : ".4"; if (hit) $(".rg-fill", r).style.boxShadow = "0 0 0 2px var(--brand-soft)"; else $(".rg-fill", r).style.boxShadow = ""; });
    } else if (f.id === "region") {
      $$("#rgList .rg-row").forEach(r => { r.style.opacity = "1"; $(".rg-fill", r).style.boxShadow = ""; });
    }
    toast(`تم تطبيق التصفية · ${f.label}: ${f.opts[f.sel]}`);
  }
  function closeAllMenus() { $$(".fl-menu.open,.exp-menu.open").forEach(m => m.classList.remove("open")); }

  /* ============================================================
     RAIL / REVEAL
     ============================================================ */
  const secList = [["s-kpi", "المؤشرات"], ["s-map", "الخريطة"], ["s-region", "الأقاليم"], ["s-demo", "التركيبة السكانية"], ["s-device", "الأجهزة"], ["s-strip", "الشريط الساعي"], ["s-qr", "رمز QR"], ["s-peak", "ساعات الذروة"], ["s-watch", "المشاهدة"], ["s-season", "المواسم"], ["s-lang", "اللغات والمدن"], ["s-funnel", "رحلة المشاهد"], ["s-month", "التنبؤ"], ["s-insight", "الرؤى"]];
  function buildRail() {
    const rail = $("#rail");
    secList.forEach(([id, label]) => {
      const b = el("button"); b.dataset.id = id;
      b.addEventListener("click", () => $("#" + id).scrollIntoView({ behavior: "smooth", block: "start" }));
      b.addEventListener("mousemove", e => showTT(e, label, "start"));
      b.addEventListener("mouseleave", hideTT);
      rail.appendChild(b);
    });
    const io = new IntersectionObserver(ents => {
      ents.forEach(en => { if (en.isIntersecting) $$("#rail button").forEach(b => b.classList.toggle("on", b.dataset.id === en.target.id)); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secList.forEach(([id]) => { const s = $("#" + id); if (s) io.observe(s); });
  }
  function initReveal() {
    const io = new IntersectionObserver((ents, obs) => ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".rv").forEach(s => io.observe(s));
  }

  /* ============================================================
     TOOLTIP / TOAST
     ============================================================ */
  const tt = $("#tt");
  function showTT(e, text, side) {
    tt.textContent = text; tt.classList.add("show");
    const r = tt.getBoundingClientRect();
    let x = side === "start" ? e.clientX + 16 : e.clientX - r.width / 2;
    let y = e.clientY - r.height - 12;
    x = Math.max(8, Math.min(x, innerWidth - r.width - 8));
    if (y < 8) y = e.clientY + 18;
    tt.style.left = x + "px"; tt.style.top = y + "px";
  }
  function hideTT() { tt.classList.remove("show"); }
  let toastT;
  function toast(msg, icon) {
    const t = $("#toast"); $("#toastT").textContent = msg;
    $("i", t).className = icon || "fa-solid fa-circle-check";
    t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ============================================================
     THEME
     ============================================================ */
  function applyTheme(next) {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("qc-theme", next); } catch (e) { }
    $("#themeBtn i").className = next === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    destroyCharts(); makeCharts();
    renderDial(); renderHeatmap(); refreshMapTheme();
  }
  function initTheme() {
    let t = "light"; try { t = localStorage.getItem("qc-theme") || "light"; } catch (e) { }
    document.documentElement.dataset.theme = t;
    $("#themeBtn i").className = t === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
    $("#themeBtn").addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  }

  /* ============================================================
     EXPORT / NOTIF / SEARCH
     ============================================================ */
  function initExport() {
    const btn = $("#expBtn"), menu = $("#expMenu");
    btn.addEventListener("click", e => { e.stopPropagation(); const open = menu.classList.contains("open"); closeAllMenus(); if (!open) menu.classList.add("open"); });
    $$(".exp-i", menu).forEach(b => b.addEventListener("click", () => {
      menu.classList.remove("open");
      const kind = b.dataset.x;
      if (kind === "CSV") exportCSV();
      else toast(`جارٍ تجهيز ملف ${kind}… (عرض توضيحي)`, "fa-solid fa-spinner");
    }));
  }
  function exportCSV() {
    const head = ["الدولة", "المشاهدون", "النسبة%", "المدة(د)", "النمو%"];
    const rows = [...D.countries].sort((a, b) => b.viewers - a.viewers)
      .map(c => [c.ar, c.viewers, c.pct, c.watch, c.growth].join(","));
    const csv = "﻿" + head.join(",") + "\n" + rows.join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = el("a"); a.href = url; a.download = "قناة-القرآن-الدول.csv"; a.click();
    URL.revokeObjectURL(url); toast("تم تنزيل ملف CSV", "fa-solid fa-file-csv");
  }
  function initSearch() {
    const inp = $("#search");
    let deb;
    inp.addEventListener("input", () => {
      clearTimeout(deb);
      deb = setTimeout(() => { state.search = inp.value; renderTable(); filterMap(inp.value.trim()); }, 180);
    });
  }
  function initNotif() {
    $("#notifBtn").addEventListener("click", () => toast("لديك ٤ تنبيهات جديدة · أعلى نمو: قطر +10.8%", "fa-regular fa-bell"));
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    $("#logo").src = LOGO; $("#logoF").src = LOGO;
    $("#refreshT").textContent = D.meta.updated;
    initTheme();

    renderKPIs();
    renderTable(); initTableSort();
    renderRegions();
    renderDevices();
    renderStripTable(); initDialTabs();
    renderMini("#qrKpis", D.qrKpis);
    renderMini("#fcGrid", D.forecastCards);
    renderFunnel();
    renderInsights();
    renderFilters();
    initPeakTabs();

    makeCharts();
    initMap();
    renderDial();
    renderHeatmap();

    buildRail();
    initReveal();
    initExport();
    initSearch();
    initNotif();

    $("#regenBtn").addEventListener("click", () => { renderInsights(); toast("تم تحديث الرؤى التنفيذية", "fa-solid fa-rotate"); });
    document.addEventListener("click", closeAllMenus);

    startClock();
  }

  /* ---------------- clock ---------------- */
  function startClock() {
    const tF = new Intl.DateTimeFormat("ar-u-nu-latn", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Riyadh" });
    const dF = new Intl.DateTimeFormat("ar-u-nu-latn", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Riyadh" });
    const tick = () => { const n = new Date(); $("#clockT").textContent = tF.format(n); $("#clockD").textContent = dF.format(n); };
    tick(); setInterval(tick, 1000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
