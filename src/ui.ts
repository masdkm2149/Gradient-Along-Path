import './styles.css';

// Initialize UI elements and event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('UI initialized');
  
  // Initialize custom dropdown selectors
  initializeUI();
});

// Initialize UI components
function initializeUI(): void {
  // Initialize custom select dropdowns
  document.querySelectorAll('.custom-select').forEach(setupCustomSelect);
  
  // Other UI initialization code...
}

// Setup the custom select dropdowns
function setupCustomSelect(selectElement: Element): void {
  const selected = selectElement.querySelector('.select-selected') as HTMLElement;
  const items = selectElement.querySelector('.select-items') as HTMLElement;
  
  if (selected && items) {
    // Toggle dropdown when clicking the selected item
    selected.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      closeAllSelect(selected);
      items.classList.toggle('select-hide');
      selected.classList.toggle('select-arrow-active');
    });
    
    // Setup each option in the dropdown
    const options = items.querySelectorAll('.select-option');
    options.forEach((option: Element) => {
      option.addEventListener('click', () => {
        // Your option selection logic here
      });
    });
  }
}

// Close all select boxes except the current one
function closeAllSelect(elmnt: HTMLElement): void {
  const items = document.querySelectorAll('.select-items');
  const selected = document.querySelectorAll('.select-arrow-active');
  
  items.forEach((item: Element, idx: number) => {
    if (selected[idx] !== elmnt) {
      item.classList.add('select-hide');
      selected[idx]?.classList.remove('select-arrow-active');
    }
  });
}

// Close dropdowns when clicking elsewhere
document.addEventListener('click', closeAllSelect);