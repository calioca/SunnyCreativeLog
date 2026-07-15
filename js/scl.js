// ========================================
// 定数・状態
// ========================================
const WORKS_KEY = "sclWorks";
const LOGS_KEY = "sclLogs";
let editingLogId = null;

const dateInput = document.getElementById("date");

// ========================================
// 日付
// ========================================

/* 今日の日付を入力フォーム用の形式で取得する */
function getLocalDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ========================================
// データの取得・保存
// ========================================

/* 作品を取得する */
function getWorks() {
  return JSON.parse(localStorage.getItem(WORKS_KEY)) || [];
}

/* 作品を保存する */
function saveWorks(works) {
  localStorage.setItem(WORKS_KEY, JSON.stringify(works));
}

/* ログを取得する */
function getLogs() {
  return JSON.parse(localStorage.getItem(LOGS_KEY)) || [];
}

/* ログを保存する */
function saveLogs(logs) {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}


// ========================================
// 創作ログ
// ========================================

/* 創作ログを保存する */
function saveLog() {
  const newTitle = document.getElementById("newTitle").value.trim();
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

  if (editingLogId !== null) {
    work = works.find(w => String(w.id) === selectedWorkId);
  } else if (newTitle) {
    work = works.find(w =>
      w.title === newTitle &&
      w.platform === platform
    );

    if (!work) {
      work = {
        id: Date.now(),
        title: newTitle,
        platform: platform,
        createdAt: document.getElementById("date").value
      };

      works.push(work);
      saveWorks(works);
    }
  } else {
    work = works.find(w => String(w.id) === selectedWorkId);
  }

  if (!work) {
    alert("作品を選ぶか、新しい作品名を入力してください。");
    return;
  }

  const log = {
    id: editingLogId ?? Date.now(),
    workId: work.id,
    date: document.getElementById("date").value,
    workType: document.getElementById("workType").value,
    chars,
    memo
  };

  const logs = getLogs();

  if (editingLogId === null) {
    logs.push(log);
  } else {
    const index = logs.findIndex(
      existingLog => existingLog.id === editingLogId
    );

    if (index === -1) {
      alert("編集する創作ログが見つかりません。");
      cancelLogEdit();
      return;
    }

    logs[index] = log;
  }

  saveLogs(logs);
  resetLogForm();
  render();
}

/* 創作ログを削除する */
function deleteLog(id) {
  const logs = getLogs().filter(log => log.id !== id);
  saveLogs(logs);
  render();
}

// ========================================
// 作品管理
// ========================================

/* 選択中の種別に対応する作品を、新しい順で選択欄に表示する */
function renderWorkOptions() {
  const works = getWorks();
  const workSelect = document.getElementById("workSelect");
  const selectedPlatform = document.getElementById("platform").value;

  if (!workSelect) return;

  const filteredWorks = works
    .filter(work => work.platform === selectedPlatform)
    .sort((a, b) => Number(b.id) - Number(a.id));

  if (filteredWorks.length === 0) {
    workSelect.innerHTML =
      `<option value="">この種別の作品はまだありません</option>`;
    return;
  }

  workSelect.innerHTML = filteredWorks.map(work => `
    <option value="${work.id}">
      ${work.title}
    </option>
  `).join("");
}

/* 作品名を更新する */
function updateWorkTitle() {
  const selectedWorkId = document.getElementById("workSelect").value;
  const newTitle = document.getElementById("editWorkTitle").value.trim();

  if (!selectedWorkId) {
    alert("作品を選択してください。");
    return;
  }

  if (!newTitle) {
    alert("新しい作品名を入力してください。");
    return;
  }

  const works = getWorks();
  const work = works.find(w => String(w.id) === selectedWorkId);

  if (!work) {
    alert("作品が見つかりません。");
    return;
  }

  const sameWork = works.find(w =>
    w.id !== work.id &&
    w.platform === work.platform &&
    w.title === newTitle
  );

  if (sameWork) {
    alert("同じ種別に同じ作品名がすでにあります。");
    return;
  }

  work.title = newTitle;
  saveWorks(works);

  document.getElementById("editWorkTitle").value = "";

  render();
}

/* 創作ログのない作品を削除する */
function deleteSelectedWorkIfEmpty() {
  const selectedWorkId = document.getElementById("workSelect").value;

  if (!selectedWorkId) {
    alert("作品を選択してください。");
    return;
  }

  const logs = getLogs();
  const hasLogs = logs.some(log => String(log.workId) === selectedWorkId);

  if (hasLogs) {
    alert("創作ログがある作品は削除できません。");
    return;
  }

  const works = getWorks();
  const work = works.find(w => String(w.id) === selectedWorkId);

  if (!work) {
    alert("作品が見つかりません。");
    return;
  }

  const confirmed = confirm(`「${work.title}」を削除しますか？`);

  if (!confirmed) return;

  const updatedWorks = works.filter(w => String(w.id) !== selectedWorkId);
  saveWorks(updatedWorks);

  document.getElementById("editWorkTitle").value = "";

  render();
}

/* 保存されているデータをもとに画面全体を更新する */
function render() {
  const works = getWorks();
  const logs = getLogs().sort((a, b) => b.date.localeCompare(a.date));

  const todayLogs = logs.filter(log => log.date === today);

  const todayTotal = todayLogs.reduce((sum, log) => sum + log.chars, 0);
  
  const totalChars = todayLogs.reduce(
    (sum, log) => sum + Number(log.chars),
    0
  );
  
  const workCount = new Set(
    todayLogs.map(log => log.workId)
  ).size;

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
    ${workCount}作品 / ${todayTotal.toLocaleString()}文字<br>
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
        <div class="log-actions">
          <button class="edit-btn" onclick="editLog(${log.id})">
            編集
          </button>
          <button class="delete-btn" onclick="deleteLog(${log.id})">
            削除
          </button>
        </div>
      </div>
    `;
  }).join("");
  
  renderWorkOptions();
}

/* 創作ログ入力フォームを初期状態に戻す */
function resetLogForm() {
  editingLogId = null;

  document.getElementById("newTitle").value = "";
  document.getElementById("chars").value = "";
  document.getElementById("memo").value = "";

  document.getElementById("saveLogButton").textContent = "記録する";
  document.getElementById("cancelEditButton").hidden = true;
  document.getElementById("newTitle").disabled = false;
}

/* 指定したIDの創作ログを編集できる状態にする */
function editLog(id) {
  const logs = getLogs();
  const works = getWorks();

  const log = logs.find(log => log.id === id);

  if (!log) {
    alert("編集する創作ログが見つかりません。");
    return;
  }

  const work = works.find(work => work.id === log.workId);

  if (!work) {
    alert("創作ログに対応する作品が見つかりません。");
    return;
  }

  editingLogId = id;

  document.getElementById("date").value = log.date;
  document.getElementById("platform").value = work.platform;

  renderWorkOptions();

  document.getElementById("workSelect").value = String(work.id);
  document.getElementById("workType").value = log.workType;
  document.getElementById("chars").value = log.chars;
  document.getElementById("memo").value = log.memo;

  document.getElementById("newTitle").value = "";
  document.getElementById("newTitle").disabled = true;

  document.getElementById("saveLogButton").textContent = "更新する";
  document.getElementById("cancelEditButton").hidden = false;

  document.getElementById("date").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// ========================================
// 作品詳細
// ========================================
/* 選択中の作品の詳細を表示する */
function showSelectedWorkDetail() {
  const selectedWorkId = document.getElementById("workSelect").value;

  if (!selectedWorkId) {
    alert("作品を選択してください。");
    return;
  }

  showWorkDetail(Number(selectedWorkId));
}

// ========================================
// 画面表示
// ========================================

/* 編集モードを終了し、新規入力モードに戻す */
function cancelLogEdit() {
  resetLogForm();

  dateInput.value = getLocalDateString();

  renderWorkOptions();
}

/* 指定したIDの作品詳細を表示する */
function showWorkDetail(workId) {
  const works = getWorks();

  const work = works.find(
    work => String(work.id) === String(workId)
  );

  if (!work) {
    alert("作品が見つかりません。");
    return;
  }
  
  const logs = getLogs();

  const workLogs = logs.filter(
    log => String(log.workId) === String(work.id)
  );
  const sortedWorkLogs = [...workLogs].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  const workDetailLogs = document.getElementById("workDetailLogs");

  if (sortedWorkLogs.length === 0) {
    workDetailLogs.innerHTML =
      `<p class="empty-message">この作品のログはまだありません。</p>`;
  } else {
    workDetailLogs.innerHTML = sortedWorkLogs.map(log => `
      <div class="work-detail-log">
        <div class="work-detail-log-meta">
          ${log.date} / ${log.workType} / ${log.chars}字
        </div>
        ${log.memo ? `<p>${log.memo}</p>` : ""}
      </div>
    `).join("");
  }

  const totalChars = workLogs.reduce(
    (sum, log) => sum + (Number(log.chars) || 0),
    0
  );

  document.getElementById("workDetailTotalChars").textContent =
  totalChars.toLocaleString();

  document.getElementById("workDetailLogCount").textContent =
  workLogs.length;

  document.getElementById("workDetailTitle").textContent = work.title;
  document.getElementById("workDetailPlatform").textContent = work.platform;

  document.getElementById("mainView").hidden = true;
  document.getElementById("workDetailView").hidden = false;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* 作品詳細を閉じてメイン画面へ戻す */
function hideWorkDetail() {
  document.getElementById("workDetailView").hidden = true;
  document.getElementById("mainView").hidden = false;

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ========================================
// 初期化
// ========================================

const today = getLocalDateString();
dateInput.value = today;

document.getElementById("platform").addEventListener(
    "change",
    renderWorkOptions
);
render();