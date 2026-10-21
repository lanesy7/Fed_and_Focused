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
