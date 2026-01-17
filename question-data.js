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
 */
function createBaseQuestion(type) {
  return {
    QID: generateQID(),
    Lang: 'en',
    QTitle: '',
    QDesc: '',
    QRelB: false,
    QnI: 0,
    QStruct: type,
    QLearn: '',
    QDetails: {}
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
function createQuestion(type) {
  const base = createBaseQuestion(type);

  switch(type) {
    case QUESTION_TYPES.AORBQ:
      base.QnI = 5;
      base.QDetails = {
        QPref1: '',
        QPref2: '',
        QPrefer1: '',
        QPrefer2: ''
      };
      break;

    case QUESTION_TYPES.FACTQ:
      base.QnI = 0;
      base.QDetails = {};
      break;

    case QUESTION_TYPES.LEVLQ:
      base.QnI = 5;
      base.QDetails = {
        QSchB: false,
        QScheme: '',
        items: []
      };
      break;

    case QUESTION_TYPES.LIKSQ:
      base.QnI = 5;
      base.QDetails = {
        QPos: ''
      };
      break;

    case QUESTION_TYPES.OPTSQ:
      base.QnI = 5;
      base.QDetails = {
        QMultiB: false,
        QOtherB: false,
        items: []
      };
      break;

    case QUESTION_TYPES.RANGQ:
      base.QnI = 0;
      base.QDetails = {
        QSUnit: '',
        QSMax: 0,
        QSMin: 0,
        QSGran: 1
      };
      break;

    case QUESTION_TYPES.TRIPQ:
      base.QnI = 5;
      base.QDetails = {
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
 * Validate a question object
 */
function validateQuestion(question) {
  const errors = [];

  // Validate common fields
  if (!question.QID) errors.push('QID is required');
  if (!question.Lang) errors.push('Lang is required');
  if (!question.QTitle || question.QTitle.length > 80) {
    errors.push('QTitle is required and must be ≤80 characters');
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

  // Type-specific validation
  switch(question.QStruct) {
    case QUESTION_TYPES.AORBQ:
      if (!question.QDetails.QPref1) errors.push('AORBQ: QPref1 is required');
      if (!question.QDetails.QPref2) errors.push('AORBQ: QPref2 is required');
      break;

    case QUESTION_TYPES.LEVLQ:
      if (question.QDetails.QSchB) {
        if (!question.QDetails.QScheme) {
          errors.push('LEVLQ: QScheme is required when QSchB is true');
        }
      } else {
        if (!question.QDetails.items || question.QDetails.items.length !== question.QnI) {
          errors.push(`LEVLQ: Must have ${question.QnI} items defined`);
        }
      }
      break;

    case QUESTION_TYPES.OPTSQ:
      if (typeof question.QDetails.QMultiB !== 'boolean') {
        errors.push('OPTSQ: QMultiB must be a boolean');
      }
      if (typeof question.QDetails.QOtherB !== 'boolean') {
        errors.push('OPTSQ: QOtherB must be a boolean');
      }
      if (!question.QDetails.items || question.QDetails.items.length !== question.QnI) {
        errors.push(`OPTSQ: Must have ${question.QnI} items defined`);
      }
      break;

    case QUESTION_TYPES.RANGQ:
      if (!question.QDetails.QSUnit) errors.push('RANGQ: QSUnit is required');
      if (typeof question.QDetails.QSMax !== 'number') {
        errors.push('RANGQ: QSMax must be a number');
      }
      if (typeof question.QDetails.QSMin !== 'number') {
        errors.push('RANGQ: QSMin must be a number');
      }
      if (question.QDetails.QSMin >= question.QDetails.QSMax) {
        errors.push('RANGQ: QSMin must be less than QSMax');
      }
      break;

    case QUESTION_TYPES.TRIPQ:
      if (!question.QDetails.QPref1) errors.push('TRIPQ: QPref1 is required');
      if (!question.QDetails.QPref2) errors.push('TRIPQ: QPref2 is required');
      if (!question.QDetails.QMidP) errors.push('TRIPQ: QMidP is required');
      if (question.QnI % 2 === 0) {
        errors.push('TRIPQ: QnI must be odd (e.g., 5 or 7)');
      }
      break;
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
