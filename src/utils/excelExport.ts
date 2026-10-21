import * as XLSX from 'xlsx';
import { PayrollSummaryItem } from '../types';

/**
 * Export payroll summary to Excel (.xlsx) file with contractor grouping & summary
 */
export function exportPayrollToExcel(
  items: PayrollSummaryItem[],
  tenantName = 'Apex Industrial Plant',
  periodLabel = 'Weekly Payroll'
) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // 1. Detailed Master Sheet
  const masterData = items.map((item, index) => ({
    'Sr No': index + 1,
    'Worker ID': item.workerCode,
    'Worker Name': item.workerName,
    'Contractor': item.contractorName,
    'Department': item.department,
    'Shifts Worked': item.shiftsWorked,
    'Regular Hours': item.totalRegularHours,
    'OT Hours': item.totalOtHours,
    'Total Hours': item.totalHours,
    'Hourly Rate (₹)': item.baseHourlyRate,
    'Regular Pay (₹)': item.regularPay,
    'Overtime Pay (₹)': item.otPay,
    'Deductions (₹)': item.deductions,
    'Cash Advance / Hafta (₹)': item.cashAdvance || 0,
    'Net Payable (₹)': item.netPay,
    'Payment Status': item.paymentStatus.toUpperCase(),
    'Paid Date': item.paidAt ? new Date(item.paidAt).toLocaleDateString('en-IN') : 'N/A',
  }));

  const masterWs = XLSX.utils.json_to_sheet(masterData);

  // Auto-fit column widths
  const colWidths = [
    { wch: 6 },  // Sr No
    { wch: 12 }, // Worker ID
    { wch: 22 }, // Worker Name
    { wch: 24 }, // Contractor
    { wch: 18 }, // Department
    { wch: 14 }, // Shifts Worked
    { wch: 14 }, // Regular Hours
    { wch: 12 }, // OT Hours
    { wch: 12 }, // Total Hours
    { wch: 15 }, // Hourly Rate
    { wch: 15 }, // Regular Pay
    { wch: 15 }, // Overtime Pay
    { wch: 14 }, // Deductions
    { wch: 20 }, // Cash Advance / Hafta
    { wch: 16 }, // Net Payable
    { wch: 14 }, // Status
    { wch: 14 }, // Paid Date
  ];
  masterWs['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, masterWs, 'Master Payroll');

  // 2. Contractor Grouped Summary Sheet
  const contractorGroups = items.reduce<Record<string, {
    contractorName: string;
    workersCount: number;
    totalRegularHours: number;
    totalOtHours: number;
    totalRegularPay: number;
    totalOtPay: number;
    totalDeductions: number;
    totalNetPay: number;
    paidCount: number;
    pendingCount: number;
  }>>((acc, item) => {
    if (!acc[item.contractorId]) {
      acc[item.contractorId] = {
        contractorName: item.contractorName,
        workersCount: 0,
        totalRegularHours: 0,
        totalOtHours: 0,
        totalRegularPay: 0,
        totalOtPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
        paidCount: 0,
        pendingCount: 0,
      };
    }
    const group = acc[item.contractorId];
    group.workersCount += 1;
    group.totalRegularHours += item.totalRegularHours;
    group.totalOtHours += item.totalOtHours;
    group.totalRegularPay += item.regularPay;
    group.totalOtPay += item.otPay;
    group.totalDeductions += item.deductions;
    group.totalNetPay += item.netPay;
    if (item.paymentStatus === 'paid') group.paidCount++;
    else group.pendingCount++;

    return acc;
  }, {});

  const summaryData = Object.values(contractorGroups).map((grp) => ({
    'Contractor Agency': grp.contractorName,
    'Deployed Workers': grp.workersCount,
    'Regular Hours': Math.round(grp.totalRegularHours * 100) / 100,
    'OT Hours': Math.round(grp.totalOtHours * 100) / 100,
    'Regular Wages (₹)': Math.round(grp.totalRegularPay),
    'OT Wages (₹)': Math.round(grp.totalOtPay),
    'Deductions (₹)': Math.round(grp.totalDeductions),
    'Net Payable (₹)': Math.round(grp.totalNetPay),
    'Paid Workers': grp.paidCount,
    'Pending Workers': grp.pendingCount,
  }));

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs['!cols'] = [
    { wch: 26 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Contractor Summary');

  // Generate file name with date stamp
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${tenantName.replace(/\s+/g, '_')}_Payroll_${dateStr}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(wb, filename);
}

/**
 * Export payroll summary to plain CSV file
 */
export function exportPayrollToCsv(
  items: PayrollSummaryItem[],
  tenantName = 'Apex Industrial Plant'
) {
  const headers = [
    'Sr No',
    'Worker ID',
    'Worker Name',
    'Contractor',
    'Department',
    'Shifts Worked',
    'Regular Hours',
    'OT Hours',
    'Total Hours',
    'Hourly Rate (INR)',
    'Regular Pay (INR)',
    'OT Pay (INR)',
    'Deductions (INR)',
    'Cash Advance Hafta (INR)',
    'Net Payable (INR)',
    'Status',
    'Paid Date'
  ];

  const rows = items.map((item, index) => [
    index + 1,
    `"${item.workerCode}"`,
    `"${item.workerName}"`,
    `"${item.contractorName}"`,
    `"${item.department}"`,
    item.shiftsWorked,
    item.totalRegularHours,
    item.totalOtHours,
    item.totalHours,
    item.baseHourlyRate,
    item.regularPay,
    item.otPay,
    item.deductions,
    item.cashAdvance || 0,
    item.netPay,
    item.paymentStatus.toUpperCase(),
    item.paidAt ? `"${item.paidAt}"` : '"N/A"'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${tenantName.replace(/\s+/g, '_')}_Payroll_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

