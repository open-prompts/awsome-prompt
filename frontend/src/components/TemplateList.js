import React, { useEffect, useState } from 'react';
import { DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell, TableContainer } from '@carbon/react';
import { useTranslation } from 'react-i18next';

// Define the headers for the data table
const headers = [
  { key: 'title', header: 'Title' },
  { key: 'description', header: 'Description' },
  { key: 'owner_id', header: 'Owner' },
  { key: 'visibility', header: 'Visibility' },
];

// TemplateList component renders a table of prompt templates.
// It fetches data from the backend API and displays it using Carbon Design System's DataTable.
const TemplateList = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // Fetch templates from the backend API
    // In a real application, the URL should be configurable via environment variables
    fetch('http://localhost:8080/api/v1/templates')
      .then(res => res.json())
      .then(data => {
        if (data.templates) {
            // Map data to match DataTable requirements (needs unique id)
            // We spread the template object and ensure 'id' is present
            setRows(data.templates.map(t => ({ ...t, id: t.id })));
        }
      })
      .catch(err => console.error('Error fetching templates:', err));
  }, []);

  return (
    <DataTable rows={rows} headers={headers}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
        <TableContainer title={t('template_list') || 'Template List'}>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>{cell.value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DataTable>
  );
};

export default TemplateList;
