/* ============================================================
   data.js — بيانات نموذجية للعرض التوضيحي
   قناة القرآن الكريم | لوحة الأداء التنفيذية
   جميع الأرقام تمثيلية لأغراض العرض فقط.
   ============================================================ */
(function () {
  "use strict";

  /* seeded RNG — لثبات الأرقام المولّدة بين التحديثات */
  let _s = 20260601;
  const rnd = () => { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; };
  const jitter = (base, spread) => base + (rnd() - 0.5) * 2 * spread;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------------- META ---------------- */
  const meta = {
    period: "01–30 يونيو 2026",
    updated: "18 يوليو 2026 · 09:40",
    tz: "توقيت السعودية (GMT+3)"
  };

  /* ---------------- KPIs ---------------- */
  const spark = (base, vol, n = 14, up = 1) => {
    const a = []; let v = base * (1 - up * 0.12);
    for (let i = 0; i < n; i++) { v = clamp(v + jitter(up * base * 0.02, base * vol), base * 0.6, base * 1.25); a.push(Math.round(v)); }
    a[n - 1] = Math.round(base); return a;
  };
  const kpis = [
    { id: "viewers", label: "إجمالي المشاهدين الفريدين", icon: "fa-solid fa-users", value: 3.82, unit: "مليون", raw: 3820000, delta: 6.4, dir: "up", spark: spark(382, .05) },
    { id: "watch", label: "متوسط مدة المشاهدة", icon: "fa-solid fa-clock", value: 26.4, unit: "دقيقة", raw: 26.4, delta: 3.1, dir: "up", spark: spark(264, .04) },
    { id: "retention", label: "معدل الاحتفاظ", icon: "fa-solid fa-heart-pulse", value: 47.2, unit: "%", raw: 47.2, delta: 2.4, dir: "up", spark: spark(472, .03) },
    { id: "scans", label: "عمليات مسح رمز QR", icon: "fa-solid fa-qrcode", value: 128.4, unit: "ألف", raw: 128400, delta: 18.7, dir: "up", spark: spark(1284, .06) },
    { id: "donations", label: "عدد التبرعات عبر الرمز", icon: "fa-solid fa-hand-holding-heart", value: 9340, unit: "تبرّع", raw: 9340, delta: 12.2, dir: "up", spark: spark(934, .07) }
  ];

  /* ---------------- COUNTRIES ---------------- */
  /* [الاسم, رمز ISO, lat, lng, viewers, watch(min), growth%] */
  const _c = [
    ["إندونيسيا", "ID", -2.5, 118, 612000, 24.1, 7.8],
    ["باكستان", "PK", 30.4, 69.3, 548000, 27.9, 9.1],
    ["الهند", "IN", 22.6, 79, 421000, 19.4, 5.2],
    ["بنغلاديش", "BD", 23.7, 90.4, 356000, 25.6, 8.4],
    ["مصر", "EG", 26.8, 30.8, 312000, 31.2, 4.6],
    ["نيجيريا", "NG", 9.1, 8.7, 268000, 22.8, 11.3],
    ["إيران", "IR", 32.4, 53.7, 214000, 28.4, 2.1],
    ["تركيا", "TR", 39, 35.2, 198000, 23.1, 3.7],
    ["السعودية", "SA", 23.9, 45.1, 187000, 42.6, 6.9],
    ["الجزائر", "DZ", 28, 2.6, 164000, 26.7, 5.8],
    ["المغرب", "MA", 31.8, -6.9, 148000, 25.3, 4.9],
    ["العراق", "IQ", 33.2, 43.7, 141000, 29.8, 6.2],
    ["السودان", "SD", 15.6, 30.2, 122000, 24.9, 3.1],
    ["أفغانستان", "AF", 33.9, 67.7, 118000, 26.1, 4.4],
    ["ماليزيا", "MY", 4.2, 101.9, 109000, 27.4, 8.9],
    ["اليمن", "YE", 15.5, 48.5, 98000, 23.6, 1.8],
    ["أوزبكستان", "UZ", 41.4, 64.6, 91000, 22.2, 7.1],
    ["سوريا", "SY", 34.8, 38.9, 86000, 27.7, 2.6],
    ["الأردن", "JO", 31.3, 36.5, 79000, 33.4, 5.5],
    ["الإمارات", "AE", 24, 54, 74000, 38.9, 9.4],
    ["كازاخستان", "KZ", 48, 67, 68000, 21.8, 6.3],
    ["تونس", "TN", 34, 9.5, 61000, 25.1, 3.9],
    ["الكويت", "KW", 29.3, 47.7, 57000, 41.2, 7.6],
    ["ليبيا", "LY", 27, 18, 49000, 24.4, 2.2],
    ["قطر", "QA", 25.3, 51.2, 44000, 40.1, 10.8],
    ["فلسطين", "PS", 31.9, 35.2, 42000, 34.8, 4.1],
    ["عُمان", "OM", 21, 57, 38000, 37.6, 6.7],
    ["الصومال", "SO", 5.2, 46.2, 34000, 22.9, 5.4],
    ["البحرين", "BH", 26, 50.5, 24000, 39.3, 8.2],
    ["لبنان", "LB", 33.9, 35.5, 21000, 30.2, 1.4]
  ];
  const totalV = _c.reduce((s, r) => s + r[4], 0);
  const countries = _c.map(r => ({
    ar: r[0], flag: r[1], lat: r[2], lng: r[3],
    viewers: r[4], pct: +(r[4] / totalV * 100).toFixed(1),
    watch: r[5], growth: r[6]
  }));

  /* ---------------- REGIONS ---------------- */
  const regions = [
    { name: "جنوب شرق آسيا", viewers: 848000 },
    { name: "جنوب آسيا", viewers: 1325000 },
    { name: "الشرق الأوسط", viewers: 604000 },
    { name: "شمال أفريقيا", viewers: 422000 },
    { name: "غرب أفريقيا", viewers: 318000 },
    { name: "شرق أفريقيا", viewers: 196000 },
    { name: "آسيا الوسطى", viewers: 227000 },
    { name: "الخليج العربي", viewers: 424000 },
    { name: "بلاد الشام", viewers: 249000 },
    { name: "أوروبا", viewers: 138000 },
    { name: "أمريكا الشمالية", viewers: 69000 }
  ].sort((a, b) => b.viewers - a.viewers);

  /* رادار: 5 محاور × 3 أقاليم للمقارنة */
  const regionRadar = {
    axes: ["الوصول", "الاحتفاظ", "التفاعل", "النمو", "التبرعات"],
    series: [
      { name: "جنوب آسيا", vals: [95, 78, 71, 66, 58] },
      { name: "الخليج العربي", vals: [62, 88, 84, 74, 92] },
      { name: "جنوب شرق آسيا", vals: [80, 72, 76, 83, 64] }
    ]
  };

  /* ---------------- AGE / GENDER ---------------- */
  const age = [
    { range: "13–17", pct: 6.2, watch: 14.1, retention: 32 },
    { range: "18–24", pct: 14.8, watch: 19.7, retention: 39 },
    { range: "25–34", pct: 23.6, watch: 24.9, retention: 45 },
    { range: "35–44", pct: 26.9, watch: 29.8, retention: 52 },
    { range: "45–54", pct: 15.4, watch: 32.6, retention: 57 },
    { range: "55–64", pct: 8.3, watch: 34.1, retention: 61 },
    { range: "65+", pct: 4.8, watch: 30.7, retention: 55 }
  ];
  const gender = [
    { label: "ذكور", pct: 54.3 },
    { label: "إناث", pct: 45.7 }
  ];

  /* ---------------- DEVICES ---------------- */
  const devices = [
    { name: "التلفاز الذكي", icon: "fa-solid fa-tv", viewers: 986000, delta: 8.2 },
    { name: "تطبيق الجوال — Android", icon: "fa-brands fa-android", viewers: 842000, delta: 11.4 },
    { name: "تطبيق الجوال — iOS", icon: "fa-brands fa-apple", viewers: 604000, delta: 9.7 },
    { name: "الموقع الإلكتروني", icon: "fa-solid fa-globe", viewers: 398000, delta: 3.1 },
    { name: "يوتيوب", icon: "fa-brands fa-youtube", viewers: 356000, delta: 14.8 },
    { name: "الأقمار الصناعية", icon: "fa-solid fa-satellite-dish", viewers: 288000, delta: -2.4 },
    { name: "Apple TV", icon: "fa-brands fa-app-store-ios", viewers: 142000, delta: 6.6 },
    { name: "Android TV", icon: "fa-brands fa-android", viewers: 124000, delta: 7.9 },
    { name: "الراديو الرقمي", icon: "fa-solid fa-radio", viewers: 88000, delta: 1.2 },
    { name: "منصات أخرى", icon: "fa-solid fa-ellipsis", viewers: 62000, delta: 4.3 }
  ];

  /* ---------------- STRIP (24h) ---------------- */
  /* شكل الطلب على مدار اليوم: ذروة الفجر، وذروة المغرب–العشاء */
  const dayShape = h => {
    const g = (c, w, a) => a * Math.exp(-((h - c) ** 2) / (2 * w * w));
    return 0.28 + g(5, 1.1, .55) + g(13, 2.2, .35) + g(19.5, 2.0, 1.0) + g(22, 1.6, .7);
  };
  const stripHours = [];
  for (let h = 0; h < 24; h++) {
    const s = dayShape(h);
    const impressions = Math.round(jitter(s * 61000, 2600));
    const reach = Math.round(impressions * clamp(jitter(0.74, .03), .6, .85));
    const retention = +clamp(jitter(38 + s * 14, 2.4), 22, 68).toFixed(1);
    const dropoff = +(100 - retention).toFixed(1);
    const ret2 = +clamp(jitter(19 + s * 6, 1.6), 8, 34).toFixed(1);
    const attention = +clamp(jitter(46 + s * 12, 2.2), 30, 74).toFixed(1);
    const scans = Math.round(jitter(s * 3600, 260));
    stripHours.push({ h, impressions, reach, retention, dropoff, return: ret2, attention, scans });
  }

  /* ---------------- QR ---------------- */
  const qrKpis = [
    { label: "إجمالي عمليات المسح", icon: "fa-solid fa-qrcode", value: "128,400", delta: 18.7, dir: "up" },
    { label: "معدل التحويل للتبرع", icon: "fa-solid fa-arrow-trend-up", value: "7.3%", delta: 1.9, dir: "up" },
    { label: "متوسط قيمة التبرع", icon: "fa-solid fa-sack-dollar", value: "84 ﷼", delta: 4.2, dir: "up" },
    { label: "أجهزة فريدة", icon: "fa-solid fa-mobile-screen", value: "96,120", delta: 15.3, dir: "up" }
  ];
  const qrTime = [];
  for (let d = 0; d < 30; d++) {
    const wk = [1, .9, .95, 1, 1.15, 1.35, 1.25][d % 7];
    const scans = Math.round(jitter(3900 * wk, 380));
    qrTime.push({ day: d + 1, scans, donations: Math.round(scans * clamp(jitter(.073, .01), .05, .1)) });
  }
  const qrOS = [
    { name: "Android", pct: 58.4 },
    { name: "iOS", pct: 33.1 },
    { name: "HarmonyOS", pct: 5.2 },
    { name: "أخرى", pct: 3.3 }
  ];
  const qrCities = [
    { name: "الرياض", scans: 21400 }, { name: "جدة", scans: 16800 },
    { name: "مكة المكرمة", scans: 14200 }, { name: "القاهرة", scans: 11900 },
    { name: "المدينة المنورة", scans: 9800 }, { name: "جاكرتا", scans: 8600 },
    { name: "لاهور", scans: 7300 }, { name: "الدمام", scans: 6100 },
    { name: "اسطنبول", scans: 5200 }, { name: "كوالالمبور", scans: 4400 }
  ];

  /* ---------------- PEAK HEATMAPS ---------------- */
  const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const buildHeat = shapeFn => days.map((_, d) =>
    Array.from({ length: 24 }, (_, h) => Math.round(clamp(shapeFn(d, h) * 100, 3, 100)))
  );
  const base = (d, h) => {
    const wend = (d === 5 || d === 6) ? 1.12 : 1;   // الجمعة/السبت
    const fri = (d === 5 && h >= 11 && h <= 13) ? 1.5 : 1; // خطبة الجمعة
    return clamp((dayShape(h) / 1.6) * wend * fri, 0, 1);
  };
  const ramadan = (d, h) => {
    const g = (c, w, a) => a * Math.exp(-((h - c) ** 2) / (2 * w * w));
    return clamp(0.3 + g(4, 1.4, .8) + g(18.5, 1.2, 1.0) + g(21.5, 2.4, .95) + g(1, 2, .6), 0, 1);
  };
  const hajj = (d, h) => {
    const g = (c, w, a) => a * Math.exp(-((h - c) ** 2) / (2 * w * w));
    return clamp(0.32 + g(6, 1.6, .7) + g(13, 3, .95) + g(19, 1.8, .8) + g(22, 1.6, .6), 0, 1);
  };
  const peak = {
    days,
    week: buildHeat(base),
    "عادي": buildHeat(base),
    "رمضان": buildHeat(ramadan),
    "الحج": buildHeat(hajj)
  };

  /* ---------------- WATCH TIME ---------------- */
  const watchDist = [
    { b: "أقل من ٥", v: 486 }, { b: "٥–١٠", v: 642 }, { b: "١٠–٢٠", v: 831 },
    { b: "٢٠–٣٠", v: 724 }, { b: "٣٠–٤٥", v: 512 }, { b: "٤٥–٦٠", v: 358 },
    { b: "٦٠–٩٠", v: 214 }, { b: "٩٠+", v: 132 }
  ];
  const retCurve = (() => {
    const mins = [5, 10, 15, 20, 30, 40, 50, 60, 75, 90, 105, 120];
    return mins.map((m, i) => ({ min: m, pct: +clamp(100 * Math.exp(-m / 58) + jitter(2, 1.5) + (i === 0 ? 0 : 0), 6, 100).toFixed(1) }));
  })();

  /* ---------------- SEASONS ---------------- */
  const seasons = [
    { name: "أيام عادية", index: 100, watch: 24.1 },
    { name: "ليالي الجمعة", index: 118, watch: 27.3 },
    { name: "عاشوراء", index: 141, watch: 29.4 },
    { name: "عشر ذي الحجة", index: 224, watch: 44.2 },
    { name: "الحج", index: 196, watch: 38.6 },
    { name: "رمضان", index: 212, watch: 41.0 },
    { name: "العشر الأواخر", index: 268, watch: 52.4 },
    { name: "ليلة القدر", index: 340, watch: 63.1 }
  ];

  /* ---------------- LANGUAGES ---------------- */
  const languages = [
    { name: "العربية", pct: 41.8 }, { name: "الإندونيسية", pct: 16.4 },
    { name: "الأردية", pct: 14.2 }, { name: "الإنجليزية", pct: 11.7 },
    { name: "الفرنسية", pct: 6.3 }, { name: "التركية", pct: 5.1 },
    { name: "الملايو", pct: 4.5 }
  ];

  /* ---------------- CITIES (top 10 by watch) ---------------- */
  const cities = [
    { name: "مكة المكرمة", watch: 48.6, viewers: 112000 },
    { name: "المدينة المنورة", watch: 45.9, viewers: 96000 },
    { name: "الرياض", watch: 39.4, viewers: 148000 },
    { name: "جدة", watch: 37.1, viewers: 134000 },
    { name: "القاهرة", watch: 34.8, viewers: 176000 },
    { name: "اسطنبول", watch: 31.2, viewers: 88000 },
    { name: "جاكرتا", watch: 29.6, viewers: 142000 },
    { name: "كراتشي", watch: 28.9, viewers: 158000 },
    { name: "لاهور", watch: 28.1, viewers: 129000 },
    { name: "كوالالمبور", watch: 27.4, viewers: 74000 }
  ];

  /* ---------------- FUNNEL ---------------- */
  const funnel = [
    { stage: "فتح القناة", icon: "fa-solid fa-power-off", value: 3820000 },
    { stage: "مشاهدة أطول من دقيقة", icon: "fa-solid fa-play", value: 2712000 },
    { stage: "مشاهدة الشريط الساعي", icon: "fa-solid fa-clock-rotate-left", value: 1486000 },
    { stage: "مسح رمز QR", icon: "fa-solid fa-qrcode", value: 128400 },
    { stage: "فتح صفحة التبرع", icon: "fa-solid fa-hand-holding-heart", value: 41200 },
    { stage: "إتمام التبرع", icon: "fa-solid fa-circle-check", value: 9340 }
  ];

  /* ---------------- MONTHLY / FORECAST ---------------- */
  const monthLabels = ["يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو"];
  const fcLabels = ["يوليو ٢٦", "أغسطس ٢٦", "سبتمبر ٢٦"];
  const lastYear = [2.71, 2.66, 2.74, 2.83, 2.79, 2.9, 3.12, 3.28, 3.66, 3.19, 3.05, 3.36];
  const thisYear = [3.18, 3.11, 3.24, 3.36, 3.3, 3.44, 3.71, 3.94, 4.62, 3.98, 3.74, 3.82];
  const forecast = [3.98, 4.12, 4.05]; // 3 أشهر قادمة
  const fcBand = [[3.84, 4.12], [3.9, 4.34], [3.78, 4.32]];
  const forecastCards = [
    { label: "النمو المتوقع (Q3)", icon: "fa-solid fa-arrow-trend-up", value: "+7.9%", delta: 1.5, dir: "up" },
    { label: "مشاهدون متوقعون — يوليو", icon: "fa-solid fa-users", value: "3.98M", delta: 4.2, dir: "up" },
    { label: "ذروة متوقعة — أغسطس", icon: "fa-solid fa-arrow-up-right-dots", value: "4.12M", delta: 3.5, dir: "up" },
    { label: "هامش الخطأ (±)", icon: "fa-solid fa-wave-square", value: "5.6%", delta: -0.4, dir: "down" }
  ];

  /* ---------------- INSIGHTS (pool) ---------------- */
  const insightsPool = [
    { tone: "good", icon: "fa-solid fa-arrow-trend-up", t: "نمو قوي في مسح رمز QR", x: "ارتفعت عمليات المسح بنسبة <b>+18.7%</b> عن الشهر السابق، بقيادة الرياض وجدة اللتين تمثّلان <b>30%</b> من إجمالي المسح." },
    { tone: "gold", icon: "fa-solid fa-star-and-crescent", t: "أثر المواسم الدينية", x: "بلغ مؤشر المشاهدة في <b>ليلة القدر</b> ذروته عند <b>340</b> مقابل <b>100</b> في الأيام العادية — أعلى ذروة سنوية." },
    { tone: "info", icon: "fa-solid fa-clock", t: "نافذتا الذروة اليوميتان", x: "يتركّز الطلب في نافذتين: <b>الفجر (٥ ص)</b> وذروة <b>المغرب–العشاء (٧–١٠ م)</b>، وهي أنسب أوقات عرض الشريط الساعي." },
    { tone: "good", icon: "fa-solid fa-mobile-screen", t: "هيمنة الجوال", x: "يشكّل الجوال (Android + iOS) نحو <b>38%</b> من المشاهدين، بنمو <b>+10.5%</b>، ما يعزّز أولوية تجربة التطبيق." },
    { tone: "warn", icon: "fa-solid fa-satellite-dish", t: "تراجع القمر الصناعي", x: "انخفضت المشاهدة عبر الأقمار الصناعية بنسبة <b>-2.4%</b>؛ يُنصح بتحويل الحملات نحو المنصات الرقمية." },
    { tone: "info", icon: "fa-solid fa-earth-asia", t: "ثقل جنوب آسيا", x: "يقود إقليم <b>جنوب آسيا</b> بـ <b>1.33 مليون</b> مشاهد، تليه <b>باكستان</b> بأعلى معدل نمو قُطري <b>+9.1%</b>." },
    { tone: "gold", icon: "fa-solid fa-hand-holding-heart", t: "تحسّن كفاءة التبرع", x: "ارتفع معدل التحويل للتبرع إلى <b>7.3%</b> بمتوسط قيمة <b>84 ﷼</b>، ما يعكس فاعلية موضع الرمز أثناء الشريط." },
    { tone: "good", icon: "fa-solid fa-hourglass-half", t: "المدن المقدّسة تتصدّر المدة", x: "تسجّل <b>مكة</b> و<b>المدينة</b> أعلى متوسط مشاهدة (<b>48.6</b> و<b>45.9</b> دقيقة) رغم صغر حجم الجمهور." },
    { tone: "warn", icon: "fa-solid fa-users-slash", t: "فجوة الفئة الشابة", x: "لا تتجاوز الفئة <b>13–24</b> نسبة <b>21%</b> من الجمهور؛ فرصة لمحتوى قصير موجّه للمنصات الاجتماعية." },
    { tone: "info", icon: "fa-solid fa-chart-line", t: "توقّع الربع الثالث", x: "يشير النموذج إلى بلوغ <b>4.12 مليون</b> مشاهد في أغسطس بهامش خطأ <b>±5.6%</b> ضمن نطاق الثقة." }
  ];

  /* ---------------- EXPORT ---------------- */
  window.DATA = {
    meta, kpis, countries, totalV, regions, regionRadar, age, gender, devices,
    stripHours, qrKpis, qrTime, qrOS, qrCities, peak,
    watchDist, retCurve, seasons, languages, cities, funnel,
    monthLabels, fcLabels, lastYear, thisYear, forecast, fcBand, forecastCards,
    insightsPool
  };
})();
