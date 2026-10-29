/* =========================================================
   CHART DATA - this is the only part you need to edit.
   Each label lines up with the number in the same spot.
   type can be: "bar", "pie", "doughnut", or "line"
   ========================================================= */

const charts = [
  {
    canvasId: "chart1",
    type: "bar",
    title: "Chart 1 title (e.g. How often students eat veggies)",
    labels: ["Daily", "A few times a week", "Weekly", "Rarely"],
    values: [12, 30, 25, 18],
  },
  {
    canvasId: "chart2",
    type: "doughnut",
    title: "Chart 2 title (e.g. Where food waste comes from)",
    labels: ["Dining halls", "Home", "Restaurants", "Other"],
    values: [40, 30, 20, 10],
  },
];


/* =========================================================
   You shouldn't need to touch anything below this line.
   ========================================================= */

function drawCharts() {
  if (typeof Chart === "undefined") return; // chart library didn't load

  const css = getComputedStyle(document.documentElement);
  const accent = css.getPropertyValue("--accent").trim();
  const muted = css.getPropertyValue("--muted").trim();
  const line = css.getPropertyValue("--line").trim();
  // Accent color first, then greys, so charts stay on-brand
  const palette = [accent, css.getPropertyValue("--accent-2").trim(), "#5f8a63", "#c98a5a", "#ece7da"];

  Chart.defaults.color = muted;
  Chart.defaults.font.family = css.getPropertyValue("--font").trim();

  charts.forEach((c) => {
    const canvas = document.getElementById(c.canvasId);
    if (!canvas) return;
    const round = c.type === "pie" || c.type === "doughnut";

    new Chart(canvas, {
      type: c.type,
      data: {
        labels: c.labels,
        datasets: [{
          label: c.title,
          data: c.values,
          backgroundColor: round ? palette : accent,
          borderColor: round ? css.getPropertyValue("--card").trim() : accent,
          borderWidth: round ? 2 : (c.type === "line" ? 2 : 0),
          borderRadius: c.type === "bar" ? 6 : 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: c.title,
            color: css.getPropertyValue("--text").trim(),
            font: { size: 15, weight: "500" },
            align: "start",
            padding: { bottom: 16 },
          },
          legend: { display: round, position: "bottom", labels: { usePointStyle: true, boxWidth: 8 } },
        },
        scales: round ? {} : {
          x: { grid: { display: false } },
          y: { grid: { color: line }, border: { display: false } },
        },
      },
    });
  });
}

drawCharts();


/* =========================================================
   Hero photo: drifts and fades as you scroll + nav turns solid
   ========================================================= */
const heroBg = document.getElementById("hero-bg");
const navbar = document.getElementById("navbar");
const calmMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function onScroll() {
  const y = window.scrollY;
  const h = window.innerHeight;

  if (heroBg && !calmMotion && y < h) {
    heroBg.style.transform = `translateY(${y * 0.35}px) scale(1.05)`; // moves slower than the page
    heroBg.style.opacity = Math.max(0, 1 - y / (h * 0.9));            // fades out
  }
  if (navbar) navbar.classList.toggle("scrolled", y > 40);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();


/* =========================================================
   Map pins: click a pin -> popup with "Get directions",
   and the Google map above jumps to that place.
   Each pin's data-place (in index.html) is what Google searches for.
   ========================================================= */
const mapFrame = document.getElementById("campus-map-frame");
const pins = document.querySelectorAll(".pin");

pins.forEach((pin) => {
  const place = pin.dataset.place;
  const label = pin.querySelector(".pin-label");
  const dot = pin.querySelector(".pin-dot");

  // Add the "Get directions" link automatically
  if (place && label) {
    const link = document.createElement("a");
    link.className = "pin-link";
    link.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(place);
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Get directions";
    label.appendChild(document.createElement("br"));
    label.appendChild(link);
  }

  if (dot) {
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = pin.classList.contains("open");
      pins.forEach((p) => p.classList.remove("open")); // close the others
      if (!wasOpen) {
        pin.classList.add("open");
        // Show this place on the Google map too
        if (mapFrame && place) {
          mapFrame.src = "https://www.google.com/maps?q=" + encodeURIComponent(place) + "&output=embed";
        }
      }
    });
  }
});

// Click anywhere else to close the popup
document.addEventListener("click", (e) => {
  if (!e.target.closest(".pin")) pins.forEach((p) => p.classList.remove("open"));
});


/* =========================================================
   VERTICAL SHOPPING CART
   A cart rides down the right edge of the page as you scroll and picks up
   each food along the way. Scrolling back up puts the foods back.
   Edit the foods in index.html (the <li class="rail-food"> lines).
   ========================================================= */
(function () {
  const rail = document.getElementById("cart-rail");
  const cart = document.getElementById("rail-cart");
  if (!rail || !cart) return;

  const foods = Array.from(rail.querySelectorAll(".rail-food"));
  const fill = document.getElementById("rail-fill");
  const load = document.getElementById("rail-load");
  const badge = document.getElementById("rail-count");
  const tip = document.getElementById("rail-tip");
  const live = document.getElementById("cart-live");

  // Foods are spread evenly between these two points of the page (0 = top, 1 = bottom)
  const START = 0.1;
  const END = 0.92;

  let positions = [];
  let railH = 0;
  let cartH = 0;
  let collected = -1;   // -1 means "haven't drawn yet"
  let tipTimer;

  // Work out where each food sits on the rail (re-runs when the window resizes)
  function layout() {
    railH = rail.clientHeight;
    cartH = cart.offsetHeight;
    const travel = Math.max(0, railH - cartH);
    positions = foods.map((el, i) => {
      const t = foods.length > 1 ? i / (foods.length - 1) : 0.5;
      const at = START + (END - START) * t;
      el.style.top = at * travel + cartH / 2 + "px";
      return at;
    });
  }

  function showTip(food, n) {
    tip.textContent = "";
    const title = document.createElement("strong");
    title.textContent = food.textContent.trim() + " " + food.dataset.name +
      (n === foods.length ? " · Cart full!" : "");
    tip.append(title, document.createTextNode(food.dataset.fact));
    tip.classList.add("show");
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => tip.classList.remove("show"), 3200);
  }

  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const f = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const travel = Math.max(0, railH - cartH);
    const y = f * travel;

    cart.style.transform = `translateY(${y}px)`;
    fill.style.height = y + cartH / 2 + "px";

    // A food is collected once the cart reaches it
    let n = 0;
    foods.forEach((el, i) => {
      const got = f >= positions[i];
      el.classList.toggle("collected", got);
      if (got) n++;
    });

    if (n !== collected) {
      const before = collected;
      collected = n;
      badge.textContent = n;

      load.textContent = "";
      foods.slice(0, n).forEach((el) => {
        const s = document.createElement("span");
        s.textContent = el.textContent.trim();
        load.appendChild(s);
      });

      if (before >= 0 && n > before) {
        const last = foods[n - 1];
        showTip(last, n);
        if (live) live.textContent = "Added " + last.dataset.name + " to your cart. " + n + " of " + foods.length + ".";
      }
    }
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", () => { layout(); update(); });
  window.addEventListener("load", () => { layout(); update(); });
  layout();
  update();
})();


/* =========================================================
   PIN FINDER MODE (for your team only)
   Open the site with ?pins at the end of the web address, e.g.
     index.html?pins   or   https://you.github.io/your-repo/?pins
   Then click anywhere on the campus image to get its top/left numbers.
   Visitors never see this.
   ========================================================= */
if (new URLSearchParams(window.location.search).has("pins")) {
  document.body.classList.add("pin-finder-mode");

  const banner = document.createElement("div");
  banner.className = "pin-finder-banner";
  banner.textContent = "Pin finder: click a spot on the campus image";
  document.body.appendChild(banner);

  document.querySelectorAll(".pin-map").forEach((mapBox) => {
    const img = mapBox.querySelector("img");
    if (!img) return;

    img.addEventListener("click", (e) => {
      const box = img.getBoundingClientRect();
      const top = ((e.clientY - box.top) / box.height * 100).toFixed(1);
      const left = ((e.clientX - box.left) / box.width * 100).toFixed(1);
      const code = `style="top: ${top}%; left: ${left}%;"`;

      // Drop a marker where you clicked
      mapBox.querySelectorAll(".pin-finder-mark, .pin-finder-tag").forEach((el) => el.remove());
      const mark = document.createElement("span");
      mark.className = "pin-finder-mark";
      mark.style.top = top + "%";
      mark.style.left = left + "%";
      const tag = document.createElement("span");
      tag.className = "pin-finder-tag";
      tag.style.top = top + "%";
      tag.style.left = left + "%";
      tag.textContent = `top: ${top}%; left: ${left}%`;
      mapBox.append(mark, tag);

      // Copy it so you can paste straight into index.html
      banner.textContent = `${code}  (copied, paste it into your pin)`;
      try {
        navigator.clipboard.writeText(code).catch(() => {
          banner.textContent = `${code}  (copy this into your pin)`;
        });
      } catch (err) {
        banner.textContent = `${code}  (copy this into your pin)`;
      }
    });
  });
}
