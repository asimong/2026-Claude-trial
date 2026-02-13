/**
 * RegenCHOICE Question Management App
 * Last updated: 2026-02-13T14:45
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
  document.getElementById('navCreate').addEventListener('click', () => {
    resetForm();  // Reset form when creating new question
    showView('create');
  });
  document.getElementById('navValidate').addEventListener('click', () => showView('validate'));

  // Question type selector
  document.getElementById('questionType').addEventListener('change', (e) => {
    updateFormForQuestionType(e.target.value);
  });

  // Form submission
  document.getElementById('questionForm').addEventListener('submit', handleFormSubmit);

  // "Save with new QID" button
  document.getElementById('saveNewQIDBtn').addEventListener('click', () => {
    handleFormSubmit(null, true); // true = force new QID
  });

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
  }
  // Note: We DON'T call resetForm() here anymore, because it would reset
  // app.editingIndex when we're trying to edit a question!

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

  // Show "Save with new QID" button when editing
  document.getElementById('saveNewQIDBtn').style.display = 'inline-block';
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

  // Hide "Save with new QID" button when creating new
  document.getElementById('saveNewQIDBtn').style.display = 'none';

  // Initialize language fields for new question
  renderLanguageField('qTitle', createLangField('en'));
  renderLanguageField('qDesc', createLangField('en'));

  // Set default Qni value explicitly
  const typeField = document.getElementById('questionType');
  const type = typeField.value;
  if (type !== QUESTION_TYPES.FACTQ && type !== QUESTION_TYPES.RANGQ) {
    document.getElementById('qni').value = 5; // Default value
  }

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
  renderLanguageField('qTitle', question.QTitle);
  renderLanguageField('qDesc', question.QDesc);

  updateFormForQuestionType(question.QStruct);

  // Populate type-specific fields
  populateTypeSpecificFields(question);
}

// (Rest of code continues on next edit...)

// =============================================================================
// TYPE-SPECIFIC FORM HANDLING
// =============================================================================

function updateFormForQuestionType(type) {
  const container = document.getElementById('typeSpecificFields');
  const qniContainer = document.getElementById('qniContainer');
  const qniInput = document.getElementById('qni');

  // Show/hide Qni based on type, and set default value if creating new
  if (type === QUESTION_TYPES.FACTQ || type === QUESTION_TYPES.RANGQ) {
    qniContainer.style.display = 'none';
  } else {
    qniContainer.style.display = 'block';
    // Set default Qni if field is empty or creating new
    if (app.editingIndex < 0 && (!qniInput.value || qniInput.value === '0')) {
      qniInput.value = 5;
    }
  }

  let html = '';

  switch(type) {
    case QUESTION_TYPES.AORBQ:
      html = '<h4>Preference Options</h4>' +
             '<div class="form-group"><label>Preference 1 (short) *</label><div id="qPref1_container"></div></div>' +
             '<div class="form-group"><label>Preference 2 (short) *</label><div id="qPref2_container"></div></div>' +
             '<div class="form-group"><label>Preference 1 (description)</label><div id="qPrefer1_container"></div></div>' +
             '<div class="form-group"><label>Preference 2 (description)</label><div id="qPrefer2_container"></div></div>';
      break;

    case QUESTION_TYPES.FACTQ:
      html = '<p class="info-text">FACTQ uses Yes/No/Don\'t Know responses. No additional fields needed.</p>';
      break;

    case QUESTION_TYPES.LEVLQ:
      html = '<h4>Level Options</h4>' +
             '<div class="form-group"><label><input type="checkbox" id="qSchB"> Use predefined scheme</label></div>' +
             '<div id="schemeFieldContainer" style="display:none;"><label>Scheme URI</label><input type="text" id="qScheme"></div>' +
             '<div id="itemsContainer"></div>';
      break;

    case QUESTION_TYPES.LIKSQ:
      html = '<h4>Likert Scale</h4>' +
             '<div class="form-group"><label>Position Statement (optional)</label><div id="qPos_container"></div>' +
             '<small>If not provided, QTitle will be used</small></div>';
      break;

    case QUESTION_TYPES.OPTSQ:
      html = '<h4>Options</h4>' +
             '<div class="form-group"><label><input type="checkbox" id="qMultiB"> Allow multiple selections</label></div>' +
             '<div class="form-group"><label><input type="checkbox" id="qOtherB"> Include "Other" option</label></div>' +
             '<div id="itemsContainer"></div>';
      break;

    case QUESTION_TYPES.RANGQ:
      html = '<h4>Range Settings</h4>' +
             '<div class="form-group"><label>Unit *</label><input type="text" id="qsUnit" required></div>' +
             '<div class="form-group"><label>Minimum *</label><input type="number" id="qsMin" required step="any" value="0"></div>' +
             '<div class="form-group"><label>Maximum *</label><input type="number" id="qsMax" required step="any" value="100"></div>' +
             '<div class="form-group"><label>Granularity</label><input type="number" id="qsGran" step="any" value="1"></div>';
      break;

    case QUESTION_TYPES.TRIPQ:
      html = '<h4>Triple Preference Options</h4>' +
             '<div class="form-group"><label>Preference 1 (short) *</label><div id="qPref1_container"></div></div>' +
             '<div class="form-group"><label>Midpoint (short) *</label><div id="qMidP_container"></div></div>' +
             '<div class="form-group"><label>Preference 2 (short) *</label><div id="qPref2_container"></div></div>' +
             '<div class="form-group"><label>Preference 1 (description)</label><div id="qPrefer1_container"></div></div>' +
             '<div class="form-group"><label>Midpoint (description)</label><div id="qMiddle_container"></div></div>' +
             '<div class="form-group"><label>Preference 2 (description)</label><div id="qPrefer2_container"></div></div>';
      break;
  }

  container.innerHTML = html;

  // Setup event listeners
  if (type === QUESTION_TYPES.LEVLQ) {
    document.getElementById('qSchB').addEventListener('change', (e) => {
      document.getElementById('schemeFieldContainer').style.display = e.target.checked ? 'block' : 'none';
    });
  }

  // Render items section if needed
  if (type === QUESTION_TYPES.LEVLQ || type === QUESTION_TYPES.OPTSQ) {
    renderItemsSection(type);
  }
}

function populateTypeSpecificFields(question) {
  const type = question.QStruct;
  const details = question.QDetails;

  if (type === QUESTION_TYPES.AORBQ || type === QUESTION_TYPES.TRIPQ) {
    renderLanguageField('qPref1', details.QPref1);
    renderLanguageField('qPref2', details.QPref2);
    renderLanguageField('qPrefer1', details.QPrefer1);
    renderLanguageField('qPrefer2', details.QPrefer2);

    if (type === QUESTION_TYPES.TRIPQ) {
      renderLanguageField('qMidP', details.QMidP);
      renderLanguageField('qMiddle', details.QMiddle);
    }
  }

  if (type === QUESTION_TYPES.LIKSQ) {
    renderLanguageField('qPos', details.QPos);
  }

  if (type === QUESTION_TYPES.LEVLQ) {
    setChecked('qSchB', details.QSchB);
    document.getElementById('schemeFieldContainer').style.display = details.QSchB ? 'block' : 'none';
    setValue('qScheme', details.QScheme);
    if (details.items && details.items.length > 0) {
      renderItemsWithData(question);
    }
  }

  if (type === QUESTION_TYPES.OPTSQ) {
    setChecked('qMultiB', details.QMultiB);
    setChecked('qOtherB', details.QOtherB);
    if (details.items && details.items.length > 0) {
      renderItemsWithData(question);
    }
  }

  if (type === QUESTION_TYPES.RANGQ) {
    setValue('qsUnit', details.QSUnit);
    setValue('qsMin', details.QSMin);
    setValue('qsMax', details.QSMax);
    setValue('qsGran', details.QSGran);
  }
}

// =============================================================================
// ITEM MANAGEMENT
// =============================================================================

function renderItemsSection(type) {
  const container = document.getElementById('itemsContainer');
  if (!container) return;

  let html = '<div class="items-section">';
  html += '<div class="items-header">';
  html += '<h4>Items</h4>';
  html += '<button type="button" onclick="addNewItemToForm()" class="btn-add">+ Add Item</button>';
  html += '</div>';
  html += '<div id="itemsList"></div>';
  html += '</div>';

  container.innerHTML = html;
}

function renderItemsWithData(question) {
  const items = question.QDetails.items || [];
  const itemsList = document.getElementById('itemsList');
  if (!itemsList) return;

  let html = '';

  items.forEach((item, idx) => {
    html += '<div class="item-box" data-item-index="' + idx + '">';
    html += '<div class="item-box-header">';
    html += '<span>Item ' + (idx + 1) + '</span>';
    
    if (items.length > 2) {
      html += '<button type="button" onclick="removeItemFromForm(' + idx + ')" class="btn-danger">Remove</button>';
    }
    
    html += '</div>';
    html += '<div class="form-group"><label>Short description *</label><div id="item' + idx + 'Short_container"></div></div>';
    html += '<div class="form-group"><label>Long description</label><div id="item' + idx + 'Long_container"></div></div>';
    
    if (question.QStruct === QUESTION_TYPES.LEVLQ) {
      html += '<div class="form-group"><label>Value</label><input type="number" id="item' + idx + 'Val" value="' + (item.QItemVal || idx + 1) + '"></div>';
    }
    
    html += '</div>';
  });

  itemsList.innerHTML = html;

  // Render language fields for each item
  items.forEach((item, idx) => {
    renderLanguageField('item' + idx + 'Short', item.QItemShort);
    renderLanguageField('item' + idx + 'Long', item.QItemLong);
  });
}

function addNewItemToForm() {
  const qni = parseInt(document.getElementById('qni').value) || 5;
  document.getElementById('qni').value = qni + 1;

  const type = document.getElementById('questionType').value;
  
  // Create a temporary question to hold the new item structure
  const tempQuestion = {
    QStruct: type,
    Qni: qni + 1,
    QDetails: {
      items: []
    }
  };

  // Collect existing items
  for (let i = 0; i < qni; i++) {
    const itemShort = collectLanguageFieldFromForm('item' + i + 'Short');
    const itemLong = collectLanguageFieldFromForm('item' + i + 'Long');
    const item = { QItemShort: itemShort, QItemLong: itemLong };
    
    if (type === QUESTION_TYPES.LEVLQ) {
      item.QItemVal = parseInt(getTrimmedValue('item' + i + 'Val')) || (i + 1);
    }
    
    tempQuestion.QDetails.items.push(item);
  }

  // Add new empty item
  const newItem = {
    QItemShort: createLangField('en'),
    QItemLong: createLangField('en')
  };
  
  if (type === QUESTION_TYPES.LEVLQ) {
    newItem.QItemVal = qni + 1;
  }
  
  tempQuestion.QDetails.items.push(newItem);

  // Re-render
  renderItemsWithData(tempQuestion);
}

function removeItemFromForm(index) {
  if (!confirm('Remove this item?')) return;

  const type = document.getElementById('questionType').value;
  const qni = parseInt(document.getElementById('qni').value) || 5;

  if (qni <= 2) {
    alert('Must have at least 2 items');
    return;
  }

  // Collect all items except the one being removed
  const tempQuestion = {
    QStruct: type,
    Qni: qni - 1,
    QDetails: { items: [] }
  };

  for (let i = 0; i < qni; i++) {
    if (i !== index) {
      const itemShort = collectLanguageFieldFromForm('item' + i + 'Short');
      const itemLong = collectLanguageFieldFromForm('item' + i + 'Long');
      const item = { QItemShort: itemShort, QItemLong: itemLong };
      
      if (type === QUESTION_TYPES.LEVLQ) {
        item.QItemVal = tempQuestion.QDetails.items.length + 1;
      }
      
      tempQuestion.QDetails.items.push(item);
    }
  }

  // Update Qni
  document.getElementById('qni').value = qni - 1;

  // Re-render
  renderItemsWithData(tempQuestion);
}

// =============================================================================
// FORM SUBMISSION
// =============================================================================

function handleFormSubmit(e, forceNewQID = false) {
  if (e) e.preventDefault();

  console.log('=== FORM SUBMIT DEBUG ===');
  console.log('app.editingIndex:', app.editingIndex);
  console.log('forceNewQID:', forceNewQID);

  const type = document.getElementById('questionType').value;
  let question;

  // Start with existing question or create new
  if (app.editingIndex >= 0 && !forceNewQID) {
    // Editing: make a COPY of existing question (preserves QID)
    const originalQuestion = app.getQuestion(app.editingIndex);
    console.log('Editing existing question, original QID:', originalQuestion.QID);
    question = JSON.parse(JSON.stringify(originalQuestion));
    console.log('After copy, QID:', question.QID);
  } else {
    // Creating new or forcing new QID: create fresh question with new QID
    question = createQuestion(type, 'en');
    console.log('Created NEW question with QID:', question.QID);
  }

  // Collect common fields
  question.QRelB = document.getElementById('qRelB').checked;
  question.QLearn = getTrimmedValue('qLearn');
  
  const enablingQID = getTrimmedValue('enablingQID');
  question.EnablingQID = enablingQID ? parseInt(enablingQID) : null;
  question.EnablingAnswers = getTrimmedValue('enablingAnswers') || null;

  // Collect Qni
  if (type !== QUESTION_TYPES.FACTQ && type !== QUESTION_TYPES.RANGQ) {
    question.Qni = parseInt(getTrimmedValue('qni')) || 5;
  }

  // Collect language fields
  question.QTitle = collectLanguageFieldFromForm('qTitle');
  question.QDesc = collectLanguageFieldFromForm('qDesc');

  // Collect type-specific fields
  question.QDetails = collectTypeSpecificDetails(type, question.Qni);

  // Validate
  const validation = validateQuestion(question);
  if (!validation.valid) {
    const msg = 'Validation issues:\\n\\n' + validation.errors.join('\\n') + '\\n\\nSave anyway?';
    if (!confirm(msg)) return;
  }

  // Save
  console.log('Before save, question QID:', question.QID);
  console.log('Saving path:', app.editingIndex >= 0 && !forceNewQID ? 'UPDATE' : 'ADD NEW');

  if (app.editingIndex >= 0 && !forceNewQID) {
    // Update existing question (keeps same QID)
    app.updateQuestion(app.editingIndex, question);
    console.log('Updated question at index', app.editingIndex, 'with QID:', question.QID);
    showMessage('Question updated (QID: ' + question.QID + ')');
  } else {
    // Add as new question (new QID)
    app.addQuestion(question);
    console.log('Added new question with QID:', question.QID);
    if (forceNewQID) {
      showMessage('Question saved with new QID: ' + question.QID);
    } else {
      showMessage('Question created');
    }
  }
  console.log('=== END SUBMIT DEBUG ===');

  showView('list');
}

function collectTypeSpecificDetails(type, qni) {
  const details = {};

  switch(type) {
    case QUESTION_TYPES.AORBQ:
      details.QPref1 = collectLanguageFieldFromForm('qPref1');
      details.QPref2 = collectLanguageFieldFromForm('qPref2');
      details.QPrefer1 = collectLanguageFieldFromForm('qPrefer1');
      details.QPrefer2 = collectLanguageFieldFromForm('qPrefer2');
      break;

    case QUESTION_TYPES.FACTQ:
      // No additional details
      break;

    case QUESTION_TYPES.LEVLQ:
      details.QSchB = document.getElementById('qSchB').checked;
      details.QScheme = getTrimmedValue('qScheme');
      details.items = [];
      
      for (let i = 0; i < qni; i++) {
        details.items.push({
          QItemShort: collectLanguageFieldFromForm('item' + i + 'Short'),
          QItemLong: collectLanguageFieldFromForm('item' + i + 'Long'),
          QItemVal: parseInt(getTrimmedValue('item' + i + 'Val')) || (i + 1)
        });
      }
      break;

    case QUESTION_TYPES.LIKSQ:
      details.QPos = collectLanguageFieldFromForm('qPos');
      break;

    case QUESTION_TYPES.OPTSQ:
      details.QMultiB = document.getElementById('qMultiB').checked;
      details.QOtherB = document.getElementById('qOtherB').checked;
      details.items = [];
      
      for (let i = 0; i < qni; i++) {
        details.items.push({
          QItemShort: collectLanguageFieldFromForm('item' + i + 'Short'),
          QItemLong: collectLanguageFieldFromForm('item' + i + 'Long')
        });
      }
      break;

    case QUESTION_TYPES.RANGQ:
      details.QSUnit = getTrimmedValue('qsUnit');
      details.QSMin = parseFloat(getTrimmedValue('qsMin'));
      details.QSMax = parseFloat(getTrimmedValue('qsMax'));
      details.QSGran = parseFloat(getTrimmedValue('qsGran'));
      break;

    case QUESTION_TYPES.TRIPQ:
      details.QPref1 = collectLanguageFieldFromForm('qPref1');
      details.QPref2 = collectLanguageFieldFromForm('qPref2');
      details.QMidP = collectLanguageFieldFromForm('qMidP');
      details.QPrefer1 = collectLanguageFieldFromForm('qPrefer1');
      details.QPrefer2 = collectLanguageFieldFromForm('qPrefer2');
      details.QMiddle = collectLanguageFieldFromForm('qMiddle');
      break;
  }

  return details;
}
