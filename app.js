// Cities organized by continent (East to West)
const citiesByContinent = {
    'Australia/Oceania': {
        'Auckland': 'Pacific/Auckland',
        'Wellington': 'Pacific/Auckland',
        'Sydney': 'Australia/Sydney',
        'Melbourne': 'Australia/Melbourne',
        'Brisbane': 'Australia/Brisbane',
        'Adelaide': 'Australia/Adelaide',
        'Darwin': 'Australia/Darwin',
        'Perth': 'Australia/Perth',
        'Port Moresby': 'Pacific/Port_Moresby',
        'Suva': 'Pacific/Fiji'
    },
    'Asia': {
        'Tokyo': 'Asia/Tokyo',
        'Seoul': 'Asia/Seoul',
        'Shanghai': 'Asia/Shanghai',
        'Hong Kong': 'Asia/Hong_Kong',
        'Manila': 'Asia/Manila',
        'Singapore': 'Asia/Singapore',
        'Bangkok': 'Asia/Bangkok',
        'Jakarta': 'Asia/Jakarta',
        'Dhaka': 'Asia/Dhaka',
        'Mumbai': 'Asia/Kolkata',
        'Karachi': 'Asia/Karachi',
        'Dubai': 'Asia/Dubai',
        'Moscow': 'Europe/Moscow'
    },
    'Europe': {
        'Istanbul': 'Europe/Istanbul',
        'Helsinki': 'Europe/Helsinki',
        'Athens': 'Europe/Athens',
        'Bucharest': 'Europe/Bucharest',
        'Kiev': 'Europe/Kiev',
        'Berlin': 'Europe/Berlin',
        'Paris': 'Europe/Paris',
        'Rome': 'Europe/Rome',
        'Barcelona': 'Europe/Madrid',
        'Amsterdam': 'Europe/Amsterdam',
        'London': 'Europe/London',
        'Dublin': 'Europe/Dublin',
        'Lisbon': 'Europe/Lisbon'
    },
    'North America': {
        'Atlanta': 'America/New_York',
        'Halifax': 'America/Halifax',
        'Manchester, NH': 'America/New_York',
        'New York': 'America/New_York',
        'Toronto': 'America/Toronto',
        'Chicago': 'America/Chicago',
        'Mexico City': 'America/Mexico_City',
        'Denver': 'America/Denver',
        'Phoenix': 'America/Phoenix',
        'Los Angeles': 'America/Los_Angeles',
        'Vancouver': 'America/Vancouver',
        'Anchorage': 'America/Anchorage',
        'Honolulu': 'Pacific/Honolulu'
    },
    'South America': {
        'Buenos Aires': 'America/Argentina/Buenos_Aires',
        'Montevideo': 'America/Montevideo',
        'Sao Paulo': 'America/Sao_Paulo',
        'Rio de Janeiro': 'America/Sao_Paulo',
        'Brasilia': 'America/Sao_Paulo',
        'Santiago': 'America/Santiago',
        'La Paz': 'America/La_Paz',
        'Lima': 'America/Lima',
        'Quito': 'America/Guayaquil',
        'Bogota': 'America/Bogota',
        'Caracas': 'America/Caracas'
    }
};

// Create a flattened lookup for city to timezone mapping
const cityToTimezone = Object.entries(citiesByContinent).reduce((acc, [_, cities]) => {
    return { ...acc, ...cities };
}, {});

// Consistent UTC offset formatter
function formatUtcOffset(offsetHours) {
    const sign = offsetHours >= 0 ? '+' : '-';
    const totalMinutes = Math.round(Math.abs(offsetHours) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `UTC${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

// Initialize cities array from localStorage or empty if none saved
const cities = JSON.parse(localStorage.getItem('selectedCities')) || [];

// Detect user's local timezone and map to a city name in list (first match)
const userLocalTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let localCityName = null;
for (const continent of Object.keys(citiesByContinent)) {
    for (const [cityName, tz] of Object.entries(citiesByContinent[continent])) {
        if (tz === userLocalTimezone) {
            localCityName = cityName;
            break;
        }
    }
    if (localCityName) break;
}

// Auto-add local city if not already selected
if (localCityName && !cities.some(c => c.name === localCityName)) {
    cities.push({ name: localCityName });
    // Sort after insertion (east to west)
    cities.sort((a, b) => {
        const tzA = cityToTimezone[a.name];
        const tzB = cityToTimezone[b.name];
        const now = new Date();
        const tzDateA = new Date(now.toLocaleString('en-US', { timeZone: tzA }));
        const utcDateA = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDateB = new Date(now.toLocaleString('en-US', { timeZone: tzB }));
        const utcDateB = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const offsetA = (tzDateA - utcDateA) / 3600000;
        const offsetB = (tzDateB - utcDateB) / 3600000;
        return offsetB - offsetA;
    });
    saveCities();
}

// Function to save cities to localStorage
function saveCities() {
    localStorage.setItem('selectedCities', JSON.stringify(cities));
}

// Function to get timezone offset in hours
function getTimezoneOffset(timezone) {
    // Robust offset calculation using actual Date differences (handles day rollovers correctly)
    const now = new Date();
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    return (tzDate - utcDate) / 3600000; // hours (can be fractional)
}

// Function to format time with hours and minutes
function formatTime(hours) {
    const wholeHours = Math.floor(hours) % 24;
    const totalMinutes = (hours % 1) * 60;
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.floor((totalMinutes % 1) * 60);
    
    // Handle hour rollover
    if (seconds === 60) {
        return `${String((wholeHours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return `${String(wholeHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Canonical current exact Date (updates every second while not fixed by slider)
let currentExactDate = new Date();

// Get the base date for time calculations: either live exact time or slider-selected time
function getBaseDate() {
    if (!isTimeFixed) {
        return currentExactDate;
    }

    // Slider-selected time (may be outside 0-24 to explore previous/next day)
    const slider = document.getElementById('timeSlider');
    let rawValue = parseFloat(slider.value);
    let dayOffsetFromSlider = 0;

    // Preserve extended range semantics: each +/-24 outside range shifts the day
    while (rawValue < 0) { rawValue += 24; dayOffsetFromSlider -= 1; }
    while (rawValue >= 24) { rawValue -= 24; dayOffsetFromSlider += 1; }

    const hours = Math.floor(rawValue);
    const minutes = Math.floor((rawValue % 1) * 60);

    const base = new Date(); // today, local timezone
    base.setHours(hours, minutes, 0, 0);
    if (dayOffsetFromSlider !== 0) {
        base.setDate(base.getDate() + dayOffsetFromSlider);
    }
    return base;
}

// Format city time given a base date (either live now or slider-selected) and target timezone
function formatCityTime(baseDate, cityTimezone) {
    // Local day vs target day to compute offset
    const localDay = baseDate.getDate();
    const targetDate = new Date(baseDate.toLocaleString('en-US', { timeZone: cityTimezone }));
    const targetDay = targetDate.getDate();

    // Time string in target timezone
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: cityTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const timeStr = timeFormatter.format(baseDate);

    let dayDiff = targetDay - localDay;
    // Month boundary heuristic (retain original logic)
    if (dayDiff < -27) dayDiff = 1;
    if (dayDiff > 27) dayDiff = -1;

    if (dayDiff !== 0) {
        return `${timeStr}<br><small class="day-offset">(day${dayDiff > 0 ? '+' : ''}${dayDiff})</small>`;
    }
    return timeStr;
}

// Function to toggle continent group collapse state
function toggleContinentGroup(continentCities, arrow) {
    const isCollapsed = continentCities.classList.toggle('collapsed');
    arrow.classList.toggle('collapsed', isCollapsed);
}

// Function to render available cities in the left pane
function renderAvailableCities() {
    const container = document.getElementById('availableCities');
    container.innerHTML = '';
    
    // Sort continents by their easternmost city's offset
    const sortedContinents = Object.entries(citiesByContinent).sort(([, citiesA], [, citiesB]) => {
        const maxOffsetA = Math.max(...Object.values(citiesA).map(tz => getTimezoneOffset(tz)));
        const maxOffsetB = Math.max(...Object.values(citiesB).map(tz => getTimezoneOffset(tz)));
        return maxOffsetB - maxOffsetA; // Larger offset (more east) comes first
    });
    
    sortedContinents.forEach(([continent, continentCities]) => {
        const continentGroup = document.createElement('div');
        continentGroup.className = 'continent-group';
        
        const continentHeader = document.createElement('div');
        continentHeader.className = 'continent-header';
        
        const headerText = document.createElement('span');
        headerText.textContent = continent;
        
        const arrow = document.createElement('span');
        arrow.className = 'collapse-arrow';
        arrow.textContent = '';
        
        continentHeader.appendChild(headerText);
        continentHeader.appendChild(arrow);
        
        const citiesContainer = document.createElement('div');
        citiesContainer.className = 'continent-cities expanded';
        
        continentHeader.onclick = () => toggleContinentGroup(citiesContainer, arrow);
        
        // Sort cities by timezone offset (east to west)
        const sortedCities = Object.keys(continentCities).sort((a, b) => {
            const offsetA = getTimezoneOffset(continentCities[a]);
            const offsetB = getTimezoneOffset(continentCities[b]);
            return offsetB - offsetA; // Larger offset (more east) comes first
        });
        
        sortedCities.forEach(cityName => {
            const isAdded = cities.some(city => city.name === cityName);
            const isLocal = cityName === localCityName;
            const cityElement = document.createElement('div');
            cityElement.className = `city-list-item ${isAdded ? 'added' : ''} ${isLocal ? 'local-city' : ''}`;
            
            const timezone = continentCities[cityName];
            const offset = getTimezoneOffset(timezone);
            cityElement.innerHTML = `${cityName} (${formatUtcOffset(offset)})${isLocal ? ' <span class="local-tag">(Local)</span>' : ''}`;
            
            if (!isAdded && !isLocal) {
                cityElement.onclick = (e) => {
                    e.stopPropagation();
                    addCity(cityName);
                };
            }
            
            citiesContainer.appendChild(cityElement);
        });
        
        continentGroup.appendChild(continentHeader);
        continentGroup.appendChild(citiesContainer);
        container.appendChild(continentGroup);
    });
}

// Function to render selected cities
function renderCities() {
    const container = document.getElementById('citiesContainer');
    container.innerHTML = '';
    
    if (cities.length === 0) {
        return;
    }
    
    // Cities are already sorted in addCity, use them directly
    cities.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.className = 'city-container';
        
        const timezone = cityToTimezone[city.name];
    const offset = getTimezoneOffset(timezone);
        
        const baseDate = getBaseDate();
        const timeDisplay = formatCityTime(baseDate, cityToTimezone[city.name]);
        
        // Split the time display into time and day offset
        let timeStr = timeDisplay;
        let dayOffsetStr = '';
        if (timeDisplay.includes('day')) {
            const parts = timeDisplay.split('<br>');
            timeStr = parts[0];
            dayOffsetStr = parts[1].replace('<small class="day-offset">', '').replace('</small>', '');
        }
        
        const localTag = city.name === localCityName ? ' <span class="local-tag">(Local)</span>' : '';
        const deleteBtn = city.name === localCityName ? '' : `<button class="delete-btn" onclick="deleteCity(${cities.indexOf(city)})">×</button>`;
        cityElement.innerHTML = `
            <div class="city-info">
                <h2>${city.name} (${formatUtcOffset(offset)})${localTag}</h2>
            </div>
            <div class="time">${timeStr}</div>
            <div class="day-offset">${dayOffsetStr}</div>
            ${deleteBtn}
        `;
        
        container.appendChild(cityElement);
    });
}

// Update city markers above the slider to visualize relative time positions
function updateCityMarkers() {
    const topContainer = document.getElementById('cityMarkersTop');
    const bottomContainer = document.getElementById('cityMarkersBottom');
    if (!topContainer || !bottomContainer) return;
    topContainer.innerHTML = '';
    bottomContainer.innerHTML = '';
    if (cities.length === 0) return;

    const slider = document.getElementById('timeSlider');
    const sliderWidth = slider.offsetWidth;
    const sliderRect = slider.getBoundingClientRect();
    const routeWrapper = slider.closest('.slider-route-wrapper');
    const wrapperRect = routeWrapper ? routeWrapper.getBoundingClientRect() : sliderRect;
    const horizontalOffset = sliderRect.left - wrapperRect.left;
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const span = max - min;

    const baseDate = getBaseDate();
    const anchor = parseFloat(slider.value);

    // Find local city index
    const localIdx = cities.findIndex(city => city.name === localCityName);
    // If not found, fallback to first city
    const anchorIdx = localIdx !== -1 ? localIdx : 0;

    cities.forEach((city, idx) => {
        const tz = cityToTimezone[city.name];
        const cityDate = new Date(baseDate.toLocaleString('en-US', { timeZone: tz }));
        const diffMs = cityDate.getTime() - baseDate.getTime();
        let offsetHours = diffMs / 3600000;
        let positionHours = anchor + offsetHours;
        while (positionHours < min) positionHours += 24;
        while (positionHours > max) positionHours -= 24;
        const percent = (positionHours - min) / span;
        const leftPx = horizontalOffset + percent * sliderWidth;

        const localDay = baseDate.getDate();
        const cityDay = cityDate.getDate();
        let dayDiff = cityDay - localDay;
        if (dayDiff < -27) dayDiff = 1;
        if (dayDiff > 27) dayDiff = -1;

        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const timeStr = formatter.format(baseDate);

        // Create tick/line element as sibling to marker
        const tick = document.createElement('div');
        // Determine tick direction: 'down' for top row, 'up' for bottom row
        let tickDirection = 'down';
        if (idx !== anchorIdx) {
            if (idx < anchorIdx) {
                tickDirection = ((idx % 2) === 0) ? 'up' : 'down';
            } else {
                tickDirection = (((idx - anchorIdx) % 2) === 1) ? 'up' : 'down';
            }
        }
        tick.className = 'city-marker-tick ' + tickDirection;
        tick.style.left = leftPx + 'px';

        // Create marker box
        const marker = document.createElement('div');
        marker.className = 'city-marker';
        if (dayDiff > 0) marker.classList.add('day-plus');
        else if (dayDiff < 0) marker.classList.add('day-minus');
        marker.style.left = leftPx + 'px';
        marker.innerHTML = `<span class="marker-name">${city.name}</span><span class="marker-time">${timeStr}${dayDiff !== 0 ? ` (d${dayDiff>0?'+':''}${dayDiff})` : ''}</span>${city.name !== localCityName ? `<button class=\"marker-delete\" title=\"Delete city\">&times;</button>` : ''}`;
        // Attach event listener to delete button if present
        if (city.name !== localCityName) {
            const btn = marker.querySelector('.marker-delete');
            if (btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    deleteCityByName(city.name);
                });
            }
        }

        // Local city always at top, but no tick marker
        if (idx === anchorIdx) {
            topContainer.appendChild(marker);
        } else {
            if (idx < anchorIdx) {
                if ((idx % 2) === 0) {
                    bottomContainer.appendChild(tick);
                    bottomContainer.appendChild(marker);
                } else {
                    topContainer.appendChild(tick);
                    topContainer.appendChild(marker);
                }
            } else {
                if (((idx - anchorIdx) % 2) === 1) {
                    bottomContainer.appendChild(tick);
                    bottomContainer.appendChild(marker);
                } else {
                    topContainer.appendChild(tick);
                    topContainer.appendChild(marker);
                }
            }
        }
    });
}

// Function to add a new city
function addCity(cityName) {
    if (cityName && !cities.some(city => city.name === cityName)) {
        // Add the new city
        cities.push({ name: cityName });
        
        // Sort cities east to west based on raw timezone offset
        cities.sort((a, b) => {
            // Extract the UTC offset from the timezone string
            const getOffset = (city) => {
                const tz = cityToTimezone[city.name];
                const now = new Date();
                const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
                const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
                return (tzDate - utcDate) / (1000 * 60 * 60); // Convert to hours
            };
            
            return getOffset(b) - getOffset(a); // Higher offset (east) first
        });
        
        saveCities();
        renderCities();
        renderAvailableCities();
    }
}

// Function to delete a city
function deleteCity(index) {
    const city = cities[index];
    if (city && city.name === localCityName) {
        // Do not remove local city
        return;
    }
    cities.splice(index, 1);
    saveCities();
    renderCities();
    renderAvailableCities();
}

// Robust city delete by name for slider bar
function deleteCityByName(cityName) {
    const idx = cities.findIndex(c => c.name === cityName);
    if (idx !== -1) {
        cities.splice(idx, 1);
        saveCities();
        renderCities();
        renderAvailableCities();
        updateCityMarkers();
    }
}

// Track slider and time states
let isSliderBeingDragged = false;
let isTimeFixed = false;

// Function to update to current time
function updateToCurrentTime() {
    currentExactDate = new Date(); // refresh canonical exact time
    const now = currentExactDate;
    const slider = document.getElementById('timeSlider');
    
    // Only update slider position if time is not fixed
    if (!isTimeFixed) {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const value = hours + (minutes / 60) + (seconds / 3600);
        slider.value = value;
        // Update aria-valuetext for accessibility to convey current local time
        slider.setAttribute('aria-valuetext', `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`);
    }
    
    renderCities();
    updateCityMarkers();
    
    // Update every second
    setTimeout(updateToCurrentTime, 1000);
}

// Event listeners setup
document.getElementById('currentTimeBtn').addEventListener('click', () => {
    isSliderBeingDragged = false;
    isTimeFixed = false;
    currentExactDate = new Date();
    const slider = document.getElementById('timeSlider');
    const now = currentExactDate;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    slider.value = hours + (minutes / 60) + (seconds / 3600);
    slider.setAttribute('aria-valuetext', `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`);
    renderCities();
    updateCityMarkers();
});

const timeSlider = document.getElementById('timeSlider');

// Function to handle slider value changes
function handleSliderChange() {
    const value = parseFloat(timeSlider.value);
    
    // Update times and display
    renderCities();
    updateCityMarkers();
}

// Set slider attributes
timeSlider.min = -12;
timeSlider.max = 36;
timeSlider.step = 0.25; // 15 minute intervals

timeSlider.addEventListener('mousedown', () => {
    isSliderBeingDragged = true;
    isTimeFixed = true;
});

timeSlider.addEventListener('mouseup', () => {
    isSliderBeingDragged = false;
    // Keep isTimeFixed true to maintain slider position
});

timeSlider.addEventListener('input', function(e) {
    isSliderBeingDragged = true;
    isTimeFixed = true;
    // Normalize the display value to 0-24 range for aria-valuetext only
    let displayValue = parseFloat(this.value);
    while (displayValue < 0) displayValue += 24;
    while (displayValue >= 24) displayValue -= 24;
    
    const hours = Math.floor(displayValue);
    const minutes = Math.floor((displayValue % 1) * 60);
    this.setAttribute('aria-valuetext', `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`);
    
    handleSliderChange();
});

// Set user's local timezone name
document.getElementById('localTimezone').textContent = 
    new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2];

// Initial setup
updateToCurrentTime();
renderCities();
renderAvailableCities();
updateCityMarkers();

// Sidebar collapse/expand persistence
function applySidebarState() {
    const saved = localStorage.getItem('sidebarCollapsed') === 'true';
    const sidebar = document.getElementById('sidebar');
    const container = document.querySelector('.container');
    const floatingToggle = document.getElementById('sidebarFloatingToggle');
    if (saved) {
        sidebar.classList.add('collapsed');
        container.classList.add('sidebar-collapsed');
        floatingToggle.textContent = '⟩';
        floatingToggle.title = 'Expand sidebar';
    } else {
        sidebar.classList.remove('collapsed');
        container.classList.remove('sidebar-collapsed');
        floatingToggle.textContent = '⟨';
        floatingToggle.title = 'Collapse sidebar';
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const container = document.querySelector('.container');
    const floatingToggle = document.getElementById('sidebarFloatingToggle');
    const willCollapse = !sidebar.classList.contains('collapsed');
    if (willCollapse) {
        sidebar.classList.add('collapsed');
        container.classList.add('sidebar-collapsed');
        floatingToggle.textContent = '⟩';
        floatingToggle.title = 'Expand sidebar';
    } else {
        sidebar.classList.remove('collapsed');
        container.classList.remove('sidebar-collapsed');
        floatingToggle.textContent = '⟨';
        floatingToggle.title = 'Collapse sidebar';
    }
    localStorage.setItem('sidebarCollapsed', String(willCollapse));
    setTimeout(updateCityMarkers, 200);
}

document.getElementById('sidebarFloatingToggle').addEventListener('click', toggleSidebar);
applySidebarState();

// Recompute positions on resize (debounced)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateCityMarkers();
    }, 150);
});
