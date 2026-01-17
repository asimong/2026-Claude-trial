/**
 * RegenCHOICE Question Management App
 */

class QuestionManager {
  constructor() {
    this.questions = [];
    this.currentQuestion = null;
    this.editingIndex = -1;
    this.loadQuestions();
  }

  // Storage methods
  loadQuestions() {
    const stored = localStorage.getItem('regenchoice_questions');
    if (stored) {
      try {
        this.questions = JSON.parse(stored);
      } catch (e) {
        console.error('Error loading questions:', e);
        this.questions = [];
      }
    }
  }

  saveQuestions() {
    localStorage.setItem('regenchoice_questions', JSON.stringify(this.questions));
  }

  // CRUD operations
  addQuestion(question) {
    this.questions.push(question);
    this.saveQuestions();
  }

  updateQuestion(index, question) {
    if (index >= 0 && index < this.questions.length) {
      this.questions[index] = question;
      this.saveQuestions();
    }
  }

  deleteQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.questions.splice(index, 1);
      this.saveQuestions();
    }
  }

  getQuestion(index) {
    return this.questions[index];
  }

  getAllQuestions() {
    return this.questions;
  }

  exportQuestions() {
    const dataStr = JSON.stringify(this.questions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'regenchoice-questions.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  importQuestions(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (Array.isArray(imported)) {
            this.questions = imported;
            this.saveQuestions();
            resolve(imported.length);
          } else {
            reject('Invalid file format');
          }
        } catch (err) {
          reject('Error parsing JSON: ' + err.message);
        }
      };
      reader.onerror = () => reject('Error reading file');
      reader.readAsText(file);
    });
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
document.addEventListener('DOMContentLoaded', () => {
  app = new QuestionManager();
  initializeUI();
  showView('list');
});

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

  // Export/Import
  document.getElementById('exportBtn').addEventListener('click', () => {
    app.exportQuestions();
  });

  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });

  document.getElementById('importFile').addEventListener('change', async (e) => {
    if (e.target.files[0]) {
      try {
        const count = await app.importQuestions(e.target.files[0]);
        alert(`Successfully imported ${count} questions`);
        showView('list');
      } catch (err) {
        alert('Import failed: ' + err);
      }
    }
  });
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
    html += `
      <div class="question-card">
        <div class="question-header">
          <span class="question-type-badge">${q.QStruct}</span>
          <span class="question-id">ID: ${q.QID}</span>
        </div>
        <h3>${escapeHtml(q.QTitle || 'Untitled Question')}</h3>
        <p class="question-desc">${escapeHtml(q.QDesc || 'No description')}</p>
        <div class="question-meta">
          <span>Language: ${q.Lang}</span>
          <span>Items: ${q.QnI}</span>
          <span>Relational: ${q.QRelB ? 'Yes' : 'No'}</span>
        </div>
        <div class="question-actions">
          <button onclick="editQuestion(${idx})" class="btn-edit">Edit</button>
          <button onclick="viewQuestion(${idx})" class="btn-view">View</button>
          <button onclick="deleteQuestion(${idx})" class="btn-delete">Delete</button>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function editQuestion(index) {
  app.editingIndex = index;
  const question = app.getQuestion(index);
  app.currentQuestion = JSON.parse(JSON.stringify(question)); // Deep copy

  showView('create');
  populateForm(question);

  document.getElementById('formTitle').textContent = 'Edit Question';
  document.getElementById('submitBtn').textContent = 'Update Question';
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
  document.getElementById('questionForm').reset();
  document.getElementById('formTitle').textContent = 'Create New Question';
  document.getElementById('submitBtn').textContent = 'Create Question';
  updateFormForQuestionType(document.getElementById('questionType').value);
}

function populateForm(question) {
  document.getElementById('questionType').value = question.QStruct;
  document.getElementById('qLang').value = question.Lang;
  document.getElementById('qTitle').value = question.QTitle;
  document.getElementById('qDesc').value = question.QDesc;
  document.getElementById('qRelB').checked = question.QRelB;
  document.getElementById('qLearn').value = question.QLearn || '';

  updateFormForQuestionType(question.QStruct);

  // Populate type-specific fields
  populateTypeSpecificFields(question);
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

function populateTypeSpecificFields(question) {
  const type = question.QStruct;

  if (type === QUESTION_TYPES.AORBQ || type === QUESTION_TYPES.TRIPQ) {
    if (document.getElementById('qPref1')) {
      document.getElementById('qPref1').value = question.QDetails.QPref1 || '';
      document.getElementById('qPref2').value = question.QDetails.QPref2 || '';
      document.getElementById('qPrefer1').value = question.QDetails.QPrefer1 || '';
      document.getElementById('qPrefer2').value = question.QDetails.QPrefer2 || '';
    }

    if (type === QUESTION_TYPES.TRIPQ) {
      document.getElementById('qMidP').value = question.QDetails.QMidP || '';
      document.getElementById('qMiddle').value = question.QDetails.QMiddle || '';
    }
  } else if (type === QUESTION_TYPES.LIKSQ) {
    document.getElementById('qPos').value = question.QDetails.QPos || '';
  } else if (type === QUESTION_TYPES.RANGQ) {
    document.getElementById('qsUnit').value = question.QDetails.QSUnit || '';
    document.getElementById('qsMin').value = question.QDetails.QSMin || 0;
    document.getElementById('qsMax').value = question.QDetails.QSMax || 0;
    document.getElementById('qsGran').value = question.QDetails.QSGran || 1;
  } else if (type === QUESTION_TYPES.LEVLQ) {
    document.getElementById('qSchB').checked = question.QDetails.QSchB || false;
    document.getElementById('schemeField').style.display = question.QDetails.QSchB ? 'block' : 'none';
    if (question.QDetails.QScheme) {
      document.getElementById('qScheme').value = question.QDetails.QScheme;
    }
    if (question.QDetails.items && question.QDetails.items.length > 0) {
      generateLevlqItems();
      question.QDetails.items.forEach((item, idx) => {
        document.getElementById(`levlq_short_${idx}`).value = item.QItemShort || '';
        document.getElementById(`levlq_long_${idx}`).value = item.QItemLong || '';
        document.getElementById(`levlq_val_${idx}`).value = item.QItemVal || idx + 1;
      });
    }
  } else if (type === QUESTION_TYPES.OPTSQ) {
    document.getElementById('qMultiB').checked = question.QDetails.QMultiB || false;
    document.getElementById('qOtherB').checked = question.QDetails.QOtherB || false;
    if (question.QDetails.items && question.QDetails.items.length > 0) {
      generateOptsqItems();
      question.QDetails.items.forEach((item, idx) => {
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

function handleFormSubmit(e) {
  e.preventDefault();

  const type = document.getElementById('questionType').value;
  const question = createQuestion(type);

  // Populate common fields
  question.Lang = document.getElementById('qLang').value;
  question.QTitle = document.getElementById('qTitle').value;
  question.QDesc = document.getElementById('qDesc').value;
  question.QRelB = document.getElementById('qRelB').checked;
  question.QLearn = document.getElementById('qLearn').value;

  if (type !== QUESTION_TYPES.FACTQ && type !== QUESTION_TYPES.RANGQ) {
    question.QnI = parseInt(document.getElementById('qnI').value);
  }

  // If editing, preserve the original QID
  if (app.editingIndex >= 0) {
    const original = app.getQuestion(app.editingIndex);
    question.QID = original.QID;
  }

  // Populate type-specific fields
  switch(type) {
    case QUESTION_TYPES.AORBQ:
      question.QDetails.QPref1 = document.getElementById('qPref1').value;
      question.QDetails.QPref2 = document.getElementById('qPref2').value;
      question.QDetails.QPrefer1 = document.getElementById('qPrefer1').value;
      question.QDetails.QPrefer2 = document.getElementById('qPrefer2').value;
      break;

    case QUESTION_TYPES.LEVLQ:
      question.QDetails.QSchB = document.getElementById('qSchB').checked;
      if (question.QDetails.QSchB) {
        question.QDetails.QScheme = document.getElementById('qScheme').value;
        question.QDetails.items = [];
      } else {
        question.QDetails.items = [];
        for (let i = 0; i < question.QnI; i++) {
          const shortEl = document.getElementById(`levlq_short_${i}`);
          const longEl = document.getElementById(`levlq_long_${i}`);
          const valEl = document.getElementById(`levlq_val_${i}`);
          if (shortEl) {
            question.QDetails.items.push({
              QItemShort: shortEl.value,
              QItemLong: longEl.value,
              QItemVal: parseInt(valEl.value)
            });
          }
        }
      }
      break;

    case QUESTION_TYPES.LIKSQ:
      question.QDetails.QPos = document.getElementById('qPos').value;
      break;

    case QUESTION_TYPES.OPTSQ:
      question.QDetails.QMultiB = document.getElementById('qMultiB').checked;
      question.QDetails.QOtherB = document.getElementById('qOtherB').checked;
      question.QDetails.items = [];
      for (let i = 0; i < question.QnI; i++) {
        const shortEl = document.getElementById(`optsq_short_${i}`);
        const longEl = document.getElementById(`optsq_long_${i}`);
        if (shortEl) {
          question.QDetails.items.push({
            QItemShort: shortEl.value,
            QItemLong: longEl.value
          });
        }
      }
      break;

    case QUESTION_TYPES.RANGQ:
      question.QDetails.QSUnit = document.getElementById('qsUnit').value;
      question.QDetails.QSMin = parseFloat(document.getElementById('qsMin').value);
      question.QDetails.QSMax = parseFloat(document.getElementById('qsMax').value);
      question.QDetails.QSGran = parseFloat(document.getElementById('qsGran').value);
      break;

    case QUESTION_TYPES.TRIPQ:
      question.QDetails.QPref1 = document.getElementById('qPref1').value;
      question.QDetails.QPref2 = document.getElementById('qPref2').value;
      question.QDetails.QMidP = document.getElementById('qMidP').value;
      question.QDetails.QPrefer1 = document.getElementById('qPrefer1').value;
      question.QDetails.QPrefer2 = document.getElementById('qPrefer2').value;
      question.QDetails.QMiddle = document.getElementById('qMiddle').value;
      break;
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
