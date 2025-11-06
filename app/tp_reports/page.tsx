import * as React from "react";

// 1. Define the type (no change here)
type TPReportEntry = {
    id: string;
    inspector: string;
    site: string;
    inspectionDate: string;
    status: "Passed" | "Failed" | "Pending";
    summary: string;
};

// 2. Create the hardcoded data (no change here)
const sampleReportData: TPReportEntry[] = [
    {
        id: "TPR-001",
        inspector: "John Doe (TPA)",
        site: "Site A - Pump 1",
        inspectionDate: "2025-10-28",
        status: "Passed",
        summary: "All parameters normal. Approved.",
    },
    {
        id: "TPR-002",
        inspector: "Jane Smith (TPA)",
        site: "Site B - Canal Gate",
        inspectionDate: "2025-10-27",
        status: "Passed",
        summary: "Minor adjustments made to seals.",
    },
    {
        id: "TPR-003",
        inspector: "John Doe (TPA)",
        site: "Site A - Pump 2",
        inspectionDate: "2025-10-26",
        status: "Failed",
        summary: "Motor vibration exceeded 7.5mm/s.",
    },
    {
        id: "TPR-004",
        inspector: "Mike Lee (Internal)",
        site: "Site C - Reservoir",
        inspectionDate: "2025-10-25",
        status: "Pending",
        summary: "Awaiting lab results for water quality.",
    },
    {
        id: "TPR-005",
        inspector: "Jane Smith (TPA)",
        site: "Site B - Pump 3",
        inspectionDate: "2025-10-24",
        status: "Passed",
        summary: "Flow rate and pressure optimal.",
    },
];

// 3. Create the Page Component
export default function TPReportsPage() {
    return (
        <div className="module active">
            {/* === Page Header === */}
            <div className="module-header">
                <div>
                    <h2>TP Reports</h2>
                    <p>View and generate third-party inspection reports.</p>
                </div>
                <button className="btn btn--primary">
                    <i className="fas fa-download"></i> Export as CSV
                </button>
            </div>

            {/* === Main Content Box === */}
            {/* We re-use the .tab-content class from your stock page */}
            {/* This single div will now hold both filters and the table */}
            <div className="tab-content active">
                {/* Row 1: The 4 Filters */}
                <div className="filters-grid">
                    <div className="form-group">
                        <label htmlFor="inspector">Inspector</label>
                        <select id="inspector" className="form-control">
                            <option value="all">All Inspectors</option>
                            <option value="john_doe">John Doe (TPA)</option>
                            <option value="jane_smith">Jane Smith (TPA)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select id="status" className="form-control">
                            <option value="all">All Statuses</option>
                            <option value="passed">Passed</option>
                            <option value="failed">Failed</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="from-date">From Date</label>
                        <input
                            id="from-date"
                            type="date"
                            className="form-control"
                            placeholder="mm/dd/yyyy"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="to-date">To Date</label>
                        <input
                            id="to-date"
                            type="date"
                            className="form-control"
                            placeholder="mm/dd/yyyy"
                        />
                    </div>
                </div>

                {/* Row 2: The Report Table */}
                <div className="stock-table-container">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>Report ID</th>
                                <th>Inspector</th>
                                <th>Site</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th style={{ width: "30%" }}>Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sampleReportData.map((report: TPReportEntry) => (
                                <tr key={report.id}>
                                    <td>{report.id}</td>
                                    <td>{report.inspector}</td>
                                    <td>{report.site}</td>
                                    <td>{report.inspectionDate}</td>
                                    <td>
                                        <span
                                            className={`status ${report.status === "Passed"
                                                ? "status--success"
                                                : report.status === "Failed"
                                                    ? "status--error"
                                                    : "status--info"
                                                }`}
                                        >
                                            {report.status}
                                        </span>
                                    </td>
                                    <td>{report.summary}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}