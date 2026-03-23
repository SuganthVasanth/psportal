import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Bus, MapPin, Navigation, StopCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

function RecenterMap({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.setView(coords, map.getZoom());
        }
    }, [coords, map]);
    return null;
}

export default function BusIncharge() {
    const [bus, setBus] = useState(null);
    const [tracking, setTracking] = useState(false);
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const socketRef = useRef(null);
    const watchIdRef = useRef(null);

    useEffect(() => {
        let loaded = false;
        let cancelled = false;

        const fetchBus = async (userId) => {
            try {
                const res = await axios.get(`${API_BASE}/api/buses/incharge/${userId}`);
                if (cancelled) return;
                setBus(res.data);
            } catch (err) {
                if (cancelled) return;
                console.error("Error fetching bus:", err);
                setError("No bus assigned to you.");
            }
        };

        const tryLoad = () => {
            if (loaded) return;
            const userId = localStorage.getItem("userId");
            if (!userId) return;
            loaded = true;
            setError(null);
            fetchBus(userId);
        };

        // StaffDashboardLayout writes localStorage.userId after /api/dashboard/me loads.
        // This page may mount before that happens, so we retry briefly.
        tryLoad();
        const intervalId = setInterval(tryLoad, 500);
        const timeoutId = setTimeout(() => {
            if (!loaded && !cancelled) {
                clearInterval(intervalId);
                setError("User ID not found. Please log in again.");
            }
        }, 10000);

        socketRef.current = io(API_BASE);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            if (socketRef.current) socketRef.current.disconnect();
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, []);

    // Auto-start tracking when bus is loaded
    useEffect(() => {
        if (bus && !tracking && !error) {
            startTracking();
        }
    }, [bus]);

    const startTracking = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        setTracking(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation([latitude, longitude]);
                
                // Emit to socket
                if (socketRef.current && bus) {
                    socketRef.current.emit('update-location', {
                        busId: bus._id,
                        latitude,
                        longitude
                    });
                }

                // Update DB
                if (bus) {
                    axios.post(`${API_BASE}/api/buses/location`, {
                        busId: bus._id,
                        latitude,
                        longitude
                    }).catch(err => console.error("DB update error:", err));
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError("Failed to get location. Please enable GPS.");
                setTracking(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const stopTracking = () => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setTracking(false);
    };

    if (error && !bus) {
        return <div className="p-8 text-red-500 font-medium">{error}</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <header className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Bus size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Bus Incharge Portal</h1>
                        <p className="text-sm text-slate-500">{bus?.busNumber} — {bus?.route}</p>
                    </div>
                </div>
                {tracking ? (
                    <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium animate-pulse border border-green-200">
                        <Navigation size={18} /> Live Broadcast Active
                    </div>
                ) : (
                    <button 
                        onClick={startTracking}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-md active:scale-95"
                    >
                        <Navigation size={18} /> Enable Tracking
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Status</h3>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${tracking ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                            <span className="font-medium text-slate-700">{tracking ? 'Live Tracking...' : 'Ready to start'}</span>
                        </div>
                    </div>
                    
                    {location && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Current Location</h3>
                            <div className="space-y-2 text-sm">
                                <p className="text-slate-600">Lat: <span className="text-slate-900">{location[0].toFixed(6)}</span></p>
                                <p className="text-slate-600">Lon: <span className="text-slate-900">{location[1].toFixed(6)}</span></p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="md:col-span-3 h-[500px] bg-slate-100 rounded-xl overflow-hidden shadow-inner border border-slate-200 relative">
                    <MapContainer center={[11.5033, 77.2444]} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        {location && (
                            <>
                                <Marker position={location}>
                                    <Popup>Your Bus is here</Popup>
                                </Marker>
                                <RecenterMap coords={location} />
                            </>
                        )}
                    </MapContainer>
                    {!tracking && !location && (
                        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center z-[1000]">
                            <p className="bg-white px-4 py-2 rounded-lg shadow-lg text-slate-700 font-medium">Start the trip to see location on map</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}