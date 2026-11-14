import {BrandLoader} from '../../design/BrandLogo';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import getEchoInstance from '@src/utils/echo';
import { appColors } from '@src/themes';
import darkMapStyle from '@src/screens/darkMapStyle';
import { useValues } from '@src/utils/context/index';
import { MapViewProps } from '../type';
import { styles } from './style';
import { useSelector } from 'react-redux';

// Live GPS updates rerender the parent map component. Keep the native WebView
// mounted unless the actual HTML source changes.
const StableMapWebView = React.memo(
  WebView,
  (previous, next) => previous.source === next.source,
);


function MapComponent({
  userLocation,
  driverId,
  markerImage,
  driverLocation,
  setDriverLocation,
  waypoints = [],
  onDurationChange,
}: MapViewProps) {
  const { taxidoSettingData } = useSelector((state: any) => state.setting);
  const [routeCoordinates, setRouteCoordinates] = useState<any>([]);
  const [rotation, setRotation] = useState<number | any>(0);
  const [markerIconDataUri, setMarkerIconDataUri] = useState<null | string | any>(null);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [_isLoading, setIsLoading] = useState<boolean>(true);
  const webviewRef = useRef<any>(null);
  const lastPosition = useRef<any>(null);
  const lastRouteFetchAt = useRef<number>(0);
  const lastRouteWaypoints = useRef<string>("");
  const { isDark, Google_Map_Key } = useValues();
  const [mapType] = useState(taxidoSettingData?.cabbooking_values?.location?.map_provider);

  const parseCoordinate = (coordinate: any) => ({
    latitude: parseFloat(coordinate.lat),
    longitude: parseFloat(coordinate.lng),
  });
  // A live ride can refresh its location object frequently. Keep the WebView's
  // initial map center fixed to the pickup so those updates never reload tiles.
  const initialMapCenterRef = useRef({
    latitude: userLocation ? parseCoordinate(userLocation).latitude : 37.78825,
    longitude: userLocation ? parseCoordinate(userLocation).longitude : -122.4324,
  });
  const initialLat = initialMapCenterRef.current?.latitude ?? 37.78825;
  const initialLng = initialMapCenterRef.current?.longitude ?? -122.4324;
  const latestMapDataRef = useRef<any>(null);
  latestMapDataRef.current = { userLocation, driverLocation, rotation, routeCoordinates };

  useEffect(() => {
    setIsLoading(true);
    setIsMapReady(false);
    setDriverLocation?.(null);
    setRouteCoordinates([]);
    setMarkerIconDataUri(null);
    lastPosition.current = null;
    let isActive = true;

    if (markerImage?.startsWith("data:")) {
      setMarkerIconDataUri(markerImage);
    } else if (markerImage) {
      fetch(markerImage)
        .then(res => res.text())
        .then(svgContent => {
          if (isActive) {
            const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
            setMarkerIconDataUri(dataUri);
          }
        })
        .catch(error => console.error("Error fetching vehicle image:", error));
    }

    let echoInstance: any = null;
    let isEchoActive = true;

    if (driverId && setDriverLocation) {
      getEchoInstance().then((echo: any) => {
        if (!isEchoActive) return;
        echoInstance = echo;
        const channelName = `driver-notification.${driverId}`;

        echo.join(channelName)
          .here((members: any[]) => {
            if (isActive && members && members.length > 0) {
              // The backend injects the driver location into the presence auth payload
              const data = members[members.length - 1];
              if (data && data.lat && data.lng) {
                const newLocation: any = { latitude: parseFloat(data.lat), longitude: parseFloat(data.lng) };
                lastPosition.current = newLocation;
                setDriverLocation(newLocation);
              }
            }
          })
          .joining((member: any) => {
            console.log("📍 [Pusher MapView] Member Joined:", member);
          })
          .error((error: any) => {
            console.error("📍 [Pusher MapView] Error Joining Presence Channel:", error);
          })
          .listen('.driver.location_updated', (e: any) => {
            if (isActive) {
              const data = e.data || e;
              if (data && data.lat && data.lng) {
                const newLocation: any = { latitude: parseFloat(data.lat), longitude: parseFloat(data.lng) };

                if (lastPosition.current && routeCoordinates?.length > 1) {
                  const distance = getDistance(lastPosition.current, newLocation);
                  if (distance < 3) return;
                  const angle = calculateRoadBearing(newLocation, routeCoordinates);
                  if (!isNaN(angle)) {
                    setRotation(angle);
                  }
                } else if (lastPosition.current && userLocation) {
                  const angle = getBearing(lastPosition.current, parseCoordinate(userLocation));
                  if (!isNaN(angle)) {
                    setRotation(angle);
                  }
                }

                lastPosition.current = newLocation;
                setDriverLocation(newLocation);
              }
            }
          });
      }).catch((err: any) => console.error("Error connecting to Echo:", err));
    }

    return () => {
      isActive = false;
      isEchoActive = false;
      if (echoInstance && driverId) {
        echoInstance.leave(`driver-notification.${driverId}`);
      }
    };
  }, [driverId, markerImage]);

  useEffect(() => {
    if (!driverLocation || !userLocation) {
      if (routeCoordinates?.length > 0) {
        setRouteCoordinates([]);
      }
      return;
    }

    const now = Date.now();
    const waypointsKey = JSON.stringify(waypoints || []);
    const isWaypointChange = waypointsKey !== lastRouteWaypoints.current;

    // GPS events arrive much more often than the route meaningfully changes.
    // Throttle Directions requests independently from the last driver position.
    if (!isWaypointChange && now - lastRouteFetchAt.current < 10000) {
      return;
    }

    lastRouteFetchAt.current = now;
    lastRouteWaypoints.current = waypointsKey;

    const origin = driverLocation;
    const destination = parseCoordinate(userLocation);
    const waypointsParam = waypoints && waypoints?.length > 0
      ? `&waypoints=optimize:false|${waypoints.map((wp: any) => `${wp.lat},${wp.lng}`).join('|')}`
      : '';
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin?.latitude},${origin?.longitude}&destination=${destination?.latitude},${destination?.longitude}${waypointsParam}&mode=driving&departure_time=now&traffic_model=best_guess&key=${Google_Map_Key}`;


    fetch(directionsUrl)
      .then(res => res.json())
      .then(json => {
        if (json.status === 'OK' && json.routes?.length > 0) {
          const points = decodePolyline(json.routes[0].overview_polyline.points);
          const validPoints = points.every(p => typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude));
          if (validPoints) {
            setRouteCoordinates(points);
          } else {
            console.error('Invalid coordinates in route:', points);
          }
          if (onDurationChange && json.routes[0].legs) {
            const totalDuration = json.routes[0].legs.reduce((sum: number, leg: any) => sum + (leg.duration_in_traffic?.value ?? leg.duration?.value ?? 0), 0);
            onDurationChange(totalDuration);
          }
        } else {
          console.error('Directions API error:', json.status, json.error_message || 'No routes found');
          onDurationChange?.(null);
          // Keep the last good road line visible during temporary API failures.
        }
      })
      .catch(error => {
        console.error('Error fetching route:', error);
        onDurationChange?.(null);
        // Keep the last good road line visible during temporary API failures.
      });
  }, [driverLocation, userLocation, Google_Map_Key, JSON.stringify(waypoints)]);

  const calculateRoadBearing = (currentLocation: any, routeCoords: any) => {
    if (!routeCoords || routeCoords?.length < 2) return NaN;

    let closestPoint = null;
    let minDistance = Infinity;
    let nextPoint = null;

    for (let i = 0; i < routeCoords?.length - 1; i++) {
      const point = routeCoords[i];
      const distance = getDistance(currentLocation, point);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
        nextPoint = routeCoords[i + 1];
      }
    }

    if (!closestPoint || !nextPoint) return NaN;
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;
    const lat1 = toRad(closestPoint.latitude);
    const lon1 = toRad(closestPoint.longitude);
    const lat2 = toRad(nextPoint.latitude);
    const lon2 = toRad(nextPoint.longitude);
    const dLon = lon2 - lon1;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
    return bearing;
  };

  useEffect(() => {
    if (isMapReady && driverLocation && webviewRef.current) {
      const script = `updateDriverLocation(${driverLocation.latitude}, ${driverLocation.longitude}, ${rotation});`;
      webviewRef.current.injectJavaScript(script);
    }
  }, [isMapReady, driverLocation, rotation]);

  useEffect(() => {
    if (isMapReady && markerIconDataUri && webviewRef.current) {
      const script = `updateDriverIcon('${markerIconDataUri}');`;
      webviewRef.current.injectJavaScript(script);
    }
  }, [isMapReady, markerIconDataUri]);

  useEffect(() => {
    if (isMapReady && userLocation && webviewRef.current) {
      const { latitude, longitude } = parseCoordinate(userLocation);
      const script = `updateUserLocation(${latitude}, ${longitude});`;
      webviewRef.current.injectJavaScript(script);
    }
  }, [isMapReady, userLocation]);

  useEffect(() => {
    if (isMapReady && waypoints && waypoints?.length > 0 && webviewRef.current) {
      const script = `updateWaypointMarkers(${JSON.stringify(waypoints)});`;
      webviewRef.current.injectJavaScript(script);
    }
  }, [isMapReady, waypoints]);

  useEffect(() => {
    if (isMapReady && driverLocation && userLocation && webviewRef.current) {
      const hasDetailedRoute = routeCoordinates?.length > 0;
      const coords = hasDetailedRoute ? routeCoordinates : [driverLocation, parseCoordinate(userLocation)];
      const script = `
        if (typeof google !== 'undefined' && google.maps && google.maps.Polyline) {
          updateRoute(${JSON.stringify(coords)}, ${!hasDetailedRoute});
        } else {
          console.warn('Google Maps API not ready, retrying polyline update...');
          setTimeout(() => {
            if (typeof google !== 'undefined' && google.maps && google.maps.Polyline) {
              updateRoute(${JSON.stringify(coords)}, ${!hasDetailedRoute});
            } else {
              console.error('Google Maps API still not ready for polyline');
            }
          }, 500);
        }
      `;
      webviewRef.current.injectJavaScript(script);
    }
  }, [isMapReady, driverLocation, userLocation, routeCoordinates]);

  useEffect(() => {
    if (isMapReady && markerIconDataUri !== null) {
      setIsLoading(false);
    }
  }, [isMapReady, markerIconDataUri]);

  const decodePolyline = (t: any) => {
    let p = [], i = 0, a = 0, n = 0;
    while (i < t.length) {
      let e, h = 0, r = 0;
      do { e = t.charCodeAt(i++) - 63, r |= (31 & e) << h, h += 5 } while (e >= 32);
      let o = 1 & r ? ~(r >> 1) : r >> 1;
      a += o, h = 0, r = 0;
      do { e = t.charCodeAt(i++) - 63, r |= (31 & e) << h, h += 5 } while (e >= 32);
      let u = 1 & r ? ~(r >> 1) : r >> 1;
      n += u, p.push({ latitude: a / 1e5, longitude: n / 1e5 });
    }
    return p;
  };

  const getBearing = (t: any, e: any) => {
    const o = (t: any) => t * Math.PI / 180, a = (t: any) => 180 * t / Math.PI;
    const n = o(t.latitude), r = o(t.longitude), i = o(e.latitude), s = o(e.longitude);
    const c = s - r, h = Math.sin(c) * Math.cos(i);
    const l = Math.cos(n) * Math.sin(i) - Math.sin(n) * Math.cos(i) * Math.cos(c);
    return (a(Math.atan2(h, l)) + 360) % 360;
  };

  const getDistance = (t: any, e: any) => {
    const o = 6371e3, a = (e.latitude - t.latitude) * Math.PI / 180, n = (e.longitude - t.longitude) * Math.PI / 180;
    const r = t.latitude * Math.PI / 180, i = e.latitude * Math.PI / 180;
    const s = Math.sin(a / 2) * Math.sin(a / 2) + Math.sin(n / 2) * Math.sin(n / 2) * Math.cos(r) * Math.cos(i);
    const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    return o * c;
  };


  const mapHtml = useMemo(() => {
    if (mapType === 'google_map') {
      //  GOOGLE MAP VERSION
      return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
          <style>
            html, body, #map { height: 100%; margin: 0; padding: 0; background: #000; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            let map, driverMarker, userMarker, routePath, waypointMarkers = [];
            let driverMoveFrame = null;
            let driverMarkerIconUrl = null;
            const provisionalDash = [{ icon: { path: 'M 0,-1 l 0,1' }, strokeOpacity: 1, scale: 4 }];

            function initMap() {
              map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: ${initialLat}, lng: ${initialLng} },
                zoom: 16,
                styles: ${isDark ? JSON.stringify(darkMapStyle) : '[]'},
                disableDefaultUI: true
              });
              window.ReactNativeWebView.postMessage("map_loaded");
            }

            function updateDriverIcon(iconUrl) {
              driverMarkerIconUrl = iconUrl;
              if (driverMarker) {
                driverMarker.setIcon({
                  url: driverMarkerIconUrl,
                  anchor: new google.maps.Point(25, 25),
                  scaledSize: new google.maps.Size(50, 50),
                  rotation: driverMarker.getIcon()?.rotation || 0
                });
              }
            }
            function updateDriverLocation(lat, lng, rot) {
              const pos = new google.maps.LatLng(lat, lng);
              if (!driverMarker) {
                driverMarker = new google.maps.Marker({
                  position: pos,
                  map: map,
                  icon: driverMarkerIconUrl ? {
                    url: driverMarkerIconUrl,
                    anchor: new google.maps.Point(25, 25),
                    scaledSize: new google.maps.Size(50, 50),
                    rotation: rot
                  } : null
                });
              }
              if (driverMoveFrame !== null) cancelAnimationFrame(driverMoveFrame);
              const start = driverMarker.getPosition() || pos;
              const startedAt = performance.now();
              const duration = 500;
              const animate = () => {
                const progress = Math.min((performance.now() - startedAt) / duration, 1);
                const eased = progress * (2 - progress);
                driverMarker.setPosition(new google.maps.LatLng(
                  start.lat() + (pos.lat() - start.lat()) * eased,
                  start.lng() + (pos.lng() - start.lng()) * eased
                ));
                if (progress < 1) driverMoveFrame = requestAnimationFrame(animate);
                else driverMoveFrame = null;
              };
              driverMoveFrame = requestAnimationFrame(animate);

              const bounds = map.getBounds();
              if (!bounds || !bounds.contains(pos)) {
                map.panTo(pos);
              }
            }

            function updateUserLocation(lat, lng) {
              const pos = new google.maps.LatLng(lat, lng);
              if (!userMarker) {
                userMarker = new google.maps.Marker({ 
                  position: pos, 
                  map: map, 
                  title: 'Destination',
                  label: { text: 'D', color: 'white', fontSize: '14px', fontWeight: 'bold' }
                });
              } else {
                userMarker.setPosition(pos);
              }
            }

            function updateWaypointMarkers(waypoints) {
              // Clear existing waypoint markers
              waypointMarkers.forEach(m => m.setMap(null));
              waypointMarkers = [];
              
              // Add new waypoint markers
              if (waypoints && waypoints.length > 0) {
                waypoints.forEach((wp, index) => {
                  const marker = new google.maps.Marker({
                    position: { lat: wp.lat, lng: wp.lng },
                    map: map,
                    title: 'Stop ' + (index + 1),
                    label: { text: String(index + 1), color: 'white', fontSize: '14px', fontWeight: 'bold' },
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: '#195594',
                      fillOpacity: 1,
                      strokeColor: 'white',
                      strokeWeight: 2
                    }
                  });
                  waypointMarkers.push(marker);
                });
              }
            }

            function updateRoute(coords, isProvisional) {
              if (!coords || coords.length < 2) {
                if (routePath) routePath.setMap(null);
                routePath = null;
                return;
              }

              const path = coords
                .filter(c => c.latitude != null && c.longitude != null)
                .map(c => ({ lat: c.latitude, lng: c.longitude }));

              if (routePath) {
                routePath.setPath(path);
              } else {
                routePath = new google.maps.Polyline({
                  path,
                  geodesic: true,
                  strokeColor: '#195594',
                  strokeWeight: 4,
                  icons: isProvisional ? provisionalDash : null,
                  map: map
                });
              }
            }
          </script>
          <script async defer src="https://maps.googleapis.com/maps/api/js?key=${Google_Map_Key}&callback=initMap"></script>
        </body>
      </html>
    `;
    } else {
      //  OSM MAP VERSION
      return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="initial-scale=1.0, width=device-width, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
          <style>
            html, body, #map { height: 100%; margin: 0; padding: 0; background: #000; }
            .leaflet-control-zoom { display: none !important; } /* Remove + / - buttons */
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
          <script>
            let map, driverMarker, userMarker, routeLine;
            let driverIconUrl = null;

            function initMap() {
              map = L.map('map', {
                zoomControl: false,
                center: [${initialLat}, ${initialLng}],
                zoom: 15,
              });

              const tileLayer = ${isDark ?
          `L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 })` :
          `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })`
        };
              tileLayer.addTo(map);
              window.ReactNativeWebView.postMessage("map_loaded");
            }

            function updateDriverIcon(iconUrl) {
              driverIconUrl = iconUrl;
              if (driverMarker) {
                const icon = L.icon({ iconUrl, iconSize: [50, 50], iconAnchor: [25, 25] });
                driverMarker.setIcon(icon);
              }
            }

            function updateDriverLocation(lat, lng) {
              const pos = [lat, lng];
              if (driverMarker) {
                driverMarker.setLatLng(pos);
              } else {
                const icon = driverIconUrl
                  ? L.icon({ iconUrl: driverIconUrl, iconSize: [50, 50], iconAnchor: [25, 25] })
                  : undefined;
                driverMarker = L.marker(pos, { icon }).addTo(map);
              }
              if (!map.getBounds().contains(pos)) {
                map.panTo(pos);
              }
            }

            function updateUserLocation(lat, lng) {
              const pos = [lat, lng];
              if (userMarker) {
                userMarker.setLatLng(pos);
              } else {
                userMarker = L.marker(pos).addTo(map);
              }
            }

            function updateRoute(coords, isProvisional) {
              if (!coords || coords.length < 2) {
                if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
                return;
              }

              const path = coords
                .filter(c => c.latitude != null && c.longitude != null)
                .map(c => [c.latitude, c.longitude]);

              if (routeLine) {
                routeLine.setLatLngs(path);
              } else {
                routeLine = L.polyline(path, {
                  color: '#195594',
                  weight: 4,
                  opacity: isProvisional ? 0.4 : 0.9,
                  dashArray: isProvisional ? '5, 10' : null
                }).addTo(map);
              }
            }
            initMap();
          </script>
        </body>
      </html>
    `;
    }
  }, [mapType, isDark, Google_Map_Key, initialLat, initialLng]);

  // Keep the native WebView source object stable as live location state
  // updates. A new source object can make Android reload the whole map.
  const webViewSource = useMemo(() => ({ html: mapHtml }), [mapHtml]);

  const onMessage = useCallback((event: any) => {
    if (event.nativeEvent.data === "map_loaded") {
      setIsMapReady(true);
      setTimeout(() => {
        const latest = latestMapDataRef.current;
        if (latest.userLocation && webviewRef.current) {
          const { latitude, longitude } = parseCoordinate(latest.userLocation);
          const script = `
            updateUserLocation(${latitude}, ${longitude});
          `;
          webviewRef.current.injectJavaScript(script);
        }
        if (latest.driverLocation && webviewRef.current) {
          const { latitude, longitude } = latest.driverLocation;
          const script = `
            updateDriverLocation(${latitude}, ${longitude}, ${latest.rotation});
          `;
          webviewRef.current.injectJavaScript(script);
        }
        if (latest.driverLocation && latest.userLocation && webviewRef.current) {
          const coords = latest.routeCoordinates?.length > 0
            ? latest.routeCoordinates
            : [latest.driverLocation, parseCoordinate(latest.userLocation)];
          const script = `
            if (typeof google !== 'undefined' && google.maps && google.maps.Polyline) {
              updateRoute(${JSON.stringify(coords)}, ${latest.routeCoordinates?.length === 0});
            }
          `;
          webviewRef.current.injectJavaScript(script);
        }
      }, 2000);
    }
  }, []);

  return (
    <View style={styles.container}>
      <StableMapWebView
        ref={webviewRef}
        style={styles.webview}
        originWhitelist={['*']}
        source={webViewSource}
        javaScriptEnabled={true}
        onMessage={onMessage}
        startInLoadingState={true}
        renderLoading={() => <BrandLoader style={styles.loadingIndicator} size="large" color={appColors.primary} />}
      />
    </View>
  );
}

export const Map = React.memo(MapComponent)

