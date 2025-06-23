let quotes = [];

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");

// ===== Load and Save Quotes in Local Storage =====
function loadQuotes() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  } else {
    quotes = [
      { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Motivational" },
      { text: "Life is really simple, but we insist on making it complicated.", category: "Life" },
      { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", category: "Wisdom" }
    ];
    saveQuotes();
  }
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ===== Session Storage (Last Viewed Quote) =====
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

// ===== ✅ Populate Categories Dropdown =====
function populateCategories() {
  const selected = localStorage.getItem("selectedCategory") || "all";
  
  // ✅ Use map to extract categories from quotes
  const allCategories = quotes.map(q => q.category);
  const uniqueCategories = [...new Set(allCategories)];

  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  uniqueCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    if (category === selected) {
      option.selected = true;
    }
    categoryFilter.appendChild(option);
  });
}

// ===== Filter Quotes by Selected Category =====
function filterQuotes() {
  const selectedCategory = categoryFilter.value;
  localStorage.setItem("selectedCategory", selectedCategory);

  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes available in this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const quote = filtered[randomIndex];
  quoteDisplay.innerHTML = `<strong>${quote.category}:</strong> "${quote.text}"`;

  saveLastViewedQuote(quote);
}

// ===== Create Add Quote Form Dynamically =====
function createAddQuoteForm() {
  const formContainer = document.createElement("div");

  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";

  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.onclick = addQuote;

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);

  document.getElementById("formContainer").appendChild(formContainer);
}

// ===== Add New Quote and Update Category Filter =====
function addQuote() {
  const newText = document.getElementById("newQuoteText").value.trim();
  const newCategory = document.getElementById("newQuoteCategory").value.trim();

  if (!newText || !newCategory) {
    alert("Please fill out both fields.");
    return;
  }

  const newQuote = { text: newText, category: newCategory };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();

  quoteDisplay.innerHTML = `<strong>Added:</strong> "${newQuote.text}" (${newQuote.category})`;
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// ===== JSON Export =====
function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "quotes.json";
  downloadLink.click();

  URL.revokeObjectURL(url);
}

// ===== JSON Import =====
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (!Array.isArray(importedQuotes)) throw new Error("Invalid file format");

      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Failed to import: Invalid JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// ===== Wire Up Import/Export Buttons =====
function setupImportExportControls() {
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importFile");

  exportBtn.addEventListener("click", exportToJsonFile);
  importInput.addEventListener("change", importFromJsonFile);
}

// ===== Initialize Everything =====
document.addEventListener("DOMContentLoaded", () => {
  loadQuotes();
  loadLastViewedQuote();

  newQuoteBtn.addEventListener("click", filterQuotes);
  categoryFilter.addEventListener("change", filterQuotes);

  createAddQuoteForm();
  setupImportExportControls();
  populateCategories();

  if (localStorage.getItem("selectedCategory")) {
    filterQuotes();
  }
});
