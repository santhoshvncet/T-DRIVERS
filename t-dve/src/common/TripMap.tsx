import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

interface LatLng {
  lat: number;
  lng: number;
}

interface Props {
  origin: LatLng;
  destination: LatLng;
  isModalOpen: boolean;
}

const TripMap: React.FC<Props> = ({ origin, destination, isModalOpen }) => {
  const containerStyle = {
    width: "100%",
    height: isModalOpen ? "50vh" : "85vh",
  };

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyCfbJMcqAWFUQ24PRcotG1pK2UYHcrYkJw",
  });

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(destination);
    map.fitBounds(bounds);
  };

  useEffect(() => {
    if (mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      mapRef.current.fitBounds(bounds);
    }
  }, [origin, destination]);


  useEffect(() => {
    if (!isLoaded) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          console.error("Directions request failed:", status);
        }
      }
    );
  }, [origin, destination, isLoaded]);

  const coordsValid =
    Number.isFinite(origin?.lat) &&
    Number.isFinite(origin?.lng) &&
    Number.isFinite(destination?.lat) &&
    Number.isFinite(destination?.lng);

  if (!isLoaded || !coordsValid) {
    console.warn("Map not ready or invalid coordinates");
    return null; 
  }

  

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={origin}
      zoom={14}
      onLoad={onMapLoad}
    >
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true,
            polylineOptions: {
              strokeWeight: 4,
              strokeOpacity: 1,
            },
          }}
        />
      )}

      <Marker position={origin} label="A" />
      <Marker position={destination} label="B" />
    </GoogleMap>
  );
};

export default TripMap;
