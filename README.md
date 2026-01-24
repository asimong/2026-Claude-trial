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
3. Fill in the common fields (title, description, etc.)
4. Complete the type-specific fields
5. Click "Create Question" to save
6. Remember to use "Save" to download your updated file

**Note**: All text fields automatically trim whitespace from both ends

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

Questions follow the RegenCHOICE specification with:

### Common Fields (all question types)
- `QID`: Unique question identifier (32-bit integer)
- `Lang`: Language code (e.g., "en")
- `QTitle`: Short title (max 80 characters)
- `QDesc`: Optional longer description
- `QRelB`: Boolean - relational or property question
- `QnI`: Number of items (for itemized questions, 2-10)
- `QStruct`: Question type (AORBQ, FACTQ, etc.)
- `QLearn`: Optional learning resource link
- `QDetails`: Type-specific fields

### Type-Specific Fields

Each question type has unique fields in `QDetails`. See the [RegenCHOICE documentation](https://wiki.simongrant.org/doku.php/ch:qs:here) for complete specifications.

## Technical Details

- Pure HTML/CSS/JavaScript
- No dependencies or frameworks
- File-based storage (JSON) for data portability and collaboration
- Automatic whitespace trimming on all text inputs
- Support for loading and merging multiple files
- Unsaved changes warning
- Responsive design for mobile and desktop

## Resources

- [RegenCHOICE Overview](https://wiki.simongrant.org/doku.php/ch:index)
- [Question Specifications](https://wiki.simongrant.org/doku.php/ch:qs:here)
- [RegenCHOICE Website](https://www.simongrant.org/RegenCHOICE/)

## License

Creative Commons Attribution-Noncommercial-Share Alike 4.0 International