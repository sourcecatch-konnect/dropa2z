import {vehicleMarker} from '../../../design/vehicleArtwork';
import {mapVehicleMarker} from '../../../design/mapVehicleMarkers';
import React, { useEffect, useMemo, useRef, useState } from "react";
import {View, StyleSheet, Image} from 'react-native';
import {Text} from '../../../design/Typography';
import { WebView } from "react-native-webview";
import {pickupRadarCss, pickupRadarMarkup, googlePickupRadarScript, leafletPickupRadarScript} from './pickupRadar';

interface Coord {
  lat: number;
  lng: number;
}

interface MapScreenProps {
  mapType: "google_map" | "osm" | any;
  pickupCoords: Coord;
  stopsCoords: Coord[];
  destinationCoords: Coord;
  isDark: boolean;
  Google_Map_Key: string;
  isPulsing: boolean;
  nearbyVehicle?: Coord | null;
  vehicleMarkerImage?: string | null;
  vehicleLabel?: string;
  onRouteInfo?: (info: { distanceKm: number; durationMinutes: number } | null) => void;
}

const fallbackVehicleIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#fff" stroke="#195594" stroke-width="3"/><path d="M11 27h26l-2-9H21l-5 5h-5z" fill="#195594"/><path d="M19 18h14l-1.4-6H23z" fill="#195594"/><circle cx="17" cy="31" r="3.5" fill="#17324f"/><circle cx="32" cy="31" r="3.5" fill="#17324f"/><path d="M24 12V8h9" fill="none" stroke="#195594" stroke-width="2.5" stroke-linecap="round"/></svg>',
)}`;

const sourceMarkerIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="64" viewBox="0 0 56 64"><path d="M28 2C13.64 2 2 13.64 2 28c0 17 26 34 26 34s26-17 26-34C54 13.64 42.36 2 28 2z" fill="#195594" stroke="#fff" stroke-width="2"/><circle cx="28" cy="27" r="16" fill="#fff"/><text x="28" y="34" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="#A25325">D</text></svg>',
)}`;

const decodeEncodedPolyline = (encoded: string): Coord[] => {
  const coordinates: Coord[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push({ lat: latitude / 1e5, lng: longitude / 1e5 });
  }

  return coordinates;
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
  onRouteInfo,
}) => {
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coord[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const lastNearbyRouteFetchAt = useRef(0);
  const routeRequestId = useRef(0);
  const previousRouteMode = useRef<boolean | null>(null);
  const useNearbyRoute = Boolean(isPulsing && nearbyVehicle);
  const routeOrigin = useNearbyRoute ? nearbyVehicle : pickupCoords;
  const routeDestination = useNearbyRoute ? pickupCoords : destinationCoords;
  const routeStops = useNearbyRoute ? [] : stopsCoords;
  const routeRequestKey = JSON.stringify({
    mode: useNearbyRoute ? "vehicle-to-pickup" : "trip",
    origin: routeOrigin,
    destination: routeDestination,
    stops: routeStops,
  });
  const displayedDistanceKm = routeDistanceKm;

  useEffect(() => {
    const routeModeChanged =
      previousRouteMode.current !== null &&
      previousRouteMode.current !== useNearbyRoute;
    previousRouteMode.current = useNearbyRoute;

    // Keep the currently rendered vehicle route while requesting its next
    // position. Clearing it on every driver poll made the map flash twice.
    if (routeModeChanged || !useNearbyRoute) {
      setRouteCoordinates([]);
      setRouteDistanceKm(null);
      onRouteInfo?.(null);
    }

    if (!routeOrigin || !routeDestination || !Google_Map_Key) {
      return;
    }

    const now = Date.now();
    if (useNearbyRoute && now - lastNearbyRouteFetchAt.current < 8000) {
      return;
    }
    if (useNearbyRoute) lastNearbyRouteFetchAt.current = now;
    const currentRequestId = ++routeRequestId.current;

    const routeBody = {
      origin: {
        location: {
          latLng: {
            latitude: routeOrigin.lat,
            longitude: routeOrigin.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: routeDestination.lat,
            longitude: routeDestination.lng,
          },
        },
      },
      intermediates: routeStops
        .filter(stop => Number.isFinite(stop?.lat) && Number.isFinite(stop?.lng))
        .map(stop => ({
          location: {
            latLng: { latitude: stop.lat, longitude: stop.lng },
          },
        })),
      travelMode: "DRIVE",
      computeAlternativeRoutes: false,
      units: "METRIC",
    };

    fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": Google_Map_Key,
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify(routeBody),
    })
      .then(async response => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result?.error?.message || `Routes API request failed (${response.status})`,
          );
        }

        const route = result?.routes?.[0];
        const encodedPolyline = route?.polyline?.encodedPolyline;
        if (!encodedPolyline) throw new Error("Routes API returned no route geometry");

        const decodedCoordinates = decodeEncodedPolyline(encodedPolyline);
        if (currentRequestId === routeRequestId.current && decodedCoordinates.length > 1) {
          setRouteCoordinates(decodedCoordinates);
          const distanceKm = Number(route.distanceMeters) / 1000;
          const durationSeconds = Number.parseFloat(String(route.duration || ""));
          if (Number.isFinite(Number(route.distanceMeters))) {
            setRouteDistanceKm(distanceKm);
            if (
              !useNearbyRoute &&
              Number.isFinite(durationSeconds) &&
              durationSeconds > 0
            ) {
              onRouteInfo?.({ distanceKm, durationMinutes: durationSeconds / 60 });
            }
          }
        }
      })
      .catch(error => {
        if (currentRequestId === routeRequestId.current) {
          console.warn("Rider Routes API request failed:", error?.message || error);
        }
      });
  }, [Google_Map_Key, onRouteInfo, routeRequestKey]);

  const getMapHtml = (provider: "google_map" | "osm") => {
    if (!pickupCoords || !destinationCoords) return "";

    const nearbyVehicleJson = JSON.stringify(nearbyVehicle);
    const routeCoordinatesJson = JSON.stringify(routeCoordinates);
    const vehicleIconJson = JSON.stringify(
      mapVehicleMarker(vehicleLabel,vehicleMarkerImage || fallbackVehicleIcon),
    );

    const pulseCss = pickupRadarCss;

    if (provider === "google_map") {
      const allPointsJson = JSON.stringify([
        { lat: pickupCoords.lat, lng: pickupCoords.lng },
        ...stopsCoords,
        { lat: destinationCoords.lat, lng: destinationCoords.lng },
      ]);

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Google Maps</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://maps.googleapis.com/maps/api/js?key=${Google_Map_Key}"></script>
          <style>html, body, #map { height: 100%; margin: 0; padding: 0; position: relative; }</style>
          ${pulseCss}
        </head>
        <body>
          <div id="map"></div>
          ${isPulsing && !nearbyVehicle ? pickupRadarMarkup : ''}
          <script>
          var map, markers = [], isPulsing = ${isPulsing};
            var directionsRenderer;
          var routePolyline = null;
          var nearbyVehicleMarker = null;
          var markerAnimationFrame = null;
          var hasFittedRoute = false;
            var nearbyVehicle = ${nearbyVehicleJson};
            var vehicleIconUrl = ${vehicleIconJson};

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
                zoom: isPulsing ? 15 : 12,
                center: { lat: ${pickupCoords.lat}, lng: ${pickupCoords.lng} },
                disableDefaultUI: true,
                gestureHandling: 'greedy',
                styles: ${isDark ? "darkMapStyle" : "null"},
                zoomControl: true,
                zoomControlOptions: {position:google.maps.ControlPosition.RIGHT_CENTER},
                scrollwheel: true,
                draggable: true,
                disableDoubleClickZoom: false,
                keyboardShortcuts: true,
                minZoom: 4,
                maxZoom: 20
              });

              if (isPulsing && nearbyVehicle) {
                drawNearbyVehicleRoute();
              } else {
                drawRouteAndMarkers();
              }
              ${googlePickupRadarScript(pickupCoords)}
              window.ReactNativeWebView?.postMessage('map_ready');
            }

            function clearAll() {
              markers.forEach(m => m.setMap(null));
              markers = [];
              if (directionsRenderer) {
                directionsRenderer.setMap(null);
                directionsRenderer = null;
              }
              if (routePolyline) {
                routePolyline.setMap(null);
                routePolyline = null;
              }
              nearbyVehicleMarker = null;
            }

            function sendRouteInfo(distanceMeters, durationSeconds) {
              if (window.ReactNativeWebView && Number.isFinite(distanceMeters)) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'routeInfo',
                  distanceMeters: distanceMeters,
                  durationSeconds: durationSeconds,
                  isNearbyRoute: Boolean(isPulsing && nearbyVehicle)
                }));
              }
            }

            function drawGoogleDirections(origin, destination, waypoints) {
              directionsRenderer = new google.maps.DirectionsRenderer({
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: '#195594',
                  strokeOpacity: 0.95,
                  strokeWeight: 5
                }
              });
              directionsRenderer.setMap(map);
              new google.maps.DirectionsService().route({
                origin: origin,
                destination: destination,
                waypoints: (waypoints || []).map(point => ({ location: point, stopover: true })),
                travelMode: google.maps.TravelMode.DRIVING
              }, (result, status) => {
                if (status === 'OK' && result && result.routes && result.routes[0]) {
                  directionsRenderer.setDirections(result);
                  const meters = result.routes[0].legs.reduce(
                    (total, leg) => total + (leg.distance ? leg.distance.value : 0), 0
                  );
                  const seconds = result.routes[0].legs.reduce(
                    (total, leg) => total + (leg.duration ? leg.duration.value : 0), 0
                  );
                  sendRouteInfo(meters, seconds);
                } else {
                  console.warn('Google road directions unavailable:', status);
                }
              });
            }

            function drawRoadPolyline(path) {
              if (!path || path.length < 2) return false;
              if (!routePolyline) {
                routePolyline = new google.maps.Polyline({
                  path: path,
                  geodesic: false,
                  strokeColor: '#195594',
                  strokeOpacity: 0.95,
                  strokeWeight: 5,
                  map: map
                });
              } else {
                routePolyline.setPath(path);
              }
              if (!hasFittedRoute) {
                var bounds = new google.maps.LatLngBounds();
                path.forEach(point => bounds.extend(point));
                map.fitBounds(bounds, 36);
                hasFittedRoute = true;
              }
              return true;
            }

            function drawRouteAndMarkers() {
              clearAll();
              var allPoints = ${allPointsJson};
              allPoints.forEach((point, index) => markers.push(new google.maps.Marker({
                position: point,
                map: map,
                ...(index === 0 ? {
                  title: 'Dropa2z pickup',
                  icon: {
                    url: ${JSON.stringify(sourceMarkerIcon)},
                    scaledSize: new google.maps.Size(42, 48),
                    anchor: new google.maps.Point(21, 46)
                  }
                } : {})
              })));
              if (!drawRoadPolyline(${routeCoordinatesJson})) {
                drawGoogleDirections(
                  { lat: ${pickupCoords.lat}, lng: ${pickupCoords.lng} },
                  { lat: ${destinationCoords.lat}, lng: ${destinationCoords.lng} },
                  ${JSON.stringify(stopsCoords)}
                );
              }
            }

            function drawNearbyVehicleRoute() {
              clearAll();
              var pickup = { lat: ${pickupCoords.lat}, lng: ${pickupCoords.lng} };
              markers.push(new google.maps.Marker({
                position: pickup,
                map: map,
                title: 'Dropa2z pickup',
                icon: {
                  url: ${JSON.stringify(sourceMarkerIcon)},
                  scaledSize: new google.maps.Size(42, 48),
                  anchor: new google.maps.Point(21, 46)
                }
              }));
              nearbyVehicleMarker = new google.maps.Marker({
                position: nearbyVehicle,
                map: map,
                title: ${JSON.stringify(vehicleLabel)},
                icon: {
                  url: vehicleIconUrl,
                  scaledSize: new google.maps.Size(44, 44),
                  anchor: new google.maps.Point(22, 22)
                }
              });
              markers.push(nearbyVehicleMarker);

              if (!drawRoadPolyline(${routeCoordinatesJson})) {
                drawGoogleDirections(nearbyVehicle, pickup, []);
              }
            }

            window.updateNearbyVehicle = function(point) {
              if (!isPulsing || !point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
              nearbyVehicle = point;
              if (!nearbyVehicleMarker) {
                var pickup = { lat: ${pickupCoords.lat}, lng: ${pickupCoords.lng} };
                markers.push(new google.maps.Marker({
                  position: pickup,
                  map: map,
                  title: 'Dropa2z pickup',
                  icon: {
                    url: ${JSON.stringify(sourceMarkerIcon)},
                    scaledSize: new google.maps.Size(42, 48),
                    anchor: new google.maps.Point(21, 46)
                  }
                }));
                nearbyVehicleMarker = new google.maps.Marker({
                  position: point,
                  map: map,
                  title: ${JSON.stringify(vehicleLabel)},
                  icon: {
                    url: vehicleIconUrl,
                    scaledSize: new google.maps.Size(44, 44),
                    anchor: new google.maps.Point(22, 22)
                  }
                });
                markers.push(nearbyVehicleMarker);
                return;
              }
              if (markerAnimationFrame !== null) cancelAnimationFrame(markerAnimationFrame);
              var target = new google.maps.LatLng(point.lat, point.lng);
              var start = nearbyVehicleMarker.getPosition() || target;
              var startedAt = performance.now();
              var animate = function() {
                var progress = Math.min((performance.now() - startedAt) / 700, 1);
                var eased = progress * (2 - progress);
                nearbyVehicleMarker.setPosition(new google.maps.LatLng(
                  start.lat() + (target.lat() - start.lat()) * eased,
                  start.lng() + (target.lng() - start.lng()) * eased
                ));
                if (progress < 1) markerAnimationFrame = requestAnimationFrame(animate);
                else markerAnimationFrame = null;
              };
              markerAnimationFrame = requestAnimationFrame(animate);
            };

            window.updateRouteCoordinates = function(path) {
              if (!path || path.length < 2) {
                if (directionsRenderer) {
                  directionsRenderer.setMap(null);
                  directionsRenderer = null;
                }
                if (routePolyline) {
                  routePolyline.setMap(null);
                  routePolyline = null;
                }
                hasFittedRoute = false;
                return;
              }
              if (directionsRenderer) {
                directionsRenderer.setMap(null);
                directionsRenderer = null;
              }
              drawRoadPolyline(path);
            };

            window.onload = initMap;
          </script>
        </body>
        </html>
      `;
    }

    const allPointsJson = JSON.stringify([
      pickupCoords,
      ...stopsCoords.filter(s => s.lat && s.lng),
      destinationCoords,
    ]);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OSM Map</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; position: relative; }
          .leaflet-container { background: ${isDark ? "#212121" : "#fff"}; }
          .leaflet-control-attribution { display: none; }
          .leaflet-top.leaflet-right {top:35%;}
        </style>
        ${pulseCss}
      </head>
      <body>
        <div id="map"></div>
        ${isPulsing && !nearbyVehicle ? pickupRadarMarkup : ''}
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            var isDark = ${isDark};
            var isPulsing = ${isPulsing};
            var nearbyVehicle = ${nearbyVehicleJson};
            var vehicleIconUrl = ${vehicleIconJson};
            var sourceMarkerIconUrl = ${JSON.stringify(sourceMarkerIcon)};
            var routeCoordinates = ${routeCoordinatesJson};
            var lightTiles = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
            var darkTiles = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';

            var map = L.map('map', {
              center: [${pickupCoords.lat}, ${pickupCoords.lng}],
              zoom: isPulsing ? 15 : 13,
              dragging: true,
              touchZoom: true,
              scrollWheelZoom: true,
              doubleClickZoom: true,
              boxZoom: true,
              keyboard: true,
              zoomAnimation: true,
              fadeAnimation: true,
              markerZoomAnimation: true,
              minZoom:4,
              maxZoom:20,
              zoomControl: false,
              tap: true,
              attributionControl: false
            });

            L.tileLayer(isDark ? darkTiles : lightTiles, { maxZoom: 19 }).addTo(map);
            L.control.zoom({position:'topright'}).addTo(map);
            ${leafletPickupRadarScript(pickupCoords)}

            var pickup = { lat: ${pickupCoords.lat}, lng: ${pickupCoords.lng} };
            var useNearbyRoute = isPulsing && nearbyVehicle;
            var allPoints = ${allPointsJson};
            var mapPoints = useNearbyRoute ? [nearbyVehicle, pickup] : allPoints;
            var nearbyVehicleMarker = null;
            var routeLine = null;
            var markerAnimationFrame = null;

            if (useNearbyRoute) {
              nearbyVehicleMarker = L.marker([nearbyVehicle.lat, nearbyVehicle.lng], {
                icon: L.icon({ iconUrl: vehicleIconUrl, iconSize: [44, 44], iconAnchor: [22, 22] })
              }).addTo(map).bindPopup(${JSON.stringify(vehicleLabel)});
              L.marker([pickup.lat, pickup.lng], {
                icon: L.icon({ iconUrl: sourceMarkerIconUrl, iconSize: [42, 48], iconAnchor: [21, 46] })
              }).addTo(map).bindPopup('Dropa2z pickup');
            } else {
              mapPoints.forEach((wp, i) => {
                var text = i === 0 ? "Start" : i === mapPoints.length - 1 ? "End" : "Stop " + i;
                var markerOptions = i === 0
                  ? { icon: L.icon({ iconUrl: sourceMarkerIconUrl, iconSize: [42, 48], iconAnchor: [21, 46] }) }
                  : {};
                L.marker([wp.lat, wp.lng], markerOptions).addTo(map).bindPopup(i === 0 ? 'Dropa2z pickup' : text);
              });
            }

            if (routeCoordinates.length > 1) {
              routeLine = L.polyline(
                routeCoordinates.map(point => [point.lat, point.lng]),
                { color: '#195594', weight: 5, opacity: 0.95 }
              ).addTo(map);
              map.flyToBounds(routeLine.getBounds(), { padding: [35, 35], duration: .8, maxZoom:17 });
            } else {
              map.flyToBounds(mapPoints.map(point => [point.lat, point.lng]), { padding: [35, 35], duration: .8, maxZoom:17 });
            }

            window.updateNearbyVehicle = function(point) {
              if (!isPulsing || !point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
              nearbyVehicle = point;
              var target = L.latLng(point.lat, point.lng);
              if (!nearbyVehicleMarker) {
                nearbyVehicleMarker = L.marker(target, {
                  icon: L.icon({ iconUrl: vehicleIconUrl, iconSize: [44, 44], iconAnchor: [22, 22] })
                }).addTo(map).bindPopup(${JSON.stringify(vehicleLabel)});
                return;
              }
              if (markerAnimationFrame !== null) cancelAnimationFrame(markerAnimationFrame);
              var start = nearbyVehicleMarker.getLatLng();
              var startedAt = performance.now();
              var animate = function() {
                var progress = Math.min((performance.now() - startedAt) / 700, 1);
                var eased = progress * (2 - progress);
                nearbyVehicleMarker.setLatLng([
                  start.lat + (target.lat - start.lat) * eased,
                  start.lng + (target.lng - start.lng) * eased
                ]);
                if (progress < 1) markerAnimationFrame = requestAnimationFrame(animate);
                else markerAnimationFrame = null;
              };
              markerAnimationFrame = requestAnimationFrame(animate);
            };

            window.updateRouteCoordinates = function(path) {
              if (!path || path.length < 2) {
                if (routeLine) routeLine.setLatLngs([]);
                return;
              }
              var points = path.map(point => [point.lat, point.lng]);
              if (routeLine) routeLine.setLatLngs(points);
              else routeLine = L.polyline(points, { color: '#195594', weight: 5, opacity: 0.95 }).addTo(map);
            };
            window.ReactNativeWebView?.postMessage('map_ready');
          });
        </script>
      </body>
      </html>
    `;
  };

  // The booking screen's countdown re-renders once per second. Keep the WebView
  // source object stable across those renders; only real map data changes should
  // cause the embedded map to reload.
  const tripMapKey = JSON.stringify([
    mapType,
    pickupCoords?.lat,
    pickupCoords?.lng,
    stopsCoords,
    destinationCoords?.lat,
    destinationCoords?.lng,
  ]);
  const mapHtml = useMemo(
    () => getMapHtml(mapType),
    [tripMapKey, isDark, Google_Map_Key, isPulsing, Boolean(nearbyVehicle), vehicleMarkerImage, vehicleLabel],
  );
  const webViewSource = useMemo(() => ({ html: mapHtml }), [mapHtml]);

  useEffect(() => {
    setIsMapReady(false);
  }, [mapHtml]);

  useEffect(() => {
    if (!isMapReady || !nearbyVehicle || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(
      `window.updateNearbyVehicle?.(${JSON.stringify(nearbyVehicle)}); true;`,
    );
  }, [isMapReady, nearbyVehicle]);

  useEffect(() => {
    if (!isMapReady || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(
      `window.updateRouteCoordinates?.(${JSON.stringify(routeCoordinates)}); true;`,
    );
  }, [isMapReady, routeCoordinates]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        key={tripMapKey}
        originWhitelist={["*"]}
        source={webViewSource}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={event => {
          if (event.nativeEvent.data === "map_ready") {
            setIsMapReady(true);
            return;
          }
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (
              message?.type === "routeInfo" &&
              Number.isFinite(Number(message.distanceMeters)) &&
              Number.isFinite(Number(message.durationSeconds))
            ) {
              const distanceKm = Number(message.distanceMeters) / 1000;
              const durationMinutes = Number(message.durationSeconds) / 60;
              setRouteDistanceKm(previous =>
                previous !== null && Math.abs(previous - distanceKm) < 0.01
                  ? previous
                  : distanceKm,
              );
              if (!message.isNearbyRoute) {
                onRouteInfo?.({ distanceKm, durationMinutes });
              }
            }
          } catch {
            // Ignore unrelated WebView messages.
          }
        }}
      />
      {isPulsing && nearbyVehicle && (
        <View pointerEvents="none" style={styles.nearbyDistanceBadge}>
          <Image
            source={{ uri: vehicleMarker(vehicleLabel,vehicleMarkerImage || fallbackVehicleIcon) }}
            style={styles.nearbyVehicleImage}
            resizeMode="contain"
          />
          <View style={styles.nearbyDistanceText}>
            <Text style={styles.nearbyVehicleTitle}>
              Nearest available {vehicleLabel}
            </Text>
            <Text style={styles.nearbyDistanceValue}>
              {displayedDistanceKm === null
                ? "Getting road route…"
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
    shadowOffset: { width: 0, height: 2 },
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
