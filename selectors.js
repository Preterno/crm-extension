var SELECTORS = {
  deals: {
    column: '.deals_index_deal-board_column',
    stage: '.deals_index_deal-board_column__title',
    card: '.deals_index_deal-card',
    title: '.card-region1',
    contact: '.card-region4',
    value: '.card-region5',
    pipeline: '.pipelines-dropdown .ac_popover-label'
  },
  tasks: {
    row: 'tr.tasks_task-row',
    title: '.task-title',
    type: '.deal-task-type',
    related: '.owner-type span',
    due: '.date span[rel="tip"]',
    status: '.status-text'
  },
  contacts: {
    row: 'tr[data-testid="c-table__row"]',
    name: 'td[data-testid="c-table__cell--full-name"] a',
    email: 'td[data-testid="c-table__cell--email"] a',
    phone: 'td[data-testid="c-table__cell--phone"] a',
    account: 'td[data-testid="c-table__cell--account"] a',
    tags: 'td[data-testid="c-table__cell--tags"]',
    date: 'td[data-testid="c-table__cell--date"]'
  }
};
