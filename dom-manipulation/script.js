let quotes = [];

const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // Placeholder API

// Load saved quotes or set defaults
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

// Populate category dropdown
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

// Filter and display quote
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

// Create quote form
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

// Add a new quote
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
  pushQuoteToServer(newQuote);
}

// Export quotes
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

// Import quotes
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

// Push a quote to the mock server
async function pushQuoteToServer(quote) {
  try {
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    if (response.ok) {
      console.log("Synced to server.");
    }
  } catch (err) {
    console.error("Sync failed:", err);
  }
}

// Periodic mock sync with conflict resolution
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const serverQuotes = await response.json();

    let updated = false;
    serverQuotes.forEach(serverQuote => {
      const localMatch = quotes.find(q => q.text === serverQuote.title); // 'title' used by JSONPlaceholder
      if (!localMatch) {
        quotes.push({ text: serverQuote.title, category: "Server" });
        updated = true;
      }
    });

    if (updated) {
      alert("Quotes synced from server.");
      saveQuotes();
      populateCategories();
    }
  } catch (err) {
    console.warn("Failed to fetch from server:", err);
  }
}

// Setup import/export buttons
function setupImportExportControls() {
  document.getElementById("exportBtn").addEventListener("click", exportToJsonFile);
  document.getElementById("importFile").addEventListener("change", importFromJsonFile);
}

// App initialization
document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  loadLastViewedQuote();
  createAddQuoteForm();
  setupImportExportControls();
  populateCategories();
  newQuoteBtn.addEventListener("click", filterQuotes);
  categoryFilter.addEventListener("change", filterQuotes);

  if (localStorage.getItem("selectedCategory")) filterQuotes();

  // Simulate periodic sync every 15 seconds
  setInterval(fetchQuotesFromServer, 15000);
});
