function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const WORKS_KEY = "sclWorks";
const LOGS_KEY = "sclLogs";

const dateInput = document.getElementById("date");
const today = getLocalDateString();
dateInput.value = today;

function getWorks() {
  return JSON.parse(localStorage.getItem(WORKS_KEY)) || [];
}

function saveWorks(works) {
  localStorage.setItem(WORKS_KEY, JSON.stringify(works));
}

function getLogs() {
  return JSON.parse(localStorage.getItem(LOGS_KEY)) || [];
}

function saveLogs(logs) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

function addLog() {
  const newTitle = document
     .getElementById("newTitle")
     .value
     .trim();
  if (newTitle === "") {
     // 新しい作品は作らない
  }
  const platform = document.getElementById("platform").value;
  const selectedWorkId = document.getElementById("workSelect").value;
  
  const chars = Number(document.getElementById("chars").value) || 0;
  const memo = document.getElementById("memo").value.trim();

  if (chars === 0 && memo === "") {
      alert("文字数かメモを入力してください。");
      return;
  }

  const works = getWorks();
  let work;

  if (newTitle) {
    work = {
      id: Date.now(),
      title: newTitle,
      platform: platform,
      createdAt: document.getElementById("date").value
    };
    works.push(work);
    saveWorks(works);
  } else {
    work = works.find(w => String(w.id) === selectedWorkId);
  }

  if (!work) {
     alert("作品を選ぶか、新しい作品名を入力してください。");
     return;
  }

  const log = {
    id: Date.now() + 1,
    workId: work.id,
    date: document.getElementById("date").value,
    workType: document.getElementById("workType").value,
    chars: Number(document.getElementById("chars").value) || 0,
    memo: document.getElementById("memo").value
  };

  const logs = getLogs();
  logs.push(log);
  saveLogs(logs);

  document.getElementById("newTitle").value = "";
  document.getElementById("chars").value = "";
  document.getElementById("memo").value = "";

  render();
}

function deleteLog(id) {
  const logs = getLogs().filter(log => log.id !== id);
  saveLogs(logs);
  render();
}

function renderWorkOptions() {
  const works = getWorks();
  const workSelect = document.getElementById("workSelect");

  if (!workSelect) return;

  if (works.length === 0) {
    workSelect.innerHTML =
      `<option value="">まだ作品がありません</option>`;
    return;
  }

  workSelect.innerHTML = works.map(work => `
    <option value="${work.id}">
      ${work.platform}：${work.title}
     </option>
  `).join("");
}

function render() {
  const works = getWorks();
  const logs = getLogs().sort((a, b) => b.date.localeCompare(a.date));

  const todayLogs = logs.filter(log => log.date === today);

  const todayTotal = todayLogs.reduce((sum, log) => sum + log.chars, 0);

  const noteTotal = todayLogs
    .filter(log => {
      const work = works.find(w => w.id === log.workId);
      return work && work.platform === "note";
    })
    .reduce((sum, log) => sum + log.chars, 0);

  const shizukanaTotal = todayLogs
    .filter(log => {
      const work = works.find(w => w.id === log.workId);
      return work && work.platform === "しずかなインターネット";
    })
    .reduce((sum, log) => sum + log.chars, 0);

  document.getElementById("summary").innerHTML = `
    <strong>🌞 今日の創作</strong><br>
    合計：${todayTotal}字 / ${todayLogs.length}件<br>
    note：${noteTotal}字<br>
    しずかなインターネット：${shizukanaTotal}字
  `;

  document.getElementById("logs").innerHTML = logs.map(log => {
    const work = works.find(w => w.id === log.workId);

    const title = work ? work.title : "不明な作品";
    const platform = work ? work.platform : "不明";

    return `
      <div class="log">
        <div class="log-title">${title}</div>
        <div class="log-meta">
          ${log.date} / ${platform} / ${log.workType} / ${log.chars}字
        </div>
        ${log.memo ? `<p>${log.memo}</p>` : ""}
        <button class="delete-btn" onclick="deleteLog(${log.id})">削除</button>
      </div>
    `;
  }).join("");
  
  renderWorkOptions();
}

render();