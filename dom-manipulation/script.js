let quotes = [];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";

// Load quotes from localStorage
function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored ? JSON.parse(stored) : [
    { text: "Believe you can and you're halfway there.", category: "Motivational" },
    { text: "Life is simple, but we make it complicated.", category: "Life" },
    { text: "Opportunity lies within every difficulty.", category: "Wisdom" }
  ];
  saveQuotes();
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function saveLastViewedQuote(quote) {
  sessionStorage.setItem("lastViewedQuote", JSON.stringify(quote));
}

function loadLastViewedQuote() {
  const last = sessionStorage.getItem("lastViewedQuote");
  if (last) {
    const quote = JSON.parse(last);
    quoteDisplay.innerHTML = `<strong>Last Viewed (${quote.category}):</strong> "${quote.text}"`;
  }
}

function populateCategories() {
  const selected = localStorage.getItem("selectedCategory") || "all";
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selected) opt.selected = true;
    categoryFilter.appendChild(opt);
  });
}

function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem("selectedCategory", selected);
  const filtered = selected === "all" ? quotes : quotes.filter(q => q.category === selected);
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes in this category.";
    return;
  }
  const quote = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.innerHTML = `<strong>${quote.category}:</strong> "${quote.text}"`;
  saveLastViewedQuote(quote);
}

function createAddQuoteForm() {
  const container = document.getElementById("formContainer");
  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.placeholder = "Enter category";

  const button = document.createElement("button");
  button.textContent = "Add Quote";
  button.onclick = addQuote;

  container.appendChild(quoteInput);
  container.appendChild(categoryInput);
  container.appendChild(button);
}

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) {
    alert("Fill both fields");
    return;
  }
  const newQuote = { text, category };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  quoteDisplay.innerHTML = `<strong>Added:</strong> "${text}" (${category})`;
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");
      quotes.push(...imported);
      saveQuotes();
      populateCategories();
      alert("Quotes imported");
    } catch {
      alert("Import failed: invalid file.");
    }
  };
  reader.readAsText(event.target.files[0]);
}

async function syncQuotes() {
  try {
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();

    let updated = false;
    const serverQuotes = serverData.map(post => ({
      text: post.title || post.text,
      category: post.category || "Server"
    }));

    // Add or update local quotes
    serverQuotes.forEach(serverQuote => {
      const match = quotes.find(local => local.text === serverQuote.text);
      if (!match) {
        quotes.push(serverQuote);
        updated = true;
      } else if (match.category !== serverQuote.category) {
        match.category = serverQuote.category; // Server wins
        updated = true;
      }
    });

    // Push new local quotes to server (simulate)
    for (const quote of quotes) {
      if (!serverQuotes.find(sq => sq.text === quote.text)) {
        await fetch(SERVER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: quote.text,
            category: quote.category
          })
        });
      }
    }

    if (updated) {
      saveQuotes();
      populateCategories();
      document.getElementById("syncNotice").textContent = "Quotes synced with server!";
      setTimeout(() => {
        document.getElementById("syncNotice").textContent = "";
      }, 4000);
    }

  } catch (error) {
    console.error("Error syncing quotes:", error);
  }
}

function setupImportExportControls() {
  document.getElementById("exportBtn").addEventListener("click", exportToJsonFile);
  document.getElementById("importFile").addEventListener("change", importFromJsonFile);
}

document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  loadLastViewedQuote();
  createAddQuoteForm();
  setupImportExportControls();
  populateCategories();
  newQuoteBtn.addEventListener("click", filterQuotes);
  categoryFilter.addEventListener("change", filterQuotes);
  if (localStorage.getItem("selectedCategory")) filterQuotes();
  setInterval(syncQuotes, 15000); // Sync every 15 seconds
});
