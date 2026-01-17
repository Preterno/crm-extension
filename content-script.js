console.log("🔥 Content script loaded at:", window.location.href);

let statusIndicator = null;

function injectStatusIndicator() {
  if (statusIndicator) {
    statusIndicator.remove();
  }

  const shadowHost = document.createElement('div');
  shadowHost.className = 'extract-indicator-host';
  document.body.appendChild(shadowHost);

  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    .extract-indicator {
      position: fixed;
      bottom: 14px;
      right: 14px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-family: system-ui, sans-serif;
      color: white;
      background: rgba(0,0,0,0.75);
      z-index: 999999;
      transition: opacity 0.3s ease-out;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .extracting { background: #3490dc; }
    .success { background: #38c172; }
    .error { background: #e3342f; }
    .hide { opacity: 0 !important; }
  `;

  const indicator = document.createElement('div');
  indicator.className = 'extract-indicator extracting';
  indicator.textContent = 'Extracting...';

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(indicator);

  statusIndicator = shadowHost;

  return { shadowRoot, indicator };
}

function updateStatusIndicator(state, message) {
  if (!statusIndicator) {
    const { indicator } = injectStatusIndicator();
    updateIndicator(indicator, state, message);
    return;
  }

  const shadowRoot = statusIndicator.shadowRoot;
  const indicator = shadowRoot.querySelector('.extract-indicator');
  if (indicator) {
    updateIndicator(indicator, state, message);
  }
}

function updateIndicator(indicator, state, message) {
  indicator.className = `extract-indicator ${state}`;
  indicator.textContent = message;

  if (state === 'success' || state === 'error') {
    setTimeout(() => {
      indicator.classList.add('hide');
      setTimeout(() => {
        if (statusIndicator && statusIndicator.parentNode) {
          statusIndicator.remove();
          statusIndicator = null;
        }
      }, 300);
    }, 1500);
  }
}

function detectView() {
  const url = window.location.href;
  
  if (url.includes('/app/contacts')) {
    return 'contacts';
  }
  
  if (url.includes('/app/deals') || url.includes('?pipeline=')) {
    return 'deals';
  }
  
  if (url.includes('/app/tasks')) {
    return 'tasks';
  }
  
  return null;
}

function extractIdFromUrl(href) {
  if (!href) return null;
  const match = href.match(/\/(\w+)\/(\d+)/);
  return match?.[2] || null;
}

function extractContacts() {
  const rows = document.querySelectorAll(SELECTORS.contacts.row);
  const contacts = [];
  
  rows.forEach(row => {
    const nameLink = row.querySelector(SELECTORS.contacts.name);
    const emailLink = row.querySelector(SELECTORS.contacts.email);
    const phoneLink = row.querySelector(SELECTORS.contacts.phone);
    const accountLink = row.querySelector(SELECTORS.contacts.account);
    const tagsCell = row.querySelector(SELECTORS.contacts.tags);
    const dateCell = row.querySelector(SELECTORS.contacts.date);
    
    if (!nameLink) return;
    
    const id = extractIdFromUrl(nameLink.href);
    const name = nameLink.innerText?.trim() || '';
    const email = emailLink?.innerText?.trim() || '';
    const phone = phoneLink?.innerText?.trim() || '';
    const account = accountLink?.innerText?.trim() || '';
    const dateCreated = dateCell?.innerText?.trim() || '';
    
    let tags = [];
    if (tagsCell) {
      tags = tagsCell.innerText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
    
    const owner = account || null;

    if (name) {
      contacts.push({
        id,
        name,
        email,
        phone,
        account,
        owner,
        tags,
        dateCreated
      });
    }
  });
  
  return contacts;
}

function extractDeals() {
    const columns = document.querySelectorAll(SELECTORS.deals.column);
    const deals = [];
  
    const pipelineElement = document.querySelector(SELECTORS.deals.pipeline);
    const pipeline = pipelineElement?.innerText?.trim() || '';
  
    columns.forEach(column => {
      // Extract stage name (column header)
      const stageElement = column.querySelector(SELECTORS.deals.stage);
      const stage = stageElement?.innerText?.trim() || '';
  
      // Extract individual cards inside the column
      const cards = column.querySelectorAll(SELECTORS.deals.card);
  
      cards.forEach(card => {
        // Extract link for ID
        const link = card.querySelector('a');
        const href = link?.getAttribute('href') || '';
        const id = extractIdFromUrl(href);
  
        // Extract title
        const titleElement = card.querySelector(SELECTORS.deals.title);
        const title = titleElement?.innerText?.trim() || '';
  
        // Extract contact (may include `/admin` suffix)
        const contactElement = card.querySelector(SELECTORS.deals.contact);
        const rawContact = contactElement?.innerText?.trim() || '';
        const contact = rawContact.replace(/\s+/g, ' ').trim();

        // Extract owner from contact field (format: "UserName/Account")
        let owner = null;
        if (contact.includes('/')) {
          owner = contact.split('/')[0].trim();
        }

        // Extract value (e.g. "$100" or "$100 USD")
        const valueElement = card.querySelector(SELECTORS.deals.value);
        const value = valueElement?.innerText?.trim() || '';

        if (title) {
          deals.push({
            id,
            title,
            value,
            contact,
            owner,
            stage,
            pipeline
          });
        }
      });
    });
  
    return deals;
  }
  

  function extractTasks() {
    const rows = document.querySelectorAll(SELECTORS.tasks.row);
    const tasks = [];
    
    rows.forEach(row => {
      const titleElement = row.querySelector(SELECTORS.tasks.title);
      const typeElement = row.querySelector(SELECTORS.tasks.type);
      const relatedElement = row.querySelector(SELECTORS.tasks.related);
      const dueElement = row.querySelector(SELECTORS.tasks.due);
      const statusElement = row.querySelector(SELECTORS.tasks.status);
  
      // Task ID using row ID
      let id = row.getAttribute('id') || null;
  
      const title = titleElement?.innerText?.trim() || '';
      const type = typeElement?.innerText?.trim() || '';
      const status = statusElement?.innerText?.trim() || '';
      const due = dueElement?.innerText?.trim() || '';
  
      let relatedTo = '';
      let relatedType = null;
  
      if (relatedElement) {
        relatedTo = relatedElement.innerText?.trim() || '';
      }
  
      // Detect related type using icon
      const iconUse = row.querySelector('use');
      if (iconUse) {
        const href = iconUse.getAttribute('xlink:href');
        if (href.includes('deals')) relatedType = 'deal';
        if (href.includes('contacts')) relatedType = 'contact';
      }

      // Extract assignee
      let assignee = null;
      const avatarElement = row.querySelector('.ac-avatar, .components_ac-avatar, [class*="avatar"]');
      if (avatarElement) {
        const assigneeText = avatarElement.getAttribute('title') || 
                           avatarElement.getAttribute('alt') ||
                           avatarElement.textContent?.trim();
        if (assigneeText) {
          assignee = assigneeText;
        }
      }

      if (title) {
        tasks.push({
          id,
          title,
          type,
          status,
          due,
          relatedTo,
          relatedType,
          assignee
        });
      }
    });
  
    return tasks;
  }
  

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_DATA') {
    const view = detectView();
    let data = [];
    
    if (view === 'contacts') {
      data = extractContacts();
    } else if (view === 'deals') {
      data = extractDeals();
    } else if (view === 'tasks') {
      data = extractTasks();
    }
    
    sendResponse({ view, data });
    return true;
  }

  if (request.type === 'START_EXTRACTION') {
    injectStatusIndicator();
    return true;
  }

  if (request.type === 'EXTRACTION_SUCCESS') {
    updateStatusIndicator('success', '✓ Success');
    return true;
  }

  if (request.type === 'EXTRACTION_FAILED') {
    updateStatusIndicator('error', '✕ Failed');
    return true;
  }
});
