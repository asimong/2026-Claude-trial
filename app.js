/**
 * RegenCHOICE Question Management App
 *
 * This file contains the main application logic for managing questions.
 * It's designed to be simple and easy to modify.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_FILENAME = 'regenchoice-questions.json';
const API_ENDPOINT = './api.php';

// =============================================================================
// APPLICATION STATE
// =============================================================================

class QuestionManager {
  constructor() {
    this.questions = [];           // Array of all questions
    this.editingIndex = -1;        // Index of question being edited (-1 = creating new)
    this.currentFilename = DEFAULT_FILENAME;
    this.unsavedChanges = false;
    this.serverAvailable = false;
  }

  // Add a new question to the list
  addQuestion(question) {
    this.questions.push(question);
    this.unsavedChanges = true;
  }

  // Update an existing question
  updateQuestion(index, question) {
    if (index >= 0 && index < this.questions.length) {
      this.questions[index] = question;
      this.unsavedChanges = true;
    }
  }

  // Delete a question
  deleteQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.questions.splice(index, 1);
      this.unsavedChanges = true;
    }
  }

  // Get a specific question
  getQuestion(index) {
    return this.questions[index];
  }

  // Get all questions
  getAllQuestions() {
    return this.questions;
  }

  // Save to a local file (downloads to user's computer)
  saveToFile(filename) {
    const jsonString = JSON.stringify(this.questions, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || this.currentFilename;
    link.click();

    URL.revokeObjectURL(url);
    this.unsavedChanges = false;
    showMessage(`Saved to ${filename || this.currentFilename}`);
  }

  // Load from a local file
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!Array.isArray(data)) {
            reject('File must contain an array of questions');
            return;
          }
          this.questions = data;
          this.currentFilename = file.name;
          this.unsavedChanges = false;
          resolve(data.length);
        } catch (err) {
          reject('Error parsing JSON: ' + err.message);
        }
      };

      reader.onerror = () => reject('Error reading file');
      reader.readAsText(file);
    });
  }

  // Check if server API is available
  async checkServerAvailability() {
    try {
      const response = await fetch(`${API_ENDPOINT}?action=info`);
      const data = await response.json();
      this.serverAvailable = data.success === true;
      return this.serverAvailable;
    } catch (err) {
      this.serverAvailable = false;
      return false;
    }
  }

  // Save to server
  async saveToServer() {
    const response = await fetch(`${API_ENDPOINT}?action=save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.questions)
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to save to server');
    }

    this.unsavedChanges = false;
    this.currentFilename = 'server: questions.json';
    showMessage(`Saved ${data.count} questions to server`);
    return data;
  }

  // Load from server
  async loadFromServer() {
    const response = await fetch(`${API_ENDPOINT}?action=load`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to load from server');
    }

    this.questions = data.questions || [];
    this.currentFilename = 'server: questions.json';
    this.unsavedChanges = false;
    showMessage(`Loaded ${this.questions.length} questions from server`);
    return this.questions.length;
  }
}

// Global app instance
let app;

// =============================================================================
// INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  app = new QuestionManager();
  setupEventListeners();

  // Check if server is available
  const serverAvailable = await app.checkServerAvailability();
  toggleServerButtons(serverAvailable);

  showStartupModal();
});

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
  // Navigation links
  document.getElementById('navList').addEventListener('click', () => showView('list'));
  document.getElementById('navCreate').addEventListener('click', () => showView('create'));
  document.getElementById('navValidate').addEventListener('click', () => showView('validate'));

  // Question type selector
  document.getElementById('questionType').addEventListener('change', (e) => {
    updateFormForQuestionType(e.target.value);
  });

  // Form submission
  document.getElementById('questionForm').addEventListener('submit', handleFormSubmit);

  // Local file operations
  document.getElementById('saveLocalBtn').addEventListener('click', () => {
    app.saveToFile(app.currentFilename);
  });

  document.getElementById('saveAsBtn').addEventListener('click', () => {
    const filename = prompt('Enter filename:', app.currentFilename);
    if (filename) {
      app.currentFilename = filename.endsWith('.json') ? filename : filename + '.json';
      app.saveToFile(app.currentFilename);
    }
  });

  document.getElementById('loadLocalBtn').addEventListener('click', () => {
    document.getElementById('loadFileInput').click();
  });

  document.getElementById('loadFileInput').addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      if (app.unsavedChanges && !confirm('Discard unsaved changes?')) {
        e.target.value = '';
        return;
      }

      try {
        const count = await app.loadFromFile(e.target.files[0]);
        showMessage(`Loaded ${count} questions`);
        showView('list');
      } catch (err) {
        alert('Load failed: ' + err);
      }

      e.target.value = '';
    }
  });

  // Server operations
  document.getElementById('saveServerBtn')?.addEventListener('click', async () => {
    if (confirm('Save to server? This will replace server data.')) {
      try {
        await app.saveToServer();
        showView('list');
      } catch (err) {
        alert('Save to server failed: ' + err.message);
      }
    }
  });

  document.getElementById('loadServerBtn')?.addEventListener('click', async () => {
    if (app.unsavedChanges && !confirm('Discard unsaved changes?')) {
      return;
    }

    try {
      await app.loadFromServer();
      showView('list');
    } catch (err) {
      alert('Load from server failed: ' + err.message);
    }
  });

  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (app.unsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes!';
      return e.returnValue;
    }
  });
}

// =============================================================================
// VIEW MANAGEMENT
// =============================================================================

function showView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });

  // Show selected view
  document.getElementById(viewName + 'View').classList.add('active');

  // Update navigation
  document.querySelectorAll('nav a').forEach(link => {
    link.classList.remove('active');
  });
  document.getElementById('nav' + viewName.charAt(0).toUpperCase() + viewName.slice(1))
    .classList.add('active');

  // Load view-specific content
  if (viewName === 'list') {
    renderQuestionList();
  } else if (viewName === 'validate') {
    renderValidationView();
  } else if (viewName === 'create') {
    resetForm();
  }

  updateStatusBar();
}

function updateStatusBar() {
  document.getElementById('statusFilename').textContent = app.currentFilename;
  document.getElementById('statusCount').textContent = app.questions.length;
  if (app.unsavedChanges) {
    document.getElementById('statusUnsaved').style.display = 'inline';
  } else {
    document.getElementById('statusUnsaved').style.display = 'none';
  }
}

function showMessage(message) {
  const msgEl = document.getElementById('statusMessage');
  msgEl.textContent = message;
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}

// =============================================================================
// STARTUP MODAL
// =============================================================================

function showStartupModal() {
  const modal = document.getElementById('startupModal');
  modal.style.display = 'block';

  // Load from file
  document.getElementById('startupLoadFile').onclick = () => {
    document.getElementById('startupFileInput').click();
  };

  document.getElementById('startupFileInput').onchange = async (e) => {
    if (e.target.files.length > 0) {
      try {
        const count = await app.loadFromFile(e.target.files[0]);
        showMessage(`Loaded ${count} questions`);
        modal.style.display = 'none';
        showView('list');
      } catch (err) {
        alert('Load failed: ' + err);
      }
    }
  };

  // Load from server
  if (app.serverAvailable) {
    document.getElementById('startupLoadServer').style.display = 'block';
    document.getElementById('startupLoadServer').onclick = async () => {
      try {
        await app.loadFromServer();
        modal.style.display = 'none';
        showView('list');
      } catch (err) {
        alert('Load from server failed: ' + err.message);
      }
    };
  }

  // Start new
  document.getElementById('startupNew').onclick = () => {
    modal.style.display = 'none';
    showView('list');
  };
}

function toggleServerButtons(available) {
  const saveServerBtn = document.getElementById('saveServerBtn');
  const loadServerBtn = document.getElementById('loadServerBtn');

  if (saveServerBtn) saveServerBtn.style.display = available ? 'inline-block' : 'none';
  if (loadServerBtn) loadServerBtn.style.display = available ? 'inline-block' : 'none';
}

// =============================================================================
// QUESTION LIST VIEW
// =============================================================================

function renderQuestionList() {
  const container = document.getElementById('questionList');
  const questions = app.getAllQuestions();

  if (questions.length === 0) {
    container.innerHTML = '<p class="empty-message">No questions yet. Create your first question!</p>';
    return;
  }

  let html = '';
  questions.forEach((q, idx) => {
    const langs = getAllQuestionLanguages(q);
    const firstLang = langs[0] || 'en';
    const title = q.QTitle[firstLang] || 'Untitled';
    const desc = q.QDesc[firstLang] || '';

    html += `
      <div class="question-card">
        <div class="question-header">
          <span class="question-type">${q.QStruct}</span>
          <span class="question-id">QID: ${q.QID}</span>
        </div>
        <h3>${escapeHtml(title)}</h3>
        <p class="question-desc">${escapeHtml(desc)}</p>
        <div class="question-meta">
          <span>Languages: ${langs.map(l => `<span class="lang-tag">${l}</span>`).join(' ')}</span>
          ${q.Qni > 0 ? `<span>Items: ${q.Qni}</span>` : ''}
        </div>
        <div class="question-actions">
          <button onclick="editQuestion(${idx})" class="btn-primary">Edit</button>
          <button onclick="viewQuestion(${idx})" class="btn-secondary">View JSON</button>
          <button onclick="validateSingleQuestion(${idx})" class="btn-secondary">Validate</button>
          <button onclick="deleteQuestion(${idx})" class="btn-danger">Delete</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function editQuestion(index) {
  app.editingIndex = index;
  const question = app.getQuestion(index);

  showView('create');
  populateForm(question);

  document.getElementById('formTitle').textContent = 'Edit Question';
  document.getElementById('submitBtn').textContent = 'Save Edit';
}

function viewQuestion(index) {
  const question = app.getQuestion(index);
  const modal = document.getElementById('viewModal');
  const content = document.getElementById('viewModalContent');

  content.innerHTML = `<pre>${JSON.stringify(question, null, 2)}</pre>`;
  modal.style.display = 'block';
}

function deleteQuestion(index) {
  if (confirm('Are you sure you want to delete this question?')) {
    app.deleteQuestion(index);
    renderQuestionList();
    updateStatusBar();
  }
}

function closeViewModal() {
  document.getElementById('viewModal').style.display = 'none';
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateSingleQuestion(index) {
  const question = app.getQuestion(index);
  const result = validateQuestion(question);

  const modal = document.getElementById('validationModal');
  const content = document.getElementById('validationModalContent');

  if (result.valid) {
    content.innerHTML = `
      <div class="validation-success">
        <h3>✓ Question is Valid</h3>
        <p>No errors found in QID ${question.QID}</p>
      </div>
    `;
  } else {
    content.innerHTML = `
      <div class="validation-errors">
        <h3>✗ Validation Errors</h3>
        <p>QID: ${question.QID}</p>
        <ul>
          ${result.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  modal.style.display = 'block';
}

function closeValidationModal() {
  document.getElementById('validationModal').style.display = 'none';
}

function renderValidationView() {
  const container = document.getElementById('validationResults');
  const questions = app.getAllQuestions();

  if (questions.length === 0) {
    container.innerHTML = '<p class="empty-message">No questions to validate.</p>';
    return;
  }

  const results = questions.map((q, idx) => ({
    index: idx,
    question: q,
    validation: validateQuestion(q)
  }));

  const validCount = results.filter(r => r.validation.valid).length;

  let html = `
    <div class="validation-summary">
      <h3>Validation Summary</h3>
      <p>${validCount} of ${questions.length} questions are valid</p>
    </div>
  `;

  results.forEach(result => {
    const statusClass = result.validation.valid ? 'valid' : 'invalid';
    const firstLang = getAllQuestionLanguages(result.question)[0] || 'en';
    const title = result.question.QTitle[firstLang] || 'Untitled';

    html += `
      <div class="validation-result ${statusClass}">
        <div class="validation-header">
          <span class="question-type">${result.question.QStruct}</span>
          <span>QID: ${result.question.QID}</span>
          <span class="validation-status">${result.validation.valid ? '✓ Valid' : '✗ Invalid'}</span>
        </div>
        <h4>${escapeHtml(title)}</h4>
        ${!result.validation.valid ? `
          <ul class="error-list">
            ${result.validation.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `;
  });

  container.innerHTML = html;
}

// =============================================================================
// FORM MANAGEMENT
// =============================================================================

function resetForm() {
  app.editingIndex = -1;
  document.getElementById('questionForm').reset();
  document.getElementById('formTitle').textContent = 'Create New Question';
  document.getElementById('submitBtn').textContent = 'Create Question';
  updateFormForQuestionType(document.getElementById('questionType').value);
}

function populateForm(question) {
  document.getElementById('questionType').value = question.QStruct;
  document.getElementById('qRelB').checked = question.QRelB;
  document.getElementById('qLearn').value = question.QLearn || '';
  document.getElementById('enablingQID').value = question.EnablingQID || '';
  document.getElementById('enablingAnswers').value = question.EnablingAnswers || '';

  if (question.Qni > 0 && question.QStruct !== QUESTION_TYPES.FACTQ && question.QStruct !== QUESTION_TYPES.RANGQ) {
    document.getElementById('qni').value = question.Qni;
  }

  // Populate language fields
  populateLanguageField('qTitle', question.QTitle);
  populateLanguageField('qDesc', question.QDesc);

  updateFormForQuestionType(question.QStruct);

  // Populate type-specific fields
  populateTypeSpecificFields(question);
}

// This will be continued in next message...
