  const WORKS_KEY = "sclWorks";
  const LOGS_KEY = "sclLogs";

  const dateInput = document.getElementById("date");
  const today = new Date().toISOString().slice(0, 10);
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
    const title = document.getElementById("title").value || "無題";
    const platform = document.getElementById("platform").value;

    const works = getWorks();

    let work = works.find(w => w.title === title && w.platform === platform);

    if (!work) {
      work = {
        id: Date.now(),
        title: title,
        platform: platform,
        createdAt: document.getElementById("date").value
      };
      works.push(work);
      saveWorks(works);
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

    document.getElementById("title").value = "";
    document.getElementById("chars").value = "";
    document.getElementById("memo").value = "";

    render();
  }

  function deleteLog(id) {
    const logs = getLogs().filter(log => log.id !== id);
    saveLogs(logs);
    render();
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
  }

  render();