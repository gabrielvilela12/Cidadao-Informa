import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], filename: string) {
    if (!data || !data.length) {
        return;
    }

    // Convert dates and format objects
    const formattedData = data.map(row => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
            const val = row[key];
            if (val instanceof Date) {
                newRow[key] = val.toLocaleString();
            } else if (val !== null && val !== undefined) {
                newRow[key] = val;
            } else {
                newRow[key] = '';
            }
        });
        return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");

    // Auto-fit columns
    const keys = Object.keys(formattedData[0]);
    const colWidths = keys.map(key => {
        let maxLength = key.length;
        formattedData.forEach(row => {
            const valStr = row[key] ? row[key].toString() : '';
            if (valStr.length > maxLength) {
                maxLength = valStr.length;
            }
        });
        return { wch: Math.min(maxLength + 2, 60) }; // cap width at 60 characters
    });
    worksheet['!cols'] = colWidths;

    // Fix extension
    const finalFilename = filename.replace(/\.csv$/, '.xlsx');
    if (!finalFilename.endsWith('.xlsx')) {
        finalFilename += '.xlsx';
    }

    XLSX.writeFile(workbook, finalFilename);
}
