// Initialize the map
var map = L.map('map').setView([-25.0, 133.0], 5); // Centered on Australia

// Add high-quality basemap (Esri Satellite)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri & contributors'
}).addTo(map);

// Function to style polygons
function getPolygonStyle(feature) {
    return {
        color: "#0044cc",   // Dark blue border
        fillColor: "#66a3ff",  // Light blue fill
        weight: 2,
        opacity: 1,
        fillOpacity: 0.4,
        dashArray: "5, 5"  // Dashed borders
    };
}

// Load the GeoJSON file dynamically
fetch('projects.geojson')
    .then(response => response.json())
    .then(data => {
        // Add polygons to the map
        L.geoJSON(data, {
            style: getPolygonStyle,
            onEachFeature: function (feature, layer) {
                var popupContent = `<b>Project Name:</b> ${feature.properties.name}<br>
                                    <b>Year:</b> ${feature.properties.year}<br>
                                    <b>Description:</b> ${feature.properties.description}`;
                layer.bindPopup(popupContent);

                // Hover effect
                layer.on("mouseover", function () {
                    this.setStyle({ fillOpacity: 0.7, weight: 3 });
                });
                layer.on("mouseout", function () {
                    this.setStyle(getPolygonStyle(feature));
                });
            }
        }).addTo(map);

        // Add default Leaflet markers at polygon centroids
        data.features.forEach(feature => {
            if (feature.geometry.type === "Polygon") {
                var centroid = getCentroid(feature.geometry.coordinates[0]);
                var marker = L.marker(centroid).addTo(map);
                marker.bindPopup(`<b>${feature.properties.name}</b>`);
            }
        });
    })
    .catch(error => console.error('Error loading the GeoJSON file:', error));

// Function to calculate centroid of a polygon
function getCentroid(coords) {
    var x = 0, y = 0, n = coords.length;
    coords.forEach(coord => {
        x += coord[0];
        y += coord[1];
    });
    return [y / n, x / n]; // Leaflet uses [lat, lon]
}

// Legend Control
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML = `<h4>Project Types</h4>
                     <i style="background: #66a3ff"></i> UXO Survey<br>
                     <i style="background: #ffcc66"></i> Environmental Assessment<br>
                     <i style="background: #ff6666"></i> Other Projects<br>`;
    return div;
};

legend.addTo(map);
