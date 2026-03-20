import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { Bus, MapPin, Loader2, AlertCircle, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import StudentSidebar from "../../components/StudentSidebar";
import "../StudentDashboard.css";

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const FALLBACK_PROFILE = {
    register_no: "7376231CS323",
    name: "SUGANTH R",
    avatarUrl: "https://ps.bitsathy.ac.in/static/media/user.00c2fd4353b2650fbdaa.png"
};

function RecenterMap({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.setView(coords, map.getZoom());
        }
    }, [coords, map]);
    return null;
}

export default function BusTracking() {
    const [bus, setBus] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState(FALLBACK_PROFILE);
    const socketRef = useRef(null);

    const registerNo = (localStorage.getItem("register_no") || "").trim() || "7376231CS323";

    useEffect(() => {
        if (registerNo) {
            fetch(`${API_BASE}/api/dashboard/student?register_no=${encodeURIComponent(registerNo)}`)
                .then((r) => r.ok ? r.json() : null)
                .then((data) => {
                    if (data?.profile) {
                        setProfile({
                            register_no: data.profile.register_no,
                            name: data.profile.name,
                            avatarUrl: data.profile.avatarUrl || FALLBACK_PROFILE.avatarUrl,
                        });
                    }
                })
                .catch(() => { });
        }
    }, [registerNo]);

    useEffect(() => {
        const fetchStudentBus = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/buses/student/${registerNo}`);
                setBus(res.data);
                
                // Fetch last known location
                try {
                    const locRes = await axios.get(`${API_BASE}/api/buses/location/${res.data._id}`);
                    setLocation([locRes.data.latitude, locRes.data.longitude]);
                } catch (e) {
                    console.info("No initial location found.");
                }

                // Setup socket
                socketRef.current = io(API_BASE);
                socketRef.current.emit('join-bus', res.data._id);

                socketRef.current.on('location-updated', (data) => {
                    setLocation([data.latitude, data.longitude]);
                });

            } catch (err) {
                console.error("Error fetching student bus:", err);
                setError("You are not assigned to any bus or your bus details couldn't be loaded.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudentBus();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [registerNo]);

    const displayProfile = registerNo ? { ...FALLBACK_PROFILE, ...profile, register_no: profile.register_no || registerNo } : FALLBACK_PROFILE;

    return (
        <div className="dashboard-layout">
            <header className="top-navbar">
                <div className="top-nav-brand">
                    <img src="https://ps.bitsathy.ac.in/static/media/logo.e99a8edb9e376c3ed2e5.png" alt="PS Portal Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
                    <span>PCDP Portal</span>
                </div>

                <div className="top-nav-profile">
                    <img
                        src={displayProfile.avatarUrl}
                        alt="Profile"
                        className="profile-avatar"
                    />
                    <div className="profile-info">
                        <span className="profile-id">{displayProfile.register_no}</span>
                        <span className="profile-name">{displayProfile.name}</span>
                    </div>
                </div>
            </header>

            <StudentSidebar />

            <main className="dashboard-main-area">
                <div className="p-6 max-w-6xl mx-auto space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                            <p className="text-slate-500 font-medium">Connecting to bus tracking system...</p>
                        </div>
                    ) : error ? (
                        <div className="max-w-md mx-auto mt-12 p-6 bg-red-50 rounded-2xl border border-red-100 flex flex-col items-center text-center gap-4">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                            <h2 className="text-xl font-bold text-red-800">Oops!</h2>
                            <p className="text-red-600">{error}</p>
                        </div>
                    ) : (
                        <>
                            <header className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                                        <Bus size={32} />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Live Bus Tracking</h1>
                                        <p className="text-slate-500 font-medium">Bus No: <span className="text-slate-900">{bus?.busNumber}</span> • Route: <span className="text-slate-900">{bus?.route}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Live Updates</span>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Target Arrival</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <MapPin size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold uppercase transition-all">Current Stop</p>
                                                    <p className="text-sm font-bold text-slate-800">BITS Campus</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl shadow-lg text-white">
                                        <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">Tracking Information</h3>
                                        <p className="text-sm font-medium leading-relaxed">
                                            Stay safe! Keep an eye on the live location. The position updates every few seconds based on the incharge's broadcast.
                                        </p>
                                    </div> */}
                                </div>

                                <div className="lg:col-span-3 h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white relative z-0">
                                    <MapContainer center={location || [11.5033, 77.2444]} zoom={15} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors" />
                                        {location && (
                                            <>
                                                <Marker position={location}>
                                                    <Popup>
                                                        <div className="font-bold text-blue-600">Bus {bus?.busNumber}</div>
                                                        <div className="text-xs text-slate-500">Last updated: Just now</div>
                                                    </Popup>
                                                </Marker>
                                                <RecenterMap coords={location} />
                                            </>
                                        )}
                                    </MapContainer>
                                    {!location && (
                                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[1000]">
                                            <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 max-w-xs text-center border border-slate-100">
                                                <Navigation className="w-8 h-8 text-blue-500 animate-bounce" />
                                                <p className="text-slate-800 font-bold">Waiting for Signal</p>
                                                <p className="text-slate-500 text-sm">The bus incharge hasn't started the broadcast yet.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}