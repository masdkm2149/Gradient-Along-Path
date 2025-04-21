/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/styles.css":
/*!************************!*\
  !*** ./src/styles.css ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/ui.js":
/*!*******************!*\
  !*** ./src/ui.js ***!
  \*******************/
/***/ (() => {

      // --- DOM Element References ---
      const startColorInput = document.getElementById('start-color');
      const endColorInput = document.getElementById('end-color');
      const startPreview = document.getElementById('start-preview');
      const endPreview = document.getElementById('end-preview');
      const gradientBar = document.getElementById('gradient-bar');
      const colorStops = document.getElementById('color-stops'); // Container for all stop elements
      const startStop = document.getElementById('start-stop');   // Start stop element
      const endStop = document.getElementById('end-stop');       // End stop element

      // Panel elements
      const currentStopPosition = document.getElementById('current-stop-position');
      const currentStopColor = document.getElementById('current-stop-color');
      const currentStopAlpha = document.getElementById('current-stop-alpha');
      const currentStopColorPreview = document.getElementById('current-stop-color-preview');
      const addStopBtn = document.getElementById('add-stop-btn');
      const removeStopBtn = document.getElementById('remove-stop-btn');

      // Stroke Weight Elements
      const strokeWeightInput = document.getElementById('stroke-weight');
      const strokeWeightLabel = document.getElementById('stroke-weight-label'); // Reference for potential future use

      // --- State Variables ---
      // Gradient stops data model
      let stops = [
        { id: 'start-stop', position: 0, color: '#ff0000', alpha: 1, isEndpoint: true },
        { id: 'end-stop', position: 100, color: '#0000ff', alpha: 1, isEndpoint: true }
      ];
      let selectedStopId = null; // ID of the currently selected stop

      // Color stop dragging state
      let isDragging = false;        // Is a color stop being dragged?
      let activeDragElement = null; // The DOM element being dragged
      let dragStartX, dragStartLeft; // Initial position during drag start

      // Stroke weight dragging state
      let isDraggingWeight = false;       // Is the stroke weight being dragged?
      let weightDragStartX = 0;         // Initial mouse X position for weight drag
      let weightDragLastX = 0;          // Last mouse X position during weight drag
      let weightDragCurrentValue = 0;   // Current weight value during drag
      let weightDragEngaged = false;    // Has the cursor changed to indicate dragging?
      let weightScalingActive = false;  // Has the value scaling started (moved enough)?


      // --- Initialization ---

      // Initial setup on page load
      document.addEventListener('DOMContentLoaded', () => {
          initializeCustomSelects(); // Set up custom dropdowns
          setupInitialStopHandlers(); // Attach handlers to start/end stops
          positionStops();           // Position initial stops correctly
          updateGradient();          // Render the initial gradient bar
          selectStop('start-stop');    // Select the start stop by default
          setupPanelInputListeners(); // Add listeners for panel inputs
          setupWeightDragListeners(); // Add listeners for weight input dragging
          setupKeyboardListeners();   // Add global keyboard listeners (delete)
          setupGradientBarClickListener(); // *** ADDED: Listener for gradient bar clicks ***

          // Request initial data from the plugin (if applicable)
          // parent.postMessage({ pluginMessage: { type: 'get-initial-data' } }, '*');
      });

      // Close custom selects when clicking outside
      document.addEventListener("click", closeAllSelect);

      // Handle window resize
      window.addEventListener('resize', () => {
         positionStops();
         updateGradient(); // Redraw gradient as bar width changes
      });

      // --- Custom Select Dropdown Logic ---

      // Closes all custom select dropdowns except the one passed as elmnt
      function closeAllSelect(elmnt) {
        const selectItems = document.getElementsByClassName("select-items");
        const selectedBoxes = document.getElementsByClassName("select-selected");
        const activeIndices = [];

        // Find the index of the element being interacted with
        for (let i = 0; i < selectedBoxes.length; i++) {
          if (elmnt === selectedBoxes[i]) {
            activeIndices.push(i);
          } else {
            selectedBoxes[i].classList.remove("select-arrow-active");
          }
        }
        // Hide all dropdowns that are not the active one
        for (let i = 0; i < selectItems.length; i++) {
          // Check if the parent wrapper does NOT have the 'join-options-visible' class
          const wrapper = selectItems[i].closest('.custom-select-wrapper');
          if (!wrapper || !wrapper.classList.contains('join-options-visible')) {
            if (activeIndices.indexOf(i) === -1) { // If index is not in active list
              selectItems[i].classList.add("select-hide");
            }
          }
        }
      }

      // Initializes all elements with the class "custom-select"
      function initializeCustomSelects() {
          const customSelects = document.getElementsByClassName("custom-select");
          for (let i = 0; i < customSelects.length; i++) {
              const customSelectDiv = customSelects[i];
              const wrapper = customSelectDiv.closest('.custom-select-wrapper');
              const hiddenInput = wrapper?.querySelector('input[type="hidden"]');
              const selectedDisplay = customSelectDiv.querySelector(".select-selected");
              const itemsContainer = customSelectDiv.querySelector(".select-items");

              if (!hiddenInput || !selectedDisplay || !itemsContainer) {
                  console.warn("Skipping malformed custom select:", customSelectDiv);
                  continue;
              }

              const isJoinSelector = wrapper.classList.contains('join-options-visible'); // Check for the class

              const options = itemsContainer.getElementsByClassName("select-option");

              // Set initial display / selected state
              const initialValue = hiddenInput.value;
              let initialHTML = 'Select...'; // Fallback for dropdowns
              for (let k = 0; k < options.length; k++) {
                  if (options[k].getAttribute('data-value') === initialValue) {
                      initialHTML = options[k].innerHTML; // Get HTML for dropdowns
                      options[k].classList.add("same-as-selected");
                      if (!isJoinSelector) { // Only move to top for dropdowns
                         itemsContainer.prepend(options[k]);
                      }
                      break;
                  }
              }
              if (!isJoinSelector) { // Only set display HTML for dropdowns
                  selectedDisplay.innerHTML = initialHTML;
              }


              // --- Conditional Listeners ---

              if (!isJoinSelector) {
                  // == STANDARD DROPDOWN LOGIC (for Start/End caps) ==
                  selectedDisplay.addEventListener("click", function(e) {
                      e.stopPropagation();
                      closeAllSelect(this); // Close others
                      itemsContainer.classList.toggle("select-hide");
                      this.classList.toggle("select-arrow-active");
                  });

                  // Basic keyboard nav for dropdowns (optional)
                  selectedDisplay.addEventListener("keydown", function(e) {
                      if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          this.click(); // Open/close dropdown
                      }
                  });

                  for (let j = 0; j < options.length; j++) {
                      options[j].addEventListener("click", function() {
                          const newValue = this.getAttribute("data-value");
                          selectedDisplay.innerHTML = this.innerHTML;
                          hiddenInput.value = newValue;

                          const siblings = this.parentNode.children;
                          for (let k = 0; k < siblings.length; k++) {
                              siblings[k].classList.remove("same-as-selected");
                          }
                          this.classList.add("same-as-selected");
                          this.parentNode.prepend(this); // Move selected option to the top
                          selectedDisplay.click(); // Close dropdown
                      });
                  }
              } else {
                  // == ALWAYS VISIBLE LOGIC (for Join) ==
                  // No click listener needed for selectedDisplay (it's hidden)
                  // No keydown listener needed for selectedDisplay

                  for (let j = 0; j < options.length; j++) {
                      options[j].addEventListener("click", function() {
                          const newValue = this.getAttribute("data-value");
                          hiddenInput.value = newValue; // Update hidden input

                          // Update styling for selected option
                          const siblings = this.parentNode.children;
                          for (let k = 0; k < siblings.length; k++) {
                              siblings[k].classList.remove("same-as-selected");
                          }
                          this.classList.add("same-as-selected");
                          // No need to close anything
                      });
                  }
              }
          }
      }


      // --- Gradient Stop Management ---

      // Selects a color stop visually and updates the panel
      function selectStop(stopId) {
          // If already selected, ensure class is present (handles edge cases)
          if (selectedStopId === stopId) {
              const currentEl = document.getElementById(stopId);
              if (currentEl && !currentEl.classList.contains('selected')) {
                  currentEl.classList.add('selected');
              }
              return; // No change needed
          }

          // Deselect previous stop
          if (selectedStopId) {
              const previousEl = document.getElementById(selectedStopId);
              previousEl?.classList.remove('selected');
          }

          // Select the new stop
          const stopElement = document.getElementById(stopId);
          if (stopElement) {
              stopElement.classList.add('selected');
              selectedStopId = stopId;
              updateStopPanel(); // Update panel based on new selection
              // Optional: Notify plugin about selection change
              // parent.postMessage({ pluginMessage: { type: 'select-stop', selectedStopId: stopId } }, '*');
          } else {
              console.warn(`selectStop called for non-existent ID: ${stopId}`);
              selectedStopId = null; // Clear selection if stop doesn't exist
              updateStopPanel(); // Clear panel
          }
      }

      // Positions all stop elements visually based on their data
      function positionStops() {
          const gradientWidth = gradientBar.offsetWidth;
          stops.forEach(stop => {
              const stopElement = document.getElementById(stop.id);
              if (stopElement) {
                  stopElement.style.left = `${(stop.position / 100) * gradientWidth}px`;
              }
          });
      }

      // Updates the gradient bar background based on current stops
      function updateGradient() {
          if (!Array.isArray(stops) || stops.length === 0) {
              console.error("Invalid 'stops' array for gradient update:", stops);
              gradientBar.style.background = 'grey'; // Fallback
              return;
          }

          // Sort stops by position for correct gradient generation
          let sortedStops = [...stops].sort((a, b) => a.position - b.position);

          // Create the CSS linear-gradient string including alpha
          let gradientString = sortedStops
              .map(stop => {
                  const alpha = stop.alpha !== undefined ? stop.alpha : 1;
                  const rgba = hexToRgba(stop.color, alpha); // Convert hex + alpha to rgba()
                  return `${rgba} ${stop.position}%`;
              })
              .join(', ');

          gradientBar.style.background = `linear-gradient(to right, ${gradientString})`;

          // Update visual representation of stops (position and preview color)
          stops.forEach(stop => {
              const stopElement = document.getElementById(stop.id);
              if (stopElement) {
                  // Update position (redundant if called after positionStops, but safe)
                  stopElement.style.left = `${(stop.position / 100) * gradientBar.offsetWidth}px`;
                  // Update preview color (uses hex color without alpha)
                  const preview = stopElement.querySelector('.color-preview');
                  if (preview) preview.style.backgroundColor = stop.color;
                  // Update hidden color input value (uses hex color without alpha)
                  const input = stopElement.querySelector('input[type="color"]');
                  if (input) input.value = stop.color;
              }
          });

          updateStopPanel(); // Keep the editor panel synchronized
      }

      // Adds a new color stop to the data model and the DOM
      function addNewStop(position, colorData) {
          if (typeof position !== 'number' || position < 0 || position > 100) {
              console.error("Invalid stop position:", position);
              return;
          }
          const stopId = `stop-${Date.now()}`; // Generate unique ID
          const newStop = {
              id: stopId,
              position: Math.round(position), // Ensure integer position
              color: colorData.color,
              alpha: colorData.alpha !== undefined ? colorData.alpha : 1,
              isEndpoint: false // New stops are never endpoints
          };
          stops.push(newStop);

          // Create DOM element for the new stop
          const stopElement = document.createElement('div');
          stopElement.classList.add('color-stop');
          stopElement.id = stopId;
          stopElement.innerHTML = `
              <div class="color-preview" style="background: ${newStop.color}"></div>
              <input type="color" value="${newStop.color}">`;
          colorStops.appendChild(stopElement); // Add to container

          // Position the new stop element
          positionStops(); // Reposition all stops including the new one

          // Setup handlers for the new stop
          setupColorInputHandler(stopId); // Color input/preview click
          const colorPreview = stopElement.querySelector('.color-preview');
          if (colorPreview) {
              colorPreview.addEventListener('mousedown', (e) => handleStopDragStart(e, stopElement)); // Dragging
          }

          updateGradient(); // Update gradient display
          selectStop(stopId); // Select the newly added stop
      }

      // Deletes a color stop from the data model and the DOM
      function deleteStop(stopId) {
          const stopIndex = stops.findIndex(s => s.id === stopId);
          if (stopIndex === -1) return; // Stop not found

          const stop = stops[stopIndex];
          if (stop.isEndpoint) return; // Cannot delete endpoints

          // Remove DOM element
          const stopElement = document.getElementById(stopId);
          stopElement?.remove();

          // Remove from data array
          stops.splice(stopIndex, 1);

          // If the deleted stop was selected, select another stop
          if (selectedStopId === stopId) {
              // Select the first non-endpoint stop, or the start stop as fallback
              const nextStopToSelect = stops.find(s => !s.isEndpoint)?.id || stops[0]?.id || null;
              selectStop(nextStopToSelect);
          }

          updateGradient(); // Update UI
      }

      // --- Stop Dragging Logic ---

      // Sets up event listeners for a specific stop's color input and preview click
      function setupColorInputHandler(stopId) {
          const stopElement = document.getElementById(stopId);
          if (!stopElement) return;
          const colorInput = stopElement.querySelector('input[type="color"]'); // Hidden color picker
          const colorPreview = stopElement.querySelector('.color-preview'); // Visible preview circle

          // Handle changes from the hidden color picker
          if (colorInput) {
              colorInput.addEventListener('input', (e) => {
                  const stopObj = stops.find(s => s.id === stopId);
                  if (stopObj) {
                      stopObj.color = e.target.value; // Update color in data model
                      if (colorPreview) colorPreview.style.backgroundColor = e.target.value; // Update preview visually
                      updateGradient(); // Redraw gradient and update panel
                  }
              });
          }

          // Handle clicks on the visible preview circle
          if (colorPreview) {
              colorPreview.addEventListener('click', () => {
                  if (!isDragging) { // Only trigger if not currently dragging this stop
                      selectStop(stopId); // Select the stop
                      colorInput?.click(); // Open the hidden color picker
                  }
              });
          }
      }

      // Initializes drag handlers for the initial start and end stops
      function setupInitialStopHandlers() {
          setupColorInputHandler('start-stop');
          setupColorInputHandler('end-stop');
          startPreview.addEventListener('mousedown', (e) => handleStopDragStart(e, startStop));
          endPreview.addEventListener('mousedown', (e) => handleStopDragStart(e, endStop));
      }

      // Handles the start of dragging a color stop
      function handleStopDragStart(e, element) {
          if (e.button !== 0) return; // Only respond to left-click
          e.preventDefault(); // Prevent default text selection/drag behaviors
          isDragging = true;
          activeDragElement = element;
          selectStop(element.id); // Select the stop being dragged
          dragStartX = e.clientX; // Record starting mouse position
          dragStartLeft = parseInt(window.getComputedStyle(element).left || '0'); // Record starting element position

          // Add temporary listeners to the document for move and mouseup
          document.addEventListener('mousemove', handleStopDragMove);
          document.addEventListener('mouseup', handleStopDragEnd, { once: true }); // Remove after first trigger
      }

      // Handles mouse movement while dragging a color stop
      function handleStopDragMove(e) {
          if (!isDragging || !activeDragElement) return;
          e.preventDefault(); // Prevent selection during drag

          const gradientRect = gradientBar.getBoundingClientRect();
          const minX = 0; // Minimum pixel position (left edge of bar)
          const maxX = gradientRect.width; // Maximum pixel position (right edge of bar)

          // Calculate new horizontal position based on mouse movement
          let newLeft = dragStartLeft + (e.clientX - dragStartX);
          newLeft = Math.max(minX, Math.min(newLeft, maxX)); // Clamp position within bar bounds

          // Calculate percentage position
          const position = Math.round((newLeft / maxX) * 100);

          // Update the stop's data model
          const stopId = activeDragElement.id;
          const stop = stops.find(s => s.id === stopId);
          if (stop) {
              stop.position = position; // Update position in the data array
              activeDragElement.style.left = `${newLeft}px`; // Update visual position immediately
              updateGradient(); // Redraw gradient bar and update panel
          }
      }

      // Handles the end of dragging a color stop
      function handleStopDragEnd() {
          if (isDragging) {
              isDragging = false;
              activeDragElement = null;
              document.removeEventListener('mousemove', handleStopDragMove);
              // mouseup listener is removed automatically due to { once: true }
              // Final update to ensure consistency (might be redundant but safe)
              updateGradient();
          }
      }

      // --- Gradient Bar Click Listener ---

      // *** ADDED: Sets up the click listener for the gradient bar ***
      function setupGradientBarClickListener() {
          gradientBar.addEventListener('click', (e) => {
              // Ignore clicks if not directly on the bar itself, or if a stop is being dragged
              if (e.target !== gradientBar || isDragging) return;

              const gradientRect = gradientBar.getBoundingClientRect();
              const clickX = e.clientX - gradientRect.left; // Click position relative to the bar
              const positionPercent = Math.round((clickX / gradientRect.width) * 100); // Position as percentage

              // Get the interpolated color and alpha at the click position
              const colorData = getColorAtPosition(positionPercent);

              // Add the new stop using the calculated position and color data
              addNewStop(positionPercent, colorData);
          });
      }

      // --- Stop Editor Panel Logic ---

      // Updates the editor panel fields based on the currently selected stop
      function updateStopPanel() {
          const stop = stops.find(s => s.id === selectedStopId);

          if (!stop) {
              // Clear/disable panel if no stop is selected
              currentStopPosition.value = '';
              currentStopColor.value = '';
              currentStopColorPreview.style.backgroundColor = 'transparent';
              currentStopAlpha.value = '';
              removeStopBtn.disabled = true; // Disable remove button
              currentStopPosition.disabled = true; // Disable inputs
              currentStopColor.disabled = true;
              currentStopAlpha.disabled = true;
              currentStopColorPreview.style.cursor = 'default';
              return;
          }

          // Enable inputs and set values
          currentStopPosition.disabled = false;
          currentStopColor.disabled = false;
          currentStopAlpha.disabled = false;
          currentStopColorPreview.style.cursor = 'pointer';

          currentStopPosition.value = stop.position + '%'; // Format position with %
          currentStopColor.value = stop.color; // Set hex color
          currentStopColorPreview.style.backgroundColor = stop.color; // Update color preview swatch
          currentStopAlpha.value = Math.round((stop.alpha !== undefined ? stop.alpha : 1) * 100); // Set alpha (0-100)

          // Disable remove button for endpoint stops
          removeStopBtn.disabled = stop.isEndpoint;
      }

      // Sets up event listeners for the input fields in the stop editor panel
      function setupPanelInputListeners() {
          // Position Input (Text Input)
          currentStopPosition.addEventListener('input', handlePositionInput);
          currentStopPosition.addEventListener('blur', handlePositionBlur);
          currentStopPosition.addEventListener('keydown', handlePositionKeydown);
          currentStopPosition.addEventListener('focus', (e) => e.target.select()); // Select text on focus

          // Color Input (Text Input for Hex)
          currentStopColor.addEventListener('input', handleColorInput);
          currentStopColor.addEventListener('blur', handleColorBlur);
          currentStopColor.addEventListener('focus', (e) => e.target.select()); // Select text on focus

          // Alpha Input (Number Input)
          currentStopAlpha.addEventListener('input', handleAlphaInput);
          currentStopAlpha.addEventListener('blur', handleAlphaBlur);
          currentStopAlpha.addEventListener('focus', (e) => e.target.select()); // Select text on focus

          // Panel Color Preview Click (opens hidden color picker for the selected stop)
          currentStopColorPreview.addEventListener('click', () => {
              if (!selectedStopId) return;
              const stopElement = document.getElementById(selectedStopId);
              const colorInput = stopElement?.querySelector('input[type="color"]');
              colorInput?.click();
          });

          // Add/Remove Buttons
          addStopBtn.addEventListener('click', handleAddStopClick);
          removeStopBtn.addEventListener('click', handleRemoveStopClick);

          // Highlight color input when alpha is focused
           currentStopAlpha.addEventListener('focus', () => currentStopColor.classList.add('highlight'));
           currentStopAlpha.addEventListener('blur', () => currentStopColor.classList.remove('highlight'));
      }

      // Handlers for Panel Inputs
      function handlePositionInput(e) {
          if (!selectedStopId) return;
          const stop = stops.find(s => s.id === selectedStopId);
          if (!stop) return;
          let value = e.target.value.replace('%', '');
          let newPosition = parseInt(value);
          if (!isNaN(newPosition)) {
              // Allow temporary overshoot during typing, clamp on update/blur
              newPosition = Math.max(-10, Math.min(110, newPosition)); // Allow slight overshoot temp
              if (stop.position !== newPosition) {
                  stop.position = newPosition;
                  updateGradient(); // Updates element position and reformats panel value
              }
          }
      }
      function handlePositionBlur(e) {
          if (!selectedStopId) return;
          const stop = stops.find(s => s.id === selectedStopId);
          if (!stop) return;
          let value = e.target.value.replace('%', '');
          let numValue = parseInt(value);
          if (!isNaN(numValue)) {
              numValue = Math.max(0, Math.min(100, numValue)); // Clamp strictly on blur
              stop.position = numValue;
              e.target.value = numValue + '%'; // Reformat input
              updateGradient();
          } else {
              e.target.value = stop.position + '%'; // Revert if invalid
          }
      }
      function handlePositionKeydown(e) { // Arrow key handling
          if (!selectedStopId || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
          e.preventDefault();
          const stop = stops.find(s => s.id === selectedStopId);
          if (!stop) return;
          let currentVal = parseInt(currentStopPosition.value.replace('%', ''));
          if (isNaN(currentVal)) currentVal = stop.position;
          const step = e.shiftKey ? 10 : 1;
          currentVal += (e.key === 'ArrowUp' ? step : -step);
          currentVal = Math.max(0, Math.min(100, currentVal)); // Clamp
          currentStopPosition.value = currentVal + '%';
          if (stop.position !== currentVal) {
              stop.position = currentVal;
              updateGradient();
          }
      }
      function handleColorInput(e) {
          if (!selectedStopId) return;
          const stop = stops.find(s => s.id === selectedStopId);
          if (!stop) return;
          const parsed = parseHexWithOptionalAlpha(e.target.value); // Use improved parser
          if (parsed) {
              const newAlpha = parsed.alphaPercent / 100;
              if (stop.color !== parsed.color || stop.alpha !== newAlpha) {
                  stop.color = parsed.color;
                  stop.alpha = newAlpha;
                  currentStopColorPreview.style.backgroundColor = stop.color;
                  currentStopAlpha.value = parsed.alphaPercent; // Update alpha input
                  // Update hidden input in the actual stop element
                  const stopElement = document.getElementById(selectedStopId);
                  const hiddenInput = stopElement?.querySelector('input[type="color"]');
                  if (hiddenInput) hiddenInput.value = stop.color;
                  updateGradient();
              }
          }
      }
      function handleColorBlur(e) {
          if (!selectedStopId) return;
          const stop = stops.find(s => s.id === selectedStopId);
          if (!stop) return;
          const parsed = parseHexWithOptionalAlpha(e.target.value);
          // On blur, always display the canonical #rrggbb format, even if alpha was entered
          e.target.value = stop.color;
          // If input was invalid, the model wasn't updated, so reverting input to stop.color is correct.
          // If input *was* valid (e.g., #rrggbbaa), model was updated, and we still set input to stop.color (#rrggbb).
      }
      function handleAlphaInput(e) {
          if (!selectedStopId) return;
          const stop = stops.find(s => s.id === selectedStopId);
          if (!stop) return;
          let alphaPercent = parseInt(e.target.value);
          if (!isNaN(alphaPercent)) {
              alphaPercent = Math.max(0, Math.min(100, alphaPercent)); // Clamp 0-100
              const newAlpha = alphaPercent / 100;
              if (stop.alpha !== newAlpha) {
                  stop.alpha = newAlpha;
                  updateGradient();
              }
          }
      }
      function handleAlphaBlur(e) {
          if (!selectedStopId) return;
          const stop = stops.find(s => s.id === selectedStopId);
          if (!stop) return;
          let alphaPercent = parseInt(e.target.value);
          if (isNaN(alphaPercent)) {
              // Revert to current model value if input is invalid
              e.target.value = Math.round((stop.alpha !== undefined ? stop.alpha : 1) * 100);
          } else {
              // Ensure clamped value is displayed and update model if needed
              alphaPercent = Math.max(0, Math.min(100, alphaPercent));
              e.target.value = alphaPercent; // Display clamped value
              const newAlpha = alphaPercent / 100;
              if (stop.alpha !== newAlpha) {
                  stop.alpha = newAlpha;
                  updateGradient();
              }
          }
      }
      function handleAddStopClick() {
          const sortedStops = [...stops].sort((a, b) => a.position - b.position);
          let position = 50; // Default position
          let colorData = { color: "#808080", alpha: 1 }; // Default color/alpha

          if (sortedStops.length >= 2) {
              // Find the largest gap between existing stops
              let largestGap = 0;
              let insertPos = 50; // Default insert position
              for (let i = 0; i < sortedStops.length - 1; i++) {
                  let gap = sortedStops[i + 1].position - sortedStops[i].position;
                  if (gap > largestGap) {
                      largestGap = gap;
                      insertPos = Math.round(sortedStops[i].position + gap / 2);
                  }
              }
              position = insertPos;
              colorData = getColorAtPosition(position); // Get interpolated color/alpha
          }
          addNewStop(position, colorData);
      }
      function handleRemoveStopClick() {
          const stop = stops.find(s => s.id === selectedStopId);
          if (stop && !stop.isEndpoint) { // Ensure selected and not endpoint
              deleteStop(selectedStopId);
          }
      }

      // --- Stroke Weight Input Logic ---

      // Sets up listeners for the stroke weight input (drag and keyboard)
      function setupWeightDragListeners() {
          strokeWeightInput.addEventListener('keydown', handleWeightKeydown);
          strokeWeightInput.addEventListener('mousedown', handleWeightMouseDown);
          strokeWeightInput.addEventListener('focus', (e) => e.target.select()); // Select text on focus
      }

      // Handles Shift + Arrow Up/Down for stroke weight input
      function handleWeightKeydown(e) {
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
          e.preventDefault(); // Prevent default input stepping

          const step = e.shiftKey ? 10 : 1; // Larger step with Shift
          const minVal = parseFloat(strokeWeightInput.min) || 0;
          const maxVal = parseFloat(strokeWeightInput.max); // Check if max is defined
          let currentValue = parseFloat(strokeWeightInput.value) || 0;

          currentValue += (e.key === 'ArrowUp' ? step : -step);

          // Clamp value within min/max bounds
          currentValue = Math.max(minVal, currentValue);
          if (!isNaN(maxVal)) {
              currentValue = Math.min(maxVal, currentValue);
          }

          strokeWeightInput.value = Math.round(currentValue); // Use rounded value for weight
          // Optionally trigger input event:
          // strokeWeightInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Handles mousedown on the stroke weight input to initiate drag
      function handleWeightMouseDown(e) {
          if (e.button !== 0) return; // Only left click

          const isFocused = (document.activeElement === strokeWeightInput);

          // Prevent default ONLY if starting drag from an unfocused state
          if (!isFocused) {
              e.preventDefault();
              strokeWeightInput.focus(); // Manually focus
          }
          // If focused, allow default behavior (cursor placement)

          // Proceed with setting up drag state
          isDraggingWeight = true;
          weightDragStartX = e.clientX;
          weightDragLastX = e.clientX;
          weightDragCurrentValue = parseFloat(strokeWeightInput.value) || 0;
          weightDragEngaged = false;
          weightScalingActive = false;

          // Add listeners
          document.addEventListener('mousemove', handleWeightDragMove);
          document.addEventListener('mouseup', handleWeightDragEnd, { once: true });
      }


      // Handles mouse movement during stroke weight drag
      function handleWeightDragMove(e) {
          if (!isDraggingWeight) return;
          e.preventDefault(); // Prevent text selection during move

          const currentX = e.clientX;
          const deltaX = Math.abs(currentX - weightDragStartX);

          // Engage cursor change visual cue
          if (!weightDragEngaged && deltaX > 2) {
              weightDragEngaged = true;
              document.body.style.cursor = 'ew-resize';
              strokeWeightInput.style.cursor = 'ew-resize';
          }

          // Activate value scaling
          if (!weightScalingActive && deltaX > 4) {
              weightScalingActive = true;
              weightDragLastX = currentX;
          }

          // Perform scaling if active
          if (weightScalingActive) {
              const moveDeltaX = currentX - weightDragLastX;
              const scaleFactor = e.shiftKey ? 1.0 : 0.1;
              const valueChange = moveDeltaX * scaleFactor;

              weightDragCurrentValue += valueChange;

              // Clamp value
              const minVal = parseFloat(strokeWeightInput.min) || 0;
              const maxVal = parseFloat(strokeWeightInput.max);
              weightDragCurrentValue = Math.max(minVal, weightDragCurrentValue);
              if (!isNaN(maxVal)) {
                  weightDragCurrentValue = Math.min(maxVal, weightDragCurrentValue);
              }

              strokeWeightInput.value = Math.round(weightDragCurrentValue);
              weightDragLastX = currentX;
          }
      }

      // Handles mouseup after stroke weight drag
      function handleWeightDragEnd() {
          if (!isDraggingWeight) return;

          // Finalize value if scaling occurred
          if (weightScalingActive) {
              let finalValue = parseFloat(strokeWeightInput.value) || 0;
              const minVal = parseFloat(strokeWeightInput.min) || 0;
              const maxVal = parseFloat(strokeWeightInput.max);
              finalValue = Math.max(minVal, finalValue);
              if (!isNaN(maxVal)) {
                  finalValue = Math.min(maxVal, finalValue);
              }
              strokeWeightInput.value = Math.round(finalValue);
          }

          // Reset states and listeners
          isDraggingWeight = false;
          weightDragEngaged = false;
          weightScalingActive = false;
          document.removeEventListener('mousemove', handleWeightDragMove);
          document.body.style.cursor = '';
          strokeWeightInput.style.cursor = '';
      }


      // --- Keyboard Listeners ---

      // Sets up global keyboard listeners (e.g., for deleting stops)
      function setupKeyboardListeners() {
          document.addEventListener('keydown', (e) => {
              const activeElement = document.activeElement;
              // Check if focus is NOT inside an input/select/textarea or custom select
              const isInputFocused = activeElement.tagName === 'INPUT' ||
                                     activeElement.tagName === 'SELECT' ||
                                     activeElement.tagName === 'TEXTAREA' ||
                                     activeElement.classList.contains('select-selected');

              // Handle Delete/Backspace for selected color stop if focus is not in an input
              if (!isInputFocused && (e.key === 'Delete' || e.key === 'Backspace') && selectedStopId) {
                  e.preventDefault(); // Prevent browser back navigation on Backspace
                  const stop = stops.find(s => s.id === selectedStopId);
                  if (stop && !stop.isEndpoint) { // Can only delete non-endpoint stops
                      deleteStop(selectedStopId);
                      // Optional: Notify plugin about key press
                      // parent.postMessage({ pluginMessage: { type: 'handle-key-press', key: e.key, selectedStopId: selectedStopId } }, '*');
                  }
              }
          });
      }

      // --- Utility Functions ---

      // Converts a hex color and alpha (0-1) to an rgba string
      function hexToRgba(hex, alpha) {
          hex = hex.replace('#', '');
          let r, g, b;
          if (hex.length === 3) { // Expand shorthand hex
              r = parseInt(hex[0] + hex[0], 16);
              g = parseInt(hex[1] + hex[1], 16);
              b = parseInt(hex[2] + hex[2], 16);
          } else if (hex.length === 6) { // Standard hex
              r = parseInt(hex.substring(0, 2), 16);
              g = parseInt(hex.substring(2, 4), 16);
              b = parseInt(hex.substring(4, 6), 16);
          } else { // Invalid hex
              r = g = b = 128; // Default to gray
          }
          alpha = Math.max(0, Math.min(1, alpha)); // Clamp alpha 0-1
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      // Interpolates color and alpha between two stops at a given ratio (0-1)
      function getColorAtPosition(positionPercent) {
          const sortedStops = [...stops].sort((a, b) => a.position - b.position);
          if (sortedStops.length === 0) return { color: '#808080', alpha: 1 }; // Default if no stops
          if (sortedStops.length === 1) return { color: sortedStops[0].color, alpha: sortedStops[0].alpha ?? 1 };

          // Find the two stops the position falls between
          let prevStop = sortedStops[0];
          let nextStop = sortedStops[sortedStops.length - 1];
          if (positionPercent <= prevStop.position) return { color: prevStop.color, alpha: prevStop.alpha ?? 1 };
          if (positionPercent >= nextStop.position) return { color: nextStop.color, alpha: nextStop.alpha ?? 1 };

          for (let i = 0; i < sortedStops.length - 1; i++) {
              if (sortedStops[i].position <= positionPercent && sortedStops[i + 1].position >= positionPercent) {
                  prevStop = sortedStops[i];
                  nextStop = sortedStops[i + 1];
                  break;
              }
          }

          // Calculate interpolation ratio
          const range = nextStop.position - prevStop.position;
          const ratio = (range === 0) ? 1 : (positionPercent - prevStop.position) / range; // Avoid division by zero

          // Interpolate color and alpha
          const interpolatedColor = interpolateColor(prevStop.color, nextStop.color, ratio);
          const prevAlpha = prevStop.alpha ?? 1;
          const nextAlpha = nextStop.alpha ?? 1;
          const interpolatedAlpha = prevAlpha + (nextAlpha - prevAlpha) * ratio;

          return { color: interpolatedColor, alpha: interpolatedAlpha };
      }

      // Linearly interpolates between two hex colors based on a ratio (0-1)
      function interpolateColor(color1, color2, ratio) {
          const parseHex = (hex) => { // Helper to parse hex to RGB object
              hex = (hex || '#000000').replace('#', '');
              let r, g, b;
              if (hex.length === 3) {
                  r = parseInt(hex[0] + hex[0], 16); g = parseInt(hex[1] + hex[1], 16); b = parseInt(hex[2] + hex[2], 16);
              } else if (hex.length === 6) {
                  r = parseInt(hex.substring(0, 2), 16); g = parseInt(hex.substring(2, 4), 16); b = parseInt(hex.substring(4, 6), 16);
              } else { return { r: 0, g: 0, b: 0 }; } // Invalid format
              return { r, g, b };
          };
          const rgb1 = parseHex(color1);
          const rgb2 = parseHex(color2);
          const clamp = (val) => Math.max(0, Math.min(255, Math.round(val))); // Clamp 0-255 and round
          const r = clamp(rgb1.r + (rgb2.r - rgb1.r) * ratio);
          const g = clamp(rgb1.g + (rgb2.g - rgb1.g) * ratio);
          const b = clamp(rgb1.b + (rgb2.b - rgb1.b) * ratio);
          const componentToHex = (c) => c.toString(16).padStart(2, '0'); // Convert number to 2-digit hex
          return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
      }

      // Parses hex color string (#rgb, #rrggbb, #rrggbbaa, or without #)
      // Returns { color: '#rrggbb', alphaPercent: 0-100 } or null if invalid
      function parseHexWithOptionalAlpha(hexColor) {
          hexColor = hexColor.trim().replace('#', ''); // Clean input
          let r, g, b, a = 255; // Default alpha is 100% (FF)

          if (/^[0-9A-Fa-f]{3}$/.test(hexColor)) { // #rgb
              r = parseInt(hexColor[0] + hexColor[0], 16);
              g = parseInt(hexColor[1] + hexColor[1], 16);
              b = parseInt(hexColor[2] + hexColor[2], 16);
          } else if (/^[0-9A-Fa-f]{6}$/.test(hexColor)) { // #rrggbb
              r = parseInt(hexColor.substring(0, 2), 16);
              g = parseInt(hexColor.substring(2, 4), 16);
              b = parseInt(hexColor.substring(4, 6), 16);
          } else if (/^[0-9A-Fa-f]{8}$/.test(hexColor)) { // #rrggbbaa
              r = parseInt(hexColor.substring(0, 2), 16);
              g = parseInt(hexColor.substring(2, 4), 16);
              b = parseInt(hexColor.substring(4, 6), 16);
              a = parseInt(hexColor.substring(6, 8), 16); // Get alpha value
          } else {
              return null; // Invalid format
          }

          const componentToHex = (c) => c.toString(16).padStart(2, '0');
          const finalColor = `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
          const finalAlphaPercent = Math.round((a / 255) * 100);

          return { color: finalColor, alphaPercent: finalAlphaPercent };
      }


      // --- Communication with Plugin (Example Functions) ---

      // Sends the final gradient data to the plugin
      function applyGradient() {
          try {
              const strokeWeight = strokeWeightInput.value;
              const startCap = document.getElementById('start-cap-value').value;
              const endCap = document.getElementById('end-cap-value').value;
              const strokeJoin = document.getElementById('stroke-join-value').value;

              if (!Array.isArray(stops) || stops.length < 2) {
                  console.error("Stops array invalid for apply:", stops);
                  alert("Error: Minimum 2 gradient stops required.");
                  return;
              }

              // Prepare stops data for the plugin (ensure position 0-100, alpha 0-1)
              const processedStops = stops.map(stop => {
                  return {
                      position: Math.max(0, Math.min(100, Number(stop.position) || 0)),
                      color: stop.color || '#000000',
                      alpha: stop.alpha !== undefined ? Math.max(0, Math.min(1, stop.alpha)) : 1
                  };
              }).sort((a, b) => a.position - b.position); // Ensure sorted by position

              // Send message to the plugin environment
              parent.postMessage({
                  pluginMessage: {
                      type: 'apply-gradient',
                      strokeWeight: parseFloat(strokeWeight) || 0,
                      startCap: startCap,
                      endCap: endCap,
                      strokeJoin: strokeJoin,
                      stops: processedStops
                  }
              }, '*'); // Use specific origin in production if possible
          } catch (error) {
              console.error("Error in applyGradient:", error);
              alert("Error applying gradient: " + error.message);
          }
      }

      // Handles messages received from the plugin
      window.onmessage = (event) => {
          // Basic security check (optional but recommended)
          // if (event.origin !== 'expected_plugin_origin') return;

          const msg = event.data.pluginMessage;
          if (!msg) return; // Ignore messages not conforming to expected structure

          console.log("Message from plugin:", msg); // For debugging

          switch (msg.type) {
              case 'selection-error':
                  alert('Plugin Error: ' + (msg.message || 'Please select a single vector path.'));
                  break;

              case 'init-data': // Plugin sends initial state
                  handleInitData(msg);
                  break;

              case 'stop-selected': // Plugin requests UI to select a stop
                  if (msg.stopId && document.getElementById(msg.stopId)) {
                      selectStop(msg.stopId);
                  }
                  break;

              case 'show-color-picker-for-stop': // Plugin requests color picker for a stop
                  if (msg.stopId) {
                      const stopElement = document.getElementById(msg.stopId);
                      const colorInput = stopElement?.querySelector('input[type="color"]');
                      colorInput?.click();
                  }
                  break;

              // Add other message types as needed
          }
      };

      // Processes initial data received from the plugin
      function handleInitData(msg) {
          // Update Stroke Properties
          if (msg.strokeWeight !== undefined) strokeWeightInput.value = msg.strokeWeight;

          // Update Custom Selects (Start/End Caps AND Join)
          updateCustomSelectFromData('start-cap', msg.startCap);
          updateCustomSelectFromData('end-cap', msg.endCap);
          updateCustomSelectFromData('stroke-join', msg.strokeJoin);

          // Update Gradient Stops
          if (Array.isArray(msg.stops)) {
              // Clear existing non-endpoint DOM elements
              colorStops.querySelectorAll('.color-stop:not(#start-stop):not(#end-stop)')
                  .forEach(el => el.remove());

              // Rebuild stops array from message (expecting position 0-100, alpha 0-1)
              stops = msg.stops.map((pluginStop, index) => {
                  let id = pluginStop.id; // Use ID from plugin if provided
                  const position = Math.max(0, Math.min(100, pluginStop.position || 0));
                  const isEndpoint = (position === 0 || position === 100);

                  // Ensure start/end stops use fixed IDs, generate for others if needed
                  if (position === 0 && !id) id = 'start-stop';
                  else if (position === 100 && !id) id = 'end-stop';
                  else if (!id && !isEndpoint) id = `stop-${Date.now()}-${index}`; // Generate ID

                  return {
                      id: id,
                      position: position,
                      color: pluginStop.color || '#000000',
                      alpha: pluginStop.alpha !== undefined ? Math.max(0, Math.min(1, pluginStop.alpha)) : 1,
                      isEndpoint: id === 'start-stop' || id === 'end-stop'
                  };
              }).sort((a, b) => a.position - b.position); // Sort by position

              // Ensure start/end stops exist structurally (add defaults if missing)
              if (!stops.some(s => s.id === 'start-stop')) {
                  console.warn("Start stop missing from plugin data, adding default.");
                  stops.unshift({ id: 'start-stop', position: 0, color: '#ff0000', alpha: 1, isEndpoint: true });
              }
              if (!stops.some(s => s.id === 'end-stop')) {
                  console.warn("End stop missing from plugin data, adding default.");
                  stops.push({ id: 'end-stop', position: 100, color: '#0000ff', alpha: 1, isEndpoint: true });
              }
              stops.sort((a, b) => a.position - b.position); // Re-sort after potential additions

              // Re-render all stops from the new array
              stops.forEach(stop => renderOrUpdateStopElement(stop));

              // Select the first stop after update
              selectStop(stops[0]?.id || null);
              updateGradient(); // Update the gradient display
          }
      }

      // Helper to update a custom select based on received data
      function updateCustomSelectFromData(baseId, value) {
          if (value === undefined || value === null) return; // No value provided
          const hiddenInput = document.getElementById(`${baseId}-value`);
          const wrapper = hiddenInput?.closest('.custom-select-wrapper');
          const selectDiv = wrapper?.querySelector('.custom-select');
          const selectedDisplay = selectDiv?.querySelector('.select-selected'); // Only relevant for dropdowns
          const options = selectDiv?.querySelectorAll('.select-option');

          if (!hiddenInput || !selectDiv || !options) {
               console.warn(`Custom select elements not found for baseId: ${baseId}`);
               return; // Elements not found
          }

          hiddenInput.value = value; // Update hidden input
          let found = false;
          for (let opt of options) {
              opt.classList.remove('same-as-selected'); // Clear previous selection style
              if (opt.getAttribute('data-value') === value) {
                  if (selectedDisplay) { // Update display only if it exists (not for join)
                    selectedDisplay.innerHTML = opt.innerHTML; // Update display HTML (with icon)
                  }
                  opt.classList.add('same-as-selected');
                  // Only move to top for dropdowns (not join)
                  if (selectedDisplay) {
                    opt.parentNode.prepend(opt);
                  }
                  found = true;
                  // Don't break for join, as we need to remove class from all others
                  if (selectedDisplay) break;
              }
          }
          if (!found) { // Handle case where value doesn't match any option
              if (selectedDisplay) selectedDisplay.innerHTML = 'Select...'; // Or display the value itself?
              console.warn(`Value "${value}" not found in options for ${baseId}`);
          }
      }


      // Creates or updates a single stop DOM element based on stop data
      function renderOrUpdateStopElement(stopData) {
          let stopElement = document.getElementById(stopData.id);

          // Create if doesn't exist (and is not an endpoint - endpoints are fixed in HTML)
          if (!stopElement && !stopData.isEndpoint) {
              stopElement = document.createElement('div');
              stopElement.classList.add('color-stop');
              stopElement.id = stopData.id;
              stopElement.innerHTML = `
                  <div class="color-preview"></div>
                  <input type="color">`;
              colorStops.appendChild(stopElement);
              // Add handlers for the newly created element
              setupColorInputHandler(stopData.id);
              const preview = stopElement.querySelector('.color-preview');
              if (preview) {
                  preview.addEventListener('mousedown', (e) => handleStopDragStart(e, stopElement));
              }
          } else if (!stopElement && stopData.isEndpoint) {
              // This case should ideally not happen if HTML is correct
              console.error(`Endpoint stop element missing in DOM: ${stopData.id}`);
              return;
          }

          // Update existing element (color preview and hidden input value)
          if (stopElement) {
              const preview = stopElement.querySelector('.color-preview');
              const input = stopElement.querySelector('input[type="color"]');
              if (preview) preview.style.backgroundColor = stopData.color;
              if (input) input.value = stopData.color;
              // Position is handled separately by positionStops/updateGradient
          }
      }


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!*******************!*\
  !*** ./src/ui.ts ***!
  \*******************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _styles_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./styles.css */ "./src/styles.css");
/* harmony import */ var _ui_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ui.js */ "./src/ui.js");
/* harmony import */ var _ui_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_ui_js__WEBPACK_IMPORTED_MODULE_1__);



})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7Ozs7QUNOc0I7QUFDTCIsInNvdXJjZXMiOlsid2VicGFjazovL0dyYWRpZW50IEFsb25nIFBhdGgvLi9zcmMvc3R5bGVzLmNzcz8xNTUzIiwid2VicGFjazovL0dyYWRpZW50IEFsb25nIFBhdGgvLi9zcmMvdWkuanMiLCJ3ZWJwYWNrOi8vR3JhZGllbnQgQWxvbmcgUGF0aC93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9HcmFkaWVudCBBbG9uZyBQYXRoL3dlYnBhY2svcnVudGltZS9jb21wYXQgZ2V0IGRlZmF1bHQgZXhwb3J0Iiwid2VicGFjazovL0dyYWRpZW50IEFsb25nIFBhdGgvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL0dyYWRpZW50IEFsb25nIFBhdGgvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9HcmFkaWVudCBBbG9uZyBQYXRoL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vR3JhZGllbnQgQWxvbmcgUGF0aC8uL3NyYy91aS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBleHRyYWN0ZWQgYnkgbWluaS1jc3MtZXh0cmFjdC1wbHVnaW5cbmV4cG9ydCB7fTsiLCIgICAgICAvLyAtLS0gRE9NIEVsZW1lbnQgUmVmZXJlbmNlcyAtLS1cclxuICAgICAgY29uc3Qgc3RhcnRDb2xvcklucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0LWNvbG9yJyk7XHJcbiAgICAgIGNvbnN0IGVuZENvbG9ySW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZW5kLWNvbG9yJyk7XHJcbiAgICAgIGNvbnN0IHN0YXJ0UHJldmlldyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGFydC1wcmV2aWV3Jyk7XHJcbiAgICAgIGNvbnN0IGVuZFByZXZpZXcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZW5kLXByZXZpZXcnKTtcclxuICAgICAgY29uc3QgZ3JhZGllbnRCYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZ3JhZGllbnQtYmFyJyk7XHJcbiAgICAgIGNvbnN0IGNvbG9yU3RvcHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29sb3Itc3RvcHMnKTsgLy8gQ29udGFpbmVyIGZvciBhbGwgc3RvcCBlbGVtZW50c1xyXG4gICAgICBjb25zdCBzdGFydFN0b3AgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhcnQtc3RvcCcpOyAgIC8vIFN0YXJ0IHN0b3AgZWxlbWVudFxyXG4gICAgICBjb25zdCBlbmRTdG9wID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VuZC1zdG9wJyk7ICAgICAgIC8vIEVuZCBzdG9wIGVsZW1lbnRcclxuXHJcbiAgICAgIC8vIFBhbmVsIGVsZW1lbnRzXHJcbiAgICAgIGNvbnN0IGN1cnJlbnRTdG9wUG9zaXRpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VycmVudC1zdG9wLXBvc2l0aW9uJyk7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRTdG9wQ29sb3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VycmVudC1zdG9wLWNvbG9yJyk7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRTdG9wQWxwaGEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VycmVudC1zdG9wLWFscGhhJyk7XHJcbiAgICAgIGNvbnN0IGN1cnJlbnRTdG9wQ29sb3JQcmV2aWV3ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2N1cnJlbnQtc3RvcC1jb2xvci1wcmV2aWV3Jyk7XHJcbiAgICAgIGNvbnN0IGFkZFN0b3BCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYWRkLXN0b3AtYnRuJyk7XHJcbiAgICAgIGNvbnN0IHJlbW92ZVN0b3BCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVtb3ZlLXN0b3AtYnRuJyk7XHJcblxyXG4gICAgICAvLyBTdHJva2UgV2VpZ2h0IEVsZW1lbnRzXHJcbiAgICAgIGNvbnN0IHN0cm9rZVdlaWdodElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0cm9rZS13ZWlnaHQnKTtcclxuICAgICAgY29uc3Qgc3Ryb2tlV2VpZ2h0TGFiZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3Ryb2tlLXdlaWdodC1sYWJlbCcpOyAvLyBSZWZlcmVuY2UgZm9yIHBvdGVudGlhbCBmdXR1cmUgdXNlXHJcblxyXG4gICAgICAvLyAtLS0gU3RhdGUgVmFyaWFibGVzIC0tLVxyXG4gICAgICAvLyBHcmFkaWVudCBzdG9wcyBkYXRhIG1vZGVsXHJcbiAgICAgIGxldCBzdG9wcyA9IFtcclxuICAgICAgICB7IGlkOiAnc3RhcnQtc3RvcCcsIHBvc2l0aW9uOiAwLCBjb2xvcjogJyNmZjAwMDAnLCBhbHBoYTogMSwgaXNFbmRwb2ludDogdHJ1ZSB9LFxyXG4gICAgICAgIHsgaWQ6ICdlbmQtc3RvcCcsIHBvc2l0aW9uOiAxMDAsIGNvbG9yOiAnIzAwMDBmZicsIGFscGhhOiAxLCBpc0VuZHBvaW50OiB0cnVlIH1cclxuICAgICAgXTtcclxuICAgICAgbGV0IHNlbGVjdGVkU3RvcElkID0gbnVsbDsgLy8gSUQgb2YgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBzdG9wXHJcblxyXG4gICAgICAvLyBDb2xvciBzdG9wIGRyYWdnaW5nIHN0YXRlXHJcbiAgICAgIGxldCBpc0RyYWdnaW5nID0gZmFsc2U7ICAgICAgICAvLyBJcyBhIGNvbG9yIHN0b3AgYmVpbmcgZHJhZ2dlZD9cclxuICAgICAgbGV0IGFjdGl2ZURyYWdFbGVtZW50ID0gbnVsbDsgLy8gVGhlIERPTSBlbGVtZW50IGJlaW5nIGRyYWdnZWRcclxuICAgICAgbGV0IGRyYWdTdGFydFgsIGRyYWdTdGFydExlZnQ7IC8vIEluaXRpYWwgcG9zaXRpb24gZHVyaW5nIGRyYWcgc3RhcnRcclxuXHJcbiAgICAgIC8vIFN0cm9rZSB3ZWlnaHQgZHJhZ2dpbmcgc3RhdGVcclxuICAgICAgbGV0IGlzRHJhZ2dpbmdXZWlnaHQgPSBmYWxzZTsgICAgICAgLy8gSXMgdGhlIHN0cm9rZSB3ZWlnaHQgYmVpbmcgZHJhZ2dlZD9cclxuICAgICAgbGV0IHdlaWdodERyYWdTdGFydFggPSAwOyAgICAgICAgIC8vIEluaXRpYWwgbW91c2UgWCBwb3NpdGlvbiBmb3Igd2VpZ2h0IGRyYWdcclxuICAgICAgbGV0IHdlaWdodERyYWdMYXN0WCA9IDA7ICAgICAgICAgIC8vIExhc3QgbW91c2UgWCBwb3NpdGlvbiBkdXJpbmcgd2VpZ2h0IGRyYWdcclxuICAgICAgbGV0IHdlaWdodERyYWdDdXJyZW50VmFsdWUgPSAwOyAgIC8vIEN1cnJlbnQgd2VpZ2h0IHZhbHVlIGR1cmluZyBkcmFnXHJcbiAgICAgIGxldCB3ZWlnaHREcmFnRW5nYWdlZCA9IGZhbHNlOyAgICAvLyBIYXMgdGhlIGN1cnNvciBjaGFuZ2VkIHRvIGluZGljYXRlIGRyYWdnaW5nP1xyXG4gICAgICBsZXQgd2VpZ2h0U2NhbGluZ0FjdGl2ZSA9IGZhbHNlOyAgLy8gSGFzIHRoZSB2YWx1ZSBzY2FsaW5nIHN0YXJ0ZWQgKG1vdmVkIGVub3VnaCk/XHJcblxyXG5cclxuICAgICAgLy8gLS0tIEluaXRpYWxpemF0aW9uIC0tLVxyXG5cclxuICAgICAgLy8gSW5pdGlhbCBzZXR1cCBvbiBwYWdlIGxvYWRcclxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgICAgICAgIGluaXRpYWxpemVDdXN0b21TZWxlY3RzKCk7IC8vIFNldCB1cCBjdXN0b20gZHJvcGRvd25zXHJcbiAgICAgICAgICBzZXR1cEluaXRpYWxTdG9wSGFuZGxlcnMoKTsgLy8gQXR0YWNoIGhhbmRsZXJzIHRvIHN0YXJ0L2VuZCBzdG9wc1xyXG4gICAgICAgICAgcG9zaXRpb25TdG9wcygpOyAgICAgICAgICAgLy8gUG9zaXRpb24gaW5pdGlhbCBzdG9wcyBjb3JyZWN0bHlcclxuICAgICAgICAgIHVwZGF0ZUdyYWRpZW50KCk7ICAgICAgICAgIC8vIFJlbmRlciB0aGUgaW5pdGlhbCBncmFkaWVudCBiYXJcclxuICAgICAgICAgIHNlbGVjdFN0b3AoJ3N0YXJ0LXN0b3AnKTsgICAgLy8gU2VsZWN0IHRoZSBzdGFydCBzdG9wIGJ5IGRlZmF1bHRcclxuICAgICAgICAgIHNldHVwUGFuZWxJbnB1dExpc3RlbmVycygpOyAvLyBBZGQgbGlzdGVuZXJzIGZvciBwYW5lbCBpbnB1dHNcclxuICAgICAgICAgIHNldHVwV2VpZ2h0RHJhZ0xpc3RlbmVycygpOyAvLyBBZGQgbGlzdGVuZXJzIGZvciB3ZWlnaHQgaW5wdXQgZHJhZ2dpbmdcclxuICAgICAgICAgIHNldHVwS2V5Ym9hcmRMaXN0ZW5lcnMoKTsgICAvLyBBZGQgZ2xvYmFsIGtleWJvYXJkIGxpc3RlbmVycyAoZGVsZXRlKVxyXG4gICAgICAgICAgc2V0dXBHcmFkaWVudEJhckNsaWNrTGlzdGVuZXIoKTsgLy8gKioqIEFEREVEOiBMaXN0ZW5lciBmb3IgZ3JhZGllbnQgYmFyIGNsaWNrcyAqKipcclxuXHJcbiAgICAgICAgICAvLyBSZXF1ZXN0IGluaXRpYWwgZGF0YSBmcm9tIHRoZSBwbHVnaW4gKGlmIGFwcGxpY2FibGUpXHJcbiAgICAgICAgICAvLyBwYXJlbnQucG9zdE1lc3NhZ2UoeyBwbHVnaW5NZXNzYWdlOiB7IHR5cGU6ICdnZXQtaW5pdGlhbC1kYXRhJyB9IH0sICcqJyk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgLy8gQ2xvc2UgY3VzdG9tIHNlbGVjdHMgd2hlbiBjbGlja2luZyBvdXRzaWRlXHJcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbG9zZUFsbFNlbGVjdCk7XHJcblxyXG4gICAgICAvLyBIYW5kbGUgd2luZG93IHJlc2l6ZVxyXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgKCkgPT4ge1xyXG4gICAgICAgICBwb3NpdGlvblN0b3BzKCk7XHJcbiAgICAgICAgIHVwZGF0ZUdyYWRpZW50KCk7IC8vIFJlZHJhdyBncmFkaWVudCBhcyBiYXIgd2lkdGggY2hhbmdlc1xyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIC8vIC0tLSBDdXN0b20gU2VsZWN0IERyb3Bkb3duIExvZ2ljIC0tLVxyXG5cclxuICAgICAgLy8gQ2xvc2VzIGFsbCBjdXN0b20gc2VsZWN0IGRyb3Bkb3ducyBleGNlcHQgdGhlIG9uZSBwYXNzZWQgYXMgZWxtbnRcclxuICAgICAgZnVuY3Rpb24gY2xvc2VBbGxTZWxlY3QoZWxtbnQpIHtcclxuICAgICAgICBjb25zdCBzZWxlY3RJdGVtcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJzZWxlY3QtaXRlbXNcIik7XHJcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWRCb3hlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJzZWxlY3Qtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgY29uc3QgYWN0aXZlSW5kaWNlcyA9IFtdO1xyXG5cclxuICAgICAgICAvLyBGaW5kIHRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBiZWluZyBpbnRlcmFjdGVkIHdpdGhcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdGVkQm94ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIGlmIChlbG1udCA9PT0gc2VsZWN0ZWRCb3hlc1tpXSkge1xyXG4gICAgICAgICAgICBhY3RpdmVJbmRpY2VzLnB1c2goaSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzZWxlY3RlZEJveGVzW2ldLmNsYXNzTGlzdC5yZW1vdmUoXCJzZWxlY3QtYXJyb3ctYWN0aXZlXCIpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBIaWRlIGFsbCBkcm9wZG93bnMgdGhhdCBhcmUgbm90IHRoZSBhY3RpdmUgb25lXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxlY3RJdGVtcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHBhcmVudCB3cmFwcGVyIGRvZXMgTk9UIGhhdmUgdGhlICdqb2luLW9wdGlvbnMtdmlzaWJsZScgY2xhc3NcclxuICAgICAgICAgIGNvbnN0IHdyYXBwZXIgPSBzZWxlY3RJdGVtc1tpXS5jbG9zZXN0KCcuY3VzdG9tLXNlbGVjdC13cmFwcGVyJyk7XHJcbiAgICAgICAgICBpZiAoIXdyYXBwZXIgfHwgIXdyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCdqb2luLW9wdGlvbnMtdmlzaWJsZScpKSB7XHJcbiAgICAgICAgICAgIGlmIChhY3RpdmVJbmRpY2VzLmluZGV4T2YoaSkgPT09IC0xKSB7IC8vIElmIGluZGV4IGlzIG5vdCBpbiBhY3RpdmUgbGlzdFxyXG4gICAgICAgICAgICAgIHNlbGVjdEl0ZW1zW2ldLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3QtaGlkZVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gSW5pdGlhbGl6ZXMgYWxsIGVsZW1lbnRzIHdpdGggdGhlIGNsYXNzIFwiY3VzdG9tLXNlbGVjdFwiXHJcbiAgICAgIGZ1bmN0aW9uIGluaXRpYWxpemVDdXN0b21TZWxlY3RzKCkge1xyXG4gICAgICAgICAgY29uc3QgY3VzdG9tU2VsZWN0cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJjdXN0b20tc2VsZWN0XCIpO1xyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjdXN0b21TZWxlY3RzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgY3VzdG9tU2VsZWN0RGl2ID0gY3VzdG9tU2VsZWN0c1tpXTtcclxuICAgICAgICAgICAgICBjb25zdCB3cmFwcGVyID0gY3VzdG9tU2VsZWN0RGl2LmNsb3Nlc3QoJy5jdXN0b20tc2VsZWN0LXdyYXBwZXInKTtcclxuICAgICAgICAgICAgICBjb25zdCBoaWRkZW5JbnB1dCA9IHdyYXBwZXI/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJoaWRkZW5cIl0nKTtcclxuICAgICAgICAgICAgICBjb25zdCBzZWxlY3RlZERpc3BsYXkgPSBjdXN0b21TZWxlY3REaXYucXVlcnlTZWxlY3RvcihcIi5zZWxlY3Qtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgY29uc3QgaXRlbXNDb250YWluZXIgPSBjdXN0b21TZWxlY3REaXYucXVlcnlTZWxlY3RvcihcIi5zZWxlY3QtaXRlbXNcIik7XHJcblxyXG4gICAgICAgICAgICAgIGlmICghaGlkZGVuSW5wdXQgfHwgIXNlbGVjdGVkRGlzcGxheSB8fCAhaXRlbXNDb250YWluZXIpIHtcclxuICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiU2tpcHBpbmcgbWFsZm9ybWVkIGN1c3RvbSBzZWxlY3Q6XCIsIGN1c3RvbVNlbGVjdERpdik7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgaXNKb2luU2VsZWN0b3IgPSB3cmFwcGVyLmNsYXNzTGlzdC5jb250YWlucygnam9pbi1vcHRpb25zLXZpc2libGUnKTsgLy8gQ2hlY2sgZm9yIHRoZSBjbGFzc1xyXG5cclxuICAgICAgICAgICAgICBjb25zdCBvcHRpb25zID0gaXRlbXNDb250YWluZXIuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInNlbGVjdC1vcHRpb25cIik7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFNldCBpbml0aWFsIGRpc3BsYXkgLyBzZWxlY3RlZCBzdGF0ZVxyXG4gICAgICAgICAgICAgIGNvbnN0IGluaXRpYWxWYWx1ZSA9IGhpZGRlbklucHV0LnZhbHVlO1xyXG4gICAgICAgICAgICAgIGxldCBpbml0aWFsSFRNTCA9ICdTZWxlY3QuLi4nOyAvLyBGYWxsYmFjayBmb3IgZHJvcGRvd25zXHJcbiAgICAgICAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBvcHRpb25zLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zW2tdLmdldEF0dHJpYnV0ZSgnZGF0YS12YWx1ZScpID09PSBpbml0aWFsVmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxIVE1MID0gb3B0aW9uc1trXS5pbm5lckhUTUw7IC8vIEdldCBIVE1MIGZvciBkcm9wZG93bnNcclxuICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnNba10uY2xhc3NMaXN0LmFkZChcInNhbWUtYXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWlzSm9pblNlbGVjdG9yKSB7IC8vIE9ubHkgbW92ZSB0byB0b3AgZm9yIGRyb3Bkb3duc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXNDb250YWluZXIucHJlcGVuZChvcHRpb25zW2tdKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmICghaXNKb2luU2VsZWN0b3IpIHsgLy8gT25seSBzZXQgZGlzcGxheSBIVE1MIGZvciBkcm9wZG93bnNcclxuICAgICAgICAgICAgICAgICAgc2VsZWN0ZWREaXNwbGF5LmlubmVySFRNTCA9IGluaXRpYWxIVE1MO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAgIC8vIC0tLSBDb25kaXRpb25hbCBMaXN0ZW5lcnMgLS0tXHJcblxyXG4gICAgICAgICAgICAgIGlmICghaXNKb2luU2VsZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgICAgLy8gPT0gU1RBTkRBUkQgRFJPUERPV04gTE9HSUMgKGZvciBTdGFydC9FbmQgY2FwcykgPT1cclxuICAgICAgICAgICAgICAgICAgc2VsZWN0ZWREaXNwbGF5LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY2xvc2VBbGxTZWxlY3QodGhpcyk7IC8vIENsb3NlIG90aGVyc1xyXG4gICAgICAgICAgICAgICAgICAgICAgaXRlbXNDb250YWluZXIuY2xhc3NMaXN0LnRvZ2dsZShcInNlbGVjdC1oaWRlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGFzc0xpc3QudG9nZ2xlKFwic2VsZWN0LWFycm93LWFjdGl2ZVwiKTtcclxuICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBCYXNpYyBrZXlib2FyZCBuYXYgZm9yIGRyb3Bkb3ducyAob3B0aW9uYWwpXHJcbiAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRGlzcGxheS5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgfHwgZS5rZXkgPT09ICcgJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaWNrKCk7IC8vIE9wZW4vY2xvc2UgZHJvcGRvd25cclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG9wdGlvbnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnNbal0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkRGlzcGxheS5pbm5lckhUTUwgPSB0aGlzLmlubmVySFRNTDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBoaWRkZW5JbnB1dC52YWx1ZSA9IG5ld1ZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzaWJsaW5ncyA9IHRoaXMucGFyZW50Tm9kZS5jaGlsZHJlbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IHNpYmxpbmdzLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzW2tdLmNsYXNzTGlzdC5yZW1vdmUoXCJzYW1lLWFzLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJzYW1lLWFzLXNlbGVjdGVkXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5wcmVwZW5kKHRoaXMpOyAvLyBNb3ZlIHNlbGVjdGVkIG9wdGlvbiB0byB0aGUgdG9wXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWREaXNwbGF5LmNsaWNrKCk7IC8vIENsb3NlIGRyb3Bkb3duXHJcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vID09IEFMV0FZUyBWSVNJQkxFIExPR0lDIChmb3IgSm9pbikgPT1cclxuICAgICAgICAgICAgICAgICAgLy8gTm8gY2xpY2sgbGlzdGVuZXIgbmVlZGVkIGZvciBzZWxlY3RlZERpc3BsYXkgKGl0J3MgaGlkZGVuKVxyXG4gICAgICAgICAgICAgICAgICAvLyBObyBrZXlkb3duIGxpc3RlbmVyIG5lZWRlZCBmb3Igc2VsZWN0ZWREaXNwbGF5XHJcblxyXG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG9wdGlvbnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnNbal0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLXZhbHVlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGhpZGRlbklucHV0LnZhbHVlID0gbmV3VmFsdWU7IC8vIFVwZGF0ZSBoaWRkZW4gaW5wdXRcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHN0eWxpbmcgZm9yIHNlbGVjdGVkIG9wdGlvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNpYmxpbmdzID0gdGhpcy5wYXJlbnROb2RlLmNoaWxkcmVuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgc2libGluZ3MubGVuZ3RoOyBrKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2libGluZ3Nba10uY2xhc3NMaXN0LnJlbW92ZShcInNhbWUtYXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcInNhbWUtYXMtc2VsZWN0ZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm8gbmVlZCB0byBjbG9zZSBhbnl0aGluZ1xyXG4gICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcblxyXG4gICAgICAvLyAtLS0gR3JhZGllbnQgU3RvcCBNYW5hZ2VtZW50IC0tLVxyXG5cclxuICAgICAgLy8gU2VsZWN0cyBhIGNvbG9yIHN0b3AgdmlzdWFsbHkgYW5kIHVwZGF0ZXMgdGhlIHBhbmVsXHJcbiAgICAgIGZ1bmN0aW9uIHNlbGVjdFN0b3Aoc3RvcElkKSB7XHJcbiAgICAgICAgICAvLyBJZiBhbHJlYWR5IHNlbGVjdGVkLCBlbnN1cmUgY2xhc3MgaXMgcHJlc2VudCAoaGFuZGxlcyBlZGdlIGNhc2VzKVxyXG4gICAgICAgICAgaWYgKHNlbGVjdGVkU3RvcElkID09PSBzdG9wSWQpIHtcclxuICAgICAgICAgICAgICBjb25zdCBjdXJyZW50RWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdG9wSWQpO1xyXG4gICAgICAgICAgICAgIGlmIChjdXJyZW50RWwgJiYgIWN1cnJlbnRFbC5jbGFzc0xpc3QuY29udGFpbnMoJ3NlbGVjdGVkJykpIHtcclxuICAgICAgICAgICAgICAgICAgY3VycmVudEVsLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybjsgLy8gTm8gY2hhbmdlIG5lZWRlZFxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIERlc2VsZWN0IHByZXZpb3VzIHN0b3BcclxuICAgICAgICAgIGlmIChzZWxlY3RlZFN0b3BJZCkge1xyXG4gICAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzZWxlY3RlZFN0b3BJZCk7XHJcbiAgICAgICAgICAgICAgcHJldmlvdXNFbD8uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBTZWxlY3QgdGhlIG5ldyBzdG9wXHJcbiAgICAgICAgICBjb25zdCBzdG9wRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHN0b3BJZCk7XHJcbiAgICAgICAgICBpZiAoc3RvcEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICBzdG9wRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdzZWxlY3RlZCcpO1xyXG4gICAgICAgICAgICAgIHNlbGVjdGVkU3RvcElkID0gc3RvcElkO1xyXG4gICAgICAgICAgICAgIHVwZGF0ZVN0b3BQYW5lbCgpOyAvLyBVcGRhdGUgcGFuZWwgYmFzZWQgb24gbmV3IHNlbGVjdGlvblxyXG4gICAgICAgICAgICAgIC8vIE9wdGlvbmFsOiBOb3RpZnkgcGx1Z2luIGFib3V0IHNlbGVjdGlvbiBjaGFuZ2VcclxuICAgICAgICAgICAgICAvLyBwYXJlbnQucG9zdE1lc3NhZ2UoeyBwbHVnaW5NZXNzYWdlOiB7IHR5cGU6ICdzZWxlY3Qtc3RvcCcsIHNlbGVjdGVkU3RvcElkOiBzdG9wSWQgfSB9LCAnKicpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYHNlbGVjdFN0b3AgY2FsbGVkIGZvciBub24tZXhpc3RlbnQgSUQ6ICR7c3RvcElkfWApO1xyXG4gICAgICAgICAgICAgIHNlbGVjdGVkU3RvcElkID0gbnVsbDsgLy8gQ2xlYXIgc2VsZWN0aW9uIGlmIHN0b3AgZG9lc24ndCBleGlzdFxyXG4gICAgICAgICAgICAgIHVwZGF0ZVN0b3BQYW5lbCgpOyAvLyBDbGVhciBwYW5lbFxyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBQb3NpdGlvbnMgYWxsIHN0b3AgZWxlbWVudHMgdmlzdWFsbHkgYmFzZWQgb24gdGhlaXIgZGF0YVxyXG4gICAgICBmdW5jdGlvbiBwb3NpdGlvblN0b3BzKCkge1xyXG4gICAgICAgICAgY29uc3QgZ3JhZGllbnRXaWR0aCA9IGdyYWRpZW50QmFyLm9mZnNldFdpZHRoO1xyXG4gICAgICAgICAgc3RvcHMuZm9yRWFjaChzdG9wID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCBzdG9wRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHN0b3AuaWQpO1xyXG4gICAgICAgICAgICAgIGlmIChzdG9wRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgICBzdG9wRWxlbWVudC5zdHlsZS5sZWZ0ID0gYCR7KHN0b3AucG9zaXRpb24gLyAxMDApICogZ3JhZGllbnRXaWR0aH1weGA7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFVwZGF0ZXMgdGhlIGdyYWRpZW50IGJhciBiYWNrZ3JvdW5kIGJhc2VkIG9uIGN1cnJlbnQgc3RvcHNcclxuICAgICAgZnVuY3Rpb24gdXBkYXRlR3JhZGllbnQoKSB7XHJcbiAgICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3RvcHMpIHx8IHN0b3BzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJJbnZhbGlkICdzdG9wcycgYXJyYXkgZm9yIGdyYWRpZW50IHVwZGF0ZTpcIiwgc3RvcHMpO1xyXG4gICAgICAgICAgICAgIGdyYWRpZW50QmFyLnN0eWxlLmJhY2tncm91bmQgPSAnZ3JleSc7IC8vIEZhbGxiYWNrXHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFNvcnQgc3RvcHMgYnkgcG9zaXRpb24gZm9yIGNvcnJlY3QgZ3JhZGllbnQgZ2VuZXJhdGlvblxyXG4gICAgICAgICAgbGV0IHNvcnRlZFN0b3BzID0gWy4uLnN0b3BzXS5zb3J0KChhLCBiKSA9PiBhLnBvc2l0aW9uIC0gYi5wb3NpdGlvbik7XHJcblxyXG4gICAgICAgICAgLy8gQ3JlYXRlIHRoZSBDU1MgbGluZWFyLWdyYWRpZW50IHN0cmluZyBpbmNsdWRpbmcgYWxwaGFcclxuICAgICAgICAgIGxldCBncmFkaWVudFN0cmluZyA9IHNvcnRlZFN0b3BzXHJcbiAgICAgICAgICAgICAgLm1hcChzdG9wID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgYWxwaGEgPSBzdG9wLmFscGhhICE9PSB1bmRlZmluZWQgPyBzdG9wLmFscGhhIDogMTtcclxuICAgICAgICAgICAgICAgICAgY29uc3QgcmdiYSA9IGhleFRvUmdiYShzdG9wLmNvbG9yLCBhbHBoYSk7IC8vIENvbnZlcnQgaGV4ICsgYWxwaGEgdG8gcmdiYSgpXHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtyZ2JhfSAke3N0b3AucG9zaXRpb259JWA7XHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAuam9pbignLCAnKTtcclxuXHJcbiAgICAgICAgICBncmFkaWVudEJhci5zdHlsZS5iYWNrZ3JvdW5kID0gYGxpbmVhci1ncmFkaWVudCh0byByaWdodCwgJHtncmFkaWVudFN0cmluZ30pYDtcclxuXHJcbiAgICAgICAgICAvLyBVcGRhdGUgdmlzdWFsIHJlcHJlc2VudGF0aW9uIG9mIHN0b3BzIChwb3NpdGlvbiBhbmQgcHJldmlldyBjb2xvcilcclxuICAgICAgICAgIHN0b3BzLmZvckVhY2goc3RvcCA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3Qgc3RvcEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdG9wLmlkKTtcclxuICAgICAgICAgICAgICBpZiAoc3RvcEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgLy8gVXBkYXRlIHBvc2l0aW9uIChyZWR1bmRhbnQgaWYgY2FsbGVkIGFmdGVyIHBvc2l0aW9uU3RvcHMsIGJ1dCBzYWZlKVxyXG4gICAgICAgICAgICAgICAgICBzdG9wRWxlbWVudC5zdHlsZS5sZWZ0ID0gYCR7KHN0b3AucG9zaXRpb24gLyAxMDApICogZ3JhZGllbnRCYXIub2Zmc2V0V2lkdGh9cHhgO1xyXG4gICAgICAgICAgICAgICAgICAvLyBVcGRhdGUgcHJldmlldyBjb2xvciAodXNlcyBoZXggY29sb3Igd2l0aG91dCBhbHBoYSlcclxuICAgICAgICAgICAgICAgICAgY29uc3QgcHJldmlldyA9IHN0b3BFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jb2xvci1wcmV2aWV3Jyk7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChwcmV2aWV3KSBwcmV2aWV3LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN0b3AuY29sb3I7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBoaWRkZW4gY29sb3IgaW5wdXQgdmFsdWUgKHVzZXMgaGV4IGNvbG9yIHdpdGhvdXQgYWxwaGEpXHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGlucHV0ID0gc3RvcEVsZW1lbnQucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cImNvbG9yXCJdJyk7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChpbnB1dCkgaW5wdXQudmFsdWUgPSBzdG9wLmNvbG9yO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgIHVwZGF0ZVN0b3BQYW5lbCgpOyAvLyBLZWVwIHRoZSBlZGl0b3IgcGFuZWwgc3luY2hyb25pemVkXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEFkZHMgYSBuZXcgY29sb3Igc3RvcCB0byB0aGUgZGF0YSBtb2RlbCBhbmQgdGhlIERPTVxyXG4gICAgICBmdW5jdGlvbiBhZGROZXdTdG9wKHBvc2l0aW9uLCBjb2xvckRhdGEpIHtcclxuICAgICAgICAgIGlmICh0eXBlb2YgcG9zaXRpb24gIT09ICdudW1iZXInIHx8IHBvc2l0aW9uIDwgMCB8fCBwb3NpdGlvbiA+IDEwMCkge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJJbnZhbGlkIHN0b3AgcG9zaXRpb246XCIsIHBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zdCBzdG9wSWQgPSBgc3RvcC0ke0RhdGUubm93KCl9YDsgLy8gR2VuZXJhdGUgdW5pcXVlIElEXHJcbiAgICAgICAgICBjb25zdCBuZXdTdG9wID0ge1xyXG4gICAgICAgICAgICAgIGlkOiBzdG9wSWQsXHJcbiAgICAgICAgICAgICAgcG9zaXRpb246IE1hdGgucm91bmQocG9zaXRpb24pLCAvLyBFbnN1cmUgaW50ZWdlciBwb3NpdGlvblxyXG4gICAgICAgICAgICAgIGNvbG9yOiBjb2xvckRhdGEuY29sb3IsXHJcbiAgICAgICAgICAgICAgYWxwaGE6IGNvbG9yRGF0YS5hbHBoYSAhPT0gdW5kZWZpbmVkID8gY29sb3JEYXRhLmFscGhhIDogMSxcclxuICAgICAgICAgICAgICBpc0VuZHBvaW50OiBmYWxzZSAvLyBOZXcgc3RvcHMgYXJlIG5ldmVyIGVuZHBvaW50c1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIHN0b3BzLnB1c2gobmV3U3RvcCk7XHJcblxyXG4gICAgICAgICAgLy8gQ3JlYXRlIERPTSBlbGVtZW50IGZvciB0aGUgbmV3IHN0b3BcclxuICAgICAgICAgIGNvbnN0IHN0b3BFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICBzdG9wRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjb2xvci1zdG9wJyk7XHJcbiAgICAgICAgICBzdG9wRWxlbWVudC5pZCA9IHN0b3BJZDtcclxuICAgICAgICAgIHN0b3BFbGVtZW50LmlubmVySFRNTCA9IGBcclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY29sb3ItcHJldmlld1wiIHN0eWxlPVwiYmFja2dyb3VuZDogJHtuZXdTdG9wLmNvbG9yfVwiPjwvZGl2PlxyXG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY29sb3JcIiB2YWx1ZT1cIiR7bmV3U3RvcC5jb2xvcn1cIj5gO1xyXG4gICAgICAgICAgY29sb3JTdG9wcy5hcHBlbmRDaGlsZChzdG9wRWxlbWVudCk7IC8vIEFkZCB0byBjb250YWluZXJcclxuXHJcbiAgICAgICAgICAvLyBQb3NpdGlvbiB0aGUgbmV3IHN0b3AgZWxlbWVudFxyXG4gICAgICAgICAgcG9zaXRpb25TdG9wcygpOyAvLyBSZXBvc2l0aW9uIGFsbCBzdG9wcyBpbmNsdWRpbmcgdGhlIG5ldyBvbmVcclxuXHJcbiAgICAgICAgICAvLyBTZXR1cCBoYW5kbGVycyBmb3IgdGhlIG5ldyBzdG9wXHJcbiAgICAgICAgICBzZXR1cENvbG9ySW5wdXRIYW5kbGVyKHN0b3BJZCk7IC8vIENvbG9yIGlucHV0L3ByZXZpZXcgY2xpY2tcclxuICAgICAgICAgIGNvbnN0IGNvbG9yUHJldmlldyA9IHN0b3BFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jb2xvci1wcmV2aWV3Jyk7XHJcbiAgICAgICAgICBpZiAoY29sb3JQcmV2aWV3KSB7XHJcbiAgICAgICAgICAgICAgY29sb3JQcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIChlKSA9PiBoYW5kbGVTdG9wRHJhZ1N0YXJ0KGUsIHN0b3BFbGVtZW50KSk7IC8vIERyYWdnaW5nXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdXBkYXRlR3JhZGllbnQoKTsgLy8gVXBkYXRlIGdyYWRpZW50IGRpc3BsYXlcclxuICAgICAgICAgIHNlbGVjdFN0b3Aoc3RvcElkKTsgLy8gU2VsZWN0IHRoZSBuZXdseSBhZGRlZCBzdG9wXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIERlbGV0ZXMgYSBjb2xvciBzdG9wIGZyb20gdGhlIGRhdGEgbW9kZWwgYW5kIHRoZSBET01cclxuICAgICAgZnVuY3Rpb24gZGVsZXRlU3RvcChzdG9wSWQpIHtcclxuICAgICAgICAgIGNvbnN0IHN0b3BJbmRleCA9IHN0b3BzLmZpbmRJbmRleChzID0+IHMuaWQgPT09IHN0b3BJZCk7XHJcbiAgICAgICAgICBpZiAoc3RvcEluZGV4ID09PSAtMSkgcmV0dXJuOyAvLyBTdG9wIG5vdCBmb3VuZFxyXG5cclxuICAgICAgICAgIGNvbnN0IHN0b3AgPSBzdG9wc1tzdG9wSW5kZXhdO1xyXG4gICAgICAgICAgaWYgKHN0b3AuaXNFbmRwb2ludCkgcmV0dXJuOyAvLyBDYW5ub3QgZGVsZXRlIGVuZHBvaW50c1xyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSBET00gZWxlbWVudFxyXG4gICAgICAgICAgY29uc3Qgc3RvcEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzdG9wSWQpO1xyXG4gICAgICAgICAgc3RvcEVsZW1lbnQ/LnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIGRhdGEgYXJyYXlcclxuICAgICAgICAgIHN0b3BzLnNwbGljZShzdG9wSW5kZXgsIDEpO1xyXG5cclxuICAgICAgICAgIC8vIElmIHRoZSBkZWxldGVkIHN0b3Agd2FzIHNlbGVjdGVkLCBzZWxlY3QgYW5vdGhlciBzdG9wXHJcbiAgICAgICAgICBpZiAoc2VsZWN0ZWRTdG9wSWQgPT09IHN0b3BJZCkge1xyXG4gICAgICAgICAgICAgIC8vIFNlbGVjdCB0aGUgZmlyc3Qgbm9uLWVuZHBvaW50IHN0b3AsIG9yIHRoZSBzdGFydCBzdG9wIGFzIGZhbGxiYWNrXHJcbiAgICAgICAgICAgICAgY29uc3QgbmV4dFN0b3BUb1NlbGVjdCA9IHN0b3BzLmZpbmQocyA9PiAhcy5pc0VuZHBvaW50KT8uaWQgfHwgc3RvcHNbMF0/LmlkIHx8IG51bGw7XHJcbiAgICAgICAgICAgICAgc2VsZWN0U3RvcChuZXh0U3RvcFRvU2VsZWN0KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB1cGRhdGVHcmFkaWVudCgpOyAvLyBVcGRhdGUgVUlcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gLS0tIFN0b3AgRHJhZ2dpbmcgTG9naWMgLS0tXHJcblxyXG4gICAgICAvLyBTZXRzIHVwIGV2ZW50IGxpc3RlbmVycyBmb3IgYSBzcGVjaWZpYyBzdG9wJ3MgY29sb3IgaW5wdXQgYW5kIHByZXZpZXcgY2xpY2tcclxuICAgICAgZnVuY3Rpb24gc2V0dXBDb2xvcklucHV0SGFuZGxlcihzdG9wSWQpIHtcclxuICAgICAgICAgIGNvbnN0IHN0b3BFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc3RvcElkKTtcclxuICAgICAgICAgIGlmICghc3RvcEVsZW1lbnQpIHJldHVybjtcclxuICAgICAgICAgIGNvbnN0IGNvbG9ySW5wdXQgPSBzdG9wRWxlbWVudC5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiY29sb3JcIl0nKTsgLy8gSGlkZGVuIGNvbG9yIHBpY2tlclxyXG4gICAgICAgICAgY29uc3QgY29sb3JQcmV2aWV3ID0gc3RvcEVsZW1lbnQucXVlcnlTZWxlY3RvcignLmNvbG9yLXByZXZpZXcnKTsgLy8gVmlzaWJsZSBwcmV2aWV3IGNpcmNsZVxyXG5cclxuICAgICAgICAgIC8vIEhhbmRsZSBjaGFuZ2VzIGZyb20gdGhlIGhpZGRlbiBjb2xvciBwaWNrZXJcclxuICAgICAgICAgIGlmIChjb2xvcklucHV0KSB7XHJcbiAgICAgICAgICAgICAgY29sb3JJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHN0b3BPYmogPSBzdG9wcy5maW5kKHMgPT4gcy5pZCA9PT0gc3RvcElkKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHN0b3BPYmopIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHN0b3BPYmouY29sb3IgPSBlLnRhcmdldC52YWx1ZTsgLy8gVXBkYXRlIGNvbG9yIGluIGRhdGEgbW9kZWxcclxuICAgICAgICAgICAgICAgICAgICAgIGlmIChjb2xvclByZXZpZXcpIGNvbG9yUHJldmlldy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBlLnRhcmdldC52YWx1ZTsgLy8gVXBkYXRlIHByZXZpZXcgdmlzdWFsbHlcclxuICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZUdyYWRpZW50KCk7IC8vIFJlZHJhdyBncmFkaWVudCBhbmQgdXBkYXRlIHBhbmVsXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBIYW5kbGUgY2xpY2tzIG9uIHRoZSB2aXNpYmxlIHByZXZpZXcgY2lyY2xlXHJcbiAgICAgICAgICBpZiAoY29sb3JQcmV2aWV3KSB7XHJcbiAgICAgICAgICAgICAgY29sb3JQcmV2aWV3LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICBpZiAoIWlzRHJhZ2dpbmcpIHsgLy8gT25seSB0cmlnZ2VyIGlmIG5vdCBjdXJyZW50bHkgZHJhZ2dpbmcgdGhpcyBzdG9wXHJcbiAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RTdG9wKHN0b3BJZCk7IC8vIFNlbGVjdCB0aGUgc3RvcFxyXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3JJbnB1dD8uY2xpY2soKTsgLy8gT3BlbiB0aGUgaGlkZGVuIGNvbG9yIHBpY2tlclxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEluaXRpYWxpemVzIGRyYWcgaGFuZGxlcnMgZm9yIHRoZSBpbml0aWFsIHN0YXJ0IGFuZCBlbmQgc3RvcHNcclxuICAgICAgZnVuY3Rpb24gc2V0dXBJbml0aWFsU3RvcEhhbmRsZXJzKCkge1xyXG4gICAgICAgICAgc2V0dXBDb2xvcklucHV0SGFuZGxlcignc3RhcnQtc3RvcCcpO1xyXG4gICAgICAgICAgc2V0dXBDb2xvcklucHV0SGFuZGxlcignZW5kLXN0b3AnKTtcclxuICAgICAgICAgIHN0YXJ0UHJldmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4gaGFuZGxlU3RvcERyYWdTdGFydChlLCBzdGFydFN0b3ApKTtcclxuICAgICAgICAgIGVuZFByZXZpZXcuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGUpID0+IGhhbmRsZVN0b3BEcmFnU3RhcnQoZSwgZW5kU3RvcCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBIYW5kbGVzIHRoZSBzdGFydCBvZiBkcmFnZ2luZyBhIGNvbG9yIHN0b3BcclxuICAgICAgZnVuY3Rpb24gaGFuZGxlU3RvcERyYWdTdGFydChlLCBlbGVtZW50KSB7XHJcbiAgICAgICAgICBpZiAoZS5idXR0b24gIT09IDApIHJldHVybjsgLy8gT25seSByZXNwb25kIHRvIGxlZnQtY2xpY2tcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTsgLy8gUHJldmVudCBkZWZhdWx0IHRleHQgc2VsZWN0aW9uL2RyYWcgYmVoYXZpb3JzXHJcbiAgICAgICAgICBpc0RyYWdnaW5nID0gdHJ1ZTtcclxuICAgICAgICAgIGFjdGl2ZURyYWdFbGVtZW50ID0gZWxlbWVudDtcclxuICAgICAgICAgIHNlbGVjdFN0b3AoZWxlbWVudC5pZCk7IC8vIFNlbGVjdCB0aGUgc3RvcCBiZWluZyBkcmFnZ2VkXHJcbiAgICAgICAgICBkcmFnU3RhcnRYID0gZS5jbGllbnRYOyAvLyBSZWNvcmQgc3RhcnRpbmcgbW91c2UgcG9zaXRpb25cclxuICAgICAgICAgIGRyYWdTdGFydExlZnQgPSBwYXJzZUludCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KS5sZWZ0IHx8ICcwJyk7IC8vIFJlY29yZCBzdGFydGluZyBlbGVtZW50IHBvc2l0aW9uXHJcblxyXG4gICAgICAgICAgLy8gQWRkIHRlbXBvcmFyeSBsaXN0ZW5lcnMgdG8gdGhlIGRvY3VtZW50IGZvciBtb3ZlIGFuZCBtb3VzZXVwXHJcbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVTdG9wRHJhZ01vdmUpO1xyXG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGhhbmRsZVN0b3BEcmFnRW5kLCB7IG9uY2U6IHRydWUgfSk7IC8vIFJlbW92ZSBhZnRlciBmaXJzdCB0cmlnZ2VyXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEhhbmRsZXMgbW91c2UgbW92ZW1lbnQgd2hpbGUgZHJhZ2dpbmcgYSBjb2xvciBzdG9wXHJcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZVN0b3BEcmFnTW92ZShlKSB7XHJcbiAgICAgICAgICBpZiAoIWlzRHJhZ2dpbmcgfHwgIWFjdGl2ZURyYWdFbGVtZW50KSByZXR1cm47XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7IC8vIFByZXZlbnQgc2VsZWN0aW9uIGR1cmluZyBkcmFnXHJcblxyXG4gICAgICAgICAgY29uc3QgZ3JhZGllbnRSZWN0ID0gZ3JhZGllbnRCYXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgICBjb25zdCBtaW5YID0gMDsgLy8gTWluaW11bSBwaXhlbCBwb3NpdGlvbiAobGVmdCBlZGdlIG9mIGJhcilcclxuICAgICAgICAgIGNvbnN0IG1heFggPSBncmFkaWVudFJlY3Qud2lkdGg7IC8vIE1heGltdW0gcGl4ZWwgcG9zaXRpb24gKHJpZ2h0IGVkZ2Ugb2YgYmFyKVxyXG5cclxuICAgICAgICAgIC8vIENhbGN1bGF0ZSBuZXcgaG9yaXpvbnRhbCBwb3NpdGlvbiBiYXNlZCBvbiBtb3VzZSBtb3ZlbWVudFxyXG4gICAgICAgICAgbGV0IG5ld0xlZnQgPSBkcmFnU3RhcnRMZWZ0ICsgKGUuY2xpZW50WCAtIGRyYWdTdGFydFgpO1xyXG4gICAgICAgICAgbmV3TGVmdCA9IE1hdGgubWF4KG1pblgsIE1hdGgubWluKG5ld0xlZnQsIG1heFgpKTsgLy8gQ2xhbXAgcG9zaXRpb24gd2l0aGluIGJhciBib3VuZHNcclxuXHJcbiAgICAgICAgICAvLyBDYWxjdWxhdGUgcGVyY2VudGFnZSBwb3NpdGlvblxyXG4gICAgICAgICAgY29uc3QgcG9zaXRpb24gPSBNYXRoLnJvdW5kKChuZXdMZWZ0IC8gbWF4WCkgKiAxMDApO1xyXG5cclxuICAgICAgICAgIC8vIFVwZGF0ZSB0aGUgc3RvcCdzIGRhdGEgbW9kZWxcclxuICAgICAgICAgIGNvbnN0IHN0b3BJZCA9IGFjdGl2ZURyYWdFbGVtZW50LmlkO1xyXG4gICAgICAgICAgY29uc3Qgc3RvcCA9IHN0b3BzLmZpbmQocyA9PiBzLmlkID09PSBzdG9wSWQpO1xyXG4gICAgICAgICAgaWYgKHN0b3ApIHtcclxuICAgICAgICAgICAgICBzdG9wLnBvc2l0aW9uID0gcG9zaXRpb247IC8vIFVwZGF0ZSBwb3NpdGlvbiBpbiB0aGUgZGF0YSBhcnJheVxyXG4gICAgICAgICAgICAgIGFjdGl2ZURyYWdFbGVtZW50LnN0eWxlLmxlZnQgPSBgJHtuZXdMZWZ0fXB4YDsgLy8gVXBkYXRlIHZpc3VhbCBwb3NpdGlvbiBpbW1lZGlhdGVseVxyXG4gICAgICAgICAgICAgIHVwZGF0ZUdyYWRpZW50KCk7IC8vIFJlZHJhdyBncmFkaWVudCBiYXIgYW5kIHVwZGF0ZSBwYW5lbFxyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBIYW5kbGVzIHRoZSBlbmQgb2YgZHJhZ2dpbmcgYSBjb2xvciBzdG9wXHJcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZVN0b3BEcmFnRW5kKCkge1xyXG4gICAgICAgICAgaWYgKGlzRHJhZ2dpbmcpIHtcclxuICAgICAgICAgICAgICBpc0RyYWdnaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgYWN0aXZlRHJhZ0VsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIGhhbmRsZVN0b3BEcmFnTW92ZSk7XHJcbiAgICAgICAgICAgICAgLy8gbW91c2V1cCBsaXN0ZW5lciBpcyByZW1vdmVkIGF1dG9tYXRpY2FsbHkgZHVlIHRvIHsgb25jZTogdHJ1ZSB9XHJcbiAgICAgICAgICAgICAgLy8gRmluYWwgdXBkYXRlIHRvIGVuc3VyZSBjb25zaXN0ZW5jeSAobWlnaHQgYmUgcmVkdW5kYW50IGJ1dCBzYWZlKVxyXG4gICAgICAgICAgICAgIHVwZGF0ZUdyYWRpZW50KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIC0tLSBHcmFkaWVudCBCYXIgQ2xpY2sgTGlzdGVuZXIgLS0tXHJcblxyXG4gICAgICAvLyAqKiogQURERUQ6IFNldHMgdXAgdGhlIGNsaWNrIGxpc3RlbmVyIGZvciB0aGUgZ3JhZGllbnQgYmFyICoqKlxyXG4gICAgICBmdW5jdGlvbiBzZXR1cEdyYWRpZW50QmFyQ2xpY2tMaXN0ZW5lcigpIHtcclxuICAgICAgICAgIGdyYWRpZW50QmFyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcclxuICAgICAgICAgICAgICAvLyBJZ25vcmUgY2xpY2tzIGlmIG5vdCBkaXJlY3RseSBvbiB0aGUgYmFyIGl0c2VsZiwgb3IgaWYgYSBzdG9wIGlzIGJlaW5nIGRyYWdnZWRcclxuICAgICAgICAgICAgICBpZiAoZS50YXJnZXQgIT09IGdyYWRpZW50QmFyIHx8IGlzRHJhZ2dpbmcpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgY29uc3QgZ3JhZGllbnRSZWN0ID0gZ3JhZGllbnRCYXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgICAgICAgY29uc3QgY2xpY2tYID0gZS5jbGllbnRYIC0gZ3JhZGllbnRSZWN0LmxlZnQ7IC8vIENsaWNrIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBiYXJcclxuICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvblBlcmNlbnQgPSBNYXRoLnJvdW5kKChjbGlja1ggLyBncmFkaWVudFJlY3Qud2lkdGgpICogMTAwKTsgLy8gUG9zaXRpb24gYXMgcGVyY2VudGFnZVxyXG5cclxuICAgICAgICAgICAgICAvLyBHZXQgdGhlIGludGVycG9sYXRlZCBjb2xvciBhbmQgYWxwaGEgYXQgdGhlIGNsaWNrIHBvc2l0aW9uXHJcbiAgICAgICAgICAgICAgY29uc3QgY29sb3JEYXRhID0gZ2V0Q29sb3JBdFBvc2l0aW9uKHBvc2l0aW9uUGVyY2VudCk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEFkZCB0aGUgbmV3IHN0b3AgdXNpbmcgdGhlIGNhbGN1bGF0ZWQgcG9zaXRpb24gYW5kIGNvbG9yIGRhdGFcclxuICAgICAgICAgICAgICBhZGROZXdTdG9wKHBvc2l0aW9uUGVyY2VudCwgY29sb3JEYXRhKTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyAtLS0gU3RvcCBFZGl0b3IgUGFuZWwgTG9naWMgLS0tXHJcblxyXG4gICAgICAvLyBVcGRhdGVzIHRoZSBlZGl0b3IgcGFuZWwgZmllbGRzIGJhc2VkIG9uIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgc3RvcFxyXG4gICAgICBmdW5jdGlvbiB1cGRhdGVTdG9wUGFuZWwoKSB7XHJcbiAgICAgICAgICBjb25zdCBzdG9wID0gc3RvcHMuZmluZChzID0+IHMuaWQgPT09IHNlbGVjdGVkU3RvcElkKTtcclxuXHJcbiAgICAgICAgICBpZiAoIXN0b3ApIHtcclxuICAgICAgICAgICAgICAvLyBDbGVhci9kaXNhYmxlIHBhbmVsIGlmIG5vIHN0b3AgaXMgc2VsZWN0ZWRcclxuICAgICAgICAgICAgICBjdXJyZW50U3RvcFBvc2l0aW9uLnZhbHVlID0gJyc7XHJcbiAgICAgICAgICAgICAgY3VycmVudFN0b3BDb2xvci52YWx1ZSA9ICcnO1xyXG4gICAgICAgICAgICAgIGN1cnJlbnRTdG9wQ29sb3JQcmV2aWV3LnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XHJcbiAgICAgICAgICAgICAgY3VycmVudFN0b3BBbHBoYS52YWx1ZSA9ICcnO1xyXG4gICAgICAgICAgICAgIHJlbW92ZVN0b3BCdG4uZGlzYWJsZWQgPSB0cnVlOyAvLyBEaXNhYmxlIHJlbW92ZSBidXR0b25cclxuICAgICAgICAgICAgICBjdXJyZW50U3RvcFBvc2l0aW9uLmRpc2FibGVkID0gdHJ1ZTsgLy8gRGlzYWJsZSBpbnB1dHNcclxuICAgICAgICAgICAgICBjdXJyZW50U3RvcENvbG9yLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICBjdXJyZW50U3RvcEFscGhhLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICBjdXJyZW50U3RvcENvbG9yUHJldmlldy5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIEVuYWJsZSBpbnB1dHMgYW5kIHNldCB2YWx1ZXNcclxuICAgICAgICAgIGN1cnJlbnRTdG9wUG9zaXRpb24uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgIGN1cnJlbnRTdG9wQ29sb3IuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgIGN1cnJlbnRTdG9wQWxwaGEuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgIGN1cnJlbnRTdG9wQ29sb3JQcmV2aWV3LnN0eWxlLmN1cnNvciA9ICdwb2ludGVyJztcclxuXHJcbiAgICAgICAgICBjdXJyZW50U3RvcFBvc2l0aW9uLnZhbHVlID0gc3RvcC5wb3NpdGlvbiArICclJzsgLy8gRm9ybWF0IHBvc2l0aW9uIHdpdGggJVxyXG4gICAgICAgICAgY3VycmVudFN0b3BDb2xvci52YWx1ZSA9IHN0b3AuY29sb3I7IC8vIFNldCBoZXggY29sb3JcclxuICAgICAgICAgIGN1cnJlbnRTdG9wQ29sb3JQcmV2aWV3LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN0b3AuY29sb3I7IC8vIFVwZGF0ZSBjb2xvciBwcmV2aWV3IHN3YXRjaFxyXG4gICAgICAgICAgY3VycmVudFN0b3BBbHBoYS52YWx1ZSA9IE1hdGgucm91bmQoKHN0b3AuYWxwaGEgIT09IHVuZGVmaW5lZCA/IHN0b3AuYWxwaGEgOiAxKSAqIDEwMCk7IC8vIFNldCBhbHBoYSAoMC0xMDApXHJcblxyXG4gICAgICAgICAgLy8gRGlzYWJsZSByZW1vdmUgYnV0dG9uIGZvciBlbmRwb2ludCBzdG9wc1xyXG4gICAgICAgICAgcmVtb3ZlU3RvcEJ0bi5kaXNhYmxlZCA9IHN0b3AuaXNFbmRwb2ludDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gU2V0cyB1cCBldmVudCBsaXN0ZW5lcnMgZm9yIHRoZSBpbnB1dCBmaWVsZHMgaW4gdGhlIHN0b3AgZWRpdG9yIHBhbmVsXHJcbiAgICAgIGZ1bmN0aW9uIHNldHVwUGFuZWxJbnB1dExpc3RlbmVycygpIHtcclxuICAgICAgICAgIC8vIFBvc2l0aW9uIElucHV0IChUZXh0IElucHV0KVxyXG4gICAgICAgICAgY3VycmVudFN0b3BQb3NpdGlvbi5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGhhbmRsZVBvc2l0aW9uSW5wdXQpO1xyXG4gICAgICAgICAgY3VycmVudFN0b3BQb3NpdGlvbi5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlUG9zaXRpb25CbHVyKTtcclxuICAgICAgICAgIGN1cnJlbnRTdG9wUG9zaXRpb24uYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGhhbmRsZVBvc2l0aW9uS2V5ZG93bik7XHJcbiAgICAgICAgICBjdXJyZW50U3RvcFBvc2l0aW9uLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKGUpID0+IGUudGFyZ2V0LnNlbGVjdCgpKTsgLy8gU2VsZWN0IHRleHQgb24gZm9jdXNcclxuXHJcbiAgICAgICAgICAvLyBDb2xvciBJbnB1dCAoVGV4dCBJbnB1dCBmb3IgSGV4KVxyXG4gICAgICAgICAgY3VycmVudFN0b3BDb2xvci5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGhhbmRsZUNvbG9ySW5wdXQpO1xyXG4gICAgICAgICAgY3VycmVudFN0b3BDb2xvci5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgaGFuZGxlQ29sb3JCbHVyKTtcclxuICAgICAgICAgIGN1cnJlbnRTdG9wQ29sb3IuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoZSkgPT4gZS50YXJnZXQuc2VsZWN0KCkpOyAvLyBTZWxlY3QgdGV4dCBvbiBmb2N1c1xyXG5cclxuICAgICAgICAgIC8vIEFscGhhIElucHV0IChOdW1iZXIgSW5wdXQpXHJcbiAgICAgICAgICBjdXJyZW50U3RvcEFscGhhLmFkZEV2ZW50TGlzdGVuZXIoJ2lucHV0JywgaGFuZGxlQWxwaGFJbnB1dCk7XHJcbiAgICAgICAgICBjdXJyZW50U3RvcEFscGhhLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBoYW5kbGVBbHBoYUJsdXIpO1xyXG4gICAgICAgICAgY3VycmVudFN0b3BBbHBoYS5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIChlKSA9PiBlLnRhcmdldC5zZWxlY3QoKSk7IC8vIFNlbGVjdCB0ZXh0IG9uIGZvY3VzXHJcblxyXG4gICAgICAgICAgLy8gUGFuZWwgQ29sb3IgUHJldmlldyBDbGljayAob3BlbnMgaGlkZGVuIGNvbG9yIHBpY2tlciBmb3IgdGhlIHNlbGVjdGVkIHN0b3ApXHJcbiAgICAgICAgICBjdXJyZW50U3RvcENvbG9yUHJldmlldy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgICAgICBpZiAoIXNlbGVjdGVkU3RvcElkKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgY29uc3Qgc3RvcEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzZWxlY3RlZFN0b3BJZCk7XHJcbiAgICAgICAgICAgICAgY29uc3QgY29sb3JJbnB1dCA9IHN0b3BFbGVtZW50Py5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiY29sb3JcIl0nKTtcclxuICAgICAgICAgICAgICBjb2xvcklucHV0Py5jbGljaygpO1xyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgLy8gQWRkL1JlbW92ZSBCdXR0b25zXHJcbiAgICAgICAgICBhZGRTdG9wQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaGFuZGxlQWRkU3RvcENsaWNrKTtcclxuICAgICAgICAgIHJlbW92ZVN0b3BCdG4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBoYW5kbGVSZW1vdmVTdG9wQ2xpY2spO1xyXG5cclxuICAgICAgICAgIC8vIEhpZ2hsaWdodCBjb2xvciBpbnB1dCB3aGVuIGFscGhhIGlzIGZvY3VzZWRcclxuICAgICAgICAgICBjdXJyZW50U3RvcEFscGhhLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgKCkgPT4gY3VycmVudFN0b3BDb2xvci5jbGFzc0xpc3QuYWRkKCdoaWdobGlnaHQnKSk7XHJcbiAgICAgICAgICAgY3VycmVudFN0b3BBbHBoYS5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT4gY3VycmVudFN0b3BDb2xvci5jbGFzc0xpc3QucmVtb3ZlKCdoaWdobGlnaHQnKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIEhhbmRsZXJzIGZvciBQYW5lbCBJbnB1dHNcclxuICAgICAgZnVuY3Rpb24gaGFuZGxlUG9zaXRpb25JbnB1dChlKSB7XHJcbiAgICAgICAgICBpZiAoIXNlbGVjdGVkU3RvcElkKSByZXR1cm47XHJcbiAgICAgICAgICBjb25zdCBzdG9wID0gc3RvcHMuZmluZChzID0+IHMuaWQgPT09IHNlbGVjdGVkU3RvcElkKTtcclxuICAgICAgICAgIGlmICghc3RvcCkgcmV0dXJuO1xyXG4gICAgICAgICAgbGV0IHZhbHVlID0gZS50YXJnZXQudmFsdWUucmVwbGFjZSgnJScsICcnKTtcclxuICAgICAgICAgIGxldCBuZXdQb3NpdGlvbiA9IHBhcnNlSW50KHZhbHVlKTtcclxuICAgICAgICAgIGlmICghaXNOYU4obmV3UG9zaXRpb24pKSB7XHJcbiAgICAgICAgICAgICAgLy8gQWxsb3cgdGVtcG9yYXJ5IG92ZXJzaG9vdCBkdXJpbmcgdHlwaW5nLCBjbGFtcCBvbiB1cGRhdGUvYmx1clxyXG4gICAgICAgICAgICAgIG5ld1Bvc2l0aW9uID0gTWF0aC5tYXgoLTEwLCBNYXRoLm1pbigxMTAsIG5ld1Bvc2l0aW9uKSk7IC8vIEFsbG93IHNsaWdodCBvdmVyc2hvb3QgdGVtcFxyXG4gICAgICAgICAgICAgIGlmIChzdG9wLnBvc2l0aW9uICE9PSBuZXdQb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICBzdG9wLnBvc2l0aW9uID0gbmV3UG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgIHVwZGF0ZUdyYWRpZW50KCk7IC8vIFVwZGF0ZXMgZWxlbWVudCBwb3NpdGlvbiBhbmQgcmVmb3JtYXRzIHBhbmVsIHZhbHVlXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZVBvc2l0aW9uQmx1cihlKSB7XHJcbiAgICAgICAgICBpZiAoIXNlbGVjdGVkU3RvcElkKSByZXR1cm47XHJcbiAgICAgICAgICBjb25zdCBzdG9wID0gc3RvcHMuZmluZChzID0+IHMuaWQgPT09IHNlbGVjdGVkU3RvcElkKTtcclxuICAgICAgICAgIGlmICghc3RvcCkgcmV0dXJuO1xyXG4gICAgICAgICAgbGV0IHZhbHVlID0gZS50YXJnZXQudmFsdWUucmVwbGFjZSgnJScsICcnKTtcclxuICAgICAgICAgIGxldCBudW1WYWx1ZSA9IHBhcnNlSW50KHZhbHVlKTtcclxuICAgICAgICAgIGlmICghaXNOYU4obnVtVmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgbnVtVmFsdWUgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIG51bVZhbHVlKSk7IC8vIENsYW1wIHN0cmljdGx5IG9uIGJsdXJcclxuICAgICAgICAgICAgICBzdG9wLnBvc2l0aW9uID0gbnVtVmFsdWU7XHJcbiAgICAgICAgICAgICAgZS50YXJnZXQudmFsdWUgPSBudW1WYWx1ZSArICclJzsgLy8gUmVmb3JtYXQgaW5wdXRcclxuICAgICAgICAgICAgICB1cGRhdGVHcmFkaWVudCgpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICBlLnRhcmdldC52YWx1ZSA9IHN0b3AucG9zaXRpb24gKyAnJSc7IC8vIFJldmVydCBpZiBpbnZhbGlkXHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZnVuY3Rpb24gaGFuZGxlUG9zaXRpb25LZXlkb3duKGUpIHsgLy8gQXJyb3cga2V5IGhhbmRsaW5nXHJcbiAgICAgICAgICBpZiAoIXNlbGVjdGVkU3RvcElkIHx8IChlLmtleSAhPT0gJ0Fycm93VXAnICYmIGUua2V5ICE9PSAnQXJyb3dEb3duJykpIHJldHVybjtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIGNvbnN0IHN0b3AgPSBzdG9wcy5maW5kKHMgPT4gcy5pZCA9PT0gc2VsZWN0ZWRTdG9wSWQpO1xyXG4gICAgICAgICAgaWYgKCFzdG9wKSByZXR1cm47XHJcbiAgICAgICAgICBsZXQgY3VycmVudFZhbCA9IHBhcnNlSW50KGN1cnJlbnRTdG9wUG9zaXRpb24udmFsdWUucmVwbGFjZSgnJScsICcnKSk7XHJcbiAgICAgICAgICBpZiAoaXNOYU4oY3VycmVudFZhbCkpIGN1cnJlbnRWYWwgPSBzdG9wLnBvc2l0aW9uO1xyXG4gICAgICAgICAgY29uc3Qgc3RlcCA9IGUuc2hpZnRLZXkgPyAxMCA6IDE7XHJcbiAgICAgICAgICBjdXJyZW50VmFsICs9IChlLmtleSA9PT0gJ0Fycm93VXAnID8gc3RlcCA6IC1zdGVwKTtcclxuICAgICAgICAgIGN1cnJlbnRWYWwgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIGN1cnJlbnRWYWwpKTsgLy8gQ2xhbXBcclxuICAgICAgICAgIGN1cnJlbnRTdG9wUG9zaXRpb24udmFsdWUgPSBjdXJyZW50VmFsICsgJyUnO1xyXG4gICAgICAgICAgaWYgKHN0b3AucG9zaXRpb24gIT09IGN1cnJlbnRWYWwpIHtcclxuICAgICAgICAgICAgICBzdG9wLnBvc2l0aW9uID0gY3VycmVudFZhbDtcclxuICAgICAgICAgICAgICB1cGRhdGVHcmFkaWVudCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZUNvbG9ySW5wdXQoZSkge1xyXG4gICAgICAgICAgaWYgKCFzZWxlY3RlZFN0b3BJZCkgcmV0dXJuO1xyXG4gICAgICAgICAgY29uc3Qgc3RvcCA9IHN0b3BzLmZpbmQocyA9PiBzLmlkID09PSBzZWxlY3RlZFN0b3BJZCk7XHJcbiAgICAgICAgICBpZiAoIXN0b3ApIHJldHVybjtcclxuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlSGV4V2l0aE9wdGlvbmFsQWxwaGEoZS50YXJnZXQudmFsdWUpOyAvLyBVc2UgaW1wcm92ZWQgcGFyc2VyXHJcbiAgICAgICAgICBpZiAocGFyc2VkKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbmV3QWxwaGEgPSBwYXJzZWQuYWxwaGFQZXJjZW50IC8gMTAwO1xyXG4gICAgICAgICAgICAgIGlmIChzdG9wLmNvbG9yICE9PSBwYXJzZWQuY29sb3IgfHwgc3RvcC5hbHBoYSAhPT0gbmV3QWxwaGEpIHtcclxuICAgICAgICAgICAgICAgICAgc3RvcC5jb2xvciA9IHBhcnNlZC5jb2xvcjtcclxuICAgICAgICAgICAgICAgICAgc3RvcC5hbHBoYSA9IG5ld0FscGhhO1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50U3RvcENvbG9yUHJldmlldy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBzdG9wLmNvbG9yO1xyXG4gICAgICAgICAgICAgICAgICBjdXJyZW50U3RvcEFscGhhLnZhbHVlID0gcGFyc2VkLmFscGhhUGVyY2VudDsgLy8gVXBkYXRlIGFscGhhIGlucHV0XHJcbiAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBoaWRkZW4gaW5wdXQgaW4gdGhlIGFjdHVhbCBzdG9wIGVsZW1lbnRcclxuICAgICAgICAgICAgICAgICAgY29uc3Qgc3RvcEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChzZWxlY3RlZFN0b3BJZCk7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGhpZGRlbklucHV0ID0gc3RvcEVsZW1lbnQ/LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjb2xvclwiXScpO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoaGlkZGVuSW5wdXQpIGhpZGRlbklucHV0LnZhbHVlID0gc3RvcC5jb2xvcjtcclxuICAgICAgICAgICAgICAgICAgdXBkYXRlR3JhZGllbnQoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZnVuY3Rpb24gaGFuZGxlQ29sb3JCbHVyKGUpIHtcclxuICAgICAgICAgIGlmICghc2VsZWN0ZWRTdG9wSWQpIHJldHVybjtcclxuICAgICAgICAgIGNvbnN0IHN0b3AgPSBzdG9wcy5maW5kKHMgPT4gcy5pZCA9PT0gc2VsZWN0ZWRTdG9wSWQpO1xyXG4gICAgICAgICAgaWYgKCFzdG9wKSByZXR1cm47XHJcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBwYXJzZUhleFdpdGhPcHRpb25hbEFscGhhKGUudGFyZ2V0LnZhbHVlKTtcclxuICAgICAgICAgIC8vIE9uIGJsdXIsIGFsd2F5cyBkaXNwbGF5IHRoZSBjYW5vbmljYWwgI3JyZ2diYiBmb3JtYXQsIGV2ZW4gaWYgYWxwaGEgd2FzIGVudGVyZWRcclxuICAgICAgICAgIGUudGFyZ2V0LnZhbHVlID0gc3RvcC5jb2xvcjtcclxuICAgICAgICAgIC8vIElmIGlucHV0IHdhcyBpbnZhbGlkLCB0aGUgbW9kZWwgd2Fzbid0IHVwZGF0ZWQsIHNvIHJldmVydGluZyBpbnB1dCB0byBzdG9wLmNvbG9yIGlzIGNvcnJlY3QuXHJcbiAgICAgICAgICAvLyBJZiBpbnB1dCAqd2FzKiB2YWxpZCAoZS5nLiwgI3JyZ2diYmFhKSwgbW9kZWwgd2FzIHVwZGF0ZWQsIGFuZCB3ZSBzdGlsbCBzZXQgaW5wdXQgdG8gc3RvcC5jb2xvciAoI3JyZ2diYikuXHJcbiAgICAgIH1cclxuICAgICAgZnVuY3Rpb24gaGFuZGxlQWxwaGFJbnB1dChlKSB7XHJcbiAgICAgICAgICBpZiAoIXNlbGVjdGVkU3RvcElkKSByZXR1cm47XHJcbiAgICAgICAgICBjb25zdCBzdG9wID0gc3RvcHMuZmluZChzID0+IHMuaWQgPT09IHNlbGVjdGVkU3RvcElkKTtcclxuICAgICAgICAgIGlmICghc3RvcCkgcmV0dXJuO1xyXG4gICAgICAgICAgbGV0IGFscGhhUGVyY2VudCA9IHBhcnNlSW50KGUudGFyZ2V0LnZhbHVlKTtcclxuICAgICAgICAgIGlmICghaXNOYU4oYWxwaGFQZXJjZW50KSkge1xyXG4gICAgICAgICAgICAgIGFscGhhUGVyY2VudCA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgYWxwaGFQZXJjZW50KSk7IC8vIENsYW1wIDAtMTAwXHJcbiAgICAgICAgICAgICAgY29uc3QgbmV3QWxwaGEgPSBhbHBoYVBlcmNlbnQgLyAxMDA7XHJcbiAgICAgICAgICAgICAgaWYgKHN0b3AuYWxwaGEgIT09IG5ld0FscGhhKSB7XHJcbiAgICAgICAgICAgICAgICAgIHN0b3AuYWxwaGEgPSBuZXdBbHBoYTtcclxuICAgICAgICAgICAgICAgICAgdXBkYXRlR3JhZGllbnQoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZnVuY3Rpb24gaGFuZGxlQWxwaGFCbHVyKGUpIHtcclxuICAgICAgICAgIGlmICghc2VsZWN0ZWRTdG9wSWQpIHJldHVybjtcclxuICAgICAgICAgIGNvbnN0IHN0b3AgPSBzdG9wcy5maW5kKHMgPT4gcy5pZCA9PT0gc2VsZWN0ZWRTdG9wSWQpO1xyXG4gICAgICAgICAgaWYgKCFzdG9wKSByZXR1cm47XHJcbiAgICAgICAgICBsZXQgYWxwaGFQZXJjZW50ID0gcGFyc2VJbnQoZS50YXJnZXQudmFsdWUpO1xyXG4gICAgICAgICAgaWYgKGlzTmFOKGFscGhhUGVyY2VudCkpIHtcclxuICAgICAgICAgICAgICAvLyBSZXZlcnQgdG8gY3VycmVudCBtb2RlbCB2YWx1ZSBpZiBpbnB1dCBpcyBpbnZhbGlkXHJcbiAgICAgICAgICAgICAgZS50YXJnZXQudmFsdWUgPSBNYXRoLnJvdW5kKChzdG9wLmFscGhhICE9PSB1bmRlZmluZWQgPyBzdG9wLmFscGhhIDogMSkgKiAxMDApO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBFbnN1cmUgY2xhbXBlZCB2YWx1ZSBpcyBkaXNwbGF5ZWQgYW5kIHVwZGF0ZSBtb2RlbCBpZiBuZWVkZWRcclxuICAgICAgICAgICAgICBhbHBoYVBlcmNlbnQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIGFscGhhUGVyY2VudCkpO1xyXG4gICAgICAgICAgICAgIGUudGFyZ2V0LnZhbHVlID0gYWxwaGFQZXJjZW50OyAvLyBEaXNwbGF5IGNsYW1wZWQgdmFsdWVcclxuICAgICAgICAgICAgICBjb25zdCBuZXdBbHBoYSA9IGFscGhhUGVyY2VudCAvIDEwMDtcclxuICAgICAgICAgICAgICBpZiAoc3RvcC5hbHBoYSAhPT0gbmV3QWxwaGEpIHtcclxuICAgICAgICAgICAgICAgICAgc3RvcC5hbHBoYSA9IG5ld0FscGhhO1xyXG4gICAgICAgICAgICAgICAgICB1cGRhdGVHcmFkaWVudCgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBmdW5jdGlvbiBoYW5kbGVBZGRTdG9wQ2xpY2soKSB7XHJcbiAgICAgICAgICBjb25zdCBzb3J0ZWRTdG9wcyA9IFsuLi5zdG9wc10uc29ydCgoYSwgYikgPT4gYS5wb3NpdGlvbiAtIGIucG9zaXRpb24pO1xyXG4gICAgICAgICAgbGV0IHBvc2l0aW9uID0gNTA7IC8vIERlZmF1bHQgcG9zaXRpb25cclxuICAgICAgICAgIGxldCBjb2xvckRhdGEgPSB7IGNvbG9yOiBcIiM4MDgwODBcIiwgYWxwaGE6IDEgfTsgLy8gRGVmYXVsdCBjb2xvci9hbHBoYVxyXG5cclxuICAgICAgICAgIGlmIChzb3J0ZWRTdG9wcy5sZW5ndGggPj0gMikge1xyXG4gICAgICAgICAgICAgIC8vIEZpbmQgdGhlIGxhcmdlc3QgZ2FwIGJldHdlZW4gZXhpc3Rpbmcgc3RvcHNcclxuICAgICAgICAgICAgICBsZXQgbGFyZ2VzdEdhcCA9IDA7XHJcbiAgICAgICAgICAgICAgbGV0IGluc2VydFBvcyA9IDUwOyAvLyBEZWZhdWx0IGluc2VydCBwb3NpdGlvblxyXG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc29ydGVkU3RvcHMubGVuZ3RoIC0gMTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgIGxldCBnYXAgPSBzb3J0ZWRTdG9wc1tpICsgMV0ucG9zaXRpb24gLSBzb3J0ZWRTdG9wc1tpXS5wb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgICAgaWYgKGdhcCA+IGxhcmdlc3RHYXApIHtcclxuICAgICAgICAgICAgICAgICAgICAgIGxhcmdlc3RHYXAgPSBnYXA7XHJcbiAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRQb3MgPSBNYXRoLnJvdW5kKHNvcnRlZFN0b3BzW2ldLnBvc2l0aW9uICsgZ2FwIC8gMik7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcG9zaXRpb24gPSBpbnNlcnRQb3M7XHJcbiAgICAgICAgICAgICAgY29sb3JEYXRhID0gZ2V0Q29sb3JBdFBvc2l0aW9uKHBvc2l0aW9uKTsgLy8gR2V0IGludGVycG9sYXRlZCBjb2xvci9hbHBoYVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYWRkTmV3U3RvcChwb3NpdGlvbiwgY29sb3JEYXRhKTtcclxuICAgICAgfVxyXG4gICAgICBmdW5jdGlvbiBoYW5kbGVSZW1vdmVTdG9wQ2xpY2soKSB7XHJcbiAgICAgICAgICBjb25zdCBzdG9wID0gc3RvcHMuZmluZChzID0+IHMuaWQgPT09IHNlbGVjdGVkU3RvcElkKTtcclxuICAgICAgICAgIGlmIChzdG9wICYmICFzdG9wLmlzRW5kcG9pbnQpIHsgLy8gRW5zdXJlIHNlbGVjdGVkIGFuZCBub3QgZW5kcG9pbnRcclxuICAgICAgICAgICAgICBkZWxldGVTdG9wKHNlbGVjdGVkU3RvcElkKTtcclxuICAgICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gLS0tIFN0cm9rZSBXZWlnaHQgSW5wdXQgTG9naWMgLS0tXHJcblxyXG4gICAgICAvLyBTZXRzIHVwIGxpc3RlbmVycyBmb3IgdGhlIHN0cm9rZSB3ZWlnaHQgaW5wdXQgKGRyYWcgYW5kIGtleWJvYXJkKVxyXG4gICAgICBmdW5jdGlvbiBzZXR1cFdlaWdodERyYWdMaXN0ZW5lcnMoKSB7XHJcbiAgICAgICAgICBzdHJva2VXZWlnaHRJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgaGFuZGxlV2VpZ2h0S2V5ZG93bik7XHJcbiAgICAgICAgICBzdHJva2VXZWlnaHRJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBoYW5kbGVXZWlnaHRNb3VzZURvd24pO1xyXG4gICAgICAgICAgc3Ryb2tlV2VpZ2h0SW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignZm9jdXMnLCAoZSkgPT4gZS50YXJnZXQuc2VsZWN0KCkpOyAvLyBTZWxlY3QgdGV4dCBvbiBmb2N1c1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBIYW5kbGVzIFNoaWZ0ICsgQXJyb3cgVXAvRG93biBmb3Igc3Ryb2tlIHdlaWdodCBpbnB1dFxyXG4gICAgICBmdW5jdGlvbiBoYW5kbGVXZWlnaHRLZXlkb3duKGUpIHtcclxuICAgICAgICAgIGlmIChlLmtleSAhPT0gJ0Fycm93VXAnICYmIGUua2V5ICE9PSAnQXJyb3dEb3duJykgcmV0dXJuO1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAvLyBQcmV2ZW50IGRlZmF1bHQgaW5wdXQgc3RlcHBpbmdcclxuXHJcbiAgICAgICAgICBjb25zdCBzdGVwID0gZS5zaGlmdEtleSA/IDEwIDogMTsgLy8gTGFyZ2VyIHN0ZXAgd2l0aCBTaGlmdFxyXG4gICAgICAgICAgY29uc3QgbWluVmFsID0gcGFyc2VGbG9hdChzdHJva2VXZWlnaHRJbnB1dC5taW4pIHx8IDA7XHJcbiAgICAgICAgICBjb25zdCBtYXhWYWwgPSBwYXJzZUZsb2F0KHN0cm9rZVdlaWdodElucHV0Lm1heCk7IC8vIENoZWNrIGlmIG1heCBpcyBkZWZpbmVkXHJcbiAgICAgICAgICBsZXQgY3VycmVudFZhbHVlID0gcGFyc2VGbG9hdChzdHJva2VXZWlnaHRJbnB1dC52YWx1ZSkgfHwgMDtcclxuXHJcbiAgICAgICAgICBjdXJyZW50VmFsdWUgKz0gKGUua2V5ID09PSAnQXJyb3dVcCcgPyBzdGVwIDogLXN0ZXApO1xyXG5cclxuICAgICAgICAgIC8vIENsYW1wIHZhbHVlIHdpdGhpbiBtaW4vbWF4IGJvdW5kc1xyXG4gICAgICAgICAgY3VycmVudFZhbHVlID0gTWF0aC5tYXgobWluVmFsLCBjdXJyZW50VmFsdWUpO1xyXG4gICAgICAgICAgaWYgKCFpc05hTihtYXhWYWwpKSB7XHJcbiAgICAgICAgICAgICAgY3VycmVudFZhbHVlID0gTWF0aC5taW4obWF4VmFsLCBjdXJyZW50VmFsdWUpO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHN0cm9rZVdlaWdodElucHV0LnZhbHVlID0gTWF0aC5yb3VuZChjdXJyZW50VmFsdWUpOyAvLyBVc2Ugcm91bmRlZCB2YWx1ZSBmb3Igd2VpZ2h0XHJcbiAgICAgICAgICAvLyBPcHRpb25hbGx5IHRyaWdnZXIgaW5wdXQgZXZlbnQ6XHJcbiAgICAgICAgICAvLyBzdHJva2VXZWlnaHRJbnB1dC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnaW5wdXQnLCB7IGJ1YmJsZXM6IHRydWUgfSkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBIYW5kbGVzIG1vdXNlZG93biBvbiB0aGUgc3Ryb2tlIHdlaWdodCBpbnB1dCB0byBpbml0aWF0ZSBkcmFnXHJcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZVdlaWdodE1vdXNlRG93bihlKSB7XHJcbiAgICAgICAgICBpZiAoZS5idXR0b24gIT09IDApIHJldHVybjsgLy8gT25seSBsZWZ0IGNsaWNrXHJcblxyXG4gICAgICAgICAgY29uc3QgaXNGb2N1c2VkID0gKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgPT09IHN0cm9rZVdlaWdodElucHV0KTtcclxuXHJcbiAgICAgICAgICAvLyBQcmV2ZW50IGRlZmF1bHQgT05MWSBpZiBzdGFydGluZyBkcmFnIGZyb20gYW4gdW5mb2N1c2VkIHN0YXRlXHJcbiAgICAgICAgICBpZiAoIWlzRm9jdXNlZCkge1xyXG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICBzdHJva2VXZWlnaHRJbnB1dC5mb2N1cygpOyAvLyBNYW51YWxseSBmb2N1c1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gSWYgZm9jdXNlZCwgYWxsb3cgZGVmYXVsdCBiZWhhdmlvciAoY3Vyc29yIHBsYWNlbWVudClcclxuXHJcbiAgICAgICAgICAvLyBQcm9jZWVkIHdpdGggc2V0dGluZyB1cCBkcmFnIHN0YXRlXHJcbiAgICAgICAgICBpc0RyYWdnaW5nV2VpZ2h0ID0gdHJ1ZTtcclxuICAgICAgICAgIHdlaWdodERyYWdTdGFydFggPSBlLmNsaWVudFg7XHJcbiAgICAgICAgICB3ZWlnaHREcmFnTGFzdFggPSBlLmNsaWVudFg7XHJcbiAgICAgICAgICB3ZWlnaHREcmFnQ3VycmVudFZhbHVlID0gcGFyc2VGbG9hdChzdHJva2VXZWlnaHRJbnB1dC52YWx1ZSkgfHwgMDtcclxuICAgICAgICAgIHdlaWdodERyYWdFbmdhZ2VkID0gZmFsc2U7XHJcbiAgICAgICAgICB3ZWlnaHRTY2FsaW5nQWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgLy8gQWRkIGxpc3RlbmVyc1xyXG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgaGFuZGxlV2VpZ2h0RHJhZ01vdmUpO1xyXG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGhhbmRsZVdlaWdodERyYWdFbmQsIHsgb25jZTogdHJ1ZSB9KTtcclxuICAgICAgfVxyXG5cclxuXHJcbiAgICAgIC8vIEhhbmRsZXMgbW91c2UgbW92ZW1lbnQgZHVyaW5nIHN0cm9rZSB3ZWlnaHQgZHJhZ1xyXG4gICAgICBmdW5jdGlvbiBoYW5kbGVXZWlnaHREcmFnTW92ZShlKSB7XHJcbiAgICAgICAgICBpZiAoIWlzRHJhZ2dpbmdXZWlnaHQpIHJldHVybjtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTsgLy8gUHJldmVudCB0ZXh0IHNlbGVjdGlvbiBkdXJpbmcgbW92ZVxyXG5cclxuICAgICAgICAgIGNvbnN0IGN1cnJlbnRYID0gZS5jbGllbnRYO1xyXG4gICAgICAgICAgY29uc3QgZGVsdGFYID0gTWF0aC5hYnMoY3VycmVudFggLSB3ZWlnaHREcmFnU3RhcnRYKTtcclxuXHJcbiAgICAgICAgICAvLyBFbmdhZ2UgY3Vyc29yIGNoYW5nZSB2aXN1YWwgY3VlXHJcbiAgICAgICAgICBpZiAoIXdlaWdodERyYWdFbmdhZ2VkICYmIGRlbHRhWCA+IDIpIHtcclxuICAgICAgICAgICAgICB3ZWlnaHREcmFnRW5nYWdlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSAnZXctcmVzaXplJztcclxuICAgICAgICAgICAgICBzdHJva2VXZWlnaHRJbnB1dC5zdHlsZS5jdXJzb3IgPSAnZXctcmVzaXplJztcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBBY3RpdmF0ZSB2YWx1ZSBzY2FsaW5nXHJcbiAgICAgICAgICBpZiAoIXdlaWdodFNjYWxpbmdBY3RpdmUgJiYgZGVsdGFYID4gNCkge1xyXG4gICAgICAgICAgICAgIHdlaWdodFNjYWxpbmdBY3RpdmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIHdlaWdodERyYWdMYXN0WCA9IGN1cnJlbnRYO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFBlcmZvcm0gc2NhbGluZyBpZiBhY3RpdmVcclxuICAgICAgICAgIGlmICh3ZWlnaHRTY2FsaW5nQWN0aXZlKSB7XHJcbiAgICAgICAgICAgICAgY29uc3QgbW92ZURlbHRhWCA9IGN1cnJlbnRYIC0gd2VpZ2h0RHJhZ0xhc3RYO1xyXG4gICAgICAgICAgICAgIGNvbnN0IHNjYWxlRmFjdG9yID0gZS5zaGlmdEtleSA/IDEuMCA6IDAuMTtcclxuICAgICAgICAgICAgICBjb25zdCB2YWx1ZUNoYW5nZSA9IG1vdmVEZWx0YVggKiBzY2FsZUZhY3RvcjtcclxuXHJcbiAgICAgICAgICAgICAgd2VpZ2h0RHJhZ0N1cnJlbnRWYWx1ZSArPSB2YWx1ZUNoYW5nZTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gQ2xhbXAgdmFsdWVcclxuICAgICAgICAgICAgICBjb25zdCBtaW5WYWwgPSBwYXJzZUZsb2F0KHN0cm9rZVdlaWdodElucHV0Lm1pbikgfHwgMDtcclxuICAgICAgICAgICAgICBjb25zdCBtYXhWYWwgPSBwYXJzZUZsb2F0KHN0cm9rZVdlaWdodElucHV0Lm1heCk7XHJcbiAgICAgICAgICAgICAgd2VpZ2h0RHJhZ0N1cnJlbnRWYWx1ZSA9IE1hdGgubWF4KG1pblZhbCwgd2VpZ2h0RHJhZ0N1cnJlbnRWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgaWYgKCFpc05hTihtYXhWYWwpKSB7XHJcbiAgICAgICAgICAgICAgICAgIHdlaWdodERyYWdDdXJyZW50VmFsdWUgPSBNYXRoLm1pbihtYXhWYWwsIHdlaWdodERyYWdDdXJyZW50VmFsdWUpO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgc3Ryb2tlV2VpZ2h0SW5wdXQudmFsdWUgPSBNYXRoLnJvdW5kKHdlaWdodERyYWdDdXJyZW50VmFsdWUpO1xyXG4gICAgICAgICAgICAgIHdlaWdodERyYWdMYXN0WCA9IGN1cnJlbnRYO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBIYW5kbGVzIG1vdXNldXAgYWZ0ZXIgc3Ryb2tlIHdlaWdodCBkcmFnXHJcbiAgICAgIGZ1bmN0aW9uIGhhbmRsZVdlaWdodERyYWdFbmQoKSB7XHJcbiAgICAgICAgICBpZiAoIWlzRHJhZ2dpbmdXZWlnaHQpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAvLyBGaW5hbGl6ZSB2YWx1ZSBpZiBzY2FsaW5nIG9jY3VycmVkXHJcbiAgICAgICAgICBpZiAod2VpZ2h0U2NhbGluZ0FjdGl2ZSkge1xyXG4gICAgICAgICAgICAgIGxldCBmaW5hbFZhbHVlID0gcGFyc2VGbG9hdChzdHJva2VXZWlnaHRJbnB1dC52YWx1ZSkgfHwgMDtcclxuICAgICAgICAgICAgICBjb25zdCBtaW5WYWwgPSBwYXJzZUZsb2F0KHN0cm9rZVdlaWdodElucHV0Lm1pbikgfHwgMDtcclxuICAgICAgICAgICAgICBjb25zdCBtYXhWYWwgPSBwYXJzZUZsb2F0KHN0cm9rZVdlaWdodElucHV0Lm1heCk7XHJcbiAgICAgICAgICAgICAgZmluYWxWYWx1ZSA9IE1hdGgubWF4KG1pblZhbCwgZmluYWxWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgaWYgKCFpc05hTihtYXhWYWwpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGZpbmFsVmFsdWUgPSBNYXRoLm1pbihtYXhWYWwsIGZpbmFsVmFsdWUpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBzdHJva2VXZWlnaHRJbnB1dC52YWx1ZSA9IE1hdGgucm91bmQoZmluYWxWYWx1ZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gUmVzZXQgc3RhdGVzIGFuZCBsaXN0ZW5lcnNcclxuICAgICAgICAgIGlzRHJhZ2dpbmdXZWlnaHQgPSBmYWxzZTtcclxuICAgICAgICAgIHdlaWdodERyYWdFbmdhZ2VkID0gZmFsc2U7XHJcbiAgICAgICAgICB3ZWlnaHRTY2FsaW5nQWN0aXZlID0gZmFsc2U7XHJcbiAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBoYW5kbGVXZWlnaHREcmFnTW92ZSk7XHJcbiAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9ICcnO1xyXG4gICAgICAgICAgc3Ryb2tlV2VpZ2h0SW5wdXQuc3R5bGUuY3Vyc29yID0gJyc7XHJcbiAgICAgIH1cclxuXHJcblxyXG4gICAgICAvLyAtLS0gS2V5Ym9hcmQgTGlzdGVuZXJzIC0tLVxyXG5cclxuICAgICAgLy8gU2V0cyB1cCBnbG9iYWwga2V5Ym9hcmQgbGlzdGVuZXJzIChlLmcuLCBmb3IgZGVsZXRpbmcgc3RvcHMpXHJcbiAgICAgIGZ1bmN0aW9uIHNldHVwS2V5Ym9hcmRMaXN0ZW5lcnMoKSB7XHJcbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCBhY3RpdmVFbGVtZW50ID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcclxuICAgICAgICAgICAgICAvLyBDaGVjayBpZiBmb2N1cyBpcyBOT1QgaW5zaWRlIGFuIGlucHV0L3NlbGVjdC90ZXh0YXJlYSBvciBjdXN0b20gc2VsZWN0XHJcbiAgICAgICAgICAgICAgY29uc3QgaXNJbnB1dEZvY3VzZWQgPSBhY3RpdmVFbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQudGFnTmFtZSA9PT0gJ1NFTEVDVCcgfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUVsZW1lbnQudGFnTmFtZSA9PT0gJ1RFWFRBUkVBJyB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ3NlbGVjdC1zZWxlY3RlZCcpO1xyXG5cclxuICAgICAgICAgICAgICAvLyBIYW5kbGUgRGVsZXRlL0JhY2tzcGFjZSBmb3Igc2VsZWN0ZWQgY29sb3Igc3RvcCBpZiBmb2N1cyBpcyBub3QgaW4gYW4gaW5wdXRcclxuICAgICAgICAgICAgICBpZiAoIWlzSW5wdXRGb2N1c2VkICYmIChlLmtleSA9PT0gJ0RlbGV0ZScgfHwgZS5rZXkgPT09ICdCYWNrc3BhY2UnKSAmJiBzZWxlY3RlZFN0b3BJZCkge1xyXG4gICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7IC8vIFByZXZlbnQgYnJvd3NlciBiYWNrIG5hdmlnYXRpb24gb24gQmFja3NwYWNlXHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHN0b3AgPSBzdG9wcy5maW5kKHMgPT4gcy5pZCA9PT0gc2VsZWN0ZWRTdG9wSWQpO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoc3RvcCAmJiAhc3RvcC5pc0VuZHBvaW50KSB7IC8vIENhbiBvbmx5IGRlbGV0ZSBub24tZW5kcG9pbnQgc3RvcHNcclxuICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZVN0b3Aoc2VsZWN0ZWRTdG9wSWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gT3B0aW9uYWw6IE5vdGlmeSBwbHVnaW4gYWJvdXQga2V5IHByZXNzXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnQucG9zdE1lc3NhZ2UoeyBwbHVnaW5NZXNzYWdlOiB7IHR5cGU6ICdoYW5kbGUta2V5LXByZXNzJywga2V5OiBlLmtleSwgc2VsZWN0ZWRTdG9wSWQ6IHNlbGVjdGVkU3RvcElkIH0gfSwgJyonKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyAtLS0gVXRpbGl0eSBGdW5jdGlvbnMgLS0tXHJcblxyXG4gICAgICAvLyBDb252ZXJ0cyBhIGhleCBjb2xvciBhbmQgYWxwaGEgKDAtMSkgdG8gYW4gcmdiYSBzdHJpbmdcclxuICAgICAgZnVuY3Rpb24gaGV4VG9SZ2JhKGhleCwgYWxwaGEpIHtcclxuICAgICAgICAgIGhleCA9IGhleC5yZXBsYWNlKCcjJywgJycpO1xyXG4gICAgICAgICAgbGV0IHIsIGcsIGI7XHJcbiAgICAgICAgICBpZiAoaGV4Lmxlbmd0aCA9PT0gMykgeyAvLyBFeHBhbmQgc2hvcnRoYW5kIGhleFxyXG4gICAgICAgICAgICAgIHIgPSBwYXJzZUludChoZXhbMF0gKyBoZXhbMF0sIDE2KTtcclxuICAgICAgICAgICAgICBnID0gcGFyc2VJbnQoaGV4WzFdICsgaGV4WzFdLCAxNik7XHJcbiAgICAgICAgICAgICAgYiA9IHBhcnNlSW50KGhleFsyXSArIGhleFsyXSwgMTYpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChoZXgubGVuZ3RoID09PSA2KSB7IC8vIFN0YW5kYXJkIGhleFxyXG4gICAgICAgICAgICAgIHIgPSBwYXJzZUludChoZXguc3Vic3RyaW5nKDAsIDIpLCAxNik7XHJcbiAgICAgICAgICAgICAgZyA9IHBhcnNlSW50KGhleC5zdWJzdHJpbmcoMiwgNCksIDE2KTtcclxuICAgICAgICAgICAgICBiID0gcGFyc2VJbnQoaGV4LnN1YnN0cmluZyg0LCA2KSwgMTYpO1xyXG4gICAgICAgICAgfSBlbHNlIHsgLy8gSW52YWxpZCBoZXhcclxuICAgICAgICAgICAgICByID0gZyA9IGIgPSAxMjg7IC8vIERlZmF1bHQgdG8gZ3JheVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYWxwaGEgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBhbHBoYSkpOyAvLyBDbGFtcCBhbHBoYSAwLTFcclxuICAgICAgICAgIHJldHVybiBgcmdiYSgke3J9LCAke2d9LCAke2J9LCAke2FscGhhfSlgO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBJbnRlcnBvbGF0ZXMgY29sb3IgYW5kIGFscGhhIGJldHdlZW4gdHdvIHN0b3BzIGF0IGEgZ2l2ZW4gcmF0aW8gKDAtMSlcclxuICAgICAgZnVuY3Rpb24gZ2V0Q29sb3JBdFBvc2l0aW9uKHBvc2l0aW9uUGVyY2VudCkge1xyXG4gICAgICAgICAgY29uc3Qgc29ydGVkU3RvcHMgPSBbLi4uc3RvcHNdLnNvcnQoKGEsIGIpID0+IGEucG9zaXRpb24gLSBiLnBvc2l0aW9uKTtcclxuICAgICAgICAgIGlmIChzb3J0ZWRTdG9wcy5sZW5ndGggPT09IDApIHJldHVybiB7IGNvbG9yOiAnIzgwODA4MCcsIGFscGhhOiAxIH07IC8vIERlZmF1bHQgaWYgbm8gc3RvcHNcclxuICAgICAgICAgIGlmIChzb3J0ZWRTdG9wcy5sZW5ndGggPT09IDEpIHJldHVybiB7IGNvbG9yOiBzb3J0ZWRTdG9wc1swXS5jb2xvciwgYWxwaGE6IHNvcnRlZFN0b3BzWzBdLmFscGhhID8/IDEgfTtcclxuXHJcbiAgICAgICAgICAvLyBGaW5kIHRoZSB0d28gc3RvcHMgdGhlIHBvc2l0aW9uIGZhbGxzIGJldHdlZW5cclxuICAgICAgICAgIGxldCBwcmV2U3RvcCA9IHNvcnRlZFN0b3BzWzBdO1xyXG4gICAgICAgICAgbGV0IG5leHRTdG9wID0gc29ydGVkU3RvcHNbc29ydGVkU3RvcHMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgICBpZiAocG9zaXRpb25QZXJjZW50IDw9IHByZXZTdG9wLnBvc2l0aW9uKSByZXR1cm4geyBjb2xvcjogcHJldlN0b3AuY29sb3IsIGFscGhhOiBwcmV2U3RvcC5hbHBoYSA/PyAxIH07XHJcbiAgICAgICAgICBpZiAocG9zaXRpb25QZXJjZW50ID49IG5leHRTdG9wLnBvc2l0aW9uKSByZXR1cm4geyBjb2xvcjogbmV4dFN0b3AuY29sb3IsIGFscGhhOiBuZXh0U3RvcC5hbHBoYSA/PyAxIH07XHJcblxyXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3J0ZWRTdG9wcy5sZW5ndGggLSAxOyBpKyspIHtcclxuICAgICAgICAgICAgICBpZiAoc29ydGVkU3RvcHNbaV0ucG9zaXRpb24gPD0gcG9zaXRpb25QZXJjZW50ICYmIHNvcnRlZFN0b3BzW2kgKyAxXS5wb3NpdGlvbiA+PSBwb3NpdGlvblBlcmNlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgcHJldlN0b3AgPSBzb3J0ZWRTdG9wc1tpXTtcclxuICAgICAgICAgICAgICAgICAgbmV4dFN0b3AgPSBzb3J0ZWRTdG9wc1tpICsgMV07XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyBDYWxjdWxhdGUgaW50ZXJwb2xhdGlvbiByYXRpb1xyXG4gICAgICAgICAgY29uc3QgcmFuZ2UgPSBuZXh0U3RvcC5wb3NpdGlvbiAtIHByZXZTdG9wLnBvc2l0aW9uO1xyXG4gICAgICAgICAgY29uc3QgcmF0aW8gPSAocmFuZ2UgPT09IDApID8gMSA6IChwb3NpdGlvblBlcmNlbnQgLSBwcmV2U3RvcC5wb3NpdGlvbikgLyByYW5nZTsgLy8gQXZvaWQgZGl2aXNpb24gYnkgemVyb1xyXG5cclxuICAgICAgICAgIC8vIEludGVycG9sYXRlIGNvbG9yIGFuZCBhbHBoYVxyXG4gICAgICAgICAgY29uc3QgaW50ZXJwb2xhdGVkQ29sb3IgPSBpbnRlcnBvbGF0ZUNvbG9yKHByZXZTdG9wLmNvbG9yLCBuZXh0U3RvcC5jb2xvciwgcmF0aW8pO1xyXG4gICAgICAgICAgY29uc3QgcHJldkFscGhhID0gcHJldlN0b3AuYWxwaGEgPz8gMTtcclxuICAgICAgICAgIGNvbnN0IG5leHRBbHBoYSA9IG5leHRTdG9wLmFscGhhID8/IDE7XHJcbiAgICAgICAgICBjb25zdCBpbnRlcnBvbGF0ZWRBbHBoYSA9IHByZXZBbHBoYSArIChuZXh0QWxwaGEgLSBwcmV2QWxwaGEpICogcmF0aW87XHJcblxyXG4gICAgICAgICAgcmV0dXJuIHsgY29sb3I6IGludGVycG9sYXRlZENvbG9yLCBhbHBoYTogaW50ZXJwb2xhdGVkQWxwaGEgfTtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gTGluZWFybHkgaW50ZXJwb2xhdGVzIGJldHdlZW4gdHdvIGhleCBjb2xvcnMgYmFzZWQgb24gYSByYXRpbyAoMC0xKVxyXG4gICAgICBmdW5jdGlvbiBpbnRlcnBvbGF0ZUNvbG9yKGNvbG9yMSwgY29sb3IyLCByYXRpbykge1xyXG4gICAgICAgICAgY29uc3QgcGFyc2VIZXggPSAoaGV4KSA9PiB7IC8vIEhlbHBlciB0byBwYXJzZSBoZXggdG8gUkdCIG9iamVjdFxyXG4gICAgICAgICAgICAgIGhleCA9IChoZXggfHwgJyMwMDAwMDAnKS5yZXBsYWNlKCcjJywgJycpO1xyXG4gICAgICAgICAgICAgIGxldCByLCBnLCBiO1xyXG4gICAgICAgICAgICAgIGlmIChoZXgubGVuZ3RoID09PSAzKSB7XHJcbiAgICAgICAgICAgICAgICAgIHIgPSBwYXJzZUludChoZXhbMF0gKyBoZXhbMF0sIDE2KTsgZyA9IHBhcnNlSW50KGhleFsxXSArIGhleFsxXSwgMTYpOyBiID0gcGFyc2VJbnQoaGV4WzJdICsgaGV4WzJdLCAxNik7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChoZXgubGVuZ3RoID09PSA2KSB7XHJcbiAgICAgICAgICAgICAgICAgIHIgPSBwYXJzZUludChoZXguc3Vic3RyaW5nKDAsIDIpLCAxNik7IGcgPSBwYXJzZUludChoZXguc3Vic3RyaW5nKDIsIDQpLCAxNik7IGIgPSBwYXJzZUludChoZXguc3Vic3RyaW5nKDQsIDYpLCAxNik7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHsgcmV0dXJuIHsgcjogMCwgZzogMCwgYjogMCB9OyB9IC8vIEludmFsaWQgZm9ybWF0XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHsgciwgZywgYiB9O1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICAgIGNvbnN0IHJnYjEgPSBwYXJzZUhleChjb2xvcjEpO1xyXG4gICAgICAgICAgY29uc3QgcmdiMiA9IHBhcnNlSGV4KGNvbG9yMik7XHJcbiAgICAgICAgICBjb25zdCBjbGFtcCA9ICh2YWwpID0+IE1hdGgubWF4KDAsIE1hdGgubWluKDI1NSwgTWF0aC5yb3VuZCh2YWwpKSk7IC8vIENsYW1wIDAtMjU1IGFuZCByb3VuZFxyXG4gICAgICAgICAgY29uc3QgciA9IGNsYW1wKHJnYjEuciArIChyZ2IyLnIgLSByZ2IxLnIpICogcmF0aW8pO1xyXG4gICAgICAgICAgY29uc3QgZyA9IGNsYW1wKHJnYjEuZyArIChyZ2IyLmcgLSByZ2IxLmcpICogcmF0aW8pO1xyXG4gICAgICAgICAgY29uc3QgYiA9IGNsYW1wKHJnYjEuYiArIChyZ2IyLmIgLSByZ2IxLmIpICogcmF0aW8pO1xyXG4gICAgICAgICAgY29uc3QgY29tcG9uZW50VG9IZXggPSAoYykgPT4gYy50b1N0cmluZygxNikucGFkU3RhcnQoMiwgJzAnKTsgLy8gQ29udmVydCBudW1iZXIgdG8gMi1kaWdpdCBoZXhcclxuICAgICAgICAgIHJldHVybiBgIyR7Y29tcG9uZW50VG9IZXgocil9JHtjb21wb25lbnRUb0hleChnKX0ke2NvbXBvbmVudFRvSGV4KGIpfWA7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFBhcnNlcyBoZXggY29sb3Igc3RyaW5nICgjcmdiLCAjcnJnZ2JiLCAjcnJnZ2JiYWEsIG9yIHdpdGhvdXQgIylcclxuICAgICAgLy8gUmV0dXJucyB7IGNvbG9yOiAnI3JyZ2diYicsIGFscGhhUGVyY2VudDogMC0xMDAgfSBvciBudWxsIGlmIGludmFsaWRcclxuICAgICAgZnVuY3Rpb24gcGFyc2VIZXhXaXRoT3B0aW9uYWxBbHBoYShoZXhDb2xvcikge1xyXG4gICAgICAgICAgaGV4Q29sb3IgPSBoZXhDb2xvci50cmltKCkucmVwbGFjZSgnIycsICcnKTsgLy8gQ2xlYW4gaW5wdXRcclxuICAgICAgICAgIGxldCByLCBnLCBiLCBhID0gMjU1OyAvLyBEZWZhdWx0IGFscGhhIGlzIDEwMCUgKEZGKVxyXG5cclxuICAgICAgICAgIGlmICgvXlswLTlBLUZhLWZdezN9JC8udGVzdChoZXhDb2xvcikpIHsgLy8gI3JnYlxyXG4gICAgICAgICAgICAgIHIgPSBwYXJzZUludChoZXhDb2xvclswXSArIGhleENvbG9yWzBdLCAxNik7XHJcbiAgICAgICAgICAgICAgZyA9IHBhcnNlSW50KGhleENvbG9yWzFdICsgaGV4Q29sb3JbMV0sIDE2KTtcclxuICAgICAgICAgICAgICBiID0gcGFyc2VJbnQoaGV4Q29sb3JbMl0gKyBoZXhDb2xvclsyXSwgMTYpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICgvXlswLTlBLUZhLWZdezZ9JC8udGVzdChoZXhDb2xvcikpIHsgLy8gI3JyZ2diYlxyXG4gICAgICAgICAgICAgIHIgPSBwYXJzZUludChoZXhDb2xvci5zdWJzdHJpbmcoMCwgMiksIDE2KTtcclxuICAgICAgICAgICAgICBnID0gcGFyc2VJbnQoaGV4Q29sb3Iuc3Vic3RyaW5nKDIsIDQpLCAxNik7XHJcbiAgICAgICAgICAgICAgYiA9IHBhcnNlSW50KGhleENvbG9yLnN1YnN0cmluZyg0LCA2KSwgMTYpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICgvXlswLTlBLUZhLWZdezh9JC8udGVzdChoZXhDb2xvcikpIHsgLy8gI3JyZ2diYmFhXHJcbiAgICAgICAgICAgICAgciA9IHBhcnNlSW50KGhleENvbG9yLnN1YnN0cmluZygwLCAyKSwgMTYpO1xyXG4gICAgICAgICAgICAgIGcgPSBwYXJzZUludChoZXhDb2xvci5zdWJzdHJpbmcoMiwgNCksIDE2KTtcclxuICAgICAgICAgICAgICBiID0gcGFyc2VJbnQoaGV4Q29sb3Iuc3Vic3RyaW5nKDQsIDYpLCAxNik7XHJcbiAgICAgICAgICAgICAgYSA9IHBhcnNlSW50KGhleENvbG9yLnN1YnN0cmluZyg2LCA4KSwgMTYpOyAvLyBHZXQgYWxwaGEgdmFsdWVcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIEludmFsaWQgZm9ybWF0XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgY29uc3QgY29tcG9uZW50VG9IZXggPSAoYykgPT4gYy50b1N0cmluZygxNikucGFkU3RhcnQoMiwgJzAnKTtcclxuICAgICAgICAgIGNvbnN0IGZpbmFsQ29sb3IgPSBgIyR7Y29tcG9uZW50VG9IZXgocil9JHtjb21wb25lbnRUb0hleChnKX0ke2NvbXBvbmVudFRvSGV4KGIpfWA7XHJcbiAgICAgICAgICBjb25zdCBmaW5hbEFscGhhUGVyY2VudCA9IE1hdGgucm91bmQoKGEgLyAyNTUpICogMTAwKTtcclxuXHJcbiAgICAgICAgICByZXR1cm4geyBjb2xvcjogZmluYWxDb2xvciwgYWxwaGFQZXJjZW50OiBmaW5hbEFscGhhUGVyY2VudCB9O1xyXG4gICAgICB9XHJcblxyXG5cclxuICAgICAgLy8gLS0tIENvbW11bmljYXRpb24gd2l0aCBQbHVnaW4gKEV4YW1wbGUgRnVuY3Rpb25zKSAtLS1cclxuXHJcbiAgICAgIC8vIFNlbmRzIHRoZSBmaW5hbCBncmFkaWVudCBkYXRhIHRvIHRoZSBwbHVnaW5cclxuICAgICAgZnVuY3Rpb24gYXBwbHlHcmFkaWVudCgpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgY29uc3Qgc3Ryb2tlV2VpZ2h0ID0gc3Ryb2tlV2VpZ2h0SW5wdXQudmFsdWU7XHJcbiAgICAgICAgICAgICAgY29uc3Qgc3RhcnRDYXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhcnQtY2FwLXZhbHVlJykudmFsdWU7XHJcbiAgICAgICAgICAgICAgY29uc3QgZW5kQ2FwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VuZC1jYXAtdmFsdWUnKS52YWx1ZTtcclxuICAgICAgICAgICAgICBjb25zdCBzdHJva2VKb2luID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0cm9rZS1qb2luLXZhbHVlJykudmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgIGlmICghQXJyYXkuaXNBcnJheShzdG9wcykgfHwgc3RvcHMubGVuZ3RoIDwgMikge1xyXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiU3RvcHMgYXJyYXkgaW52YWxpZCBmb3IgYXBwbHk6XCIsIHN0b3BzKTtcclxuICAgICAgICAgICAgICAgICAgYWxlcnQoXCJFcnJvcjogTWluaW11bSAyIGdyYWRpZW50IHN0b3BzIHJlcXVpcmVkLlwiKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgLy8gUHJlcGFyZSBzdG9wcyBkYXRhIGZvciB0aGUgcGx1Z2luIChlbnN1cmUgcG9zaXRpb24gMC0xMDAsIGFscGhhIDAtMSlcclxuICAgICAgICAgICAgICBjb25zdCBwcm9jZXNzZWRTdG9wcyA9IHN0b3BzLm1hcChzdG9wID0+IHtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBNYXRoLm1heCgwLCBNYXRoLm1pbigxMDAsIE51bWJlcihzdG9wLnBvc2l0aW9uKSB8fCAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogc3RvcC5jb2xvciB8fCAnIzAwMDAwMCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICBhbHBoYTogc3RvcC5hbHBoYSAhPT0gdW5kZWZpbmVkID8gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgc3RvcC5hbHBoYSkpIDogMVxyXG4gICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgIH0pLnNvcnQoKGEsIGIpID0+IGEucG9zaXRpb24gLSBiLnBvc2l0aW9uKTsgLy8gRW5zdXJlIHNvcnRlZCBieSBwb3NpdGlvblxyXG5cclxuICAgICAgICAgICAgICAvLyBTZW5kIG1lc3NhZ2UgdG8gdGhlIHBsdWdpbiBlbnZpcm9ubWVudFxyXG4gICAgICAgICAgICAgIHBhcmVudC5wb3N0TWVzc2FnZSh7XHJcbiAgICAgICAgICAgICAgICAgIHBsdWdpbk1lc3NhZ2U6IHtcclxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdhcHBseS1ncmFkaWVudCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICBzdHJva2VXZWlnaHQ6IHBhcnNlRmxvYXQoc3Ryb2tlV2VpZ2h0KSB8fCAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgc3RhcnRDYXA6IHN0YXJ0Q2FwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgZW5kQ2FwOiBlbmRDYXAsXHJcbiAgICAgICAgICAgICAgICAgICAgICBzdHJva2VKb2luOiBzdHJva2VKb2luLFxyXG4gICAgICAgICAgICAgICAgICAgICAgc3RvcHM6IHByb2Nlc3NlZFN0b3BzXHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9LCAnKicpOyAvLyBVc2Ugc3BlY2lmaWMgb3JpZ2luIGluIHByb2R1Y3Rpb24gaWYgcG9zc2libGVcclxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluIGFwcGx5R3JhZGllbnQ6XCIsIGVycm9yKTtcclxuICAgICAgICAgICAgICBhbGVydChcIkVycm9yIGFwcGx5aW5nIGdyYWRpZW50OiBcIiArIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBIYW5kbGVzIG1lc3NhZ2VzIHJlY2VpdmVkIGZyb20gdGhlIHBsdWdpblxyXG4gICAgICB3aW5kb3cub25tZXNzYWdlID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAvLyBCYXNpYyBzZWN1cml0eSBjaGVjayAob3B0aW9uYWwgYnV0IHJlY29tbWVuZGVkKVxyXG4gICAgICAgICAgLy8gaWYgKGV2ZW50Lm9yaWdpbiAhPT0gJ2V4cGVjdGVkX3BsdWdpbl9vcmlnaW4nKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgY29uc3QgbXNnID0gZXZlbnQuZGF0YS5wbHVnaW5NZXNzYWdlO1xyXG4gICAgICAgICAgaWYgKCFtc2cpIHJldHVybjsgLy8gSWdub3JlIG1lc3NhZ2VzIG5vdCBjb25mb3JtaW5nIHRvIGV4cGVjdGVkIHN0cnVjdHVyZVxyXG5cclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiTWVzc2FnZSBmcm9tIHBsdWdpbjpcIiwgbXNnKTsgLy8gRm9yIGRlYnVnZ2luZ1xyXG5cclxuICAgICAgICAgIHN3aXRjaCAobXNnLnR5cGUpIHtcclxuICAgICAgICAgICAgICBjYXNlICdzZWxlY3Rpb24tZXJyb3InOlxyXG4gICAgICAgICAgICAgICAgICBhbGVydCgnUGx1Z2luIEVycm9yOiAnICsgKG1zZy5tZXNzYWdlIHx8ICdQbGVhc2Ugc2VsZWN0IGEgc2luZ2xlIHZlY3RvciBwYXRoLicpKTtcclxuICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgIGNhc2UgJ2luaXQtZGF0YSc6IC8vIFBsdWdpbiBzZW5kcyBpbml0aWFsIHN0YXRlXHJcbiAgICAgICAgICAgICAgICAgIGhhbmRsZUluaXREYXRhKG1zZyk7XHJcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICBjYXNlICdzdG9wLXNlbGVjdGVkJzogLy8gUGx1Z2luIHJlcXVlc3RzIFVJIHRvIHNlbGVjdCBhIHN0b3BcclxuICAgICAgICAgICAgICAgICAgaWYgKG1zZy5zdG9wSWQgJiYgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobXNnLnN0b3BJZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdFN0b3AobXNnLnN0b3BJZCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgIGNhc2UgJ3Nob3ctY29sb3ItcGlja2VyLWZvci1zdG9wJzogLy8gUGx1Z2luIHJlcXVlc3RzIGNvbG9yIHBpY2tlciBmb3IgYSBzdG9wXHJcbiAgICAgICAgICAgICAgICAgIGlmIChtc2cuc3RvcElkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdG9wRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG1zZy5zdG9wSWQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sb3JJbnB1dCA9IHN0b3BFbGVtZW50Py5xdWVyeVNlbGVjdG9yKCdpbnB1dFt0eXBlPVwiY29sb3JcIl0nKTtcclxuICAgICAgICAgICAgICAgICAgICAgIGNvbG9ySW5wdXQ/LmNsaWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgIC8vIEFkZCBvdGhlciBtZXNzYWdlIHR5cGVzIGFzIG5lZWRlZFxyXG4gICAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gUHJvY2Vzc2VzIGluaXRpYWwgZGF0YSByZWNlaXZlZCBmcm9tIHRoZSBwbHVnaW5cclxuICAgICAgZnVuY3Rpb24gaGFuZGxlSW5pdERhdGEobXNnKSB7XHJcbiAgICAgICAgICAvLyBVcGRhdGUgU3Ryb2tlIFByb3BlcnRpZXNcclxuICAgICAgICAgIGlmIChtc2cuc3Ryb2tlV2VpZ2h0ICE9PSB1bmRlZmluZWQpIHN0cm9rZVdlaWdodElucHV0LnZhbHVlID0gbXNnLnN0cm9rZVdlaWdodDtcclxuXHJcbiAgICAgICAgICAvLyBVcGRhdGUgQ3VzdG9tIFNlbGVjdHMgKFN0YXJ0L0VuZCBDYXBzIEFORCBKb2luKVxyXG4gICAgICAgICAgdXBkYXRlQ3VzdG9tU2VsZWN0RnJvbURhdGEoJ3N0YXJ0LWNhcCcsIG1zZy5zdGFydENhcCk7XHJcbiAgICAgICAgICB1cGRhdGVDdXN0b21TZWxlY3RGcm9tRGF0YSgnZW5kLWNhcCcsIG1zZy5lbmRDYXApO1xyXG4gICAgICAgICAgdXBkYXRlQ3VzdG9tU2VsZWN0RnJvbURhdGEoJ3N0cm9rZS1qb2luJywgbXNnLnN0cm9rZUpvaW4pO1xyXG5cclxuICAgICAgICAgIC8vIFVwZGF0ZSBHcmFkaWVudCBTdG9wc1xyXG4gICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobXNnLnN0b3BzKSkge1xyXG4gICAgICAgICAgICAgIC8vIENsZWFyIGV4aXN0aW5nIG5vbi1lbmRwb2ludCBET00gZWxlbWVudHNcclxuICAgICAgICAgICAgICBjb2xvclN0b3BzLnF1ZXJ5U2VsZWN0b3JBbGwoJy5jb2xvci1zdG9wOm5vdCgjc3RhcnQtc3RvcCk6bm90KCNlbmQtc3RvcCknKVxyXG4gICAgICAgICAgICAgICAgICAuZm9yRWFjaChlbCA9PiBlbC5yZW1vdmUoKSk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFJlYnVpbGQgc3RvcHMgYXJyYXkgZnJvbSBtZXNzYWdlIChleHBlY3RpbmcgcG9zaXRpb24gMC0xMDAsIGFscGhhIDAtMSlcclxuICAgICAgICAgICAgICBzdG9wcyA9IG1zZy5zdG9wcy5tYXAoKHBsdWdpblN0b3AsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGxldCBpZCA9IHBsdWdpblN0b3AuaWQ7IC8vIFVzZSBJRCBmcm9tIHBsdWdpbiBpZiBwcm92aWRlZFxyXG4gICAgICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEwMCwgcGx1Z2luU3RvcC5wb3NpdGlvbiB8fCAwKSk7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGlzRW5kcG9pbnQgPSAocG9zaXRpb24gPT09IDAgfHwgcG9zaXRpb24gPT09IDEwMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAvLyBFbnN1cmUgc3RhcnQvZW5kIHN0b3BzIHVzZSBmaXhlZCBJRHMsIGdlbmVyYXRlIGZvciBvdGhlcnMgaWYgbmVlZGVkXHJcbiAgICAgICAgICAgICAgICAgIGlmIChwb3NpdGlvbiA9PT0gMCAmJiAhaWQpIGlkID0gJ3N0YXJ0LXN0b3AnO1xyXG4gICAgICAgICAgICAgICAgICBlbHNlIGlmIChwb3NpdGlvbiA9PT0gMTAwICYmICFpZCkgaWQgPSAnZW5kLXN0b3AnO1xyXG4gICAgICAgICAgICAgICAgICBlbHNlIGlmICghaWQgJiYgIWlzRW5kcG9pbnQpIGlkID0gYHN0b3AtJHtEYXRlLm5vdygpfS0ke2luZGV4fWA7IC8vIEdlbmVyYXRlIElEXHJcblxyXG4gICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgaWQ6IGlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHBsdWdpblN0b3AuY29sb3IgfHwgJyMwMDAwMDAnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgYWxwaGE6IHBsdWdpblN0b3AuYWxwaGEgIT09IHVuZGVmaW5lZCA/IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHBsdWdpblN0b3AuYWxwaGEpKSA6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICBpc0VuZHBvaW50OiBpZCA9PT0gJ3N0YXJ0LXN0b3AnIHx8IGlkID09PSAnZW5kLXN0b3AnXHJcbiAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgfSkuc29ydCgoYSwgYikgPT4gYS5wb3NpdGlvbiAtIGIucG9zaXRpb24pOyAvLyBTb3J0IGJ5IHBvc2l0aW9uXHJcblxyXG4gICAgICAgICAgICAgIC8vIEVuc3VyZSBzdGFydC9lbmQgc3RvcHMgZXhpc3Qgc3RydWN0dXJhbGx5IChhZGQgZGVmYXVsdHMgaWYgbWlzc2luZylcclxuICAgICAgICAgICAgICBpZiAoIXN0b3BzLnNvbWUocyA9PiBzLmlkID09PSAnc3RhcnQtc3RvcCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlN0YXJ0IHN0b3AgbWlzc2luZyBmcm9tIHBsdWdpbiBkYXRhLCBhZGRpbmcgZGVmYXVsdC5cIik7XHJcbiAgICAgICAgICAgICAgICAgIHN0b3BzLnVuc2hpZnQoeyBpZDogJ3N0YXJ0LXN0b3AnLCBwb3NpdGlvbjogMCwgY29sb3I6ICcjZmYwMDAwJywgYWxwaGE6IDEsIGlzRW5kcG9pbnQ6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmICghc3RvcHMuc29tZShzID0+IHMuaWQgPT09ICdlbmQtc3RvcCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkVuZCBzdG9wIG1pc3NpbmcgZnJvbSBwbHVnaW4gZGF0YSwgYWRkaW5nIGRlZmF1bHQuXCIpO1xyXG4gICAgICAgICAgICAgICAgICBzdG9wcy5wdXNoKHsgaWQ6ICdlbmQtc3RvcCcsIHBvc2l0aW9uOiAxMDAsIGNvbG9yOiAnIzAwMDBmZicsIGFscGhhOiAxLCBpc0VuZHBvaW50OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBzdG9wcy5zb3J0KChhLCBiKSA9PiBhLnBvc2l0aW9uIC0gYi5wb3NpdGlvbik7IC8vIFJlLXNvcnQgYWZ0ZXIgcG90ZW50aWFsIGFkZGl0aW9uc1xyXG5cclxuICAgICAgICAgICAgICAvLyBSZS1yZW5kZXIgYWxsIHN0b3BzIGZyb20gdGhlIG5ldyBhcnJheVxyXG4gICAgICAgICAgICAgIHN0b3BzLmZvckVhY2goc3RvcCA9PiByZW5kZXJPclVwZGF0ZVN0b3BFbGVtZW50KHN0b3ApKTtcclxuXHJcbiAgICAgICAgICAgICAgLy8gU2VsZWN0IHRoZSBmaXJzdCBzdG9wIGFmdGVyIHVwZGF0ZVxyXG4gICAgICAgICAgICAgIHNlbGVjdFN0b3Aoc3RvcHNbMF0/LmlkIHx8IG51bGwpO1xyXG4gICAgICAgICAgICAgIHVwZGF0ZUdyYWRpZW50KCk7IC8vIFVwZGF0ZSB0aGUgZ3JhZGllbnQgZGlzcGxheVxyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBIZWxwZXIgdG8gdXBkYXRlIGEgY3VzdG9tIHNlbGVjdCBiYXNlZCBvbiByZWNlaXZlZCBkYXRhXHJcbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZUN1c3RvbVNlbGVjdEZyb21EYXRhKGJhc2VJZCwgdmFsdWUpIHtcclxuICAgICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHZhbHVlID09PSBudWxsKSByZXR1cm47IC8vIE5vIHZhbHVlIHByb3ZpZGVkXHJcbiAgICAgICAgICBjb25zdCBoaWRkZW5JbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGAke2Jhc2VJZH0tdmFsdWVgKTtcclxuICAgICAgICAgIGNvbnN0IHdyYXBwZXIgPSBoaWRkZW5JbnB1dD8uY2xvc2VzdCgnLmN1c3RvbS1zZWxlY3Qtd3JhcHBlcicpO1xyXG4gICAgICAgICAgY29uc3Qgc2VsZWN0RGl2ID0gd3JhcHBlcj8ucXVlcnlTZWxlY3RvcignLmN1c3RvbS1zZWxlY3QnKTtcclxuICAgICAgICAgIGNvbnN0IHNlbGVjdGVkRGlzcGxheSA9IHNlbGVjdERpdj8ucXVlcnlTZWxlY3RvcignLnNlbGVjdC1zZWxlY3RlZCcpOyAvLyBPbmx5IHJlbGV2YW50IGZvciBkcm9wZG93bnNcclxuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBzZWxlY3REaXY/LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zZWxlY3Qtb3B0aW9uJyk7XHJcblxyXG4gICAgICAgICAgaWYgKCFoaWRkZW5JbnB1dCB8fCAhc2VsZWN0RGl2IHx8ICFvcHRpb25zKSB7XHJcbiAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ3VzdG9tIHNlbGVjdCBlbGVtZW50cyBub3QgZm91bmQgZm9yIGJhc2VJZDogJHtiYXNlSWR9YCk7XHJcbiAgICAgICAgICAgICAgIHJldHVybjsgLy8gRWxlbWVudHMgbm90IGZvdW5kXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgaGlkZGVuSW5wdXQudmFsdWUgPSB2YWx1ZTsgLy8gVXBkYXRlIGhpZGRlbiBpbnB1dFxyXG4gICAgICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgICBmb3IgKGxldCBvcHQgb2Ygb3B0aW9ucykge1xyXG4gICAgICAgICAgICAgIG9wdC5jbGFzc0xpc3QucmVtb3ZlKCdzYW1lLWFzLXNlbGVjdGVkJyk7IC8vIENsZWFyIHByZXZpb3VzIHNlbGVjdGlvbiBzdHlsZVxyXG4gICAgICAgICAgICAgIGlmIChvcHQuZ2V0QXR0cmlidXRlKCdkYXRhLXZhbHVlJykgPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZERpc3BsYXkpIHsgLy8gVXBkYXRlIGRpc3BsYXkgb25seSBpZiBpdCBleGlzdHMgKG5vdCBmb3Igam9pbilcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZERpc3BsYXkuaW5uZXJIVE1MID0gb3B0LmlubmVySFRNTDsgLy8gVXBkYXRlIGRpc3BsYXkgSFRNTCAod2l0aCBpY29uKVxyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIG9wdC5jbGFzc0xpc3QuYWRkKCdzYW1lLWFzLXNlbGVjdGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgIC8vIE9ubHkgbW92ZSB0byB0b3AgZm9yIGRyb3Bkb3ducyAobm90IGpvaW4pXHJcbiAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZERpc3BsYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBvcHQucGFyZW50Tm9kZS5wcmVwZW5kKG9wdCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAvLyBEb24ndCBicmVhayBmb3Igam9pbiwgYXMgd2UgbmVlZCB0byByZW1vdmUgY2xhc3MgZnJvbSBhbGwgb3RoZXJzXHJcbiAgICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZERpc3BsYXkpIGJyZWFrO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICghZm91bmQpIHsgLy8gSGFuZGxlIGNhc2Ugd2hlcmUgdmFsdWUgZG9lc24ndCBtYXRjaCBhbnkgb3B0aW9uXHJcbiAgICAgICAgICAgICAgaWYgKHNlbGVjdGVkRGlzcGxheSkgc2VsZWN0ZWREaXNwbGF5LmlubmVySFRNTCA9ICdTZWxlY3QuLi4nOyAvLyBPciBkaXNwbGF5IHRoZSB2YWx1ZSBpdHNlbGY/XHJcbiAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBWYWx1ZSBcIiR7dmFsdWV9XCIgbm90IGZvdW5kIGluIG9wdGlvbnMgZm9yICR7YmFzZUlkfWApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG5cclxuICAgICAgLy8gQ3JlYXRlcyBvciB1cGRhdGVzIGEgc2luZ2xlIHN0b3AgRE9NIGVsZW1lbnQgYmFzZWQgb24gc3RvcCBkYXRhXHJcbiAgICAgIGZ1bmN0aW9uIHJlbmRlck9yVXBkYXRlU3RvcEVsZW1lbnQoc3RvcERhdGEpIHtcclxuICAgICAgICAgIGxldCBzdG9wRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHN0b3BEYXRhLmlkKTtcclxuXHJcbiAgICAgICAgICAvLyBDcmVhdGUgaWYgZG9lc24ndCBleGlzdCAoYW5kIGlzIG5vdCBhbiBlbmRwb2ludCAtIGVuZHBvaW50cyBhcmUgZml4ZWQgaW4gSFRNTClcclxuICAgICAgICAgIGlmICghc3RvcEVsZW1lbnQgJiYgIXN0b3BEYXRhLmlzRW5kcG9pbnQpIHtcclxuICAgICAgICAgICAgICBzdG9wRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgIHN0b3BFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ2NvbG9yLXN0b3AnKTtcclxuICAgICAgICAgICAgICBzdG9wRWxlbWVudC5pZCA9IHN0b3BEYXRhLmlkO1xyXG4gICAgICAgICAgICAgIHN0b3BFbGVtZW50LmlubmVySFRNTCA9IGBcclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbG9yLXByZXZpZXdcIj48L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjb2xvclwiPmA7XHJcbiAgICAgICAgICAgICAgY29sb3JTdG9wcy5hcHBlbmRDaGlsZChzdG9wRWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgLy8gQWRkIGhhbmRsZXJzIGZvciB0aGUgbmV3bHkgY3JlYXRlZCBlbGVtZW50XHJcbiAgICAgICAgICAgICAgc2V0dXBDb2xvcklucHV0SGFuZGxlcihzdG9wRGF0YS5pZCk7XHJcbiAgICAgICAgICAgICAgY29uc3QgcHJldmlldyA9IHN0b3BFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5jb2xvci1wcmV2aWV3Jyk7XHJcbiAgICAgICAgICAgICAgaWYgKHByZXZpZXcpIHtcclxuICAgICAgICAgICAgICAgICAgcHJldmlldy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoZSkgPT4gaGFuZGxlU3RvcERyYWdTdGFydChlLCBzdG9wRWxlbWVudCkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSBpZiAoIXN0b3BFbGVtZW50ICYmIHN0b3BEYXRhLmlzRW5kcG9pbnQpIHtcclxuICAgICAgICAgICAgICAvLyBUaGlzIGNhc2Ugc2hvdWxkIGlkZWFsbHkgbm90IGhhcHBlbiBpZiBIVE1MIGlzIGNvcnJlY3RcclxuICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFbmRwb2ludCBzdG9wIGVsZW1lbnQgbWlzc2luZyBpbiBET006ICR7c3RvcERhdGEuaWR9YCk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIFVwZGF0ZSBleGlzdGluZyBlbGVtZW50IChjb2xvciBwcmV2aWV3IGFuZCBoaWRkZW4gaW5wdXQgdmFsdWUpXHJcbiAgICAgICAgICBpZiAoc3RvcEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICBjb25zdCBwcmV2aWV3ID0gc3RvcEVsZW1lbnQucXVlcnlTZWxlY3RvcignLmNvbG9yLXByZXZpZXcnKTtcclxuICAgICAgICAgICAgICBjb25zdCBpbnB1dCA9IHN0b3BFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJjb2xvclwiXScpO1xyXG4gICAgICAgICAgICAgIGlmIChwcmV2aWV3KSBwcmV2aWV3LnN0eWxlLmJhY2tncm91bmRDb2xvciA9IHN0b3BEYXRhLmNvbG9yO1xyXG4gICAgICAgICAgICAgIGlmIChpbnB1dCkgaW5wdXQudmFsdWUgPSBzdG9wRGF0YS5jb2xvcjtcclxuICAgICAgICAgICAgICAvLyBQb3NpdGlvbiBpcyBoYW5kbGVkIHNlcGFyYXRlbHkgYnkgcG9zaXRpb25TdG9wcy91cGRhdGVHcmFkaWVudFxyXG4gICAgICAgICAgfVxyXG4gICAgICB9XHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgJy4vc3R5bGVzLmNzcyc7XG5pbXBvcnQgJy4vdWkuanMnO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9