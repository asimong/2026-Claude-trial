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
3. Data is stored in your browser's localStorage

## Usage

### Creating Questions

1. Click "Create Question" in the navigation
2. Select the question type from the dropdown
3. Fill in the common fields (title, description, etc.)
4. Complete the type-specific fields
5. Click "Create Question" to save

### Managing Questions

- **View**: Click the list icon to see all questions
- **Edit**: Click "Edit" on any question card
- **Delete**: Click "Delete" (with confirmation)
- **View Details**: Click "View" to see the full JSON structure

### Validation

1. Click "Validate" in the navigation
2. See which questions pass validation
3. View specific errors for invalid questions

### Export/Import

- **Export**: Download all questions as JSON
- **Import**: Upload a previously exported JSON file

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
- localStorage for data persistence
- Responsive design for mobile and desktop

## Resources

- [RegenCHOICE Overview](https://wiki.simongrant.org/doku.php/ch:index)
- [Question Specifications](https://wiki.simongrant.org/doku.php/ch:qs:here)
- [RegenCHOICE Website](https://www.simongrant.org/RegenCHOICE/)

## License

Creative Commons Attribution-Noncommercial-Share Alike 4.0 International