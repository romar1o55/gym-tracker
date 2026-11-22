const $ = (s) => document.querySelector(s);
let exercises = [],
  workouts = JSON.parse(localStorage.getItem("gym_workouts") || "[]");
const dateLabel = () =>
  new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
$("#today").textContent = dateLabel();
function save() {
  localStorage.setItem("gym_workouts", JSON.stringify(workouts));
}
function render() {
  const root = $("#exercises");
  if (!exercises.length)
    root.innerHTML =
      '<div class="empty">Пока нет упражнений.<br>Добавь первое упражнение ниже.</div>';
  else
    root.innerHTML = exercises
      .map(
        (e, i) =>
          `<div class="exercise"><div class="row"><div class="exercise-title">${escapeHtml(e.name)}</div><button class="secondary small" onclick="removeExercise(${i})">Удалить</button></div><div class="sethead"><span>№</span><span>Вес, кг</span><span>Повторы</span><span></span></div>${e.sets.map((s, j) => `<div class="setrow"><span>${j + 1}</span><input aria-label="Вес" type="number" min="0" step="0.5" placeholder="0" value="${s.weight}" onchange="changeSet(${i},${j},'weight',this.value)"><input aria-label="Повторения" type="number" min="0" step="1" placeholder="0" value="${s.reps}" onchange="changeSet(${i},${j},'reps',this.value)"><button class="secondary" style="padding:9px" onclick="removeSet(${i},${j})">×</button></div>`).join("")}<button class="secondary full" onclick="addSet(${i})">＋ Добавить подход</button></div>`,
      )
      .join("");
  $("#exerciseCount").textContent = exercises.length;
  $("#setCount").textContent = exercises.reduce((n, e) => n + e.sets.length, 0);
}
function escapeHtml(s) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}
window.removeExercise = (i) => {
  exercises.splice(i, 1);
  render();
};
window.addSet = (i) => {
  exercises[i].sets.push({ weight: "", reps: "" });
  render();
};
window.removeSet = (i, j) => {
  exercises[i].sets.splice(j, 1);
  render();
};
window.changeSet = (i, j, k, v) => {
  exercises[i].sets[j][k] = v;
};
$("#addExercise").onclick = () => {
  let name = prompt("Название упражнения:");
  if (name && name.trim()) {
    exercises.push({
      name: name.trim(),
      sets: [{ weight: "", reps: "" }],
    });
    render();
  }
};
$("#finish").onclick = () => {
  if (!exercises.length) {
    alert("Сначала добавь хотя бы одно упражнение.");
    return;
  }
  let clean = exercises
    .map((e) => ({
      ...e,
      sets: e.sets.filter((s) => s.weight !== "" || s.reps !== ""),
    }))
    .filter((e) => e.sets.length);
  if (!clean.length) {
    alert("Заполни хотя бы один подход.");
    return;
  }
  workouts.unshift({ date: new Date().toISOString(), exercises: clean });
  save();
  exercises = [];
  render();
  renderHistory();
  renderProgress();
  alert("Тренировка сохранена!");
};
function renderHistory() {
  let el = $("#historyList");

  if (!workouts.length) {
    el.innerHTML = '<div class="empty">Сохранённых тренировок пока нет.</div>';
    return;
  }

  el.innerHTML = workouts
    .map(
      (w, i) => `
        <div class="history-item">
            <div class="row">
                <b>${new Date(w.date).toLocaleDateString("ru-RU")}</b>
                <button class="secondary small"
                    onclick="deleteWorkout(${i})">Удалить</button>
            </div>

            <button class="secondary full"
                onclick="showWorkout(${i})">
                Подробнее о тренировке
            </button>
        </div>
    `,
    )
    .join("");
}
window.showWorkout = (i) => {
    let w = workouts[i];

    let details = w.exercises.map(e => {
        let sets = e.sets.map((s, j) =>
            `Подход ${j + 1}: ${s.weight} кг × ${s.reps} повторений`
        ).join('\n');

        return `${e.name}\n${sets}`;
    }).join('\n\n');

    alert(
        'Тренировка от ' +
        new Date(w.date).toLocaleDateString('ru-RU') +
        '\n\n' + details
    );
};

window.deleteWorkout = (i) => {
  if (confirm("Удалить эту тренировку?")) {
    workouts.splice(i, 1);
    save();
    renderHistory();
    renderProgress();
  }
};
function renderProgress() {
  let el = $("#progressContent");
  let count = workouts.length;
  let all = workouts.flatMap((w) => w.exercises);
  let total = all.reduce((n, e) => n + e.sets.length, 0);
  let best = {};
  all.forEach((e) =>
    e.sets.forEach((s) => {
      let v = Number(s.weight);
      if (s.weight !== "" && (!best[e.name] || v > best[e.name]))
        best[e.name] = v;
    }),
  );
  el.innerHTML = `<div class="stats topgap"><div class="stat"><small>Тренировок</small><b>${count}</b></div><div class="stat"><small>Подходов всего</small><b>${total}</b></div></div><div class="card"><h3>Лучший записанный вес</h3>${
    Object.keys(best).length
      ? Object.entries(best)
          .map(
            ([n, v]) =>
              `<div class="history-item row"><span>${escapeHtml(n)}</span><b>${v} кг</b></div>`,
          )
          .join("")
      : '<div class="empty">Пока нет данных. Сохрани первую тренировку.</div>'
  }</div>`;
}
document.querySelectorAll("nav button").forEach(
  (b) =>
    (b.onclick = () => {
      document
        .querySelectorAll("nav button")
        .forEach((x) => x.classList.toggle("active", x === b));
      ["workout", "history", "progress"].forEach((id) =>
        $("#" + id).classList.toggle("hidden", id !== b.dataset.tab),
      );
      if (b.dataset.tab === "history") renderHistory();
      if (b.dataset.tab === "progress") renderProgress();
    }),
);
render();
renderHistory();
renderProgress();
if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
  navigator.serviceWorker.register("./sw.js").catch(() => {});
