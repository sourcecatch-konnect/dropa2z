@push('scripts')
<script src="https://maps.googleapis.com/maps/api/js?key={{ env('GOOGLE_MAP_API_KEY') }}&libraries=places,geometry,drawing&callback=initMap" defer></script>
<script>
    var locationCoordinates = <?php echo json_encode($locationCoordinates); ?>

    function initMap() {
         var start = {
            lat: parseFloat(locationCoordinates[0].lat),
            lng: parseFloat(locationCoordinates[0].lng)
        };

        var end = {
            lat: parseFloat(locationCoordinates[locationCoordinates.length - 1].lat),
            lng: parseFloat(locationCoordinates[locationCoordinates.length - 1].lng)
        };


        // Initialize Google Maps
        var map = new google.maps.Map(document.getElementById('map-view'), {
            zoom: 12,
            center: start
        });

        // DirectionsService is a legacy Google API that cannot be enabled for
        // new projects.  Use Routes API instead, then draw its polyline on
        // the existing Maps JavaScript map.
        var routesApiKey = @json(env('GOOGLE_MAP_API_KEY'));
        var intermediates = locationCoordinates.slice(1, -1).map(function(coordinate) {
            return {
                location: {
                    latLng: {
                        latitude: parseFloat(coordinate.lat),
                        longitude: parseFloat(coordinate.lng)
                    }
                }
            };
        });

        fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': routesApiKey,
                'X-Goog-FieldMask': 'routes.polyline.encodedPolyline'
            },
            body: JSON.stringify({
                origin: { location: { latLng: { latitude: start.lat, longitude: start.lng } } },
                destination: { location: { latLng: { latitude: end.lat, longitude: end.lng } } },
                intermediates: intermediates,
                travelMode: 'DRIVE'
            })
        })
            .then(function(response) {
                if (!response.ok) throw new Error('Routes API request failed');
                return response.json();
            })
            .then(function(data) {
                var encodedPolyline = data?.routes?.[0]?.polyline?.encodedPolyline;
                if (!encodedPolyline) throw new Error('No route returned');

                var routePath = google.maps.geometry.encoding.decodePath(encodedPolyline);
                new google.maps.Polyline({
                    path: routePath,
                    map: map,
                    strokeColor: '#199675',
                    strokeWeight: 5,
                    strokeOpacity: 0.8
                });
                new google.maps.Marker({ position: start, map: map, label: 'A' });
                new google.maps.Marker({ position: end, map: map, label: 'B' });

                var bounds = new google.maps.LatLngBounds();
                routePath.forEach(function(point) { bounds.extend(point); });
                map.fitBounds(bounds);
            })
            .catch(function(error) {
                console.error('Routes API request failed:', error);
                window.alert('Unable to load the route. Please try again.');
            });
    }
</script>

<script>
    (function($) {
        "use strict";
        $('#rideForm').validate();
    })(jQuery);
</script>

@endpush
