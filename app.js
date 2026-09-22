const CONFIG = {
  publishedCsvUrl:
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRRVj_DoyTqLY_oMFVteRifkzANvSGHK-nULlYy9yqksytoDEE-qmbSC0TcFDNtgKUpgMr38A681VUx/pub?gid=676947176&single=true&output=csv",
};

const DATA_URL = CONFIG.publishedCsvUrl;

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
    throw new Error("教材清單讀取失敗：" + response.status);
  }

  const text = await response.text();
  const rows = parseCsv(text);

  return rows
    .slice(1)
    .map((cells) => normalizeRow(cells))
    .filter((row) => row.group && row.date && row.title && row.url && row.visible === "是")
    .filter((row) => isSafeWebUrl(row.url))
    .sort((a, b) => b.sortKey - a.sortKey);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === String.fromCharCode(10) || char === String.fromCharCode(13)) && !inQuotes) {
      if (char === String.fromCharCode(13) && text.charCodeAt(index + 1) === 10) {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normalizeRow(cells) {
  const group = cellText(cells[0]);
  const date = cellText(cells[1]);
  const dateInfo = parseDate(date, date);

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

function cellText(value) {
  return String(value ?? "").trim();
}

function parseDate(value, formattedValue) {
  const parsed = new Date(value || formattedValue);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      label: (parsed.getMonth() + 1) + "月" + parsed.getDate() + "日",
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
  elements.selectedGroupTitle.textContent = state.selectedGroup + "：請選擇日期";
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
