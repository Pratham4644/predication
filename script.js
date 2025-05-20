// Global Variables
let map;
let directionsService;
let directionsRenderer;
let trafficLayer;
let currentLocationMarker;
let watchId;
let isNavigating = false;
let currentRoute = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initUI();
    
    // Initialize map (this will be called by Google Maps API callback)
    window.initMap = initMap;
    
    // Check if browser supports geolocation
    if (navigator.geolocation) {
        updateGPSStatus(true);
    } else {
        updateGPSStatus(false);
        alert("Geolocation is not supported by this browser.");
    }
});

// Initialize UI elements and event listeners
function initUI() {
    // Tab switching
    document.getElementById('favorites-tab').addEventListener('click', function() {
        switchTab('favorites');
    });
    
    document.getElementById('collections-tab').addEventListener('click', function() {
        switchTab('collections');
    });
    
    // Directions panel
    document.getElementById('directions-btn').addEventListener('click', toggleDirectionsPanel);
    document.getElementById('close-directions-btn').addEventListener('click', toggleDirectionsPanel);
    document.getElementById('get-directions-btn').addEventListener('click', getDirections);
    document.getElementById('start-navigation-btn').addEventListener('click', startNavigation);
    
    // More menu
    document.getElementById('more-btn').addEventListener('click', toggleMoreMenu);
    document.getElementById('close-more-menu').addEventListener('click', toggleMoreMenu);
    
    // Map controls
    document.getElementById('traffic-layer-btn').addEventListener('click', toggleTrafficLayer);
    document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
    document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);
    document.getElementById('compass-btn').addEventListener('click', resetCompass);
    document.getElementById('report-btn').addEventListener('click', showReportModal);
    document.getElementById('voice-toggle').addEventListener('click', toggleVoiceGuidance);
    
    // Report modal
    document.getElementById('submit-report').addEventListener('click', submitTrafficReport);
    document.getElementById('cancel-report').addEventListener('click', hideReportModal);
    
    // Simulate traffic changes (for demo)
    setInterval(simulateTrafficChange, 5000);
}

// Initialize Google Map
function initMap() {
    // Default to Sangli, India coordinates
    const sangli = { lat: 16.8524, lng: 74.5815 };
    
    // Create map
    map = new google.maps.Map(document.getElementById('map'), {
        center: sangli,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false
    });
    
    // Initialize services
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true
    });
    
    // Initialize traffic layer
    trafficLayer = new google.maps.TrafficLayer();
    
    // Add click listener to map
    map.addListener('click', function(e) {
        if (isNavigating) {
            addWaypoint(e.latLng);
        }
    });
    
    // Try to get current location
    getCurrentLocation();
}

// Switch between tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'favorites') {
        document.getElementById('favorites-tab').classList.add('active');
        document.getElementById('favorites-content').classList.add('active');
    } else {
        document.getElementById('collections-tab').classList.add('active');
        document.getElementById('collections-content').classList.add('active');
    }
}

// Toggle directions panel
function toggleDirectionsPanel() {
    const panel = document.getElementById('directions-panel');
    panel.classList.toggle('hidden');
    
    if (!panel.classList.contains('hidden')) {
        // Focus on start location input when panel opens
        document.getElementById('start-location').focus();
    }
}

// Get directions between two points
function getDirections() {
    const start = document.getElementById('start-location').value;
    const end = document.getElementById('end-location').value;
    
    if (!start || !end) {
        alert('Please enter both start and end locations');
        return;
    }
    
    const request = {
        origin: start,
        destination: end,
        travelMode: 'DRIVING',
        provideRouteAlternatives: true
    };
    
    directionsService.route(request, function(result, status) {
        if (status === 'OK') {
            displayDirections(result);
            document.getElementById('start-navigation-btn').classList.remove('hidden');
            currentRoute = result.routes[0];
        } else {
            alert('Directions request failed: ' + status);
        }
    });
}

// Display directions results
function displayDirections(result) {
    const directionsResult = document.getElementById('directions-result');
    directionsResult.innerHTML = '';
    
    const route = result.routes[0]; // Get the first route
    
    // Display summary
    const summary = document.createElement('div');
    summary.className = 'direction-summary';
    summary.innerHTML = `
        <h4>${route.summary}</h4>
        <p>Distance: ${route.legs[0].distance.text}</p>
        <p>Duration: ${route.legs[0].duration.text}</p>
    `;
    directionsResult.appendChild(summary);
    
    // Display each step
    route.legs[0].steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'direction-step';
        stepDiv.innerHTML = `
            <div class="step-number">${index + 1}</div>
            <div class="step-instruction">${step.instructions}</div>
            <div class="step-distance">${step.distance.text}</div>
        `;
        directionsResult.appendChild(stepDiv);
    });
    
    // Render the route on the map
    directionsRenderer.setDirections(result);
}

// Start navigation
function startNavigation() {
    if (!currentRoute) return;
    
    isNavigating = true;
    document.getElementById('nav-guidance').classList.remove('hidden');
    document.getElementById('start-navigation-btn').textContent = 'Stop Navigation';
    document.getElementById('start-navigation-btn').removeEventListener('click', startNavigation);
    document.getElementById('start-navigation-btn').addEventListener('click', stopNavigation);
    
    // Start updating navigation guidance
    updateNavigationGuidance(currentRoute.legs[0].steps);
    
    // Start watching position
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            updatePosition,
            handleLocationError,
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
    }
}

// Stop navigation
function stopNavigation() {
    isNavigating = false;
    document.getElementById('nav-guidance').classList.add('hidden');
    document.getElementById('start-navigation-btn').textContent = 'Start Navigation';
    document.getElementById('start-navigation-btn').removeEventListener('click', stopNavigation);
    document.getElementById('start-navigation-btn').addEventListener('click', startNavigation);
    
    // Stop watching position
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }
}

// Update navigation guidance
function updateNavigationGuidance(steps) {
    // For demo, we'll just show the first step
    if (steps.length > 0) {
        const currentStep = steps[0];
        document.getElementById('step-instruction').innerHTML = currentStep.instructions;
        document.getElementById('step-distance').textContent = currentStep.distance.text;
        document.getElementById('step-duration').textContent = currentStep.duration.text;
    }
    
    // Update stats (simulated for demo)
    document.getElementById('current-speed').textContent = '45';
    document.getElementById('eta').textContent = '12:45 PM';
    document.getElementById('distance-remaining').textContent = '8.5 km';
}

// Toggle traffic layer
function toggleTrafficLayer() {
    if (trafficLayer.getMap()) {
        trafficLayer.setMap(null);
    } else {
        trafficLayer.setMap(map);
    }
}

// Zoom in
function zoomIn() {
    map.setZoom(map.getZoom() + 1);
}

// Zoom out
function zoomOut() {
    map.setZoom(map.getZoom() - 1);
}

// Reset compass orientation
function resetCompass() {
    map.setHeading(0);
    map.setTilt(0);
}

// Show report modal
function showReportModal() {
    document.getElementById('report-modal').classList.remove('hidden');
}

// Hide report modal
function hideReportModal() {
    document.getElementById('report-modal').classList.add('hidden');
}

// Submit traffic report
function submitTrafficReport() {
    const issueType = document.getElementById('issue-type').value;
    const description = document.getElementById('issue-description').value;
    
    // In a real app, you would send this to your backend
    console.log('Traffic report submitted:', { issueType, description });
    
    alert('Thank you for your report!');
    hideReportModal();
}

// Toggle voice guidance
function toggleVoiceGuidance() {
    const voiceToggle = document.getElementById('voice-toggle');
    if (voiceToggle.classList.contains('active')) {
        voiceToggle.classList.remove('active');
        // Stop voice guidance
    } else {
        voiceToggle.classList.add('active');
        // Start voice guidance
    }
}

// Toggle more menu
function toggleMoreMenu() {
    document.getElementById('more-menu').classList.toggle('hidden');
}

// Get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                updatePosition(position);
                updateGPSStatus(true);
            },
            function(error) {
                handleLocationError(error);
                updateGPSStatus(false);
            }
        );
    }
}

// Update position on map
function updatePosition(position) {
    const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };
    
    // Update or create marker
    if (!currentLocationMarker) {
        currentLocationMarker = new google.maps.Marker({
            position: pos,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: 'white'
            },
            title: 'Your Location'
        });
    } else {
        currentLocationMarker.setPosition(pos);
    }
    
    // Center map on position if not navigating
    if (!isNavigating) {
        map.setCenter(pos);
    }
    
    // Update speed if available
    if (position.coords.speed) {
        const speedKmh = Math.round(position.coords.speed * 3.6);
        document.getElementById('current-speed').textContent = speedKmh;
    }
}

// Handle location errors
function handleLocationError(error) {
    let message = '';
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            message = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            message = "An unknown error occurred.";
            break;
    }
    console.error('Geolocation error:', message);
    updateGPSStatus(false);
}

// Update GPS status display
function updateGPSStatus(active) {
    const gpsStatus = document.getElementById('gps-status');
    if (active) {
        gpsStatus.classList.remove('gps-inactive');
        gpsStatus.classList.add('gps-active');
        gpsStatus.querySelector('.gps-text').textContent = 'GPS Active';
    } else {
        gpsStatus.classList.remove('gps-active');
        gpsStatus.classList.add('gps-inactive');
        gpsStatus.querySelector('.gps-text').textContent = 'GPS Offline';
    }
}

// Simulate traffic changes (for demo)
function simulateTrafficChange() {
    const trafficLights = [
        document.getElementById('traffic-light-1'),
        document.getElementById('traffic-light-2'),
        document.getElementById('traffic-light-3')
    ];
    
    const statuses = ['Heavy', 'Moderate', 'Light'];
    const colors = ['#e74c3c', '#f39c12', '#2ecc71'];
    
    // Randomly select a traffic status
    const randomIndex = Math.floor(Math.random() * 3);
    
    // Update traffic lights
    trafficLights.forEach((light, index) => {
        light.classList.toggle('active', index === randomIndex);
    });
    
    // Update traffic message
    document.getElementById('traffic-message').textContent = `Traffic: ${statuses[randomIndex]}`;
    
    // If we have a traffic layer, we could update its data here
}

// Add waypoint during navigation
function addWaypoint(latLng) {
    if (!isNavigating || !currentRoute) return;
    
    // In a real app, you would recalculate the route with this waypoint
    alert('Waypoint added at: ' + latLng.lat() + ', ' + latLng.lng());
}