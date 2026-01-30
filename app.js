/**
 * RegenCHOICE Question Management App
 * File-based storage version
 */

// Default filename for question storage
const DEFAULT_FILENAME = 'regenchoice-questions.json';

// Server API endpoint (update this to your server path)
const API_ENDPOINT = './api.php';

class QuestionManager {
  constructor() {
    this.questions = [];
    this.currentQuestion = null;
    this.editingIndex = -1;
    this.currentFilename = DEFAULT_FILENAME;
    this.unsavedChanges = false;
    this.currentEditingLang = 'en';  // Track which language is being edited
    this.serverAvailable = false;  // Track if server API is available
  }

  // File operations
  saveToFile(filename) {
    const dataStr = JSON.stringify(this.questions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || this.currentFilename;
    link.click();
    URL.revokeObjectURL(url);
    this.unsavedChanges = false;
    updateStatus(`Saved to ${filename || this.currentFilename}`);
  }

  loadFromFile(file, merge = false) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (Array.isArray(imported)) {
            if (merge) {
              // Merge: add new questions, avoiding duplicates by QID
              const existingQIDs = new Set(this.questions.map(q => q.QID));
              const newQuestions = imported.filter(q => !existingQIDs.has(q.QID));
              this.questions.push(...newQuestions);
              updateStatus(`Merged ${newQuestions.length} new questions from ${file.name}`);
              resolve({ count: newQuestions.length, merged: true });
            } else {
              // Replace: load as new file
              this.questions = imported;
              this.currentFilename = file.name;
              this.unsavedChanges = false;
              updateStatus(`Loaded ${imported.length} questions from ${file.name}`);
              resolve({ count: imported.length, merged: false });
            }
          } else {
            reject('Invalid file format: expected an array of questions');
          }
        } catch (err) {
          reject('Error parsing JSON: ' + err.message);
        }
      };
      reader.onerror = () => reject('Error reading file');
      reader.readAsText(file);
    });
  }

  loadFromMultipleFiles(files) {
    return Promise.all(Array.from(files).map(file => this.loadFromFile(file, true)))
      .then(results => {
        const totalMerged = results.reduce((sum, r) => sum + r.count, 0);
        updateStatus(`Merged ${totalMerged} questions from ${files.length} files`);
        return totalMerged;
      });
  }

  // Server operations
  async checkServerAvailability() {
    try {
      const response = await fetch(`${API_ENDPOINT}?action=info`);
      const data = await response.json();
      this.serverAvailable = data.success === true;
      return this.serverAvailable;
    } catch (err) {
      console.warn('Server API not available:', err);
      this.serverAvailable = false;
      return false;
    }
  }

  async loadFromServer() {
    try {
      updateStatus('Loading from server...');
      const response = await fetch(`${API_ENDPOINT}?action=load`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load from server');
      }

      this.questions = data.questions || [];
      this.currentFilename = 'server: questions.json';
      this.unsavedChanges = false;
      updateStatus(`Loaded ${this.questions.length} questions from server`);

      return {
        success: true,
        count: this.questions.length,
        message: data.message
      };
    } catch (err) {
      console.error('Load from server error:', err);
      throw new Error('Failed to load from server: ' + err.message);
    }
  }

  async saveToServer() {
    try {
      updateStatus('Saving to server...');

      const response = await fetch(`${API_ENDPOINT}?action=save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.questions)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save to server');
      }

      this.unsavedChanges = false;
      this.currentFilename = 'server: questions.json';
      updateStatus(`Saved ${data.count} questions to server`);

      return {
        success: true,
        count: data.count,
        bytes: data.bytes
      };
    } catch (err) {
      console.error('Save to server error:', err);
      throw new Error('Failed to save to server: ' + err.message);
    }
  }

  // CRUD operations
  addQuestion(question) {
    this.questions.push(question);
    this.markUnsaved();
  }

  updateQuestion(index, question) {
    if (index >= 0 && index < this.questions.length) {
      this.questions[index] = question;
      this.markUnsaved();
    }
  }

  deleteQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.questions.splice(index, 1);
      this.markUnsaved();
    }
  }

  getQuestion(index) {
    return this.questions[index];
  }

  getAllQuestions() {
    return this.questions;
  }

  markUnsaved() {
    this.unsavedChanges = true;
    updateStatus(`Unsaved changes (${this.questions.length} questions)`);
  }

  validateAll() {
    const results = this.questions.map((q, idx) => ({
      index: idx,
      question: q,
      validation: validateQuestion(q)
    }));
    return results;
  }
}

// Global app instance
let app;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  app = new QuestionManager();
  initializeUI();

  // Check server availability
  const serverAvailable = await app.checkServerAvailability();
  updateServerButtonsVisibility(serverAvailable);

  showStartupModal();
});

// Update server buttons visibility based on availability
function updateServerButtonsVisibility(available) {
  const uploadBtn = document.getElementById('uploadServerBtn');
  const loadBtn = document.getElementById('loadServerBtn');

  if (uploadBtn) {
    uploadBtn.style.display = available ? 'block' : 'none';
    if (!available) {
      uploadBtn.title = 'Server API not available';
    }
  }

  if (loadBtn) {
    loadBtn.style.display = available ? 'block' : 'none';
    if (!available) {
      loadBtn.title = 'Server API not available';
    }
  }

  console.log('Server availability:', available);
}

// UI Management
function initializeUI() {
  // Navigation buttons
  document.getElementById('navList').addEventListener('click', () => showView('list'));
  document.getElementById('navCreate').addEventListener('click', () => showView('create'));
  document.getElementById('navValidate').addEventListener('click', () => showView('validate'));

  // Question type selector
  document.getElementById('questionType').addEventListener('change', (e) => {
    updateFormForQuestionType(e.target.value);
  });

  // Form submission
  document.getElementById('questionForm').addEventListener('submit', handleFormSubmit);

  // File operations
  document.getElementById('saveBtn').addEventListener('click', () => {
    app.saveToFile(app.currentFilename);
  });

  document.getElementById('saveAsBtn').addEventListener('click', () => {
    showSaveAsDialog();
  });

  document.getElementById('loadBtn').addEventListener('click', () => {
    document.getElementById('loadFile').click();
  });

  // Server operations
  document.getElementById('uploadServerBtn')?.addEventListener('click', async () => {
    if (confirm('Upload current questions to server? This will replace server data.')) {
      try {
        const result = await app.saveToServer();
        alert(`Successfully uploaded ${result.count} questions to server`);
        showView('list');
      } catch (err) {
        alert('Upload failed: ' + err.message);
      }
    }
  });

  document.getElementById('loadServerBtn')?.addEventListener('click', async () => {
    if (app.unsavedChanges && app.questions.length > 0) {
      if (!confirm('You have unsaved changes. Load from server and discard changes?')) {
        return;
      }
    }
    try {
      const result = await app.loadFromServer();
      alert(`Successfully loaded ${result.count} questions from server`);
      showView('list');
    } catch (err) {
      alert('Load failed: ' + err.message);
    }
  });

  document.getElementById('loadFile').addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      try {
        if (e.target.files.length === 1) {
          if (app.unsavedChanges && app.questions.length > 0) {
            if (!confirm('You have unsaved changes. Load new file and discard changes?')) {
              e.target.value = '';
              return;
            }
          }
          const result = await app.loadFromFile(e.target.files[0], false);
          alert(`Successfully loaded ${result.count} questions from ${e.target.files[0].name}`);
        } else {
          // Multiple files - merge them
          const total = await app.loadFromMultipleFiles(e.target.files);
          alert(`Successfully merged ${total} questions from ${e.target.files.length} files`);
        }
        showView('list');
        e.target.value = '';
      } catch (err) {
        alert('Load failed: ' + err);
        e.target.value = '';
      }
    }
  });

  document.getElementById('mergeBtn').addEventListener('click', () => {
    document.getElementById('mergeFile').click();
  });

  document.getElementById('mergeFile').addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      try {
        const total = await app.loadFromMultipleFiles(e.target.files);
        alert(`Successfully merged ${total} questions from ${e.target.files.length} file(s)`);
        showView('list');
        e.target.value = '';
      } catch (err) {
        alert('Merge failed: ' + err);
        e.target.value = '';
      }
    }
  });

  // Warn before leaving with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (app.unsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  });
}

// Startup modal for initial file loading
function showStartupModal() {
  const modal = document.getElementById('startupModal');
  modal.style.display = 'block';

  document.getElementById('startupLoadBtn').onclick = () => {
    document.getElementById('startupLoadFile').click();
  };

  document.getElementById('startupLoadFile').onchange = async (e) => {
    if (e.target.files.length > 0) {
      try {
        if (e.target.files.length === 1) {
          const result = await app.loadFromFile(e.target.files[0], false);
          updateStatus(`Loaded ${result.count} questions from ${e.target.files[0].name}`);
        } else {
          const total = await app.loadFromMultipleFiles(e.target.files);
          updateStatus(`Merged ${total} questions from ${e.target.files.length} files`);
        }
        modal.style.display = 'none';
        showView('list');
      } catch (err) {
        alert('Load failed: ' + err);
      }
    }
  };

  document.getElementById('startupNewBtn').onclick = () => {
    modal.style.display = 'none';
    updateStatus('Started with empty question set');
    showView('list');
  };

  // Server load button (if available)
  const startupServerBtn = document.getElementById('startupLoadServerBtn');
  if (startupServerBtn) {
    startupServerBtn.style.display = app.serverAvailable ? 'block' : 'none';
    startupServerBtn.onclick = async () => {
      try {
        const result = await app.loadFromServer();
        updateStatus(`Loaded ${result.count} questions from server`);
        modal.style.display = 'none';
        showView('list');
      } catch (err) {
        alert('Load from server failed: ' + err.message);
      }
    };
  }
}

// Save As dialog
function showSaveAsDialog() {
  const filename = prompt('Enter filename:', app.currentFilename);
  if (filename) {
    app.currentFilename = filename.endsWith('.json') ? filename : filename + '.json';
    app.saveToFile(app.currentFilename);
  }
}

// Status updates
function updateStatus(message) {
  const statusEl = document.getElementById('statusBar');
  if (statusEl) {
    const filenameEl = statusEl.querySelector('.current-filename');
    const questionCountEl = statusEl.querySelector('.question-count');
    const statusMsgEl = statusEl.querySelector('.status-message');

    if (filenameEl) filenameEl.textContent = app.currentFilename;
    if (questionCountEl) questionCountEl.textContent = `${app.questions.length} question${app.questions.length !== 1 ? 's' : ''}`;
    if (statusMsgEl) statusMsgEl.textContent = message;

    // Auto-hide status message after 3 seconds
    if (statusMsgEl && message) {
      setTimeout(() => {
        statusMsgEl.textContent = '';
      }, 3000);
    }
  }
}

function showView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });

  // Show selected view
  document.getElementById(viewName + 'View').classList.add('active');

  // Update navigation
  document.querySelectorAll('nav button').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById('nav' + viewName.charAt(0).toUpperCase() + viewName.slice(1))
    .classList.add('active');

  // Load view-specific content
  if (viewName === 'list') {
    renderQuestionList();
  } else if (viewName === 'validate') {
    renderValidationResults();
  } else if (viewName === 'create') {
    resetForm();
  }
}

function renderQuestionList() {
  const container = document.getElementById('questionList');
  const questions = app.getAllQuestions();

  if (questions.length === 0) {
    container.innerHTML = '<p class="empty-state">No questions yet. Create your first question!</p>';
    return;
  }

  let html = '<div class="question-cards">';
  questions.forEach((q, idx) => {
    const langs = getQuestionLanguages(q);
    const defaultLang = q.defaultLang || langs[0] || 'en';
    const langData = getLanguageData(q, defaultLang);

    const languageBadges = langs.map(lang =>
      `<span class="lang-badge" title="${COMMON_LANGUAGES[lang] || lang}">${lang.toUpperCase()}</span>`
    ).join('');

    html += `
      <div class="question-card">
        <div class="question-header">
          <span class="question-type-badge">${q.QStruct}</span>
          <span class="question-id">ID: ${q.QID}</span>
        </div>
        <h3>${escapeHtml(langData?.QTitle || 'Untitled Question')}</h3>
        <p class="question-desc">${escapeHtml(langData?.QDesc || 'No description')}</p>
        <div class="question-meta">
          <span>Languages: ${languageBadges}</span>
          <span>Items: ${q.QnI}</span>
          <span>Relational: ${q.QRelB ? 'Yes' : 'No'}</span>
        </div>
        <div class="question-actions">
          <button onclick="editQuestion(${idx}, '${defaultLang}')" class="btn-edit">Edit</button>
          <button onclick="viewQuestion(${idx})" class="btn-view">View</button>
          <button onclick="deleteQuestion(${idx})" class="btn-delete">Delete</button>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function editQuestion(index, lang) {
  app.editingIndex = index;
  const question = app.getQuestion(index);
  app.currentQuestion = JSON.parse(JSON.stringify(question)); // Deep copy
  app.currentEditingLang = lang || question.defaultLang || 'en';

  showView('create');
  populateForm(question, app.currentEditingLang);

  document.getElementById('formTitle').textContent = 'Edit Question';
  document.getElementById('submitBtn').textContent = 'Update Question';

  // Show language selector
  setupLanguageSelector();
}

function viewQuestion(index) {
  const question = app.getQuestion(index);
  const modal = document.getElementById('viewModal');
  const content = document.getElementById('modalContent');

  content.innerHTML = `<pre>${JSON.stringify(question, null, 2)}</pre>`;
  modal.style.display = 'block';
}

function deleteQuestion(index) {
  if (confirm('Are you sure you want to delete this question?')) {
    app.deleteQuestion(index);
    renderQuestionList();
  }
}

function closeModal() {
  document.getElementById('viewModal').style.display = 'none';
}

function resetForm() {
  app.editingIndex = -1;
  app.currentQuestion = null;
  app.currentEditingLang = 'en';
  document.getElementById('questionForm').reset();
  document.getElementById('formTitle').textContent = 'Create New Question';
  document.getElementById('submitBtn').textContent = 'Create Question';
  updateFormForQuestionType(document.getElementById('questionType').value);

  // Hide language selector for new questions
  const langSelector = document.getElementById('languageSelector');
  if (langSelector) langSelector.style.display = 'none';
}

function populateForm(question, lang) {
  const editLang = lang || question.defaultLang || 'en';
  const langData = getLanguageData(question, editLang);

  if (!langData) {
    alert(`Language ${editLang} not found in question. Using ${question.defaultLang}`);
    return populateForm(question, question.defaultLang);
  }

  document.getElementById('questionType').value = question.QStruct;
  document.getElementById('qLang').value = editLang;
  document.getElementById('qTitle').value = langData.QTitle;
  document.getElementById('qDesc').value = langData.QDesc;
  document.getElementById('qRelB').checked = question.QRelB;
  document.getElementById('qLearn').value = question.QLearn || '';

  if (question.QStruct !== QUESTION_TYPES.FACTQ && question.QStruct !== QUESTION_TYPES.RANGQ) {
    document.getElementById('qnI').value = question.QnI;
  }

  updateFormForQuestionType(question.QStruct);

  // Populate type-specific fields
  populateTypeSpecificFields(question, editLang);
}

function updateFormForQuestionType(type) {
  const container = document.getElementById('typeSpecificFields');
  const qniContainer = document.getElementById('qniContainer');

  // Show/hide QnI based on type
  if (type === QUESTION_TYPES.FACTQ || type === QUESTION_TYPES.RANGQ) {
    qniContainer.style.display = 'none';
  } else {
    qniContainer.style.display = 'block';
  }

  let html = '';

  switch(type) {
    case QUESTION_TYPES.AORBQ:
      html = `
        <div class="form-group">
          <label for="qPref1">Preference 1 (short) *</label>
          <input type="text" id="qPref1" required maxlength="80">
        </div>
        <div class="form-group">
          <label for="qPref2">Preference 2 (short) *</label>
          <input type="text" id="qPref2" required maxlength="80">
        </div>
        <div class="form-group">
          <label for="qPrefer1">Preference 1 (long description)</label>
          <textarea id="qPrefer1" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label for="qPrefer2">Preference 2 (long description)</label>
          <textarea id="qPrefer2" rows="3"></textarea>
        </div>
      `;
      break;

    case QUESTION_TYPES.FACTQ:
      html = '<p class="info">FACTQ questions use standard Yes/No/Don\'t Know responses. No additional fields required.</p>';
      break;

    case QUESTION_TYPES.LEVLQ:
      html = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="qSchB">
            Use predefined scheme
          </label>
        </div>
        <div class="form-group" id="schemeField" style="display: none;">
          <label for="qScheme">Scheme URI</label>
          <input type="text" id="qScheme">
        </div>
        <div id="levlqItems">
          <button type="button" onclick="generateLevlqItems()" class="btn-secondary">Generate Level Items</button>
          <div id="levlqItemsList"></div>
        </div>
      `;
      break;

    case QUESTION_TYPES.LIKSQ:
      html = `
        <div class="form-group">
          <label for="qPos">Position Statement (optional)</label>
          <textarea id="qPos" rows="2"></textarea>
          <small>If not provided, QTitle will be used</small>
        </div>
      `;
      break;

    case QUESTION_TYPES.OPTSQ:
      html = `
        <div class="form-group">
          <label>
            <input type="checkbox" id="qMultiB">
            Allow multiple selections
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="qOtherB">
            Include "Other" option
          </label>
        </div>
        <div id="optsqItems">
          <button type="button" onclick="generateOptsqItems()" class="btn-secondary">Generate Option Items</button>
          <div id="optsqItemsList"></div>
        </div>
      `;
      break;

    case QUESTION_TYPES.RANGQ:
      html = `
        <div class="form-group">
          <label for="qsUnit">Unit of Measurement *</label>
          <input type="text" id="qsUnit" required placeholder="e.g., kg, cm, years">
        </div>
        <div class="form-group">
          <label for="qsMin">Minimum Value *</label>
          <input type="number" id="qsMin" required step="any">
        </div>
        <div class="form-group">
          <label for="qsMax">Maximum Value *</label>
          <input type="number" id="qsMax" required step="any">
        </div>
        <div class="form-group">
          <label for="qsGran">Granularity (rounding)</label>
          <input type="number" id="qsGran" value="1" step="any">
        </div>
      `;
      break;

    case QUESTION_TYPES.TRIPQ:
      html = `
        <div class="form-group">
          <label for="qPref1">Preference 1 (short) *</label>
          <input type="text" id="qPref1" required maxlength="80">
        </div>
        <div class="form-group">
          <label for="qMidP">Midpoint (short) *</label>
          <input type="text" id="qMidP" required maxlength="80">
        </div>
        <div class="form-group">
          <label for="qPref2">Preference 2 (short) *</label>
          <input type="text" id="qPref2" required maxlength="80">
        </div>
        <div class="form-group">
          <label for="qPrefer1">Preference 1 (long description)</label>
          <textarea id="qPrefer1" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label for="qMiddle">Midpoint (long description)</label>
          <textarea id="qMiddle" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label for="qPrefer2">Preference 2 (long description)</label>
          <textarea id="qPrefer2" rows="2"></textarea>
        </div>
      `;
      break;
  }

  container.innerHTML = html;

  // Add event listeners for dynamic fields
  if (type === QUESTION_TYPES.LEVLQ) {
    document.getElementById('qSchB').addEventListener('change', (e) => {
      document.getElementById('schemeField').style.display = e.target.checked ? 'block' : 'none';
    });
  }
}

function populateTypeSpecificFields(question, lang) {
  const type = question.QStruct;
  const editLang = lang || app.currentEditingLang || question.defaultLang || 'en';
  const langData = getLanguageData(question, editLang);

  if (!langData || !langData.QDetails) return;

  const details = langData.QDetails;

  if (type === QUESTION_TYPES.AORBQ || type === QUESTION_TYPES.TRIPQ) {
    if (document.getElementById('qPref1')) {
      document.getElementById('qPref1').value = details.QPref1 || '';
      document.getElementById('qPref2').value = details.QPref2 || '';
      document.getElementById('qPrefer1').value = details.QPrefer1 || '';
      document.getElementById('qPrefer2').value = details.QPrefer2 || '';
    }

    if (type === QUESTION_TYPES.TRIPQ) {
      document.getElementById('qMidP').value = details.QMidP || '';
      document.getElementById('qMiddle').value = details.QMiddle || '';
    }
  } else if (type === QUESTION_TYPES.LIKSQ) {
    document.getElementById('qPos').value = details.QPos || '';
  } else if (type === QUESTION_TYPES.RANGQ) {
    document.getElementById('qsUnit').value = details.QSUnit || '';
    document.getElementById('qsMin').value = details.QSMin || 0;
    document.getElementById('qsMax').value = details.QSMax || 0;
    document.getElementById('qsGran').value = details.QSGran || 1;
  } else if (type === QUESTION_TYPES.LEVLQ) {
    document.getElementById('qSchB').checked = details.QSchB || false;
    document.getElementById('schemeField').style.display = details.QSchB ? 'block' : 'none';
    if (details.QScheme) {
      document.getElementById('qScheme').value = details.QScheme;
    }
    if (details.items && details.items.length > 0) {
      generateLevlqItems();
      details.items.forEach((item, idx) => {
        document.getElementById(`levlq_short_${idx}`).value = item.QItemShort || '';
        document.getElementById(`levlq_long_${idx}`).value = item.QItemLong || '';
        document.getElementById(`levlq_val_${idx}`).value = item.QItemVal || idx + 1;
      });
    }
  } else if (type === QUESTION_TYPES.OPTSQ) {
    document.getElementById('qMultiB').checked = details.QMultiB || false;
    document.getElementById('qOtherB').checked = details.QOtherB || false;
    if (details.items && details.items.length > 0) {
      generateOptsqItems();
      details.items.forEach((item, idx) => {
        document.getElementById(`optsq_short_${idx}`).value = item.QItemShort || '';
        document.getElementById(`optsq_long_${idx}`).value = item.QItemLong || '';
      });
    }
  }
}

function generateLevlqItems() {
  const qni = parseInt(document.getElementById('qnI').value) || 5;
  const container = document.getElementById('levlqItemsList');

  let html = '<h4>Level Items</h4>';
  for (let i = 0; i < qni; i++) {
    html += `
      <div class="item-group">
        <h5>Level ${i + 1}</h5>
        <input type="text" id="levlq_short_${i}" placeholder="Short description" maxlength="80">
        <textarea id="levlq_long_${i}" placeholder="Long description" rows="2"></textarea>
        <input type="number" id="levlq_val_${i}" placeholder="Value" value="${i + 1}">
      </div>
    `;
  }
  container.innerHTML = html;
}

function generateOptsqItems() {
  const qni = parseInt(document.getElementById('qnI').value) || 5;
  const container = document.getElementById('optsqItemsList');

  let html = '<h4>Option Items</h4>';
  for (let i = 0; i < qni; i++) {
    html += `
      <div class="item-group">
        <h5>Option ${i + 1}</h5>
        <input type="text" id="optsq_short_${i}" placeholder="Short description" maxlength="80">
        <textarea id="optsq_long_${i}" placeholder="Long description" rows="2"></textarea>
      </div>
    `;
  }
  container.innerHTML = html;
}

// Helper function to get trimmed value from element
function getTrimmedValue(elementId) {
  const el = document.getElementById(elementId);
  return el ? el.value.trim() : '';
}

function handleFormSubmit(e) {
  e.preventDefault();

  const type = document.getElementById('questionType').value;
  const editLang = getTrimmedValue('qLang');
  let question;

  // If editing existing question, start with that; otherwise create new
  if (app.editingIndex >= 0) {
    question = JSON.parse(JSON.stringify(app.getQuestion(app.editingIndex))); // Deep copy
  } else {
    question = createQuestion(type, editLang);
  }

  // Populate common fields (language-independent)
  question.QRelB = document.getElementById('qRelB').checked;
  question.QLearn = getTrimmedValue('qLearn');

  if (type !== QUESTION_TYPES.FACTQ && type !== QUESTION_TYPES.RANGQ) {
    question.QnI = parseInt(document.getElementById('qnI').value);
  }

  // Ensure the language exists in the question
  if (!question.languages[editLang]) {
    question.languages[editLang] = {
      QTitle: '',
      QDesc: '',
      QDetails: {}
    };
  }

  // Get reference to the language data we're editing
  const langData = question.languages[editLang];

  // Populate language-specific fields
  langData.QTitle = getTrimmedValue('qTitle');
  langData.QDesc = getTrimmedValue('qDesc');

  // Populate type-specific fields (with whitespace trimming)
  switch(type) {
    case QUESTION_TYPES.AORBQ:
      langData.QDetails.QPref1 = getTrimmedValue('qPref1');
      langData.QDetails.QPref2 = getTrimmedValue('qPref2');
      langData.QDetails.QPrefer1 = getTrimmedValue('qPrefer1');
      langData.QDetails.QPrefer2 = getTrimmedValue('qPrefer2');
      break;

    case QUESTION_TYPES.LEVLQ:
      langData.QDetails.QSchB = document.getElementById('qSchB').checked;
      if (langData.QDetails.QSchB) {
        langData.QDetails.QScheme = getTrimmedValue('qScheme');
        langData.QDetails.items = [];
      } else {
        langData.QDetails.items = [];
        for (let i = 0; i < question.QnI; i++) {
          const shortEl = document.getElementById(`levlq_short_${i}`);
          const longEl = document.getElementById(`levlq_long_${i}`);
          const valEl = document.getElementById(`levlq_val_${i}`);
          if (shortEl) {
            langData.QDetails.items.push({
              QItemShort: shortEl.value.trim(),
              QItemLong: longEl.value.trim(),
              QItemVal: parseInt(valEl.value)
            });
          }
        }
      }
      break;

    case QUESTION_TYPES.LIKSQ:
      langData.QDetails.QPos = getTrimmedValue('qPos');
      break;

    case QUESTION_TYPES.OPTSQ:
      langData.QDetails.QMultiB = document.getElementById('qMultiB').checked;
      langData.QDetails.QOtherB = document.getElementById('qOtherB').checked;
      langData.QDetails.items = [];
      for (let i = 0; i < question.QnI; i++) {
        const shortEl = document.getElementById(`optsq_short_${i}`);
        const longEl = document.getElementById(`optsq_long_${i}`);
        if (shortEl) {
          langData.QDetails.items.push({
            QItemShort: shortEl.value.trim(),
            QItemLong: longEl.value.trim()
          });
        }
      }
      break;

    case QUESTION_TYPES.RANGQ:
      langData.QDetails.QSUnit = getTrimmedValue('qsUnit');
      langData.QDetails.QSMin = parseFloat(document.getElementById('qsMin').value);
      langData.QDetails.QSMax = parseFloat(document.getElementById('qsMax').value);
      langData.QDetails.QSGran = parseFloat(document.getElementById('qsGran').value);
      break;

    case QUESTION_TYPES.TRIPQ:
      langData.QDetails.QPref1 = getTrimmedValue('qPref1');
      langData.QDetails.QPref2 = getTrimmedValue('qPref2');
      langData.QDetails.QMidP = getTrimmedValue('qMidP');
      langData.QDetails.QPrefer1 = getTrimmedValue('qPrefer1');
      langData.QDetails.QPrefer2 = getTrimmedValue('qPrefer2');
      langData.QDetails.QMiddle = getTrimmedValue('qMiddle');
      break;
  }

  // Set default language if creating new question
  if (app.editingIndex < 0) {
    question.defaultLang = editLang;
  }

  // Validate before saving
  const validation = validateQuestion(question);
  if (!validation.valid) {
    alert('Validation errors:\n' + validation.errors.join('\n'));
    return;
  }

  // Save question
  if (app.editingIndex >= 0) {
    app.updateQuestion(app.editingIndex, question);
  } else {
    app.addQuestion(question);
  }

  alert('Question saved successfully!');
  showView('list');
}

// Language selector and translation management
function setupLanguageSelector() {
  console.log('setupLanguageSelector called, editingIndex:', app.editingIndex);

  const question = app.getQuestion(app.editingIndex);
  if (!question) {
    console.log('No question found at index', app.editingIndex);
    return;
  }

  console.log('Question found:', question.QID, 'Languages:', Object.keys(question.languages || {}));

  const langs = getQuestionLanguages(question);
  const selector = document.getElementById('languageSelector');

  if (!selector) {
    console.log('ERROR: languageSelector element not found in DOM!');
    return;
  }

  console.log('Language selector element found, showing it...');

  // Show the selector
  selector.style.display = 'flex';

  console.log('Selector display style set to:', selector.style.display);

  let html = '<div class="lang-selector-content">';
  html += '<label for="currentLangSelect">Editing Language:</label>';
  html += '<select id="currentLangSelect" class="lang-select">';

  langs.forEach(lang => {
    const selected = lang === app.currentEditingLang ? 'selected' : '';
    const langName = COMMON_LANGUAGES[lang] || lang;
    html += `<option value="${lang}" ${selected}>${lang.toUpperCase()} - ${langName}</option>`;
  });

  html += '</select>';
  html += '<button type="button" id="addTranslationBtn" class="btn-secondary">Add Translation</button>';
  html += '</div>';

  selector.innerHTML = html;

  // Add event listeners
  document.getElementById('currentLangSelect').addEventListener('change', (e) => {
    switchEditingLanguage(e.target.value);
  });

  document.getElementById('addTranslationBtn').addEventListener('click', () => {
    showAddTranslationDialog();
  });
}

function switchEditingLanguage(newLang) {
  const question = app.getQuestion(app.editingIndex);
  if (!question || !question.languages[newLang]) return;

  app.currentEditingLang = newLang;
  populateForm(question, newLang);
  setupLanguageSelector(); // Refresh selector to show current selection
}

function showAddTranslationDialog() {
  const question = app.getQuestion(app.editingIndex);
  if (!question) return;

  const existingLangs = getQuestionLanguages(question);

  // Create modal HTML
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'addTranslationModal';
  modal.style.display = 'block';

  let html = '<div class="modal-content">';
  html += '<div class="modal-header">';
  html += '<h2>Add Translation</h2>';
  html += '<button onclick="closeAddTranslationModal()" class="close-btn">&times;</button>';
  html += '</div>';
  html += '<div class="modal-body">';
  html += '<div class="form-group">';
  html += '<label for="newLangSelect">Select Language:</label>';
  html += '<select id="newLangSelect" class="lang-select">';

  // Add common languages that don't already exist
  for (const [code, name] of Object.entries(COMMON_LANGUAGES)) {
    if (code !== 'other' && !existingLangs.includes(code)) {
      html += `<option value="${code}">${name}</option>`;
    }
  }
  html += '<option value="other">Other (enter code)</option>';
  html += '</select>';
  html += '</div>';

  html += '<div class="form-group" id="customLangGroup" style="display: none;">';
  html += '<label for="customLangCode">Language Code (e.g., "pt", "sv"):</label>';
  html += '<input type="text" id="customLangCode" maxlength="10" pattern="[a-z]{2,10}">';
  html += '</div>';

  html += '<div class="form-group">';
  html += '<label>';
  html += '<input type="checkbox" id="copyFromExisting"> Copy from existing language';
  html += '</label>';
  html += '</div>';

  html += '<div class="form-group" id="copyFromGroup" style="display: none;">';
  html += '<label for="copyFromLang">Copy from:</label>';
  html += '<select id="copyFromLang" class="lang-select">';
  existingLangs.forEach(lang => {
    const langName = COMMON_LANGUAGES[lang] || lang;
    html += `<option value="${lang}">${lang.toUpperCase()} - ${langName}</option>`;
  });
  html += '</select>';
  html += '</div>';

  html += '<div class="form-actions">';
  html += '<button onclick="addTranslation()" class="btn-primary">Add Translation</button>';
  html += '<button onclick="closeAddTranslationModal()" class="btn-secondary">Cancel</button>';
  html += '</div>';
  html += '</div></div>';

  modal.innerHTML = html;
  document.body.appendChild(modal);

  // Add event listeners
  document.getElementById('newLangSelect').addEventListener('change', (e) => {
    document.getElementById('customLangGroup').style.display =
      e.target.value === 'other' ? 'block' : 'none';
  });

  document.getElementById('copyFromExisting').addEventListener('change', (e) => {
    document.getElementById('copyFromGroup').style.display =
      e.target.checked ? 'block' : 'none';
  });
}

function closeAddTranslationModal() {
  const modal = document.getElementById('addTranslationModal');
  if (modal) modal.remove();
}

function addTranslation() {
  const question = app.getQuestion(app.editingIndex);
  if (!question) return;

  let newLang = document.getElementById('newLangSelect').value;
  if (newLang === 'other') {
    newLang = document.getElementById('customLangCode').value.trim().toLowerCase();
    if (!newLang || !/^[a-z]{2,10}$/.test(newLang)) {
      alert('Please enter a valid language code (2-10 lowercase letters)');
      return;
    }
  }

  const copyFrom = document.getElementById('copyFromExisting').checked ?
    document.getElementById('copyFromLang').value : null;

  const result = addLanguageToQuestion(question, newLang, copyFrom);

  if (!result.success) {
    alert(result.error || 'Failed to add language');
    return;
  }

  app.updateQuestion(app.editingIndex, question);
  closeAddTranslationModal();

  alert(`Translation added for ${newLang.toUpperCase()}${result.copied ? ' (copied from ' + copyFrom + ')' : ''}`);

  // Switch to editing the new language
  app.currentEditingLang = newLang;
  populateForm(question, newLang);
  setupLanguageSelector();
}

function renderValidationResults() {
  const container = document.getElementById('validationResults');
  const results = app.validateAll();

  if (results.length === 0) {
    container.innerHTML = '<p class="empty-state">No questions to validate.</p>';
    return;
  }

  let html = '<div class="validation-list">';
  results.forEach(result => {
    const statusClass = result.validation.valid ? 'valid' : 'invalid';
    html += `
      <div class="validation-item ${statusClass}">
        <div class="validation-header">
          <span class="question-type-badge">${result.question.QStruct}</span>
          <span>${escapeHtml(result.question.QTitle)}</span>
          <span class="validation-status">${result.validation.valid ? '✓ Valid' : '✗ Invalid'}</span>
        </div>
        ${!result.validation.valid ? `
          <div class="validation-errors">
            <strong>Errors:</strong>
            <ul>
              ${result.validation.errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  });
  html += '</div>';

  const validCount = results.filter(r => r.validation.valid).length;
  const summary = `<div class="validation-summary">
    <strong>Summary:</strong> ${validCount} of ${results.length} questions are valid
  </div>`;

  container.innerHTML = summary + html;
}

// Utility function
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
