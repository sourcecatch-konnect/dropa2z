import {mapVehicleMarker} from '../../design/mapVehicleMarkers';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Platform, PermissionsAndroid, Alert } from 'react-native'
import Geolocation from '@react-native-community/geolocation'
import WebView from 'react-native-webview'
import appColors from '../../theme/appColors'
import darkMapStyle from './darkMap'
import { useValues } from '../../utils/context'
import { useSelector } from 'react-redux'
import getEchoInstance from '../../utils/echo'

const DEFAULT_JALGAON_CENTER = { latitude: 21.0077, longitude: 75.5626 }

const parseMapCoordinate = (coordinate: any) => {
  if (!coordinate) return null
  const latitude = Number(coordinate.lat ?? coordinate.latitude)
  const longitude = Number(coordinate.lng ?? coordinate.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  if (latitude === 0 && longitude === 0) return null
  return { latitude, longitude }
}

function MapComponent({ Destinationlocation, driverId, rideDetails, stoplocation }: any) {

  const [driverLocation, setDriverLocation] = useState<any>(null)
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [rotation, setRotation] = useState<number>(0)
  const webViewRef = useRef<any>(null)
  const lastPosition = useRef<any>(null)
  const lastStoredPosition = useRef<any>(null)
  const isRouteFetched = useRef<boolean>(false)
  const lastRouteParams = useRef<string>('')
  const lastRouteTripKey = useRef<string>('')
  const lastRouteFetchAt = useRef<number>(0)
  const routeRequestId = useRef<number>(0)
  const lastStopMarkersKey = useRef<string>('')
  const [isWebViewReady, setIsWebViewReady] = useState(false)
  const { isDark, Google_Map_Key } = useValues()
  const { selfDriver } = useSelector((state: any) => state.account)
  const { taxidoSettingData } = useSelector((state: any) => state.setting)
  const pickupCoordinate = parseMapCoordinate(rideDetails?.location_coordinates?.[0]) ||
    parseMapCoordinate({ lat: rideDetails?.pickup_latitude, lng: rideDetails?.pickup_longitude })
  const driverCoordinate = parseMapCoordinate({ lat: selfDriver?.lat, lng: selfDriver?.lng })
  const destinationCoordinate = parseMapCoordinate(Destinationlocation) ||
    parseMapCoordinate(rideDetails?.location_coordinates?.[rideDetails?.location_coordinates?.length - 1])
  const tripCoordinates = (rideDetails?.location_coordinates || [])
    .map(parseMapCoordinate)
    .filter(Boolean) as Array<{ latitude: number; longitude: number }>
  const tripCoordinatesKey = JSON.stringify(tripCoordinates)
  const mapCenter = pickupCoordinate || driverCoordinate || destinationCoordinate || DEFAULT_JALGAON_CENTER
  const [initialRegion, setInitialRegion] = useState(mapCenter)
  const hasDriverLocationRef = useRef(false);
  const hasInitialMapCenterRef = useRef(Boolean(pickupCoordinate || driverCoordinate || destinationCoordinate));
  const mapType = taxidoSettingData?.cabbooking_values?.location?.map_provider ||
    (Google_Map_Key ? 'google_map' : undefined)
  const initializeMapLocation = (location: any) => {
    const validLocation = parseMapCoordinate(location)
    if (!validLocation) return

    if (!hasDriverLocationRef.current) {
      hasDriverLocationRef.current = true;
      setDriverLocation(validLocation);
    }

    if (!hasInitialMapCenterRef.current && validLocation) {
      hasInitialMapCenterRef.current = true;
      setInitialRegion(validLocation);
    }
  };
  const parseCoordinate = (coordinate: any) => parseMapCoordinate(coordinate)

  useEffect(() => {
    if (pickupCoordinate) {
      hasInitialMapCenterRef.current = true
      setInitialRegion(pickupCoordinate)
    }
  }, [rideDetails?.id, rideDetails?.location_coordinates?.[0]?.lat, rideDetails?.location_coordinates?.[0]?.lng, rideDetails?.pickup_latitude, rideDetails?.pickup_longitude])

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    // Initial location fallbacks
    if (!hasDriverLocationRef.current) {
      if (selfDriver?.lat && selfDriver?.lng) {
        initializeMapLocation({
          latitude: parseFloat(selfDriver.lat),
          longitude: parseFloat(selfDriver.lng),
        })
      } else if (pickupCoordinate) {
        initializeMapLocation(pickupCoordinate)
      }
    }

    // If still no location, try one-time current position
    if (!hasDriverLocationRef.current && !pickupCoordinate && !selfDriver?.lat) {
      requestLocationPermission().then(granted => {
        if (granted) {
          Geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const newLocation = { latitude, longitude };
              initializeMapLocation(newLocation);
            },
            (error) => console.log("Initial location fetch error:", error),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
          );
        }
      });
    }

    if (!driverId) return;

    let echoInstance: any = null;
    let watchId: number | null = null;

    const handleLocationUpdate = (lat: any, lng: any, bearing?: number) => {
      const newLocation = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      };

      initializeMapLocation(newLocation);

      let newRotation = bearing !== undefined ? bearing : rotation;
      if (lastPosition.current && bearing === undefined) {
        const distance = getDistance(lastPosition.current, newLocation);
        if (distance >= 3) {
          const angle = getBearing(lastPosition.current, newLocation);
          if (!isNaN(angle)) {
            setRotation(angle);
            newRotation = angle;
          }
        }
      } else if (bearing !== undefined) {
        setRotation(bearing);
      }

      lastPosition.current = newLocation;

      if (webViewRef.current) {
        const jsCode = `
          window.updateDriverMarker(${newLocation.latitude}, ${newLocation.longitude}, ${newRotation});
          true;
        `;
        webViewRef.current.injectJavaScript(jsCode);
      }
    };

    const setupTracking = async () => {
      const isMe = Number(driverId) === Number(selfDriver?.id);

      if (isMe) {
        const granted = await requestLocationPermission();
        if (granted) {
          watchId = Geolocation.watchPosition(
            (position) => {
              const { latitude, longitude, heading } = position.coords;
              const newLocation = { latitude, longitude };

              initializeMapLocation(newLocation);
              handleLocationUpdate(latitude, longitude, heading || 0);
            },
            (error) => console.error("Geolocation error:", error),
            { enableHighAccuracy: true, distanceFilter: 10 }
          );
        }
      } else {
        try {
          echoInstance = await getEchoInstance();
          if (!echoInstance) return;

          const channel = echoInstance.join(`driver-notification.${driverId}`);

          channel.here((users: any[]) => {
            const driverData = users.find((u: any) => u.driver_id === Number(driverId) || u.id === Number(driverId));
            if (driverData && driverData.lat && driverData.lng) {
              const newLocation = {
                latitude: parseFloat(driverData.lat),
                longitude: parseFloat(driverData.lng),
              };
              initializeMapLocation(newLocation);
              handleLocationUpdate(driverData.lat, driverData.lng, driverData.bearing || 0);
            }
          });

          channel.listen('.driver.track_update', (data: any) => {
            if (data && data.lat && data.lng) {
              handleLocationUpdate(data.lat, data.lng, data.bearing || 0);
            }
          });

          channel.listen('.driver.location_updated', (data: any) => {
            if (data && data.lat && data.lng) {
              handleLocationUpdate(data.lat, data.lng, data.bearing || 0);
            }
          });
        } catch (err) {
          console.error("Echo init error:", err);
        }
      }
    };

    setupTracking();

    return () => {
      if (echoInstance) {
        echoInstance.leave(`driver-notification.${driverId}`);
      }
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [driverId, selfDriver?.id, selfDriver?.lat, selfDriver?.lng, pickupCoordinate?.latitude, pickupCoordinate?.longitude]);

  useEffect(() => {
    const destination = parseCoordinate(Destinationlocation) || destinationCoordinate
    // Use the booked pickup for the full passenger route. If the trip payload
    // has no pickup, route from the live driver location instead.
    const origin = pickupCoordinate || parseMapCoordinate(driverLocation)
    if (!origin || !destination || !Google_Map_Key) {
      if (routeCoordinates.length) setRouteCoordinates([])
      return;
    }

    const routeStops = (stoplocation || [])
      .map(parseMapCoordinate)
      .filter(Boolean) as Array<{ latitude: number; longitude: number }>
    const originKey = pickupCoordinate
      ? `${origin.latitude},${origin.longitude}`
      : `${origin.latitude.toFixed(3)},${origin.longitude.toFixed(3)}`
    const stopLocationsKey = routeStops.map(stop => `${stop.latitude},${stop.longitude}`).join('|')
    const routeTripKey = `${origin.latitude},${origin.longitude}-${stopLocationsKey}-${destination.latitude},${destination.longitude}`
    const routeKey = `${originKey}-${stopLocationsKey}-${destination.latitude},${destination.longitude}`

    // Skip duplicate route requests. When GPS is the origin, refresh at most
    // every 30 seconds; itinerary changes are fetched immediately.
    if (lastRouteParams.current === routeKey) return;
    const tripChanged = lastRouteTripKey.current !== routeTripKey
    if (!pickupCoordinate && !tripChanged && lastRouteFetchAt.current && Date.now() - lastRouteFetchAt.current < 30000) return;

    lastRouteParams.current = routeKey;
    lastRouteTripKey.current = routeTripKey
    lastRouteFetchAt.current = Date.now();
    const currentRequestId = ++routeRequestId.current
    if (tripChanged) setRouteCoordinates([])

    const routeBody = {
      origin: {
        location: { latLng: { latitude: origin.latitude, longitude: origin.longitude } },
      },
      destination: {
        location: { latLng: { latitude: destination.latitude, longitude: destination.longitude } },
      },
      intermediates: routeStops.map(stop => ({
        location: { latLng: { latitude: stop.latitude, longitude: stop.longitude } },
      })),
      travelMode: 'DRIVE',
      computeAlternativeRoutes: false,
      units: 'METRIC',
    }

    fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': Google_Map_Key,
        'X-Goog-FieldMask': 'routes.polyline.encodedPolyline',
      },
      body: JSON.stringify(routeBody),
    })
      .then(async response => {
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result?.error?.message || `Routes API request failed (${response.status})`)
        }
        const encodedPolyline = result?.routes?.[0]?.polyline?.encodedPolyline
        if (!encodedPolyline) throw new Error('Routes API returned no road geometry')
        const points: any = decodePolyline(encodedPolyline)
        if (currentRequestId === routeRequestId.current && points.length > 1) {
          setRouteCoordinates(points)
        }
      })
      .catch(error => {
        if (currentRequestId === routeRequestId.current) {
          console.warn('Driver road route unavailable:', error?.message || error)
          setRouteCoordinates([])
        }
      })
  }, [Destinationlocation, stoplocation, driverLocation, Google_Map_Key, rideDetails?.id, tripCoordinatesKey, pickupCoordinate?.latitude, pickupCoordinate?.longitude])

  useEffect(() => {
    if (webViewRef.current && routeCoordinates?.length > 0) {
      const formattedPoints = routeCoordinates.map((p: any) => ({
        lat: p.latitude,
        lng: p.longitude,
      }));

      const jsCode = `
        window.updatePolyline(${JSON.stringify(formattedPoints)});
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);

      // Fit bounds only once when route is first loaded
      setTimeout(() => {
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript('window.fitMapToPolyline(); true;');
        }
      }, 500);
    }
  }, [routeCoordinates]);

  // useEffect to update the destination marker when the prop changes
  useEffect(() => {
    if (webViewRef.current) {
      const destinationCoords = Destinationlocation ? parseCoordinate(Destinationlocation) : null;
      const destinationForWebView = destinationCoords ? { lat: destinationCoords.latitude, lng: destinationCoords.longitude } : null;

      const jsCode = `
        window.updateDestinationMarker(${JSON.stringify(destinationForWebView)});
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [Destinationlocation]);

  //  [NEW] useEffect to update stop markers when the prop changes
  useEffect(() => {
    if (webViewRef.current && stoplocation && stoplocation?.length > 0) {
      const stopMarkers = stoplocation.map((stop: any) => {
        // Handle both {lat, lng} and {latitude, longitude} formats
        const lat = stop.lat !== undefined ? parseFloat(stop.lat) : parseFloat(stop.latitude);
        const lng = stop.lng !== undefined ? parseFloat(stop.lng) : parseFloat(stop.longitude);
        return { lat, lng };
      });

      // Create unique key to prevent unnecessary updates
      const stopMarkersKey = JSON.stringify(stopMarkers);

      // Only update if stop markers actually changed
      if (lastStopMarkersKey.current === stopMarkersKey) return;
      lastStopMarkersKey.current = stopMarkersKey;

      const jsCode = `
        window.updateStopMarkers(${JSON.stringify(stopMarkers)});
        true;
      `;
      webViewRef.current.injectJavaScript(jsCode);
    } else if (webViewRef.current && (!stoplocation || stoplocation?.length === 0)) {
      // Clear stop markers if none exist
      if (lastStopMarkersKey.current !== '') {
        lastStopMarkersKey.current = '';
        webViewRef.current.injectJavaScript('window.updateStopMarkers([]); true;');
      }
    }
  }, [stoplocation]);



  const decodePolyline = (t: any) => {
    let points = [], index = 0, lat = 0, lng = 0;
    while (index < t.length) {
      let b, shift = 0, result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const getBearing = (start: any, end: any) => {
    const toRad = (deg: any) => (deg * Math.PI) / 180, toDeg = (rad: any) => (rad * 180) / Math.PI;
    const lat1 = toRad(start.latitude), lon1 = toRad(start.longitude);
    const lat2 = toRad(end.latitude), lon2 = toRad(end.longitude);
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  };

  const getDistance = (from: any, to: any) => {
    const R = 6371000;
    const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const driverIconUrl = mapVehicleMarker(rideDetails?.vehicle?.vehicle_type || selfDriver, rideDetails?.vehicle?.vehicle_type?.map_icon_url || selfDriver?.vehicle_info?.vehicle_type_map_icon_url) || "";
  const mapStyleString = isDark ? JSON.stringify(darkMapStyle) : '[]';
  const initialDestinationCoords = parseCoordinate(Destinationlocation) || destinationCoordinate;
  const initialDestinationForWebView = initialDestinationCoords ? { lat: initialDestinationCoords.latitude, lng: initialDestinationCoords.longitude } : null;
  const initialStopMarkers = stoplocation && stoplocation.length > 0 ? stoplocation.map((stop: any) => {
    // Handle both {lat, lng} and {latitude, longitude} formats
    const lat = stop.lat !== undefined ? parseFloat(stop.lat) : parseFloat(stop.latitude);
    const lng = stop.lng !== undefined ? parseFloat(stop.lng) : parseFloat(stop.longitude);
    return { lat, lng };
  }) : [];
  const initialDestinationJson = JSON.stringify(initialDestinationForWebView);
  const initialStopMarkersJson = JSON.stringify(initialStopMarkers);


  const htmlContent = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: #000; }
  .leaflet-control-zoom { display: none !important; }
</style>
</head>
<body>
<div id="map"></div>

${(mapType === "google_map" || mapType === "google")
      ? `
  <!--  GOOGLE MAP VERSION -->
  <script src="https://maps.googleapis.com/maps/api/js?key=${Google_Map_Key}"></script>
  <script>
    let map, driverMarker, destinationMarker, routePolyline, stopMarkers = [];
    let driverMoveFrame = null;
    function initMap() {
      map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: ${initialRegion?.latitude}, lng: ${initialRegion?.longitude} },
        zoom: 16,
        disableDefaultUI: true,
        styles: ${mapStyleString},
      });

      // Set initial destination
      updateDestinationMarker(${initialDestinationJson});

      // Set initial stop markers
      updateStopMarkers(${initialStopMarkersJson});

      routePolyline = new google.maps.Polyline({
        path: [], geodesic: true, strokeColor: '${appColors.primary}', strokeOpacity: 1.0, strokeWeight: 4
      });
      routePolyline.setMap(map);
      window.ReactNativeWebView?.postMessage("WebViewReady");
    }

    //  [NEW] Function to handle destination marker updates
    window.updateDestinationMarker = function(destPos) {
      if (!destPos) {
        if (destinationMarker) {
          destinationMarker.setMap(null);
          destinationMarker = null;
        }
        return;
      }
      if (destinationMarker) {
        destinationMarker.setPosition(destPos);
      } else {
        destinationMarker = new google.maps.Marker({ position: destPos, map: map, title: "Destination" });
      }
    };

    //  [NEW] Function to handle stop markers updates
    window.updateStopMarkers = function(stops) {
      // Clear existing stop markers
      stopMarkers.forEach(marker => marker.setMap(null));
      stopMarkers = [];

      // Add new stop markers with numbered labels
      if (stops && stops.length > 0) {
        stops.forEach((stop, index) => {
          const marker = new google.maps.Marker({
            position: stop,
            map: map,
            label: {
              text: (index + 1).toString(),
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '${appColors.primary}',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2
            },
            title: "Stop " + (index + 1)
          });
          stopMarkers.push(marker);
        });
      }
    };

    window.updateDriverMarker = function(lat, lng, rotation) {
      const newPosition = new google.maps.LatLng(lat, lng);
      if (!driverMarker) {
        driverMarker = new google.maps.Marker({
          position: newPosition,
          map: map,
          icon: { url: '${driverIconUrl}', scaledSize: new google.maps.Size(40, 40), anchor: new google.maps.Point(20, 20) }
        });
      } else {
        if (driverMoveFrame !== null) cancelAnimationFrame(driverMoveFrame);
        const start = driverMarker.getPosition() || newPosition;
        const startedAt = performance.now();
        const duration = 500;
        const animate = () => {
          const progress = Math.min((performance.now() - startedAt) / duration, 1);
          const eased = progress * (2 - progress);
          driverMarker.setPosition(new google.maps.LatLng(
            start.lat() + (newPosition.lat() - start.lat()) * eased,
            start.lng() + (newPosition.lng() - start.lng()) * eased
          ));
          if (progress < 1) driverMoveFrame = requestAnimationFrame(animate);
          else driverMoveFrame = null;
        };
        driverMoveFrame = requestAnimationFrame(animate);
      }
      const currentIcon = driverMarker.getIcon();
      // Google Maps only supports rotation on Symbol icons. The vehicle uses a
      // URL image, so assigning .rotation to its getIcon() result throws on GPS
      // updates and interrupts marker rendering.
      if (currentIcon && typeof currentIcon === 'object' && currentIcon.path) {
        driverMarker.setIcon({ ...currentIcon, rotation });
      }
    };

    window.updatePolyline = function(points) {
      routePolyline?.setPath(points);
    };

    window.fitMapToPolyline = function() {
      const path = routePolyline.getPath();
      if (path.getLength() > 1) {
        const bounds = new google.maps.LatLngBounds();
        path.forEach(latLng => bounds.extend(latLng));
        if(driverMarker) bounds.extend(driverMarker.getPosition());
        if(destinationMarker) bounds.extend(destinationMarker.getPosition());
        stopMarkers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 });
      }
    };

    window.animateCameraTo = function(center) { 
      // Camera animation removed to prevent constant refocusing
    };
    window.addEventListener('load', initMap);
  </script>
  `
      : `
  <!--  OSM MAP VERSION -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  <script>
    let map, driverMarker, destinationMarker, routeLine, stopMarkers = [];
    let driverMoveFrame = null;
    const driverIconUrl = '${driverIconUrl}';

    function initMap() {
      map = L.map('map', {
        center: [${initialRegion?.latitude}, ${initialRegion?.longitude}],
        zoom: 16, zoomControl: false, attributionControl: false
      });
      const tileLayer = ${isDark ? `L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 })` : `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })`};
      tileLayer.addTo(map);

      // Set initial destination
      updateDestinationMarker(${initialDestinationJson});

      // Set initial stop markers
      updateStopMarkers(${initialStopMarkersJson});

      routeLine = L.polyline([], { color: '${appColors.primary}', weight: 4, opacity: 1 }).addTo(map);
      window.ReactNativeWebView?.postMessage("WebViewReady");
    }

    // [NEW] Function to handle destination marker updates
    window.updateDestinationMarker = function(destPos) {
      if (!destPos) {
        if (destinationMarker) {
          map.removeLayer(destinationMarker);
          destinationMarker = null;
        }
        return;
      }
      const latLng = [destPos.lat, destPos.lng];
      if (destinationMarker) {
        destinationMarker.setLatLng(latLng);
      } else {
        destinationMarker = L.marker(latLng, { title: "Destination" }).addTo(map);
      }
    };

    //  [NEW] Function to handle stop markers updates
    window.updateStopMarkers = function(stops) {
      // Clear existing stop markers
      stopMarkers.forEach(marker => map.removeLayer(marker));
      stopMarkers = [];

      // Add new stop markers with numbered labels
      if (stops && stops.length > 0) {
        stops.forEach((stop, index) => {
          const icon = L.divIcon({
            className: 'custom-stop-marker',
            html: '<div style="background-color: ${appColors.primary}; color: white; border: 3px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">' + (index + 1) + '</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          const marker = L.marker([stop.lat, stop.lng], { icon: icon, title: "Stop " + (index + 1) }).addTo(map);
          stopMarkers.push(marker);
        });
      }
    };

    window.updateDriverMarker = function(lat, lng) {
      const pos = L.latLng(lat, lng);
      if (!driverMarker) {
        const icon = L.icon({ iconUrl: driverIconUrl, iconSize: [40, 40], iconAnchor: [20, 20] });
        driverMarker = L.marker(pos, { icon }).addTo(map);
      } else {
        if (driverMoveFrame !== null) cancelAnimationFrame(driverMoveFrame);
        const start = driverMarker.getLatLng();
        const startedAt = performance.now();
        const duration = 500;
        const animate = () => {
          const progress = Math.min((performance.now() - startedAt) / duration, 1);
          const eased = progress * (2 - progress);
          driverMarker.setLatLng([
            start.lat + (pos.lat - start.lat) * eased,
            start.lng + (pos.lng - start.lng) * eased,
          ]);
          if (progress < 1) driverMoveFrame = requestAnimationFrame(animate);
          else driverMoveFrame = null;
        };
        driverMoveFrame = requestAnimationFrame(animate);
      }
    };

    window.updatePolyline = function(points) {
      const latLngs = points.map(p => [p.lat, p.lng]);
      routeLine?.setLatLngs(latLngs);
    };

    window.fitMapToPolyline = function() {
      const latLngs = routeLine.getLatLngs();
      if (latLngs.length > 1) {
        const bounds = L.latLngBounds(latLngs);
        if(driverMarker) bounds.extend(driverMarker.getLatLng());
        if(destinationMarker) bounds.extend(destinationMarker.getLatLng());
        stopMarkers.forEach(marker => bounds.extend(marker.getLatLng()));
        map.fitBounds(bounds, { padding: [80, 80] });
      }
    };

    window.animateCameraTo = function(center) { map.panTo([center.lat, center.lng]); };
    window.addEventListener('load', initMap);
  </script>
  `
    }
</body>
</html>
`, [
    mapType,
    Google_Map_Key,
    initialRegion.latitude,
    initialRegion.longitude,
    mapStyleString,
    driverIconUrl,
    initialDestinationJson,
    initialStopMarkersJson,
    appColors.primary,
  ]);
  const webViewSource = useMemo(() => ({ html: htmlContent }), [htmlContent]);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={webViewSource}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        onMessage={(event) => {
          const msg = event.nativeEvent.data;
          if (msg === 'WebViewReady') {
            setIsWebViewReady(true);
            // Re-inject current state
            if (driverLocation) {
              const jsCode = `
                window.updateDriverMarker(${driverLocation.latitude}, ${driverLocation.longitude}, ${rotation});
                true;
              `;
              webViewRef.current.injectJavaScript(jsCode);
            }
            if (routeCoordinates?.length > 0) {
              const formattedPoints = routeCoordinates.map((p: any) => ({
                lat: p.latitude,
                lng: p.longitude,
              }));
              webViewRef.current.injectJavaScript(`window.updatePolyline(${JSON.stringify(formattedPoints)}); true;`);
              webViewRef.current.injectJavaScript('window.fitMapToPolyline(); true;');
            }
          }
        }}
      />
    </View>
  )
}

export const Map = React.memo(MapComponent, (previous, next) => {
  const relevantProps = (props: any) => JSON.stringify({
    destination: props.Destinationlocation,
    driverId: props.driverId,
    rideId: props.rideDetails?.id,
    pickupLatitude: props.rideDetails?.pickup_latitude,
    pickupLongitude: props.rideDetails?.pickup_longitude,
    pickup: props.rideDetails?.location_coordinates?.[0],
    route: props.rideDetails?.location_coordinates ?? [],
    mapProvider: props.rideDetails?.map_provider,
    driverIcon: props.rideDetails?.vehicle?.vehicle_type?.map_icon_url,
    stops: props.stoplocation ?? [],
  });

  return relevantProps(previous) === relevantProps(next);
});



