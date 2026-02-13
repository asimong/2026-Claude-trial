/**
 * RegenCHOICE Question Data Structures
 * Last updated: 2026-02-13T14:30
 *
 * This file defines the structure for RegenCHOICE questions.
 * Language-dependent fields are stored as objects with language codes as keys.
 *
 * Example: QTitle: { "en": "text", "fr": "texte", "nl": "tekst" }
 */

// =============================================================================
// QUESTION TYPES
// =============================================================================

const QUESTION_TYPES = {
  AORBQ: 'AORBQ',  // A or B preference question
  FACTQ: 'FACTQ',  // Factual yes/no question
  LEVLQ: 'LEVLQ',  // Ordered levels question
  LIKSQ: 'LIKSQ',  // Likert scale question
  OPTSQ: 'OPTSQ',  // Options list (multiple choice)
  RANGQ: 'RANGQ',  // Numeric range question
  TRIPQ: 'TRIPQ'   // Triple preference (A or midpoint or B)
};

// =============================================================================
// COMMON LANGUAGES
// =============================================================================

const COMMON_LANGUAGES = {
  'en': 'English',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'it': 'Italiano',
  'nl': 'Nederlands',
  'pt': 'Português',
  'ru': 'Русский',
  'zh': '中文',
  'ja': '日本語',
  'ar': 'العربية'
};

// =============================================================================
// HELPER FUNCTIONS FOR LANGUAGE-DEPENDENT FIELDS
// =============================================================================

/**
 * Create an empty language object with one language
 * @param {string} initialLang - Initial language code (default 'en')
 * @returns {Object} Language object: { "en": "" }
 */
function createLangField(initialLang = 'en') {
  return { [initialLang]: '' };
}

/**
 * Get all language codes used in a language field
 * @param {Object} langField - Language field object
 * @returns {Array} Array of language codes
 */
function getLanguages(langField) {
  if (!langField || typeof langField !== 'object') return [];
  return Object.keys(langField);
}

/**
 * Add a language to a field, optionally copying from existing language
 * @param {Object} langField - Language field object
 * @param {string} newLang - New language code
 * @param {string} copyFrom - Optional: copy text from this language
 */
function addLanguage(langField, newLang, copyFrom = null) {
  if (langField[newLang]) {
    return { success: false, error: 'Language already exists' };
  }

  if (copyFrom && langField[copyFrom]) {
    langField[newLang] = langField[copyFrom];
  } else {
    langField[newLang] = '';
  }

  return { success: true };
}

/**
 * Remove a language from a field (if it's not the only one)
 * @param {Object} langField - Language field object
 * @param {string} lang - Language code to remove
 */
function removeLanguage(langField, lang) {
  if (Object.keys(langField).length <= 1) {
    return { success: false, error: 'Cannot remove the only language' };
  }

  delete langField[lang];
  return { success: true };
}

/**
 * Get all languages used across all fields in a question
 * @param {Object} question - Question object
 * @returns {Array} Array of unique language codes
 */
function getAllQuestionLanguages(question) {
  const languages = new Set();

  // Check QTitle and QDesc
  getLanguages(question.QTitle).forEach(lang => languages.add(lang));
  getLanguages(question.QDesc).forEach(lang => languages.add(lang));

  // Check QDetails based on question type
  if (question.QDetails) {
    const type = question.QStruct;

    if (type === QUESTION_TYPES.AORBQ || type === QUESTION_TYPES.TRIPQ) {
      getLanguages(question.QDetails.QPref1).forEach(lang => languages.add(lang));
      getLanguages(question.QDetails.QPref2).forEach(lang => languages.add(lang));
      getLanguages(question.QDetails.QPrefer1).forEach(lang => languages.add(lang));
      getLanguages(question.QDetails.QPrefer2).forEach(lang => languages.add(lang));

      if (type === QUESTION_TYPES.TRIPQ) {
        getLanguages(question.QDetails.QMidP).forEach(lang => languages.add(lang));
        getLanguages(question.QDetails.QMiddle).forEach(lang => languages.add(lang));
      }
    }

    if (type === QUESTION_TYPES.LIKSQ && question.QDetails.QPos) {
      getLanguages(question.QDetails.QPos).forEach(lang => languages.add(lang));
    }

    if (type === QUESTION_TYPES.LEVLQ || type === QUESTION_TYPES.OPTSQ) {
      if (question.QDetails.items) {
        question.QDetails.items.forEach(item => {
          getLanguages(item.QItemShort).forEach(lang => languages.add(lang));
          getLanguages(item.QItemLong).forEach(lang => languages.add(lang));
        });
      }
    }
  }

  return Array.from(languages).sort();
}

// =============================================================================
// QUESTION CREATION
// =============================================================================

/**
 * Generate a random Question ID (32-bit positive integer)
 * @returns {number} Random QID
 */
function generateQID() {
  return Math.floor(Math.random() * 2147483647) + 1;
}

/**
 * Create a new question of the specified type
 * @param {string} type - Question type (from QUESTION_TYPES)
 * @param {string} initialLang - Initial language code
 * @returns {Object} New question object
 */
function createQuestion(type, initialLang = 'en') {
  // Base structure for all questions
  const question = {
    QID: generateQID(),
    QRelB: false,
    Qni: 0,
    QStruct: type,
    QTitle: createLangField(initialLang),
    QDesc: createLangField(initialLang),
    QDetails: {},
    QLearn: '',
    EnablingQID: null,
    EnablingAnswers: null
  };

  // Add type-specific fields and default Qni
  switch(type) {
    case QUESTION_TYPES.AORBQ:
      question.Qni = 5;
      question.QDetails = {
        QPref1: createLangField(initialLang),
        QPref2: createLangField(initialLang),
        QPrefer1: createLangField(initialLang),
        QPrefer2: createLangField(initialLang)
      };
      break;

    case QUESTION_TYPES.FACTQ:
      question.Qni = 0; // FACTQ doesn't use Qni
      break;

    case QUESTION_TYPES.LEVLQ:
      question.Qni = 5;
      question.QDetails = {
        QSchB: false,
        QScheme: '',
        items: []
      };
      // Create default items
      for (let i = 0; i < 5; i++) {
        question.QDetails.items.push({
          QItemShort: createLangField(initialLang),
          QItemLong: createLangField(initialLang),
          QItemVal: i + 1
        });
      }
      break;

    case QUESTION_TYPES.LIKSQ:
      question.Qni = 5;
      question.QDetails = {
        QPos: createLangField(initialLang)
      };
      break;

    case QUESTION_TYPES.OPTSQ:
      question.Qni = 5;
      question.QDetails = {
        QMultiB: false,
        QOtherB: false,
        items: []
      };
      // Create default items
      for (let i = 0; i < 5; i++) {
        question.QDetails.items.push({
          QItemShort: createLangField(initialLang),
          QItemLong: createLangField(initialLang)
        });
      }
      break;

    case QUESTION_TYPES.RANGQ:
      question.Qni = 0; // RANGQ doesn't use Qni
      question.QDetails = {
        QSUnit: '',  // Not language-dependent
        QSMin: 0,
        QSMax: 100,
        QSGran: 1
      };
      break;

    case QUESTION_TYPES.TRIPQ:
      question.Qni = 5;
      question.QDetails = {
        QPref1: createLangField(initialLang),
        QPref2: createLangField(initialLang),
        QMidP: createLangField(initialLang),
        QPrefer1: createLangField(initialLang),
        QPrefer2: createLangField(initialLang),
        QMiddle: createLangField(initialLang)
      };
      break;
  }

  return question;
}

// =============================================================================
// ITEM MANAGEMENT (for LEVLQ and OPTSQ)
// =============================================================================

/**
 * Add a new item to a LEVLQ or OPTSQ question
 * @param {Object} question - Question object
 * @param {string} lang - Language for the new item
 */
function addItem(question, lang = 'en') {
  if (question.QStruct !== QUESTION_TYPES.LEVLQ &&
      question.QStruct !== QUESTION_TYPES.OPTSQ) {
    return { success: false, error: 'Can only add items to LEVLQ or OPTSQ' };
  }

  if (!question.QDetails.items) {
    question.QDetails.items = [];
  }

  const newItem = {
    QItemShort: createLangField(lang),
    QItemLong: createLangField(lang)
  };

  if (question.QStruct === QUESTION_TYPES.LEVLQ) {
    newItem.QItemVal = question.QDetails.items.length + 1;
  }

  question.QDetails.items.push(newItem);
  question.Qni = question.QDetails.items.length;

  return { success: true };
}

/**
 * Remove an item from a LEVLQ or OPTSQ question
 * @param {Object} question - Question object
 * @param {number} index - Index of item to remove
 */
function removeItem(question, index) {
  if (!question.QDetails.items || index < 0 || index >= question.QDetails.items.length) {
    return { success: false, error: 'Invalid item index' };
  }

  if (question.QDetails.items.length <= 2) {
    return { success: false, error: 'Must have at least 2 items' };
  }

  question.QDetails.items.splice(index, 1);
  question.Qni = question.QDetails.items.length;

  // Update QItemVal for LEVLQ
  if (question.QStruct === QUESTION_TYPES.LEVLQ) {
    question.QDetails.items.forEach((item, idx) => {
      item.QItemVal = idx + 1;
    });
  }

  return { success: true };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate a question
 * @param {Object} question - Question to validate
 * @returns {Object} Validation result with valid flag and errors array
 */
function validateQuestion(question) {
  const errors = [];

  // Basic required fields
  if (!question.QID) errors.push('QID is required');
  if (!question.QStruct) errors.push('QStruct is required');
  if (question.QRelB !== true && question.QRelB !== false) {
    errors.push('QRelB must be boolean');
  }

  // Language field validation
  const titleLangs = getLanguages(question.QTitle);
  if (titleLangs.length === 0) {
    errors.push('QTitle must have at least one language');
  }

  // Check for empty values in QTitle
  titleLangs.forEach(lang => {
    if (!question.QTitle[lang] || question.QTitle[lang].trim() === '') {
      errors.push(`QTitle is empty for language '${lang}'`);
    }
  });

  // Check language consistency
  const languageWarnings = checkLanguageConsistency(question);
  if (languageWarnings.length > 0) {
    // Add as warnings, not errors
    languageWarnings.forEach(warning => {
      errors.push('⚠️ ' + warning);
    });
  }

  // Type-specific validation
  const type = question.QStruct;

  if (type === QUESTION_TYPES.AORBQ || type === QUESTION_TYPES.TRIPQ) {
    if (getLanguages(question.QDetails.QPref1).length === 0) {
      errors.push('QPref1 is required');
    }
    if (getLanguages(question.QDetails.QPref2).length === 0) {
      errors.push('QPref2 is required');
    }
    if (type === QUESTION_TYPES.TRIPQ) {
      if (getLanguages(question.QDetails.QMidP).length === 0) {
        errors.push('QMidP is required for TRIPQ');
      }
      if (question.Qni % 2 === 0) {
        errors.push('TRIPQ Qni must be odd (e.g., 5 or 7)');
      }
    }
  }

  if (type === QUESTION_TYPES.LEVLQ) {
    if (!question.QDetails.QSchB) {
      if (!question.QDetails.items || question.QDetails.items.length === 0) {
        errors.push('LEVLQ must have items');
      } else if (question.QDetails.items.length !== question.Qni) {
        errors.push(`LEVLQ item count (${question.QDetails.items.length}) does not match Qni (${question.Qni})`);
      }
    }
  }

  if (type === QUESTION_TYPES.OPTSQ) {
    if (!question.QDetails.items || question.QDetails.items.length === 0) {
      errors.push('OPTSQ must have items');
    } else if (question.QDetails.items.length !== question.Qni) {
      errors.push(`OPTSQ item count (${question.QDetails.items.length}) does not match Qni (${question.Qni})`);
    }
  }

  if (type === QUESTION_TYPES.RANGQ) {
    if (!question.QDetails.QSUnit) {
      errors.push('QSUnit is required for RANGQ');
    }
    if (question.QDetails.QSMin >= question.QDetails.QSMax) {
      errors.push('QSMin must be less than QSMax');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Check language consistency across all fields
 * Returns warnings (not errors) for missing translations
 * @param {Object} question - Question to check
 * @returns {Array} Array of warning messages
 */
function checkLanguageConsistency(question) {
  const warnings = [];
  const allLanguages = getAllQuestionLanguages(question);

  // If only one language, no warnings needed
  if (allLanguages.length <= 1) return warnings;

  // Check if each language appears in all fields
  const titleLangs = new Set(getLanguages(question.QTitle));
  const descLangs = new Set(getLanguages(question.QDesc));

  allLanguages.forEach(lang => {
    const missingFields = [];

    if (!titleLangs.has(lang)) missingFields.push('QTitle');
    if (!descLangs.has(lang)) missingFields.push('QDesc');

    if (missingFields.length > 0) {
      warnings.push(`Language '${lang}' missing from: ${missingFields.join(', ')}`);
    }
  });

  return warnings;
}

/**
 * Get a human-readable description of a question type
 */
function getQuestionTypeDescription(type) {
  const descriptions = {
    AORBQ: 'A preference between two alternatives, A or B',
    FACTQ: 'A factual question with answer Yes or No or Don\'t Know',
    LEVLQ: 'Ordered options presented as levels',
    LIKSQ: 'A classic Likert scale question',
    OPTSQ: 'A list of (unordered) options, multiple choice style',
    RANGQ: 'A question with a numeric range',
    TRIPQ: 'Binary choice with a named midpoint option'
  };
  return descriptions[type] || 'Unknown type';
}
