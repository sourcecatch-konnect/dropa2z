import {vehicleMarker} from '../../../design/vehicleArtwork';
import {mapVehicleMarker} from '../../../design/mapVehicleMarkers';
import React, {useRef, useEffect, useState} from "react";
import {View, StyleSheet, Image} from 'react-native';
import {Text} from '../../../design/Typography';
import {WebView} from "react-native-webview";

interface Coord {
  lat: number;
  lng: number;
}

interface MapScreenProps {
  mapType: "googleMap" | "osm" | any;
  pickupCoords: Coord;
  stopsCoords: Coord[]; // up to 3 stops
  destinationCoords: Coord;
  isDark: boolean;
  Google_Map_Key: string;
  isPulsing: boolean;
  nearbyVehicle?: Coord | null;
  vehicleMarkerImage?: string | null;
  vehicleLabel?: string;
}

const fallbackVehicleIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#fff" stroke="#195594" stroke-width="3"/><path d="M11 27h26l-2-9H21l-5 5h-5z" fill="#195594"/><path d="M19 18h14l-1.4-6H23z" fill="#195594"/><circle cx="17" cy="31" r="3.5" fill="#17324f"/><circle cx="32" cy="31" r="3.5" fill="#17324f"/><path d="M24 12V8h9" fill="none" stroke="#195594" stroke-width="2.5" stroke-linecap="round"/></svg>',
)}`;

const distanceInKm = (from: Coord, to: Coord) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const MapScreen: React.FC<MapScreenProps> = ({
  mapType,
  pickupCoords,
  stopsCoords,
  destinationCoords,
  isDark,
  Google_Map_Key,
  isPulsing,
  nearbyVehicle = null,
  vehicleMarkerImage,
  vehicleLabel = "vehicle",
}) => {
  const webViewRef = useRef<WebView>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const nearbyVehicleKey = nearbyVehicle
    ? `${nearbyVehicle.lat},${nearbyVehicle.lng}:${pickupCoords?.lat},${pickupCoords?.lng}`
    : "";
  const fallbackDistanceKm =
    nearbyVehicle && pickupCoords
      ? distanceInKm(nearbyVehicle, pickupCoords)
      : null;
  const displayedDistanceKm = routeDistanceKm ?? fallbackDistanceKm;

  useEffect(() => {
    setRouteDistanceKm(null);
  }, [nearbyVehicleKey]);

  const handleMapMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (
        message?.type === "nearbyVehicleDistance" &&
        Number.isFinite(Number(message.meters))
      ) {
        setRouteDistanceKm(Number(message.meters) / 1000);
      }
    } catch {
      // Ignore unrelated WebView messages.
    }
  };

  const getMapHtml = (provider: "googleMap" | "osm") => {
    if (!pickupCoords || !destinationCoords) return "";

    const nearbyVehicleJson = JSON.stringify(nearbyVehicle);
    const vehicleIconJson = JSON.stringify(
      mapVehicleMarker(vehicleLabel,vehicleMarkerImage || fallbackVehicleIcon),
    );

    const pulseCss = `
      <style>
        .pulse-container { width: 300px; height: 300px; position: relative; }
        .pulse-ring {
          position: absolute; left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          width: 15px; height: 15px;
          background-color: rgba(150, 71, 25, 0.7);
          border-radius: 50%;
          animation: pulse-animation 2.5s ease-out infinite;
          opacity: 0;
        }
        .pulse-ring:nth-child(2) { animation-delay: 0.8s; }
        .pulse-ring:nth-child(3) { animation-delay: 1.6s; }
        @keyframes pulse-animation {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.9; }
          100% { transform: translate(-50%, -50%) scale(20); opacity: 0; }
        }
      </style>
    `;

    if (provider === "googleMap") {
      const stopsJson = JSON.stringify(
        stopsCoords.map(s => ({location: s, stopover: true})),
      );
      const allPointsJson = JSON.stringify([
        {lat: pickupCoords.lat, lng: pickupCoords.lng},
        ...stopsCoords,
        {lat: destinationCoords.lat, lng: destinationCoords.lng},
      ]);

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Maps</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://maps.googleapis.com/maps/api/js?key=${Google_Map_Key}"></script>
          <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
          ${pulseCss}
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map, directionsRenderer, markers = [], pulseOverlay = null;
            var nearbyVehicle = ${nearbyVehicleJson};
            var vehicleIconUrl = ${vehicleIconJson};

            function sendNearbyDistance(meters) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'nearbyVehicleDistance',
                  meters: meters
                }));
              }
            }

            function straightLineMeters(from, to) {
              var toRadians = degrees => degrees * Math.PI / 180;
              var latDelta = toRadians(to.lat - from.lat);
              var lngDelta = toRadians(to.lng - from.lng);
              var a = Math.sin(latDelta / 2) ** 2 +
                Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) *
                Math.sin(lngDelta / 2) ** 2;
              return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            }

            function initMap() {
              const darkMapStyle = [
                { elementType: 'geometry', stylers: [{ color: '#212121' }] },
                { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
                { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
                { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#282828' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#383838' }] },
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] }
              ];

              map = new google.maps.Map(document.getElementById('map'), {
                zoom: 12,
                center: { lat: ${pickupCoords.lat}, lng: ${pickupCoords.lng} },
                disableDefaultUI: true,
                gestureHandling: 'greedy',
                styles: ${isDark ? "darkMapStyle" : "null"}
              });

              drawRouteAndMarkers();
            }

            function clearAll() {
              if(directionsRenderer) directionsRenderer.setMap(null);
              markers.forEach(m => m.setMap(null));
              markers = [];
              if(pulseOverlay) { pulseOverlay.setMap(null); pulseOverlay = null; }
            }

            function drawRouteAndMarkers() {
              clearAll();
              var waypoints = ${stopsJson};
              var directionsService = new google.maps.DirectionsService();
              directionsRenderer = new google.maps.DirectionsRenderer({
                suppressMarkers: true,
                polylineOptions: { strokeColor: '#195594', strokeWeight: 5 }
              });
              directionsRenderer.setMap(map);

              var allPoints = ${allPointsJson};
              if (nearbyVehicle) {
                var pickup = { lat: ${pickupCoords.lat}, lng: ${pickupCoords.lng} };
                markers.push(new google.maps.Marker({
                  position: nearbyVehicle,
                  map: map,
                  icon: {
                    url: vehicleIconUrl,
                    scaledSize: new google.maps.Size(44, 44),
                    anchor: new google.maps.Point(22, 22)
                  },
                  title: '${vehicleLabel.replace(/'/g, "\\'")}'
                }));
                markers.push(new google.maps.Marker({
                  position: pickup,
                  map: map,
                  title: 'Pickup'
                }));
                directionsService.route({
                  origin: nearbyVehicle,
                  destination: pickup,
                  travelMode: 'DRIVING'
                }, (res, status) => {
                  if (status === 'OK' && res.routes?.[0]) {
                    directionsRenderer.setDirections(res);
                    var meters = res.routes[0].legs.reduce(
                      (total, leg) => total + (leg.distance?.value || 0), 0
                    );
                    sendNearbyDistance(meters);
                  } else {
                    new google.maps.Polyline({
                      path: [nearbyVehicle, pickup],
                      geodesic: true,
                      strokeColor: '#195594',
                      strokeOpacity: 0.9,
                      strokeWeight: 5,
                      map: map
                    });
                    sendNearbyDistance(straightLineMeters(nearbyVehicle, pickup));
                  }
                });
                return;
              }

              allPoints.forEach(p => markers.push(new google.maps.Marker({ position: p, map: map })));

              directionsService.route({
                origin: { lat: ${pickupCoords.lat}, lng: ${pickupCoords.lng} },
                destination: { lat: ${destinationCoords.lat}, lng: ${
        destinationCoords.lng
      } },
                waypoints: waypoints,
                travelMode: 'DRIVING'
              }, (res, status) => { if(status === 'OK') directionsRenderer.setDirections(res); });
            }

            window.onload = initMap;
          </script>
        </body>
        </html>
      `;
    }

    const waypointsStr = [
      pickupCoords,
      ...stopsCoords.filter(s => s.lat && s.lng),
      destinationCoords,
    ]
      .map(c => `L.latLng(${c.lat}, ${c.lng})`)
      .join(", ");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OSM Map</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.css" />
        <script src="https://unpkg.com/leaflet-routing-machine/dist/leaflet-routing-machine.js"></script>
        ${pulseCss}
        <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            var isDark = ${isDark};
            var nearbyVehicle = ${nearbyVehicleJson};
            var vehicleIconUrl = ${vehicleIconJson};
            var lightTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
            var darkTiles = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';

            function sendNearbyDistance(meters) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'nearbyVehicleDistance',
                  meters: meters
                }));
              }
            }

            function straightLineMeters(from, to) {
              var toRadians = degrees => degrees * Math.PI / 180;
              var latDelta = toRadians(to.lat - from.lat);
              var lngDelta = toRadians(to.lng - from.lng);
              var a = Math.sin(latDelta / 2) ** 2 +
                Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) *
                Math.sin(lngDelta / 2) ** 2;
              return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            }

            var map = L.map('map').setView([${pickupCoords.lat}, ${pickupCoords.lng}], 13);
            L.tileLayer(isDark ? darkTiles : lightTiles, { maxZoom: 19 }).addTo(map);

            var pickup = { lat: ${pickupCoords.lat}, lng: ${pickupCoords.lng} };
            var waypoints = nearbyVehicle
              ? [L.latLng(nearbyVehicle.lat, nearbyVehicle.lng), L.latLng(pickup.lat, pickup.lng)]
              : [${waypointsStr}];

            // Draw markers
            if (nearbyVehicle) {
              L.marker([nearbyVehicle.lat, nearbyVehicle.lng], {
                icon: L.icon({
                  iconUrl: vehicleIconUrl,
                  iconSize: [44, 44],
                  iconAnchor: [22, 22]
                })
              }).addTo(map).bindPopup('${vehicleLabel.replace(/'/g, "\\'")}');
              L.marker([pickup.lat, pickup.lng]).addTo(map).bindPopup('Pickup');
            } else {
              waypoints.forEach((wp, i) => {
                var text = i === 0 ? "Start" : i === waypoints.length - 1 ? "End" : "Stop " + i;
                L.marker([wp.lat, wp.lng]).addTo(map).bindPopup(text);
              });
            }

            // Draw route
            var routeControl = L.Routing.control({
              waypoints: waypoints,
              routeWhileDragging: false,
              createMarker: function() { return null; },
              lineOptions: { styles: [{ color: '#195594', weight: 5 }] }
            }).addTo(map);

            if (nearbyVehicle) {
              routeControl.on('routesfound', function(event) {
                var meters = event.routes?.[0]?.summary?.totalDistance;
                if (Number.isFinite(meters)) sendNearbyDistance(meters);
              });
              routeControl.on('routingerror', function() {
                L.polyline([
                  [nearbyVehicle.lat, nearbyVehicle.lng],
                  [pickup.lat, pickup.lng]
                ], { color: '#195594', weight: 5, opacity: 0.9 }).addTo(map);
                sendNearbyDistance(straightLineMeters(nearbyVehicle, pickup));
              });
            }

            map.fitBounds(waypoints.map(wp => [wp.lat, wp.lng]), { padding: [35, 35] });
          });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <WebView
        key={
          mapType +
          JSON.stringify([
            pickupCoords,
            stopsCoords,
            destinationCoords,
            nearbyVehicle,
            vehicleMarkerImage,
          ])
        }
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{html: getMapHtml(mapType)}}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={handleMapMessage}
      />
      {nearbyVehicle && (
        <View pointerEvents="none" style={styles.nearbyDistanceBadge}>
          <Image
            source={{uri: vehicleMarker(vehicleLabel,vehicleMarkerImage || fallbackVehicleIcon)}}
            style={styles.nearbyVehicleImage}
            resizeMode="contain"
          />
          <View style={styles.nearbyDistanceText}>
            <Text style={styles.nearbyVehicleTitle}>
              Nearest available {vehicleLabel}
            </Text>
            <Text style={styles.nearbyDistanceValue}>
              {displayedDistanceKm === null
                ? "Getting route distance…"
                : `${displayedDistanceKm.toFixed(1)} km to pickup`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  nearbyDistanceBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    maxWidth: "92%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    elevation: 5,
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 2},
  },
  nearbyVehicleImage: {
    width: 34,
    height: 34,
    marginRight: 8,
  },
  nearbyDistanceText: {
    flexShrink: 1,
  },
  nearbyVehicleTitle: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "600",
  },
  nearbyDistanceValue: {
    marginTop: 2,
    color: "#195594",
    fontSize: 13,
    fontWeight: "700",
  },
});
