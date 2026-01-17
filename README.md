# ActiveCampaign CRM Data Extractor

A Chrome Extension (Manifest V3) that extracts Contacts, Deals, and Tasks from ActiveCampaign's web UI and provides a React-based popup interface for viewing, managing, and exporting the data.

## 🎯 Project Purpose

This extension enables users to:
- Extract CRM data directly from ActiveCampaign's web interface
- Store extracted data locally using Chrome's storage API
- View and manage data through a modern React UI
- Export data in JSON or CSV formats
- Delete individual records
- Search and filter extracted data
- Sync data across multiple browser tabs in real-time

## 🛠 Tech Stack

- **Manifest Version**: V3 (Service Worker)
- **Frontend**: React 19 + Tailwind CSS 4
- **Build Tool**: Vite 7
- **Storage**: chrome.storage.local
- **Architecture**: Content Scripts + Background Service Worker + React Popup
- **Export**: JSZip for multi-file CSV exports

## 📁 Folder Structure

```
crm-extension/
├── manifest.json              # Extension manifest (MV3)
├── background.js              # Service worker (message routing, storage operations)
├── content-script.js          # DOM extraction logic
├── selectors.js               # CSS selector configuration
├── storage.js                 # Storage operations (get, set, merge, delete, dedupe)
├── popup-build/               # React popup application
│   ├── src/
│   │   ├── main.jsx          # React entry point
│   │   ├── App.jsx           # Main application component
│   │   ├── Tabs.jsx          # Tab navigation component
│   │   ├── DataTable.jsx     # Data table with delete functionality
│   │   ├── ExportButtons.jsx # Export JSON/CSV buttons
│   │   ├── components/
│   │   │   └── Toast.jsx     # Toast notification component
│   │   │   └── SearchBar.jsx # Search/filter input
│   │   ├── hooks/
│   │   │   └── useToast.jsx  # Toast state management hook
│   │   └── tailwind.css      # Tailwind styles
│   ├── package.json
│   └── dist/                 # Build output (served as dist-popup/)
└── dist-popup/               # Vite build output (popup UI)
```

## 🚀 Build & Load Instructions

### Prerequisites
- Node.js 18+ and npm
- Chrome browser

### Build Steps

1. **Install dependencies:**
   ```bash
   cd popup-build
   npm install
   ```

2. **Build the popup:**
   ```bash
   npm run build
   ```
   This generates the popup UI in `dist-popup/` directory.

3. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `crm-extension/` folder (root directory containing `manifest.json`)

4. **Verify installation:**
   - The extension icon should appear in your Chrome toolbar
   - Click the icon to open the popup
   - Navigate to an ActiveCampaign page (contacts, deals, or tasks view)

## 🔍 DOM Extraction Strategy

### Why CSS Selectors?

We use CSS selectors because:
- ActiveCampaign exposes semantic classes and `data-testid` attributes
- XPath is not natively supported in Chrome content scripts without conversion
- CSS selectors are more performant and maintainable
- Selectors are centralized in `selectors.js` for easy updates

### View Detection Logic

The extension detects the current ActiveCampaign view using URL patterns:

- **Contacts**: URL contains `/app/contacts`
- **Deals**: URL contains `/app/deals` AND `?pipeline=`
- **Tasks**: URL contains `/app/tasks`

Detection is handled by `detectView()` in `content-script.js`:

```javascript
function detectView() {
  const url = window.location.href;
  if (url.includes('/app/contacts')) return 'contacts';
  if (url.includes('/app/deals') && url.includes('?pipeline=')) return 'deals';
  if (url.includes('/app/tasks')) return 'tasks';
  return null;
}
```

### SPA Navigation Handling

ActiveCampaign is a Single Page Application (SPA). We handle navigation by:
- Monitoring `window.location.href` changes
- Re-running view detection on each extraction request
- Using `document_idle` run_at timing to ensure DOM is ready
- Re-triggering extraction when user clicks "Extract Now" in popup

### Lazy-Loaded DOM

Some data may be lazy-loaded. Our approach:
- Content script runs at `document_idle` (after DOM is ready)
- User manually triggers extraction via popup button
- Extraction queries visible DOM elements only
- No pagination handling (extracts only visible rows)

## 💾 Storage Schema & Deduplication

### Storage Structure

Data is stored in `chrome.storage.local` under the key `activecampaign_data`:

```json
{
  "contacts": [
    {
      "id": "123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "account": "Acme Corp",
      "owner": "Jane Smith",
      "tags": ["customer", "vip"],
      "dateCreated": "2024-01-15"
    }
  ],
  "deals": [
    {
      "id": "456",
      "title": "Q1 Deal",
      "value": "$10,000",
      "contact": "John Doe",
      "owner": "Jane Smith",
      "stage": "Qualified",
      "pipeline": "Sales Pipeline"
    }
  ],
  "tasks": [
    {
      "id": "789",
      "title": "Follow up",
      "type": "Call",
      "status": "Pending",
      "due": "2024-01-20",
      "relatedTo": "John Doe",
      "relatedType": "contact",
      "assignee": "Jane Smith"
    }
  ],
  "lastSync": 1737110321200
}
```

### Deduplication Strategy

Items are deduplicated by `id`:

1. **Primary Key**: `id` field (extracted from URL patterns like `/contacts/123`)
2. **Fallback for Tasks**: If `id` is null, generate hash from:
   ```javascript
   hash(title + relatedTo + due)
   ```
3. **Hash Function**: Simple string hash (left-shift algorithm)
4. **Storage**: Only unique items (by id) are stored per view

### Merge Logic

- `mergeData(view, items)` replaces the entire array for the specified view
- Deduplication runs before storage
- `lastSync` timestamp is updated on each merge
- Existing data in other views is preserved

## 📡 Message Passing Architecture

### Message Flow

```
Popup → Background → Content Script → Extraction → Response → Background → Storage → Popup
```

### Message Types

#### From Popup to Background:
- `EXTRACT_DATA` - Trigger data extraction
- `DELETE_ITEM` - Delete a specific record

#### From Background to Content Script:
- `START_EXTRACTION` - Show extraction indicator
- `EXTRACT_DATA` - Request data extraction
- `EXTRACTION_SUCCESS` - Update indicator to success
- `EXTRACTION_FAILED` - Update indicator to error

#### From Background to Popup:
- `DATA_SYNCED` - Broadcast data sync completion

#### From Content Script to Background:
- `{ view, data }` - Extracted data response

### Real-Time Sync

Two mechanisms ensure real-time updates:

1. **chrome.storage.onChanged**: Popup listens for storage changes
2. **DATA_SYNCED Broadcast**: Background sends sync notifications after operations

## Features

### Shadow DOM Extraction Indicator

A floating status indicator appears on the ActiveCampaign page during extraction:
- **States**: "Extracting..." → "✓ Success" / "✕ Failed"
- **Position**: Bottom-right (14px from edge)
- **Z-index**: 999999 (above all page content)
- **Auto-hide**: Fades out after 1500ms
- **Isolation**: Uses Shadow DOM to prevent CSS conflicts

### Search & Filter

- Real-time search across all fields
- Debounced input (300ms delay)
- Works for Contacts, Deals, and Tasks
- Case-insensitive matching
- Clear button for quick reset

### Export Features

- **Export JSON**: Current tab data as formatted JSON
- **Export CSV**: Current tab data as CSV
- **Export All JSON**: Complete dataset as `activecampaign_export.json`
- **Export All CSV**: ZIP file containing `contacts.csv`, `deals.csv`, `tasks.csv`

### Delete Records

- Delete button (trash icon) on each table row
- Immediate UI update
- Toast notification on success/error
- Auto-sync across tabs

### Toast Notifications

- Success/error states
- Auto-dismiss after 3 seconds
- Slide-in animation
- Non-intrusive positioning

### Loading States

- Spinner on "Extract Now" button during extraction
- Disabled state prevents multiple clicks
- Visual feedback for all async operations

