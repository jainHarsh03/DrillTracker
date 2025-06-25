// Fixed JavaScript for drill-tracker frontend

// Enhanced renderCalendar function with click handlers and better drill indicators
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthElement = document.getElementById('currentMonth');
    
    if (!calendar || !monthElement) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    monthElement.textContent = currentCalendarDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    calendar.innerHTML = '';
    calendar.style.display = 'grid';
    calendar.style.gridTemplateColumns = 'repeat(7, 1fr)';
    calendar.style.gap = '1px';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.textAlign = 'center';
        dayHeader.style.padding = '10px';
        dayHeader.style.background = '#374151';
        dayHeader.style.color = '#a5f3fc';
        dayHeader.style.borderRadius = '4px';
        calendar.appendChild(dayHeader);
    });
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        emptyDay.style.padding = '10px';
        emptyDay.style.minHeight = '60px';
        emptyDay.style.background = '#1a1a1a';
        emptyDay.style.borderRadius = '4px';
        calendar.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.style.padding = '10px';
        dayElement.style.minHeight = '60px';
        dayElement.style.background = '#2a2a2a';
        dayElement.style.borderRadius = '4px';
        dayElement.style.cursor = 'pointer';
        dayElement.style.position = 'relative';
        dayElement.style.transition = 'all 0.3s ease';
        
        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.textContent = day;
        dayNumber.style.fontWeight = 'bold';
        dayNumber.style.marginBottom = '5px';
        dayElement.appendChild(dayNumber);
        
        // Check if this day has drills
        const dayDate = new Date(year, month, day);
        const dayDrills = drills.filter(drill => {
            const drillDate = new Date(drill.scheduledDate);
            return drillDate.toDateString() === dayDate.toDateString();
        });
        
        if (dayDrills.length > 0) {
            dayElement.classList.add('has-drill');
            dayElement.style.background = '#4f46e5';
            dayElement.style.border = '2px solid #ff6b9d';
            
            // Add drill indicators
            dayDrills.forEach((drill, index) => {
                if (index < 2) { // Show max 2 drills per day visually
                    const indicator = document.createElement('div');
                    indicator.className = 'drill-indicator';
                    indicator.textContent = drill.name || drill.drillName;
                    indicator.style.fontSize = '10px';
                    indicator.style.background = '#ff6b9d';
                    indicator.style.color = 'white';
                    indicator.style.padding = '2px 4px';
                    indicator.style.borderRadius = '2px';
                    indicator.style.marginBottom = '2px';
                    indicator.style.overflow = 'hidden';
                    indicator.style.textOverflow = 'ellipsis';
                    indicator.style.whiteSpace = 'nowrap';
                    dayElement.appendChild(indicator);
                }
            });
            
            if (dayDrills.length > 2) {
                const moreIndicator = document.createElement('div');
                moreIndicator.textContent = `+${dayDrills.length - 2} more`;
                moreIndicator.style.fontSize = '9px';
                moreIndicator.style.color = '#a3a3a3';
                dayElement.appendChild(moreIndicator);
            }
        }
        
        // Add click handler for each day
        dayElement.addEventListener('click', () => handleDateClick(dayDate, dayDrills));
        
        // Add hover effect
        dayElement.addEventListener('mouseenter', () => {
            dayElement.style.transform = 'scale(1.05)';
            dayElement.style.zIndex = '10';
        });
        
        dayElement.addEventListener('mouseleave', () => {
            dayElement.style.transform = 'scale(1)';
            dayElement.style.zIndex = '1';
        });
        
        calendar.appendChild(dayElement);
    }
}

// Handle date click - either show drills or allow adding new drill
function handleDateClick(date, dayDrills) {
    if (dayDrills.length > 0) {
        // Show existing drills for this day
        showDayDrillsModal(date, dayDrills);
    } else {
        // Pre-fill add drill modal with selected date
        showAddDrillModalWithDate(date);
    }
}

// Show modal with all drills for a specific day
function showDayDrillsModal(date, dayDrills) {
    // Create a modal to show all drills for this day
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1000';
    
    const modalContent = document.createElement('div');
    modalContent.style.background = '#2a2a2a';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '10px';
    modalContent.style.maxWidth = '500px';
    modalContent.style.width = '90%';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';
    
    const title = document.createElement('h2');
    title.textContent = `Drills for ${date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })}`;
    title.style.color = '#ff6b9d';
    title.style.marginBottom = '20px';
    modalContent.appendChild(title);
    
    dayDrills.forEach(drill => {
        const drillItem = document.createElement('div');
        drillItem.style.background = '#3a3a3a';
        drillItem.style.padding = '15px';
        drillItem.style.marginBottom = '10px';
        drillItem.style.borderRadius = '5px';
        drillItem.style.cursor = 'pointer';
        drillItem.style.border = '1px solid #4a4a4a';
        drillItem.style.transition = 'all 0.3s ease';
        
        drillItem.innerHTML = `
            <h3 style="color: #a5f3fc; margin-bottom: 5px;">${drill.name || drill.drillName}</h3>
            <p style="color: #a3a3a3; margin-bottom: 5px;">${new Date(drill.scheduledDate).toLocaleTimeString()}</p>
            <p style="color: #e0e0e0;">${drill.description || drill.notes || 'No description'}</p>
            <span style="background: #ff6b9d; color: white; padding: 2px 8px; border-radius: 10px; font-size: 12px;">${drill.status.toUpperCase()}</span>
        `;
        
        drillItem.addEventListener('click', () => {
            modal.remove();
            showDrillDetails(drill);
        });
        
        drillItem.addEventListener('mouseenter', () => {
            drillItem.style.background = '#4a4a4a';
        });
        
        drillItem.addEventListener('mouseleave', () => {
            drillItem.style.background = '#3a3a3a';
        });
        
        modalContent.appendChild(drillItem);
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕ Close';
    closeButton.style.background = '#ff6b9d';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.padding = '10px 20px';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.marginTop = '20px';
    closeButton.style.width = '100%';
    
    closeButton.addEventListener('click', () => modal.remove());
    modalContent.appendChild(closeButton);
    
    modal.appendChild(modalContent);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

// Show add drill modal with pre-filled date
function showAddDrillModalWithDate(date) {
    showAddDrillModal();
    
    // Pre-fill the date
    const dateInput = document.getElementById('newDrillDate');
    if (dateInput) {
        // Format date for datetime-local input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}T10:00`; // Default to 10:00 AM
    }
}

// Enhanced renderDrillsList function with pagination and filtering
function renderDrillsList() {
    const drillsList = document.getElementById('drillsList');
    if (!drillsList) return;
    
    drillsList.innerHTML = '';
    
    console.log('📋 Rendering drills list. Total drills:', drills.length);
    
    if (drills.length === 0) {
        drillsList.innerHTML = '<p style="text-align: center; color: #a3a3a3; padding: 20px;">No drills scheduled. Add your first drill to get started!</p>';
        return;
    }
    
    // Add a header with count
    const header = document.createElement('div');
    header.style.marginBottom = '15px';
    header.style.padding = '10px';
    header.style.background = '#2a2a2a';
    header.style.borderRadius = '5px';
    header.innerHTML = `
        <span style="color: #ff6b9d; font-weight: bold;">Total Drills: ${drills.length}</span>
        <span style="color: #a3a3a3; margin-left: 20px;">Click on any drill to view details</span>
    `;
    drillsList.appendChild(header);
    
    // Sort drills by date
    const sortedDrills = [...drills].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    
    sortedDrills.forEach((drill, index) => {
        const drillItem = document.createElement('div');
        drillItem.className = 'drill-item';
        drillItem.style.background = '#2a2a2a';
        drillItem.style.border = '1px solid #4a4a4a';
        drillItem.style.borderRadius = '8px';
        drillItem.style.padding = '15px';
        drillItem.style.marginBottom = '10px';
        drillItem.style.cursor = 'pointer';
        drillItem.style.transition = 'all 0.3s ease';
        drillItem.style.display = 'flex';
        drillItem.style.justifyContent = 'space-between';
        drillItem.style.alignItems = 'center';
        
        drillItem.addEventListener('mouseenter', () => {
            drillItem.style.background = '#3a3a3a';
            drillItem.style.borderColor = '#ff6b9d';
        });
        
        drillItem.addEventListener('mouseleave', () => {
            drillItem.style.background = '#2a2a2a';
            drillItem.style.borderColor = '#4a4a4a';
        });
        
        drillItem.onclick = () => showDrillDetails(drill);
        
        const drillInfo = document.createElement('div');
        drillInfo.className = 'drill-info';
        drillInfo.style.flex = '1';
        
        const drillName = document.createElement('h3');
        drillName.textContent = drill.name || drill.drillName;
        drillName.style.color = '#a5f3fc';
        drillName.style.marginBottom = '5px';
        drillName.style.fontSize = '18px';
        
        const drillDate = document.createElement('p');
        drillDate.textContent = new Date(drill.scheduledDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        drillDate.style.color = '#a3a3a3';
        drillDate.style.marginBottom = '5px';
        
        const drillDescription = document.createElement('p');
        drillDescription.textContent = drill.description || drill.notes || 'No description';
        drillDescription.style.color = '#e0e0e0';
        drillDescription.style.fontSize = '14px';
        drillDescription.style.maxWidth = '400px';
        drillDescription.style.overflow = 'hidden';
        drillDescription.style.textOverflow = 'ellipsis';
        drillDescription.style.whiteSpace = 'nowrap';
        
        drillInfo.appendChild(drillName);
        drillInfo.appendChild(drillDate);
        drillInfo.appendChild(drillDescription);
        
        const drillStatus = document.createElement('div');
        drillStatus.className = `drill-status ${drill.status}`;
        drillStatus.textContent = drill.status.toUpperCase();
        drillStatus.style.padding = '5px 10px';
        drillStatus.style.borderRadius = '15px';
        drillStatus.style.fontSize = '12px';
        drillStatus.style.fontWeight = 'bold';
        drillStatus.style.minWidth = '80px';
        drillStatus.style.textAlign = 'center';
        
        // Color code by status
        switch (drill.status.toLowerCase()) {
            case 'completed':
                drillStatus.style.background = '#22c55e';
                drillStatus.style.color = 'white';
                break;
            case 'scheduled':
                drillStatus.style.background = '#3b82f6';
                drillStatus.style.color = 'white';
                break;
            case 'missed':
                drillStatus.style.background = '#ef4444';
                drillStatus.style.color = 'white';
                break;
            default:
                drillStatus.style.background = '#6b7280';
                drillStatus.style.color = 'white';
        }
        
        drillItem.appendChild(drillInfo);
        drillItem.appendChild(drillStatus);
        
        drillsList.appendChild(drillItem);
    });
}

console.log('✅ Enhanced drill tracker functions loaded');
