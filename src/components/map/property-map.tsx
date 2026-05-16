'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in bundlers
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyMapProps {
  lat: number;
  lng: number;
  address?: string;
}

export function PropertyMap({ lat, lng, address }: PropertyMapProps) {
  // This component is always dynamically imported with ssr: false,
  // so it only renders on the client side — no isClient check needed.

  const mapProps = {
    center: [lat, lng] as [number, number],
    zoom: 15,
    scrollWheelZoom: false,
    style: { height: '100%', width: '100%' } as const,
    className: 'rounded-xl',
  };

  const tileProps = {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden" style={{ height: '300px' }}>
      {/* react-leaflet v5 + Leaflet typings: cast for spread when @types/leaflet is absent */}
      <MapContainer {...(mapProps as object)}>
        {/* @ts-expect-error TileLayerProps omits Leaflet options without @types/leaflet; attribution is valid at runtime */}
        <TileLayer attribution={tileProps.attribution} url={tileProps.url} />
        <Marker position={[lat, lng]}>
          <Popup>
            <span className="text-sm font-medium">{address || 'Property Location'}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
