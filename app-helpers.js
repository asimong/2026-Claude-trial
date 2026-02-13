/**
 * Helper Functions for RegenCHOICE App
 * Last updated: 2026-02-13T14:30
 *
 * This file contains UI helper functions to keep app.js cleaner.
 * Includes language field management and form utilities.
 */

// =============================================================================
// LANGUAGE FIELD UI
// =============================================================================

/**
 * Create UI for a multi-language field
 * Shows all existing languages with delete buttons, plus add new language option
 */
function createLanguageFieldUI(fieldId, langObj) {
  const languages = getLanguages(langObj);
  let html = '';

  // Show each existing language version
  languages.forEach(lang => {
    const value = langObj[lang] || '';
    const canDelete = languages.length > 1;

    html += '<div class="lang-field-row">';
    html += `<span class="lang-label">${lang.toUpperCase()}</span>`;
    html += `<input type="text" class="lang-input" data-field="${fieldId}" data-lang="${lang}" value="${escapeHtml(value)}">`;

    if (canDelete) {
      html += `<button type="button" class="btn-remove-lang" onclick="removeLangVersion('${fieldId}', '${lang}')">×</button>`;
    }

    html += '</div>';
  });

  // Add new language row
  html += '<div class="lang-field-row add-lang-row">';
  html += `<select id="${fieldId}_newLang" class="lang-selector">`;
  html += '<option value="">+ Add translation...</option>';

  Object.entries(COMMON_LANGUAGES).forEach(([code, name]) => {
    if (!languages.includes(code)) {
      html += `<option value="${code}">${name} (${code})</option>`;
    }
  });

  html += '<option value="custom">Other language...</option>';
  html += '</select>';
  html += `<input type="text" id="${fieldId}_customCode" class="lang-input" placeholder="e.g., sv" style="display:none;">`;
  html += `<button type="button" class="btn-add-lang" onclick="addLangVersion('${fieldId}')">Add</button>`;
  html += '</div>';

  return html;
}

/**
 * Render a language field in the DOM
 */
function renderLanguageField(fieldId, langObj) {
  const container = document.getElementById(fieldId + '_container');
  if (!container) {
    console.error('Container not found:', fieldId + '_container');
    return;
  }

  container.innerHTML = createLanguageFieldUI(fieldId, langObj);

  // Setup event listener for custom language input
  const selector = document.getElementById(fieldId + '_newLang');
  const customInput = document.getElementById(fieldId + '_customCode');

  if (selector && customInput) {
    selector.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        customInput.style.display = 'inline-block';
        customInput.focus();
      } else {
        customInput.style.display = 'none';
      }
    });
  }
}

/**
 * Add a new language version to a field
 */
function addLangVersion(fieldId) {
  const selector = document.getElementById(fieldId + '_newLang');
  const customInput = document.getElementById(fieldId + '_customCode');

  let newLang = selector.value;

  // Handle custom language code
  if (newLang === 'custom') {
    newLang = customInput.value.trim().toLowerCase();
    if (!newLang || !/^[a-z]{2,10}$/.test(newLang)) {
      alert('Please enter a valid language code (2-10 lowercase letters, e.g., "sv" for Swedish)');
      return;
    }
  }

  if (!newLang) {
    alert('Please select a language');
    return;
  }

  // Get the current values from the form
  const langObj = collectLanguageFieldFromForm(fieldId);

  // Check if language already exists
  if (langObj[newLang]) {
    alert(`Language ${newLang} already exists`);
    return;
  }

  // Add the new language with empty value
  langObj[newLang] = '';

  // Re-render the field
  renderLanguageField(fieldId, langObj);

  // Focus on the new input
  const newInput = document.querySelector(`[data-field="${fieldId}"][data-lang="${newLang}"]`);
  if (newInput) newInput.focus();
}

/**
 * Remove a language version from a field
 */
function removeLangVersion(fieldId, lang) {
  if (!confirm(`Remove ${lang.toUpperCase()} translation?`)) {
    return;
  }

  // Get current values
  const langObj = collectLanguageFieldFromForm(fieldId);

  // Check if it's the only language
  if (Object.keys(langObj).length <= 1) {
    alert('Cannot remove the only language version');
    return;
  }

  // Remove the language
  delete langObj[lang];

  // Re-render
  renderLanguageField(fieldId, langObj);
}

/**
 * Collect language field values from the form
 * Returns an object like { "en": "value", "fr": "valeur" }
 */
function collectLanguageFieldFromForm(fieldId) {
  const inputs = document.querySelectorAll(`[data-field="${fieldId}"]`);
  const langObj = {};

  inputs.forEach(input => {
    const lang = input.getAttribute('data-lang');
    if (lang) {
      langObj[lang] = input.value.trim();
    }
  });

  // If no values found, return default
  if (Object.keys(langObj).length === 0) {
    return createLangField('en');
  }

  return langObj;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get a trimmed value from an input element
 */
function getTrimmedValue(elementId) {
  const el = document.getElementById(elementId);
  return el ? el.value.trim() : '';
}

/**
 * Set value of an input element
 */
function setValue(elementId, value) {
  const el = document.getElementById(elementId);
  if (el) el.value = value || '';
}

/**
 * Set checked state of a checkbox
 */
function setChecked(elementId, checked) {
  const el = document.getElementById(elementId);
  if (el) el.checked = !!checked;
}
