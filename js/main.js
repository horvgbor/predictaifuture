document.addEventListener('DOMContentLoaded', () => {
    const tableContainer = document.getElementById('aiPredictionsTableContainer');
    const csvFilePath = 'data/data.csv'; // Relative path to your CSV file

    async function fetchAndDisplayData() {
        try {
            const response = await fetch(csvFilePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} while fetching ${csvFilePath}`);
            }
            const csvData = await response.text();
            const parsedData = parseCSV(csvData);

            // Default sort by "when" column if present
            const whenHeader = parsedData.headers.find(h => h.toLowerCase() === 'when');
            if (whenHeader) {
                parsedData.rows.sort((a, b) => {
                    const aValue = a[whenHeader] instanceof Date ? a[whenHeader].getTime() : 0;
                    const bValue = b[whenHeader] instanceof Date ? b[whenHeader].getTime() : 0;
                    return aValue - bValue;
                });
            }

            if (parsedData.headers.length > 0 && parsedData.rows.length > 0) {
                renderTable(parsedData.headers, parsedData.rows);
            } else {
                tableContainer.innerHTML = '<p>No data found or CSV is empty.</p>';
            }

        } catch (error) {
            console.error('Error fetching or parsing CSV data:', error);
            tableContainer.innerHTML = `<p>Error loading data: ${error.message}. Please check the console for more details.</p>`;
        }
    }

    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) {
            return { headers: [], rows: [] };
        }

        const headers = lines[0].split(';').map(header => header.trim());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';');
            // Basic check to ensure row isn't just empty or malformed
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    let value = values[index] ? values[index].trim() : '';
                    if (header.toLowerCase() === 'date' || header.toLowerCase() === 'when') {
                        value = new Date(value); // Parse date and when columns to Date object
                    }
                    row[header] = value;
                });
                rows.push(row);
            } else {
                console.warn(`Skipping malformed CSV line ${i + 1}: ${lines[i]}`);
            }
        }
        return { headers, rows };
    }

    function renderTable(headers, rows) {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Function to sort table
        function sortTable(header) {
            const isDate = header.toLowerCase() === 'date' || header.toLowerCase() === 'when';
            const sortDirection = table.getAttribute('data-sort-direction') === 'asc' ? 'desc' : 'asc';

            rows.sort((a, b) => {
                let aValue = a[header];
                let bValue = b[header];

                if (isDate) {
                    aValue = aValue instanceof Date && !isNaN(aValue) ? aValue.getTime() : -Infinity;
                    bValue = bValue instanceof Date && !isNaN(bValue) ? bValue.getTime() : -Infinity;
                } else {
                    aValue = String(aValue).toUpperCase();
                    bValue = String(bValue).toUpperCase();
                }

                if (aValue < bValue) {
                    return sortDirection === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            });

            // Clear existing table body
            tbody.innerHTML = '';

            // Re-render table body with sorted rows
            rows.forEach(rowData => {
                const tr = document.createElement('tr');
                headers.forEach(header => {
                    if (header.toLowerCase() !== 'link') {
                        const td = document.createElement('td');
                        let cellData = rowData[header] || '';

                        if (header.toLowerCase() === 'source') {
                            const linkData = rowData['link'] || '';
                            if (linkData && linkData.toLowerCase() !== 'n/a' && (linkData.startsWith('http://') || linkData.startsWith('https://'))) {
                                const a = document.createElement('a');
                                a.href = linkData;
                                a.textContent = cellData;
                                a.target = '_blank';
                                a.rel = 'noopener noreferrer';
                                td.appendChild(a);
                            } else {
                                td.textContent = '';
                            }
                        } else if (header.toLowerCase() === 'date') {
                            cellData = rowData[header] ? rowData[header].toLocaleDateString() : '';
                            td.textContent = cellData;
                        } else if (header.toLowerCase() === 'when') {
                            cellData = rowData[header] instanceof Date && !isNaN(rowData[header]) ? rowData[header].toISOString().slice(0, 10) : '';
                            td.textContent = cellData;
                        } else {
                            td.textContent = cellData;
                        }
                        tr.appendChild(td);
                    }
                });
                tbody.appendChild(tr);
            });

            table.setAttribute('data-sort-direction', sortDirection);
        }

        // Create table header row
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            if (headerText.toLowerCase() !== 'link') {
                const th = document.createElement('th');
                th.textContent = headerText.replace(/_/g, ' ');
                th.style.cursor = 'pointer'; // Indicate it's clickable
                th.addEventListener('click', () => sortTable(headerText)); // Add click event to sort
                headerRow.appendChild(th);
            }
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        table.setAttribute('data-sort-direction', 'asc'); // Default sort direction

        // Create table body rows
        rows.forEach(rowData => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                if (header.toLowerCase() !== 'link') {
                    const td = document.createElement('td');
                    let cellData = rowData[header] || '';

                    if (header.toLowerCase() === 'source') {
                        const linkData = rowData['link'] || '';
                        if (linkData && linkData.toLowerCase() !== 'n/a' && (linkData.startsWith('http://') || linkData.startsWith('https://'))) {
                            const a = document.createElement('a');
                            a.href = linkData;
                            a.textContent = cellData;
                            a.target = '_blank';
                            a.rel = 'noopener noreferrer';
                            td.appendChild(a);
                        } else {
                            td.textContent = '';
                        }
                    } else if (header.toLowerCase() === 'date') {
                        // Format date for display
                        cellData = rowData[header] ? rowData[header].toLocaleDateString() : '';
                        td.textContent = cellData;
                    } else if (header.toLowerCase() === 'when') {
                        cellData = rowData[header] instanceof Date && !isNaN(rowData[header]) ? rowData[header].toISOString().slice(0, 10) : '';
                        td.textContent = cellData;
                    } else {
                        td.textContent = cellData;
                    }
                    tr.appendChild(td);
                }
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        // Clear loading message and append the table
        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);
    }

    fetchAndDisplayData();
});