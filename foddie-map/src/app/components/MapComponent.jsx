import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

const MapComponent = ({ lat, lon }) => {
  useEffect(() => {
    // Opcional: Validar si las coordenadas existen
    if (!lat || !lon) {
      console.warn('Coordenadas no válidas para el mapa');
    }
  }, [lat, lon]);

  return (
    <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
      {lat && lon ? (
        <MapContainer center={[lat, lon]} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[lat, lon]}>
            <Popup>
              <span>Ubicación seleccionada</span>
            </Popup>
          </Marker>
        </MapContainer>
      ) : (
        <p>Introduce coordenadas válidas para mostrar el mapa</p>
      )}
    </div>
  );
};

export default MapComponent;