# RegenCHOICE Question Manager - Quick Start Guide

## ✨ What Changed

Your application has been completely rewritten with:
- **Field-level language model** - Each field (QTitle, QDesc, etc.) can have multiple languages
- **Simpler, cleaner code** - Well-commented and easy to modify
- **Better UI** - Clear distinction between navigation (links) and actions (buttons)
- **All your requested features** implemented

## 🚀 Getting Started

### Opening the App

1. Open `index.html` in a web browser
2. Choose how to start:
   - **Load from File** - Open existing questions
   - **Load from Server** - If you've deployed to your server
   - **Start Fresh** - Begin with empty question list

### Creating a Question

1. Click **Create Question** (navigation link at top)
2. Select question type (AORBQ, FACTQ, LEVLQ, etc.)
3. Fill in required fields:
   - **QTitle** - Short title (max 80 chars)
   - **QDesc** - Description
4. **Add translations:**
   - Each field shows current languages
   - Click language selector dropdown to add more
   - Click **×** button to remove a language
5. For LEVLQ/OPTSQ: Use **+ Add Item** / **Remove** buttons
6. Click **Create Question**

### Editing a Question

1. Find question in the list
2. Click **Edit** button
3. Make changes
4. Button now says **Save Edit** (keeps same QID)
5. Want a new QID? Edit QID field manually before saving

### Adding Translations

When editing a question:
1. Each language-dependent field shows all existing translations
2. Use the dropdown under each field to add new languages
3. Type the translation text
4. Click × to remove unwanted languages

### Managing Items (LEVLQ/OPTSQ)

- **Add Item**: Click **+ Add Item** button (Qni updates automatically)
- **Remove Item**: Click **Remove** button on any item (Qni updates automatically)
- Items must have at least 2 entries

### Validation

**Single Question:**
- Click **Validate** button on any question card
- Shows errors and warnings in a popup

**All Questions:**
- Click **Validate** link (top navigation)
- See summary of all questions
- Warnings (⚠️) won't prevent saving

### Saving Your Work

**Save Locally (Download to computer):**
- **Save questions locally** - Downloads JSON file
- **Save with new filename** - Choose custom name

**Save to Server (if deployed):**
- **Save questions to server** - Uploads to server
- **Load from Server** - Downloads from server
- Buttons appear automatically if server API detected

## 📁 File Structure

```
question-data.js    - Data structures, validation (460 lines)
app-helpers.js      - Language field UI helpers (180 lines)
app.js              - Main application logic (948 lines)
index.html          - Page structure (188 lines)
styles.css          - Styling (703 lines)
api.php             - Server API (optional)
deploy.sh           - Deployment script (optional)
```

## 🔧 Data Structure Example

```json
{
  "QID": 12345,
  "QStruct": "AORBQ",
  "QRelB": false,
  "Qni": 5,
  "QTitle": {
    "en": "Do you prefer cats or dogs?",
    "fr": "Préférez-vous les chats ou les chiens?",
    "nl": "Geef je de voorkeur aan katten of honden?"
  },
  "QDesc": {
    "en": "A simple preference question",
    "fr": "Une question de préférence simple"
  },
  "QDetails": {
    "QPref1": {"en": "Cats", "fr": "Chats"},
    "QPref2": {"en": "Dogs", "fr": "Chiens"},
    "QPrefer1": {"en": "I prefer cats", "fr": "Je préfère les chats"},
    "QPrefer2": {"en": "I prefer dogs", "fr": "Je préfère les chiens"}
  },
  "QLearn": "https://example.com/learn-more",
  "EnablingQID": null,
  "EnablingAnswers": null
}
```

## ⚙️ Key Features

### Language Management
- Add/remove languages at field level
- Each field independently multilingual
- Validation warns if languages inconsistent
- Can save with incomplete translations

### Item Management (LEVLQ/OPTSQ)
- Add items dynamically
- Remove items (minimum 2)
- Qni auto-updates
- Each item has its own language fields

### Enabling Questions
- **EnablingQID**: Question ID that enables this question
- **EnablingAnswers**: Answer values that enable (format TBD)
- Placeholder fields for future implementation

### UI Design
- **Navigation** (links): Switch between views
- **Actions** (buttons): Save, load, create
- **Dangerous actions**: Confirm before executing
- **Status bar**: Shows filename, count, unsaved indicator

## 🐛 Troubleshooting

### Language field not showing
- Check browser console (F12) for errors
- Ensure all three JS files are loaded

### Can't add/remove items
- Only works for LEVLQ and OPTSQ types
- Minimum 2 items required

### Server buttons missing
- Server must have PHP support
- api.php must be deployed
- Check browser console for API errors

### Validation warnings
- Warnings (⚠️) are informational
- You can still save
- Fix warnings for complete translations

## 📝 Tips

1. **Start simple**: Create one question, test all features
2. **Save often**: Use "Save questions locally" frequently
3. **Validate early**: Check validation as you build questions
4. **One language first**: Complete one language before adding translations
5. **Test items**: For LEVLQ/OPTSQ, test add/remove thoroughly

## 🔗 Next Steps

### Deploy to Server (Optional)

1. Edit `deploy.sh` with your server details
2. Run `./deploy.sh` to upload
3. Server buttons will appear automatically

### Customize

All code is well-commented. Key files to modify:
- `question-data.js` - Add new question types or validation
- `app-helpers.js` - Modify language field UI
- `app.js` - Change application behavior
- `styles.css` - Adjust colors, layout, fonts

## 📖 Documentation

- Full spec: https://wiki.simongrant.org/doku.php/ch:ia:question-info
- Question types: https://wiki.simongrant.org/doku.php/ch:qs:here

## Questions?

The code is designed to be readable and modifiable. Each function has comments explaining what it does. Look for section headers like:

```javascript
// =============================================================================
// SECTION NAME
// =============================================================================
```

Happy question building! 🎉
