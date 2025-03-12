// Initialize the map
var map = L.map('map').setView([-25.0, 133.0], 5); // Centered on Australia

// Add Esri World Imagery with Labels
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri & contributors'
}).addTo(map);

// Add Esri World Reference Overlay for place labels
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri & contributors'
}).addTo(map);

// Function to style polygons for Desktop Studies (original layer)
function getDesktopStudiesStyle(feature) {
    return {
        color: "#FFCC00",   // Bright yellow-orange border
        fillColor: "#FFFF66",  // Soft pastel yellow fill
        weight: 2,  
        opacity: 0.9,  
        fillOpacity: 0.2,  
        dashArray: "3, 7"  // More refined dotted border
    };
}

// Function to style polygons for Field Work (new layer)
function getFieldWorkStyle(feature) {
    return {
        color: "#FF0000",   // Red solid border
        fillColor: "rgba(255, 0, 0, 0.3)",  // Transparent red fill
        weight: 3,          // Thicker border
        opacity: 1,  
        fillOpacity: 0.3,   // Transparent red fill
        dashArray: "0"      // Solid border (no dashes)
    };
}

// Function to get the top-left (northwest) corner of a polygon
function getTopLeftCorner(coords) {
    let topLeft = coords[0]; // Start with the first coordinate
    coords.forEach(coord => {
        if (coord[1] > topLeft[1] || (coord[1] === topLeft[1] && coord[0] < topLeft[0])) {
            topLeft = coord;
        }
    });
    return [topLeft[1], topLeft[0]]; // Return as [lat, lon]
}

// Popup for Desktop Studies
function getDesktopStudiesPopupContent(feature) {
    return `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3); font-family: 'Helvetica Neue', sans-serif;">
            <h4 style="color: #1976D2; text-align: center;">${feature.properties["Project Name"]}</h4>
            <p style="color: #333; margin: 5px 0; font-size: 14px;"><b>📌 Project No:</b> ${feature.properties["Project No"]}</p>
            <p style="color: #333; margin: 5px 0; font-size: 14px;"><b>📅 Report Date:</b> ${feature.properties["Report Date"]}</p>
            <p style="color: #333; margin: 5px 0; font-size: 14px;"><b>🏗 Contractor:</b> ${feature.properties.Contractor}</p>
        </div>
    `;
}

// Popup for Field Work
function getFieldWorkPopupContent(feature) {
    return `
        <div style="background: #ffebee; padding: 15px; border-radius: 8px; box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3); font-family: 'Helvetica Neue', sans-serif;">
            <h4 style="color: #D32F2F; text-align: center;">${feature.properties["Clearance_Area_Name"]}</h4>
            <p style="color: #333; margin: 5px 0; font-size: 14px;"><b>📌 Project No:</b> ${feature.properties["Certificate_Number"]}</p>
            <p style="color: #333; margin: 5px 0; font-size: 14px;"><b>📅 Report Date:</b> ${feature.properties["Clearance_Date"]}</p>
            <p style="color: #333; margin: 5px 0; font-size: 14px;"><b>🏗 Contractor:</b> ${feature.properties["Survey_equipment_and_systems_used"]}</p>
        </div>
    `;
}

// Function to add GeoJSON polygons to the map
function addGeoJSONData(url, styleFunction, markerColor, popupFunction) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Add polygons to the map
            L.geoJSON(data, {
                style: styleFunction,
                onEachFeature: function (feature, layer) {
                    // Bind popup content specific to each layer
                    layer.bindPopup(popupFunction(feature));

                    // Smooth hover effect
                    layer.on("mouseover", function () {
                        this.setStyle({ 
                            fillOpacity: 0.7, 
                            weight: 3,
                            color: "#FFD700", // Lighter yellow glow effect
                        });
                    });
                    layer.on("mouseout", function () {
                        this.setStyle(styleFunction(feature));
                    });
                }
            }).addTo(map);

            // Add markers at the top-left corner of polygons with zoom control
            var markers = [];
            data.features.forEach(feature => {
                if (feature.geometry.type === "Polygon") {
                    var topLeft = getTopLeftCorner(feature.geometry.coordinates[0]);
                    var marker = L.circleMarker(topLeft, {
                        radius: 8,  // Larger marker size
                        fillColor: markerColor,  // Color based on layer type
                        color: markerColor, // Border color same as fill
                        weight: 3,
                        opacity: 1,
                        fillOpacity: 0.7,
                        minZoom: 12,  // Only show at zoom level 5 and below
                        maxZoom: 25  // Hide marker when zoomed in beyond level 12
                    }).addTo(map);
                    marker.bindPopup(`<b>${feature.properties["Project Name"]}</b>`);

                    markers.push(marker); // Store the marker
                }
            });

            // Function to hide/show markers based on zoom level
            function updateMarkers() {
                var currentZoom = map.getZoom();
                markers.forEach(marker => {
                    if (currentZoom <= marker.options.minZoom) {
                        marker.addTo(map);
                    } else {
                        marker.removeFrom(map);
                    }
                });
            }

            // Update markers when zoom level changes
            map.on('zoomend', updateMarkers);

            // Run the initial marker update to check visibility
            updateMarkers();
        })
        .catch(error => console.error('Error loading the GeoJSON file:', error));
}

// Load the NT_DTR.geojson file (Desktop Studies) with original style, blue markers, and Desktop Studies popup
addGeoJSONData('NT_DTR.geojson', getDesktopStudiesStyle, "#FFD700", getDesktopStudiesPopupContent);

// Load the NT_CC.geojson file (Field Work) with new style, red markers, and Field Work popup
addGeoJSONData('NT_CC.geojson', getFieldWorkStyle, "#FF0000", getFieldWorkPopupContent);

// Improved Legend Control
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    var div = L.DomUtil.create("div", "legend");
    div.style.background = "white";
    div.style.padding = "8px";
    div.style.borderRadius = "8px";  // Rounded corners
    div.style.boxShadow = "2px 2px 8px rgba(0, 0, 0, 0.2)"; // Soft shadow

    div.innerHTML = `<h4 style="margin-bottom: 5px;">Project Types</h4>
                     <i style="background: #FFFF66; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> UXO Survey<br>
                     <i style="background: #ffcc66; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> Environmental Assessment<br>
                     <i style="background: #ff6666; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> Other Projects<br>
                     <hr>
                     <i style="background: #FF0000; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> Field Work (Red)<br>
                     <i style="background: #0066CC; width: 12px; height: 12px; display: inline-block; margin-right: 5px;"></i> Desktop Studies<br>`;
    return div;
};

legend.addTo(map);
