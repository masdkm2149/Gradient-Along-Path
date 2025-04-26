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
