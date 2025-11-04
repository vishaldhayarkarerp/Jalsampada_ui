// Application Data
const appData = {
    "technical_data": [
        { "pump_id": "P-001", "pump_type": "Centrifugal", "capacity_lps": 50, "head_m": 45, "power_kw": 22, "voltage_v": 415, "current_a": 45, "commissioning_year": 2018, "manufacturer": "KSB", "model": "Etanorm 050-032", "location": "Pump House 1" },
        { "pump_id": "P-002", "pump_type": "Centrifugal", "capacity_lps": 75, "head_m": 60, "power_kw": 37, "voltage_v": 415, "current_a": 75, "commissioning_year": 2020, "manufacturer": "Grundfos", "model": "CR 64-2", "location": "Pump House 1" },
        { "pump_id": "P-003", "pump_type": "Submersible", "capacity_lps": 30, "head_m": 25, "power_kw": 15, "voltage_v": 415, "current_a": 35, "commissioning_year": 2019, "manufacturer": "Crompton", "model": "SUP 150", "location": "Borewell 1" },
        { "pump_id": "M-001", "pump_type": "Motor", "capacity_lps": 0, "head_m": 0, "power_kw": 22, "voltage_v": 415, "current_a": 45, "commissioning_year": 2018, "manufacturer": "Siemens", "model": "1LE1001", "location": "Pump House 1" },
        { "pump_id": "M-002", "pump_type": "Motor", "capacity_lps": 0, "head_m": 0, "power_kw": 37, "voltage_v": 415, "current_a": 75, "commissioning_year": 2020, "manufacturer": "ABB", "model": "M3BP", "location": "Pump House 1" }
    ],
    "operation_data": [
        { "timestamp": "2025-09-15 08:00:00", "pump_id": "P-001", "status": "Running", "flow_rate_lps": 48.5, "head_m": 44.2, "current_a": 42.3, "voltage_v": 415.2, "power_kw": 21.8, "temperature_c": 52.1, "vibration_mm_s": 3.2, "bearing_temp_c": 48.5 },
        { "timestamp": "2025-09-15 08:00:00", "pump_id": "P-002", "status": "Stopped", "flow_rate_lps": 0, "head_m": 0, "current_a": 0, "voltage_v": 415.2, "power_kw": 0, "temperature_c": 35.2, "vibration_mm_s": 0, "bearing_temp_c": 38.1 },
        { "timestamp": "2025-09-15 08:00:00", "pump_id": "P-003", "status": "Running", "flow_rate_lps": 28.7, "head_m": 23.8, "current_a": 32.1, "voltage_v": 414.8, "power_kw": 14.2, "temperature_c": 49.3, "vibration_mm_s": 2.8, "bearing_temp_c": 45.2 }
    ],
    "spare_parts": [
        { "part_id": "SP-001", "description": "Impeller - Cast Iron", "pump_model": "Etanorm 050-032", "quantity": 2, "min_stock": 1, "unit_cost": 15000, "supplier": "KSB India", "status": "OK" },
        { "part_id": "SP-002", "description": "Mechanical Seal", "pump_model": "Etanorm 050-032", "quantity": 5, "min_stock": 2, "unit_cost": 8000, "supplier": "John Crane", "status": "OK" },
        { "part_id": "SP-003", "description": "Bearing - 6308", "pump_model": "All", "quantity": 8, "min_stock": 3, "unit_cost": 3500, "supplier": "SKF", "status": "OK" },
        { "part_id": "SP-004", "description": "O-Ring Set", "pump_model": "All", "quantity": 15, "min_stock": 5, "unit_cost": 1200, "supplier": "Parker", "status": "OK" },
        { "part_id": "SP-005", "description": "Coupling", "pump_model": "CR 64-2", "quantity": 1, "min_stock": 1, "unit_cost": 12000, "supplier": "Grundfos", "status": "OK" },
        { "part_id": "SP-006", "description": "Motor Winding", "pump_model": "1LE1001", "quantity": 0, "min_stock": 1, "unit_cost": 25000, "supplier": "Siemens", "status": "LOW_STOCK" }
    ],
    "maintenance_records": [
        { "record_id": "MR-001", "pump_id": "P-001", "date": "2024-08-15", "type": "Preventive", "description": "Bearing lubrication and vibration check", "parts_used": "SP-004", "cost": 2500, "technician": "Ramesh Kumar", "status": "Completed" },
        { "record_id": "MR-002", "pump_id": "P-002", "date": "2024-08-10", "type": "Corrective", "description": "Mechanical seal replacement", "parts_used": "SP-002", "cost": 12000, "technician": "Suresh Patil", "status": "Completed" },
        { "record_id": "MR-003", "pump_id": "P-003", "date": "2024-07-28", "type": "Preventive", "description": "Monthly inspection and cleaning", "parts_used": "None", "cost": 1500, "technician": "Rajesh Yadav", "status": "Completed" },
        { "record_id": "MR-004", "pump_id": "P-001", "date": "2024-07-20", "type": "Corrective", "description": "Impeller replacement due to cavitation damage", "parts_used": "SP-001", "cost": 18000, "technician": "Ramesh Kumar", "status": "Completed" }
    ]
};

// Global Variables
let currentModule = 'dashboard';
let charts = {};

// Initialize Application
document.addEventListener('DOMContentLoaded', function () {
    console.log('Application initializing...');

    // Initialize all components
    initializeNavigation();
    loadDashboard();
    loadTechnicalData();
    loadOperationsData();
    loadStockData();
    loadReportsData();

    // Initialize charts with a small delay to ensure DOM is ready
    setTimeout(() => {
        initializeCharts();
    }, 100);

    console.log('Application initialized');
});

// Navigation Functions
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        // Remove any existing event listeners
        item.removeEventListener('click', handleNavClick);
        // Add new event listener
        item.addEventListener('click', handleNavClick);
    });
}

function handleNavClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const module = this.getAttribute('data-module');
    console.log('Navigation clicked:', module);

    if (module) {
        switchModule(module);
    }
}

function switchModule(module) {
    console.log('Switching to module:', module);

    // Update active navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeNavItem = document.querySelector(`[data-module="${module}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    // Hide all modules
    document.querySelectorAll('.module').forEach(mod => {
        mod.classList.remove('active');
    });

    // Show selected module
    const targetModule = document.getElementById(`${module}-module`);
    if (targetModule) {
        targetModule.classList.add('active');
        currentModule = module;

        // Load module-specific data
        switch (module) {
            case 'operations':
                updateOperationsCharts();
                break;
            case 'reports':
                updateReportsCharts();
                break;
            case 'stock':
                loadStockData();
                break;
        }
    } else {
        console.error('Module not found:', module);
    }
}

// Dashboard Functions
function loadDashboard() {
    console.log('Loading dashboard...');
    // Dashboard metrics are already populated in HTML
    // Any dynamic dashboard loading can be added here
}

// Assets Functions
function loadTechnicalData() {
    console.log('Loading Assets...');
    const equipmentGrid = document.getElementById('equipment-grid');
    if (!equipmentGrid) {
        console.error('Equipment grid not found');
        return;
    }

    function renderEquipment(data = appData.technical_data) {
        equipmentGrid.innerHTML = '';

        data.forEach(equipment => {
            const card = createEquipmentCard(equipment);
            equipmentGrid.appendChild(card);
        });
    }

    // Initial render
    renderEquipment();

    // Search functionality with proper event handling
    const searchInput = document.getElementById('tech-search');
    const filterSelect = document.getElementById('tech-filter');

    if (searchInput) {
        searchInput.removeEventListener('input', filterEquipment);
        searchInput.addEventListener('input', filterEquipment);

        // Prevent navigation issues when clicking search input
        searchInput.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

    if (filterSelect) {
        filterSelect.removeEventListener('change', filterEquipment);
        filterSelect.addEventListener('change', filterEquipment);
    }

    function filterEquipment() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const filterType = filterSelect ? filterSelect.value : '';

        const filtered = appData.technical_data.filter(equipment => {
            const matchesSearch = equipment.pump_id.toLowerCase().includes(searchTerm) ||
                equipment.manufacturer.toLowerCase().includes(searchTerm) ||
                equipment.model.toLowerCase().includes(searchTerm);
            const matchesType = !filterType || equipment.pump_type === filterType;

            return matchesSearch && matchesType;
        });

        renderEquipment(filtered);
    }
}

function createEquipmentCard(equipment) {
    const card = document.createElement('div');
    card.className = 'equipment-card';

    card.innerHTML = `
        <div class="equipment-card-header">
            <h4>${equipment.pump_id}</h4>
            <div class="equipment-type">${equipment.pump_type}</div>
        </div>
        <div class="equipment-card-body">
            <div class="equipment-specs">
                <div class="spec-item">
                    <span class="spec-label">Manufacturer</span>
                    <span class="spec-value">${equipment.manufacturer}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Model</span>
                    <span class="spec-value">${equipment.model}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Capacity</span>
                    <span class="spec-value">${equipment.capacity_lps} LPS</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Head</span>
                    <span class="spec-value">${equipment.head_m} m</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Power</span>
                    <span class="spec-value">${equipment.power_kw} kW</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Voltage</span>
                    <span class="spec-value">${equipment.voltage_v} V</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Year</span>
                    <span class="spec-value">${equipment.commissioning_year}</span>
                </div>
                <div class="spec-item">
                    <span class="spec-label">Location</span>
                    <span class="spec-value">${equipment.location}</span>
                </div>
            </div>
        </div>
    `;

    return card;
}

// Operations Functions
function loadOperationsData() {
    console.log('Loading operations data...');
    loadPumpStatus();
    populateReadingsPumpSelect();
}

function loadPumpStatus() {
    const statusList = document.getElementById('pump-status-list');
    if (!statusList) {
        console.error('Pump status list not found');
        return;
    }

    statusList.innerHTML = '';

    appData.operation_data.forEach(pump => {
        const statusItem = document.createElement('div');
        statusItem.className = `pump-status-item ${pump.status.toLowerCase()}`;

        statusItem.innerHTML = `
            <div class="pump-id">${pump.pump_id}</div>
            <div class="status ${pump.status.toLowerCase()}">${pump.status}</div>
        `;

        statusList.appendChild(statusItem);
    });
}

function populateReadingsPumpSelect() {
    const select = document.getElementById('reading-pump-id');
    if (!select) return;

    select.innerHTML = '<option value="">Select Pump</option>';

    appData.operation_data.forEach(pump => {
        const option = document.createElement('option');
        option.value = pump.pump_id;
        option.textContent = pump.pump_id;
        select.appendChild(option);
    });
}

// Stock Functions
function loadStockData() {
    console.log('Loading stock data...');
    loadInventoryTable();
    loadMaintenanceRecords();
    loadStockAlerts();
}

function loadInventoryTable() {
    const tableBody = document.getElementById('stock-table-body');
    if (!tableBody) {
        console.error('Stock table body not found');
        return;
    }

    function renderStock(data = appData.spare_parts) {
        tableBody.innerHTML = '';

        data.forEach(part => {
            const row = document.createElement('tr');
            const stockClass = part.quantity <= part.min_stock ? 'low-stock' : '';

            row.innerHTML = `
                <td>${part.part_id}</td>
                <td>${part.description}</td>
                <td>${part.pump_model}</td>
                <td class="${stockClass}">${part.quantity}</td>
                <td>${part.min_stock}</td>
                <td>â‚¹${part.unit_cost.toLocaleString()}</td>
                <td>
                    <span class="status-indicator ${part.status === 'LOW_STOCK' ? 'stopped' : 'running'}">
                        ${part.status === 'LOW_STOCK' ? 'Low Stock' : 'OK'}
                    </span>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    renderStock();

    // Search functionality
    const searchInput = document.getElementById('stock-search');
    if (searchInput) {
        searchInput.removeEventListener('input', handleStockSearch);
        searchInput.addEventListener('input', handleStockSearch);

        searchInput.addEventListener('click', function (e) {
            e.stopPropagation();
        });
    }

    function handleStockSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = appData.spare_parts.filter(part =>
            part.part_id.toLowerCase().includes(searchTerm) ||
            part.description.toLowerCase().includes(searchTerm) ||
            part.pump_model.toLowerCase().includes(searchTerm)
        );
        renderStock(filtered);
    }
}

function loadMaintenanceRecords() {
    const recordsContainer = document.getElementById('maintenance-records');
    if (!recordsContainer) {
        console.error('Maintenance records container not found');
        return;
    }

    recordsContainer.innerHTML = '';

    appData.maintenance_records.forEach(record => {
        const recordDiv = document.createElement('div');
        recordDiv.className = 'maintenance-record';

        recordDiv.innerHTML = `
            <div class="record-header">
                <div class="record-id">${record.record_id}</div>
                <div class="record-date">${new Date(record.date).toLocaleDateString()}</div>
            </div>
            <div class="record-details">
                <div class="record-detail-item">
                    <div class="record-detail-label">Pump ID</div>
                    <div class="record-detail-value">${record.pump_id}</div>
                </div>
                <div class="record-detail-item">
                    <div class="record-detail-label">Type</div>
                    <div class="record-detail-value">${record.type}</div>
                </div>
                <div class="record-detail-item">
                    <div class="record-detail-label">Cost</div>
                    <div class="record-detail-value">â‚¹${record.cost.toLocaleString()}</div>
                </div>
                <div class="record-detail-item">
                    <div class="record-detail-label">Technician</div>
                    <div class="record-detail-value">${record.technician}</div>
                </div>
            </div>
            <div class="record-description">${record.description}</div>
        `;

        recordsContainer.appendChild(recordDiv);
    });
}

function loadStockAlerts() {
    const alertsContainer = document.getElementById('stock-alerts');
    if (!alertsContainer) {
        console.error('Stock alerts container not found');
        return;
    }

    const lowStockItems = appData.spare_parts.filter(part => part.quantity <= part.min_stock);

    alertsContainer.innerHTML = '';

    if (lowStockItems.length === 0) {
        alertsContainer.innerHTML = '<p>No stock alerts at this time.</p>';
        return;
    }

    lowStockItems.forEach(part => {
        const alert = document.createElement('div');
        alert.className = 'stock-alert';

        alert.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>${part.part_id}</strong> - ${part.description}<br>
                <small>Current stock: ${part.quantity}, Minimum required: ${part.min_stock}</small>
            </div>
        `;

        alertsContainer.appendChild(alert);
    });
}

function switchStockTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Reports Functions
function loadReportsData() {
    console.log('Loading reports data...');
    populateEquipmentFilter();
    setDefaultDateRange();
}

function populateEquipmentFilter() {
    const select = document.getElementById('equipment-filter');
    if (!select) return;

    select.innerHTML = '<option value="">All Equipment</option>';

    appData.technical_data.forEach(equipment => {
        const option = document.createElement('option');
        option.value = equipment.pump_id;
        option.textContent = `${equipment.pump_id} - ${equipment.pump_type}`;
        select.appendChild(option);
    });
}

function setDefaultDateRange() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');

    if (startInput) startInput.value = startDate.toISOString().split('T')[0];
    if (endInput) endInput.value = endDate.toISOString().split('T')[0];
}

function generateReports() {
    console.log('Generating reports...');
    updateReportsCharts();
    alert('Report generated successfully!');
}

// Chart Functions
function initializeCharts() {
    console.log('Initializing charts...');
    const chartColors = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];

    // Operational Chart
    const operationalCtx = document.getElementById('operationalChart');
    if (operationalCtx) {
        try {
            charts.operational = new Chart(operationalCtx, {
                type: 'bar',
                data: {
                    labels: appData.operation_data.map(p => p.pump_id),
                    datasets: [{
                        label: 'Current (A)',
                        data: appData.operation_data.map(p => p.current_a),
                        backgroundColor: chartColors[0],
                        borderColor: chartColors[0],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating operational chart:', error);
        }
    }

    // Flow Chart
    const flowCtx = document.getElementById('flowChart');
    if (flowCtx) {
        try {
            charts.flow = new Chart(flowCtx, {
                type: 'line',
                data: {
                    labels: ['8:00', '9:00', '10:00', '11:00', '12:00'],
                    datasets: [{
                        label: 'Flow Rate (LPS)',
                        data: [48.5, 47.2, 49.1, 48.8, 47.9],
                        borderColor: chartColors[1],
                        backgroundColor: chartColors[1] + '20',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating flow chart:', error);
        }
    }

    // Power Chart
    const powerCtx = document.getElementById('powerChart');
    if (powerCtx) {
        try {
            charts.power = new Chart(powerCtx, {
                type: 'doughnut',
                data: {
                    labels: appData.operation_data.map(p => p.pump_id),
                    datasets: [{
                        data: appData.operation_data.map(p => p.power_kw),
                        backgroundColor: chartColors.slice(0, appData.operation_data.length)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating power chart:', error);
        }
    }

    // Pumping Hours Chart
    const pumpingHoursCtx = document.getElementById('pumpingHoursChart');
    if (pumpingHoursCtx) {
        try {
            charts.pumpingHours = new Chart(pumpingHoursCtx, {
                type: 'bar',
                data: {
                    labels: ['P-001', 'P-002', 'P-003'],
                    datasets: [{
                        label: 'Operating Hours',
                        data: [720, 480, 650],
                        backgroundColor: chartColors[2]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating pumping hours chart:', error);
        }
    }

    // Cost Chart
    const costCtx = document.getElementById('costChart');
    if (costCtx) {
        try {
            charts.cost = new Chart(costCtx, {
                type: 'pie',
                data: {
                    labels: ['Preventive', 'Corrective', 'Parts', 'Labor'],
                    datasets: [{
                        data: [15000, 30000, 45000, 10000],
                        backgroundColor: [chartColors[3], chartColors[4], chartColors[5], chartColors[6]]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating cost chart:', error);
        }
    }

    console.log('Charts initialized');
}

function updateOperationsCharts() {
    if (charts.operational) {
        charts.operational.data.datasets[0].data = appData.operation_data.map(p => p.current_a);
        charts.operational.update();
    }
}

function updateReportsCharts() {
    if (charts.pumpingHours) {
        charts.pumpingHours.update();
    }
    if (charts.cost) {
        charts.cost.update();
    }
}

// Modal Functions
function showAddEquipmentModal() {
    const modal = document.getElementById('add-equipment-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function showReadingsModal() {
    const modal = document.getElementById('readings-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function showMaintenanceModal() {
    const modal = document.getElementById('maintenance-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
    }
}

function addEquipment() {
    alert('Equipment added successfully!');
    closeModal('add-equipment-modal');
}

function addReading() {
    alert('Reading added successfully!');
    closeModal('readings-modal');
}

function createWorkOrder() {
    alert('Work order created successfully!');
    closeModal('maintenance-modal');
}

// Export Functions
function exportData(format) {
    switch (format) {
        case 'pdf':
            alert('Exporting to PDF...');
            break;
        case 'excel':
            alert('Exporting to Excel...');
            break;
        case 'csv':
            exportToCSV();
            break;
        default:
            alert('Export format not supported');
    }
}

function exportToCSV() {
    const data = [
        ['Equipment ID', 'Type', 'Status', 'Flow Rate', 'Power'],
        ...appData.operation_data.map(pump => [
            pump.pump_id,
            appData.technical_data.find(t => t.pump_id === pump.pump_id)?.pump_type || 'N/A',
            pump.status,
            pump.flow_rate_lps,
            pump.power_kw
        ])
    ];

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pump_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Event Listeners
document.addEventListener('click', function (e) {
    // Close modals when clicking outside
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

document.addEventListener('keydown', function (e) {
    // Close modals on Escape key
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
});

// Global functions for HTML onclick handlers
window.switchStockTab = switchStockTab;
window.showAddEquipmentModal = showAddEquipmentModal;
window.showReadingsModal = showReadingsModal;
window.showMaintenanceModal = showMaintenanceModal;
window.closeModal = closeModal;
window.addEquipment = addEquipment;
window.addReading = addReading;
window.createWorkOrder = createWorkOrder;
window.generateReports = generateReports;
window.exportData = exportData;