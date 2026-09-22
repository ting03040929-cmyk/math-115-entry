const CONFIG = {
  spreadsheetId: "1y3HZnrCFnfyy_IkC8FoMra7GWZSPkWMYId2r-3uFu2s",
  sheetName: "入口清單",
};

const DATA_URL = `https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(CONFIG.sheetName)}`;

const state = {
  rows: [],
  selectedGroup: "",
};

const elements = {
  loadingCard: document.querySelector("#loading-card"),
  groupPanel: document.querySelector("#group-panel"),
  datePanel: document.querySelector("#date-panel"),
  errorCard: document.querySelector("#error-card"),
  dateList: document.querySelector("#date-list"),
  selectedGroupTitle: document.querySelector("#selected-group-title"),
  dateInstruction: document.querySelector("#date-instruction"),
  backButton: document.querySelector("#back-button"),
};

document.querySelectorAll("[data-group]").forEach((button) => {
  button.addEventListener("click", () => {
    state.selectedGroup = button.dataset.group;
    renderDatePanel();
  });
});

elements.backButton.addEventListener("click", () => {
  state.selectedGroup = "";
  elements.datePanel.hidden = true;
  elements.groupPanel.hidden = false;
});

init();

async function init() {
  try {
    state.rows = await loadRows();
    elements.loadingCard.hidden = true;
    elements.groupPanel.hidden = false;
  } catch (error) {
    console.error(error);
    elements.loadingCard.hidden = true;
    elements.errorCard.hidden = false;
  }
}

async function loadRows() {
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`教材清單讀取失敗：${response.status}`);
  }

  const text = await response.text();
  const payload = parseGoogleVisualizationResponse(text);
  const rows = payload?.table?.rows ?? [];

  return rows
    .map((row) => normalizeRow(row))
    .filter((row) => row.group && row.date && row.title && row.url && row.visible === "是")
    .filter((row) => isSafeWebUrl(row.url))
    .sort((a, b) => b.sortKey - a.sortKey);
}

function parseGoogleVisualizationResponse(text) {
  const prefix = "google.visualization.Query.setResponse(";
  const start = text.indexOf(prefix);
  if (start === -1) {
    throw new Error("Google 試算表回傳格式不正確。");
  }

  const jsonText = text.slice(start + prefix.length).replace(/\);?\s*$/, "");
  return JSON.parse(jsonText);
}

function normalizeRow(row) {
  const cells = row.c ?? [];
  const group = cellText(cells[0]);
  const dateCell = cells[1] ?? {};
  const date = cellText(dateCell);
  const dateInfo = parseDate(dateCell.v, dateCell.f || date);

  return {
    group,
    date: dateInfo.label,
    sortKey: dateInfo.sortKey,
    usage: cellText(cells[2]),
    title: cellText(cells[3]),
    url: cellText(cells[4]),
    visible: cellText(cells[5]),
  };
}

function cellText(cell) {
  if (!cell) return "";
  return String(cell.f ?? cell.v ?? "").trim();
}

function parseDate(value, formattedValue) {
  const gvizDate = typeof value === "string" && value.match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (gvizDate) {
    const year = Number(gvizDate[1]);
    const month = Number(gvizDate[2]);
    const day = Number(gvizDate[3]);
    return {
      label: `${month + 1}月${day}日`,
      sortKey: Date.UTC(year, month, day),
    };
  }

  const parsed = new Date(value || formattedValue);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      label: `${parsed.getMonth() + 1}月${parsed.getDate()}日`,
      sortKey: parsed.getTime(),
    };
  }

  return {
    label: formattedValue || String(value || ""),
    sortKey: 0,
  };
}

function isSafeWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function renderDatePanel() {
  const groupRows = state.rows.filter((row) => row.group === state.selectedGroup);
  elements.groupPanel.hidden = true;
  elements.datePanel.hidden = false;
  elements.selectedGroupTitle.textContent = `${state.selectedGroup}：請選擇日期`;
  elements.dateInstruction.textContent = groupRows.length
    ? "請點選要進入的日期。"
    : "目前還沒有這一組的教材或作業。";
  elements.dateList.replaceChildren();

  if (!groupRows.length) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "目前沒有可選的日期。";
    elements.dateList.append(empty);
    return;
  }

  groupRows.forEach((row) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "date-card";
    card.addEventListener("click", () => {
      window.location.assign(row.url);
    });

    const date = document.createElement("span");
    date.className = "date-value";
    date.textContent = row.date;

    const details = document.createElement("span");
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = row.usage || "數學教材";
    const title = document.createElement("span");
    title.className = "date-title";
    title.textContent = row.title;
    details.append(tag, document.createElement("br"), title);

    const arrow = document.createElement("span");
    arrow.className = "date-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";

    card.append(date, details, arrow);
    elements.dateList.append(card);
  });
}
