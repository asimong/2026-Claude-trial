/**
 * RegenCHOICE Question Data Structures and Validation
 */

// Question structure types
const QUESTION_TYPES = {
  AORBQ: 'AORBQ',  // Alternative or B preference
  FACTQ: 'FACTQ',  // Factual Yes/No/Don't Know
  LEVLQ: 'LEVLQ',  // Level/grade questions
  LIKSQ: 'LIKSQ',  // Likert scale
  OPTSQ: 'OPTSQ',  // Multiple choice options
  RANGQ: 'RANGQ',  // Numeric range
  TRIPQ: 'TRIPQ'   // Triple choice with midpoint
};

/**
 * Creates a base question object with common fields
 * Multilingual structure: each QID can have multiple language versions
 */
function createBaseQuestion(type, initialLang = 'en') {
  return {
    QID: generateQID(),
    defaultLang: initialLang,  // The primary language
    QRelB: false,
    QnI: 0,
    QStruct: type,
    QLearn: '',
    languages: {
      // Each language has its own title, description, and details
      [initialLang]: {
        QTitle: '',
        QDesc: '',
        QDetails: {}
      }
    }
  };
}

/**
 * Generate a unique question ID (32-bit integer)
 */
function generateQID() {
  return Math.floor(Math.random() * 0x100000000);
}

/**
 * Create question with type-specific defaults
 */
function createQuestion(type, initialLang = 'en') {
  const base = createBaseQuestion(type, initialLang);
  const langData = base.languages[initialLang];

  switch(type) {
    case QUESTION_TYPES.AORBQ:
      base.QnI = 5;
      langData.QDetails = {
        QPref1: '',
        QPref2: '',
        QPrefer1: '',
        QPrefer2: ''
      };
      break;

    case QUESTION_TYPES.FACTQ:
      base.QnI = 0;
      langData.QDetails = {};
      break;

    case QUESTION_TYPES.LEVLQ:
      base.QnI = 5;
      langData.QDetails = {
        QSchB: false,
        QScheme: '',
        items: []
      };
      break;

    case QUESTION_TYPES.LIKSQ:
      base.QnI = 5;
      langData.QDetails = {
        QPos: ''
      };
      break;

    case QUESTION_TYPES.OPTSQ:
      base.QnI = 5;
      langData.QDetails = {
        QMultiB: false,
        QOtherB: false,
        items: []
      };
      break;

    case QUESTION_TYPES.RANGQ:
      base.QnI = 0;
      langData.QDetails = {
        QSUnit: '',
        QSMax: 0,
        QSMin: 0,
        QSGran: 1
      };
      break;

    case QUESTION_TYPES.TRIPQ:
      base.QnI = 5;
      langData.QDetails = {
        QPref1: '',
        QPref2: '',
        QMidP: '',
        QPrefer1: '',
        QPrefer2: '',
        QMiddle: ''
      };
      break;
  }

  return base;
}

/**
 * Add a new language version to an existing question
 */
function addLanguageToQuestion(question, newLang, copyFromLang = null) {
  if (question.languages[newLang]) {
    return { success: false, error: 'Language already exists' };
  }

  const type = question.QStruct;

  // If copyFromLang specified and exists, copy from it
  if (copyFromLang && question.languages[copyFromLang]) {
    question.languages[newLang] = JSON.parse(JSON.stringify(question.languages[copyFromLang]));
    return { success: true, copied: true };
  }

  // Otherwise create empty template
  const langData = {
    QTitle: '',
    QDesc: '',
    QDetails: {}
  };

  // Initialize type-specific details
  switch(type) {
    case QUESTION_TYPES.AORBQ:
      langData.QDetails = {
        QPref1: '',
        QPref2: '',
        QPrefer1: '',
        QPrefer2: ''
      };
      break;

    case QUESTION_TYPES.FACTQ:
      langData.QDetails = {};
      break;

    case QUESTION_TYPES.LEVLQ:
      langData.QDetails = {
        QSchB: false,
        QScheme: '',
        items: Array(question.QnI).fill(null).map(() => ({
          QItemShort: '',
          QItemLong: '',
          QItemVal: 0
        }))
      };
      break;

    case QUESTION_TYPES.LIKSQ:
      langData.QDetails = {
        QPos: ''
      };
      break;

    case QUESTION_TYPES.OPTSQ:
      langData.QDetails = {
        QMultiB: false,
        QOtherB: false,
        items: Array(question.QnI).fill(null).map(() => ({
          QItemShort: '',
          QItemLong: ''
        }))
      };
      break;

    case QUESTION_TYPES.RANGQ:
      langData.QDetails = {
        QSUnit: '',
        QSMax: 0,
        QSMin: 0,
        QSGran: 1
      };
      break;

    case QUESTION_TYPES.TRIPQ:
      langData.QDetails = {
        QPref1: '',
        QPref2: '',
        QMidP: '',
        QPrefer1: '',
        QPrefer2: '',
        QMiddle: ''
      };
      break;
  }

  question.languages[newLang] = langData;
  return { success: true, copied: false };
}

/**
 * Validate a question object (multilingual structure)
 */
function validateQuestion(question) {
  const errors = [];

  // Validate common fields
  if (!question.QID) errors.push('QID is required');
  if (!question.defaultLang) errors.push('defaultLang is required');
  if (!question.languages || typeof question.languages !== 'object') {
    errors.push('languages object is required');
    return { valid: false, errors: errors };
  }
  if (Object.keys(question.languages).length === 0) {
    errors.push('At least one language version is required');
  }
  if (question.defaultLang && !question.languages[question.defaultLang]) {
    errors.push('Default language must exist in languages object');
  }
  if (typeof question.QRelB !== 'boolean') {
    errors.push('QRelB must be a boolean');
  }
  if (!Object.values(QUESTION_TYPES).includes(question.QStruct)) {
    errors.push('Invalid QStruct value');
  }

  // Validate QnI range
  if (question.QStruct !== QUESTION_TYPES.FACTQ &&
      question.QStruct !== QUESTION_TYPES.RANGQ) {
    if (question.QnI < 2 || question.QnI > 10) {
      errors.push('QnI must be between 2 and 10 for itemized questions');
    }
  }

  // Validate each language version
  for (const [lang, langData] of Object.entries(question.languages)) {
    if (!langData.QTitle || langData.QTitle.length > 80) {
      errors.push(`[${lang}] QTitle is required and must be ≤80 characters`);
    }

    // Type-specific validation
    const details = langData.QDetails;
    switch(question.QStruct) {
      case QUESTION_TYPES.AORBQ:
        if (!details.QPref1) errors.push(`[${lang}] AORBQ: QPref1 is required`);
        if (!details.QPref2) errors.push(`[${lang}] AORBQ: QPref2 is required`);
        break;

      case QUESTION_TYPES.LEVLQ:
        if (details.QSchB) {
          if (!details.QScheme) {
            errors.push(`[${lang}] LEVLQ: QScheme is required when QSchB is true`);
          }
        } else {
          if (!details.items || details.items.length !== question.QnI) {
            errors.push(`[${lang}] LEVLQ: Must have ${question.QnI} items defined`);
          }
        }
        break;

      case QUESTION_TYPES.OPTSQ:
        if (typeof details.QMultiB !== 'boolean') {
          errors.push(`[${lang}] OPTSQ: QMultiB must be a boolean`);
        }
        if (typeof details.QOtherB !== 'boolean') {
          errors.push(`[${lang}] OPTSQ: QOtherB must be a boolean`);
        }
        if (!details.items || details.items.length !== question.QnI) {
          errors.push(`[${lang}] OPTSQ: Must have ${question.QnI} items defined`);
        }
        break;

      case QUESTION_TYPES.RANGQ:
        if (!details.QSUnit) errors.push(`[${lang}] RANGQ: QSUnit is required`);
        if (typeof details.QSMax !== 'number') {
          errors.push(`[${lang}] RANGQ: QSMax must be a number`);
        }
        if (typeof details.QSMin !== 'number') {
          errors.push(`[${lang}] RANGQ: QSMin must be a number`);
        }
        if (details.QSMin >= details.QSMax) {
          errors.push(`[${lang}] RANGQ: QSMin must be less than QSMax`);
        }
        break;

      case QUESTION_TYPES.TRIPQ:
        if (!details.QPref1) errors.push(`[${lang}] TRIPQ: QPref1 is required`);
        if (!details.QPref2) errors.push(`[${lang}] TRIPQ: QPref2 is required`);
        if (!details.QMidP) errors.push(`[${lang}] TRIPQ: QMidP is required`);
        if (question.QnI % 2 === 0) {
          errors.push('TRIPQ: QnI must be odd (e.g., 5 or 7)');
        }
        break;
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
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

/**
 * Get available languages for a question
 */
function getQuestionLanguages(question) {
  return Object.keys(question.languages || {});
}

/**
 * Get language data for a specific language
 */
function getLanguageData(question, lang) {
  return question.languages ? question.languages[lang] : null;
}

/**
 * Common language codes with names
 */
const COMMON_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish / Español',
  'fr': 'French / Français',
  'de': 'German / Deutsch',
  'it': 'Italian / Italiano',
  'pt': 'Portuguese / Português',
  'zh': 'Chinese / 中文',
  'ja': 'Japanese / 日本語',
  'ar': 'Arabic / العربية',
  'ru': 'Russian / Русский',
  'hi': 'Hindi / हिन्दी',
  'other': 'Other (enter code)'
};
