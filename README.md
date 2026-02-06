# RegenCHOICE Question Management App

A web-based application for creating, managing, and validating questions for the RegenCHOICE matching system.

## Overview

This application provides a user-friendly interface to:
- Create questions according to RegenCHOICE data structures
- View and manage all questions in a list
- Edit existing questions
- Validate questions against specification requirements
- Export/import questions as JSON

## Supported Question Types

The app supports all 7 RegenCHOICE question structures:

1. **AORBQ** - A preference between two alternatives, A or B
2. **FACTQ** - A factual question with answer Yes or No or Don't Know
3. **LEVLQ** - Ordered options presented as levels
4. **LIKSQ** - A classic Likert scale question
5. **OPTSQ** - A list of (unordered) options, multiple choice style
6. **RANGQ** - A question with a numeric range
7. **TRIPQ** - Binary choice with a named midpoint option

## Getting Started

1. Open `index.html` in a modern web browser
2. The app runs entirely client-side - no server needed
3. Choose to load existing questions from JSON file(s) or start fresh
4. Questions are saved to JSON files that can be shared with collaborators

## Usage

### Working with Files

On startup, you'll see a welcome screen with two options:
- **Load from File(s)**: Open existing question files (select multiple to merge)
- **Start Fresh**: Begin with an empty question set

File operations available in the navigation:
- **Save**: Save to current file (downloads as JSON)
- **Save As**: Save to a new filename
- **Load**: Load from one or more files (replaces current questions)
- **Merge**: Add questions from additional file(s) without replacing existing ones

**Default filename**: `regenchoice-questions.json` (customizable via Save As)

**Collaborative workflow**:
1. Share your JSON file with collaborators
2. They can load it, make changes, and save
3. Merge multiple contributors' files together
4. The app automatically prevents duplicate questions (by QID)

### Creating Questions

1. Click "Create Question" in the navigation
2. Select the question type from the dropdown
3. Select initial language (default: English)
4. Fill in the common fields (title, description, etc.)
5. Complete the type-specific fields
6. Click "Create Question" to save
7. Remember to use "Save" to download your updated file

**Note**: All text fields automatically trim whitespace from both ends

### Multilingual Support

Questions can be translated into multiple languages:

**Adding Translations:**
1. Edit an existing question
2. Click "Add Translation" button in the language selector
3. Choose a language from the dropdown or enter a custom language code
4. Optionally copy from an existing language as a starting point
5. Fill in the translated text for all fields
6. Save the question

**Switching Languages:**
- When editing, use the language dropdown to switch between available translations
- Each language version maintains its own title, description, and type-specific text
- Common fields (QnI, QRelB, etc.) are shared across all languages

**Language Codes:**
- Use standard ISO 639-1 codes (en, es, fr, de, etc.)
- Supported languages: English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Arabic, Russian, Hindi, and more
- Custom language codes accepted (2-10 lowercase letters)

### Managing Questions

- **View**: Click the list icon to see all questions
- **Edit**: Click "Edit" on any question card
- **Delete**: Click "Delete" (with confirmation)
- **View Details**: Click "View" to see the full JSON structure

### Validation

1. Click "Validate" in the navigation
2. See which questions pass validation
3. View specific errors for invalid questions

## Data Structure

Questions follow the RegenCHOICE specification with multilingual support:

### Common Fields (all question types)
- `QID`: Unique question identifier (32-bit integer, same for all translations)
- `defaultLang`: Primary language code (e.g., "en")
- `QRelB`: Boolean - relational or property question (shared across languages)
- `QnI`: Number of items for itemized questions, 2-10 (shared across languages)
- `QStruct`: Question type - AORBQ, FACTQ, etc. (shared across languages)
- `QLearn`: Optional learning resource link (shared across languages)
- `languages`: Object containing language-specific data

### Language-Specific Fields (within `languages.{lang}`)
Each language code (e.g., "en", "es", "fr") contains:
- `QTitle`: Short title (max 80 characters)
- `QDesc`: Optional longer description
- `QDetails`: Type-specific fields (translated for each language)

### Example Structure
```json
{
  "QID": 123456789,
  "defaultLang": "en",
  "QRelB": false,
  "QnI": 5,
  "QStruct": "AORBQ",
  "QLearn": "https://example.com/help",
  "languages": {
    "en": {
      "QTitle": "Do you prefer A or B?",
      "QDesc": "Choose your preference",
      "QDetails": {
        "QPref1": "Option A",
        "QPref2": "Option B"
      }
    },
    "es": {
      "QTitle": "¿Prefieres A o B?",
      "QDesc": "Elige tu preferencia",
      "QDetails": {
        "QPref1": "Opción A",
        "QPref2": "Opción B"
      }
    }
  }
}
```

### Type-Specific Fields

Each question type has unique fields in `QDetails` within each language. See the [RegenCHOICE documentation](https://wiki.simongrant.org/doku.php/ch:qs:here) for complete specifications.

## Deployment

### Automated Deployment to Server

The application includes a deployment script to automate uploading to your web server.

**Setup:**

1. Edit `deploy.sh` and update these variables:
   ```bash
   SERVER_USER="your-username"
   SERVER_HOST="www.simongrant.org"
   SERVER_PATH="/path/to/web/directory"
   ```

2. Make the script executable:
   ```bash
   chmod +x deploy.sh
   ```

3. Deploy to your server:
   ```bash
   ./deploy.sh
   ```

**Requirements:**
- SSH access to your server
- `rsync` installed on your local machine
- PHP support on your server (for server-side storage)

**What gets deployed:**
- All HTML, CSS, and JavaScript files
- PHP API for server storage
- README documentation
- Excludes: git files, local data, deployment script

### Alternative: Git-Based Deployment

For simpler deployments without the script:

1. Clone this repository on your server:
   ```bash
   cd /var/www/html/regenchoice
   git clone https://github.com/yourusername/yourrepo.git .
   ```

2. To update, SSH to server and pull changes:
   ```bash
   cd /var/www/html/regenchoice
   git pull origin main
   ```

## Server-Side Storage

The app now supports saving questions directly to the server instead of just downloading files.

### Server Setup

1. Ensure PHP is installed on your server (PHP 7.4 or higher recommended)

2. Create a writable `data` directory:
   ```bash
   mkdir data
   chmod 755 data
   ```

3. The API will automatically create `data/questions.json` when you first save

4. For security, you may want to restrict access to the data directory:
   ```apache
   # Add to .htaccess in data directory
   Order deny,allow
   Deny from all
   ```

### Using Server Storage

Once deployed, the app will automatically detect if the server API is available:

**Upload to Server:**
- Click "📤 Upload to Server" button in the navigation
- Uploads current questions to server storage
- Server keeps automatic backups (last 5 versions)

**Load from Server:**
- Click "📥 Load from Server" button
- Loads questions stored on server
- Also available in startup modal

**Features:**
- Automatic backup system (keeps last 5 versions)
- File size limit: 5MB
- JSON validation on server
- Server status indicator

### Local vs Server Storage

You can use both methods:
- **Local files**: Download/upload JSON files (good for backups, sharing)
- **Server storage**: Direct save to server (convenient for single-user editing)
- **Hybrid approach**: Work locally, periodically upload to server

## Technical Details

- Pure HTML/CSS/JavaScript
- No dependencies or frameworks
- Dual storage: File-based (JSON) for portability + Server-side (PHP) for convenience
- Automatic whitespace trimming on all text inputs
- Support for loading and merging multiple files
- Unsaved changes warning
- Responsive design for mobile and desktop
- Server API with automatic backups

## Troubleshooting

### Server buttons not showing

If the "Upload to Server" and "Load from Server" buttons don't appear:

1. Check browser console for errors
2. Verify `api.php` is deployed to your server
3. Test API directly: `https://yourserver.com/path/api.php?action=info`
4. Check PHP is enabled on your server
5. Verify `data` directory exists and is writable

### Deployment script fails

Common issues:

- **SSH key not configured**: Set up SSH key authentication
- **Permission denied**: Check server path permissions
- **rsync not found**: Install rsync (`apt-get install rsync` or `brew install rsync`)

### Server save/load fails

- Check `data` directory permissions (755 for directory)
- Verify PHP has write permissions
- Check server error logs for PHP errors
- Ensure file size is under 5MB limit

## Resources

- [RegenCHOICE Overview](https://wiki.simongrant.org/doku.php/ch:index)
- [Question Specifications](https://wiki.simongrant.org/doku.php/ch:qs:here)
- [RegenCHOICE Website](https://www.simongrant.org/RegenCHOICE/)

## License

Creative Commons Attribution-Noncommercial-Share Alike 4.0 International