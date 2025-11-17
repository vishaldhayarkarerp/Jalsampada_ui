"use client";

import { useState } from "react";
import { ArrowLeft, Download, QrCode, Clipboard, BarChart3, History, Settings, X } from "lucide-react";
import Link from "next/link";


// Static sample data - replace with your own if needed
const SAMPLE_MACHINE = {
    id: "123",
    machine_name: "CNC Lathe Pro-500",
    machine_id: "MACH-2025-001",
    location: "Shop Floor A - Zone 3",
    health_status: "Healthy",
    machine_type: "CNC Lathe",
    model_number: "PRO-500X",
    manufacturer: "Haas Automation",
    installation_date: "2023-08-15",
    status: "Operational",
    next_maintenance_date: "2025-12-01",
    days_until_maintenance: 14,
    last_maintenance_date: "2025-06-15",
    latest_reading: {
        temperature: 42.5,
        vibration_level: 0.8,
        oil_pressure: 58,
    },
};

const SAMPLE_READINGS = [
    { id: 1, timestamp: "2025-11-17T10:30:00Z", temperature: 42.5, vibration_level: 0.8, oil_pressure: 58, is_anomaly: false },
    { id: 2, timestamp: "2025-11-17T09:15:00Z", temperature: 43.1, vibration_level: 1.2, oil_pressure: 57, is_anomaly: true },
    { id: 3, timestamp: "2025-11-17T08:00:00Z", temperature: 41.9, vibration_level: 0.7, oil_pressure: 59, is_anomaly: false },
    { id: 4, timestamp: "2025-11-16T22:30:00Z", temperature: 40.8, vibration_level: 0.6, oil_pressure: 60, is_anomaly: false },
    { id: 5, timestamp: "2025-11-16T18:00:00Z", temperature: 44.2, vibration_level: 1.5, oil_pressure: 55, is_anomaly: true },
    { id: 6, timestamp: "2025-11-16T14:20:00Z", temperature: 42.0, vibration_level: 0.9, oil_pressure: 58, is_anomaly: false },
    { id: 7, timestamp: "2025-11-16T10:00:00Z", temperature: 41.5, vibration_level: 0.8, oil_pressure: 59, is_anomaly: false },
    { id: 8, timestamp: "2025-11-15T23:45:00Z", temperature: 43.8, vibration_level: 1.1, oil_pressure: 56, is_anomaly: false },
    { id: 9, timestamp: "2025-11-15T19:30:00Z", temperature: 42.7, vibration_level: 0.9, oil_pressure: 57, is_anomaly: false },
    { id: 10, timestamp: "2025-11-15T15:00:00Z", temperature: 41.2, vibration_level: 0.7, oil_pressure: 60, is_anomaly: false },
];

const MAINTENANCE_HISTORY = [
    { date: "2025-06-15", type: "Preventive", status: "Completed", cost: "₹8,500" },
    { date: "2025-03-20", type: "Emergency (Bearing Replacement)", status: "Completed", cost: "₹32,000" },
    { date: "2024-12-10", type: "Preventive", status: "Completed", cost: "₹8,500" },
    { date: "2024-09-05", type: "Calibration", status: "Completed", cost: "₹5,200" },
];

export default function MachineDetailPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [showQR, setShowQR] = useState(false);
    const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);

    // Static handlers (no real API calls)
    const handleDownloadReport = () => {
        alert("Report downloaded: CNC_Lathe_Pro500_Report_Nov2025.pdf");
    };

    const handleShowQR = () => {
        setShowQR(true);
    };

    const handleCreateWorkOrder = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        alert("Work Order Created Successfully! 🎉");
        setShowWorkOrderModal(false);
    };

    const tabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "readings", label: `Readings (${SAMPLE_READINGS.length})`, icon: BarChart3 },
        { id: "maintenance", label: "Maintenance History", icon: History },
        { id: "specs", label: "Specifications", icon: Settings },
    ];

    const latestReading = SAMPLE_MACHINE.latest_reading;

    return (
        <div className="p-4 md:p-6">
            <Link href="/machines" className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mb-6">
                <ArrowLeft size={20} /> Back to Machines
            </Link>

            <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">{SAMPLE_MACHINE.machine_name}</h1>
                        <p className="text-blue-100 text-lg mt-1">{SAMPLE_MACHINE.machine_id}</p>
                        <p className="text-blue-100 text-sm mt-1">{SAMPLE_MACHINE.location}</p>
                    </div>
                    <div className="px-6 py-3 bg-white text-primary rounded-lg font-bold text-lg">
                        {SAMPLE_MACHINE.health_status}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button onClick={() => setShowWorkOrderModal(true)} className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2">
                        <Clipboard size={18} /> Create Work Order
                    </button>
                    <button onClick={handleDownloadReport} className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition flex items-center gap-2">
                        <Download size={18} /> Download Report
                    </button>
                    <button onClick={handleShowQR} className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition flex items-center gap-2">
                        <QrCode size={18} /> Show QR Code
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border mb-6 overflow-x-auto">
                <div className="flex gap-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`pb-4 px-2 font-medium transition border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <>
                            <div className="card p-6">
                                <h2 className="text-xl font-semibold mb-4">Current Status</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center p-6 bg-background rounded-lg border">
                                        <p className="text-sm text-gray-500 mb-2">Temperature</p>
                                        <p className="text-4xl font-bold text-orange-600">{latestReading.temperature}°C</p>
                                    </div>
                                    <div className="text-center p-6 bg-background rounded-lg border">
                                        <p className="text-sm text-gray-500 mb-2">Vibration Level</p>
                                        <p className="text-4xl font-bold text-blue-600">{latestReading.vibration_level}</p>
                                        <p className="text-xs text-success mt-1">mm/s (Normal)</p>
                                    </div>
                                    <div className="text-center p-6 bg-background rounded-lg border">
                                        <p className="text-sm text-gray-500 mb-2">Oil Pressure</p>
                                        <p className="text-4xl font-bold text-green-600">{latestReading.oil_pressure} PSI</p>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-6">
                                <h2 className="text-xl font-semibold mb-4">Recent Readings</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium">Date & Time</th>
                                                <th className="px-4 py-3 text-left font-medium">Temp (°C)</th>
                                                <th className="px-4 py-3 text-left font-medium">Vibration</th>
                                                <th className="px-4 py-3 text-left font-medium">Pressure</th>
                                                <th className="px-4 py-3 text-left font-medium">Anomaly</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {SAMPLE_READINGS.slice(0, 6).map((reading) => (
                                                <tr key={reading.id} className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-xs">{new Date(reading.timestamp).toLocaleString()}</td>
                                                    <td className="px-4 py-3">{reading.temperature}</td>
                                                    <td className="px-4 py-3">{reading.vibration_level}</td>
                                                    <td className="px-4 py-3">{reading.oil_pressure}</td>
                                                    <td className="px-4 py-3">
                                                        {reading.is_anomaly ? (
                                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Yes</span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">No</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* All Readings Tab */}
                    {activeTab === "readings" && (
                        <div className="card p-6">
                            <h2 className="text-xl font-semibold mb-4">All Sensor Readings</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Timestamp</th>
                                            <th className="px-4 py-3 text-left">Temp (°C)</th>
                                            <th className="px-4 py-3 text-left">Vibration</th>
                                            <th className="px-4 py-3 text-left">Pressure (PSI)</th>
                                            <th className="px-4 py-3 text-left">Anomaly</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SAMPLE_READINGS.map((reading) => (
                                            <tr key={reading.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 text-xs">{new Date(reading.timestamp).toLocaleString()}</td>
                                                <td className="px-4 py-3">{reading.temperature}</td>
                                                <td className="px-4 py-3">{reading.vibration_level}</td>
                                                <td className="px-4 py-3">{reading.oil_pressure}</td>
                                                <td className="px-4 py-3">
                                                    {reading.is_anomaly ? (
                                                        <span className="text-red-600 font-semibold">⚠ Yes</span>
                                                    ) : (
                                                        <span className="text-green-600">✓ No</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Maintenance History - Fixed & Improved */}
                    {activeTab === "maintenance" && (
                        <div className="card p-6">
                            <h2 className="text-xl font-semibold mb-5">Maintenance History</h2>
                            <div className="space-y-3"> {/* Reduced from space-y-4 to space-y-3 */}
                                {[
                                    { date: "2025-06-15", type: "Preventive", cost: "₹8,500" },
                                    { date: "2025-03-20", type: "Emergency (Bearing Replacement)", cost: "₹32,000" },
                                    { date: "2024-12-10", type: "Preventive", cost: "₹8,500" },
                                    { date: "2024-09-05", type: "Calibration", cost: "₹5,200" },
                                ].map((record, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-background rounded-xl border hover:border-primary/30 transition-all"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                                <div>
                                                    <p className="font-semibold text-lg text-gray-900">
                                                        {record.type} Maintenance
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        {new Date(record.date).toLocaleDateString("en-IN")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6 mt-4 sm:mt-0">
                                            <span className="text-green-600 font-bold text-sm px-3 py-1 bg-green-50 rounded-full">
                                                Completed
                                            </span>
                                            <span className="text-lg font-bold text-gray-800">
                                                {record.cost}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Specifications */}
                    {activeTab === "specs" && (
                        <div className="card p-6">
                            <h2 className="text-xl font-semibold mb-4">Machine Specifications</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { label: "Machine Type", value: SAMPLE_MACHINE.machine_type },
                                    { label: "Model", value: SAMPLE_MACHINE.model_number },
                                    { label: "Manufacturer", value: SAMPLE_MACHINE.manufacturer },
                                    { label: "Installation Date", value: new Date(SAMPLE_MACHINE.installation_date).toLocaleDateString("en-IN") },
                                    { label: "Location", value: SAMPLE_MACHINE.location },
                                    { label: "Current Status", value: SAMPLE_MACHINE.status },
                                    { label: "Health Status", value: SAMPLE_MACHINE.health_status },
                                    { label: "Next Maintenance", value: SAMPLE_MACHINE.next_maintenance_date ? new Date(SAMPLE_MACHINE.next_maintenance_date).toLocaleDateString("en-IN") : "Not scheduled" },
                                ].map((spec, idx) => (
                                    <div key={idx} className="p-5 bg-background rounded-lg border">
                                        <p className="text-sm text-gray-500 mb-1">{spec.label}</p>
                                        <p className="font-bold text-lg">{spec.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - Quick Info */}
                <div className="lg:col-span-1">
                    <div className="card p-6 sticky top-20">
                        <h3 className="font-bold text-xl mb-5">Quick Info</h3>
                        <div className="space-y-5">
                            <div className="p-5 bg-background rounded-lg border">
                                <p className="text-xs text-gray-500 mb-1">Machine Type</p>
                                <p className="font-bold text-lg">{SAMPLE_MACHINE.machine_type}</p>
                            </div>
                            <div className="p-5 bg-background rounded-lg border">
                                <p className="text-xs text-gray-500 mb-1">Operational Status</p>
                                <p className="font-bold text-lg text-green-600">{SAMPLE_MACHINE.status}</p>
                            </div>
                            <div className="p-5 bg-background rounded-lg border">
                                <p className="text-xs text-gray-500 mb-1">Next Maintenance</p>
                                <p className="font-bold text-lg">{SAMPLE_MACHINE.next_maintenance_date ? new Date(SAMPLE_MACHINE.next_maintenance_date).toLocaleDateString("en-IN") : "N/A"}</p>
                                {SAMPLE_MACHINE.days_until_maintenance !== null && (
                                    <p className="text-sm text-orange-600 font-medium mt-1">in {SAMPLE_MACHINE.days_until_maintenance} days</p>
                                )}
                            </div>
                            <div className="p-5 bg-background rounded-lg border">
                                <p className="text-xs text-gray-500 mb-1">Last Maintenance</p>
                                <p className="font-bold">{SAMPLE_MACHINE.last_maintenance_date ? new Date(SAMPLE_MACHINE.last_maintenance_date).toLocaleDateString("en-IN") : "Never"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Code Modal */}
            {showQR && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Machine QR Code</h3>
                            <button onClick={() => setShowQR(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex justify-center mb-6 bg-gray-50 p-8 rounded-xl">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-64 h-64 flex items-center justify-center text-gray-500">
                                QR Code Placeholder
                            </div>
                        </div>
                        <p className="text-center text-gray-600">Scan to view machine details instantly</p>
                    </div>
                </div>
            )}

            {/* Work Order Modal */}
            {showWorkOrderModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold">Create New Work Order</h3>
                            <button onClick={() => setShowWorkOrderModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateWorkOrder} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2">Title</label>
                                <input name="title" required placeholder="e.g., Replace spindle bearing" className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Description</label>
                                <textarea name="description" required rows={4} placeholder="Describe the issue or task..." className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Priority</label>
                                    <select name="priority" required className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Scheduled Date</label>
                                    <input name="scheduled_date" type="date" required className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-primary-dark transition">
                                Create Work Order
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}