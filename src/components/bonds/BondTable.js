import React, { useState, useContext } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { AppContext } from '../../store/AppContext';

// Добавляем свойство onSelectBond, которое передадим из внешнего компонента
const BondTable = ({ bonds, onSelectBond }) => {
  const [sorting, setSorting] = useState([]);
  const { favorites, toggleFavorite } = useContext(AppContext);

  const columns = [
    {
      id: 'favorite',
      header: '',
      cell: info => {
        const secid = info.row.original.SECID;
        const isFav = favorites.includes(secid);
        return (
          <span
            style={{ cursor: 'pointer', color: isFav ? 'var(--accent-green)' : 'var(--text-muted)', fontSize: '18px', userSelect: 'none' }}
            onClick={(e) => {
              e.stopPropagation(); // Останавливаем всплытие, чтобы не триггерить клик по всей строке
              toggleFavorite(secid);
            }}
            title={isFav ? "Удалить из избранного" : "Добавить в избранное"}
          >
            {isFav ? '★' : '☆'}
          </span>
        );
      },
    },
    {
      accessorKey: 'SECID',
      header: 'Тикер',
      cell: info => <span style={{ color: 'var(--accent-green)', fontWeight: '500' }}>{info.getValue()}</span>,
    },
    {
      accessorKey: 'SHORTNAME',
      header: 'Название',
    },
    {
      accessorKey: 'PRICE',
      header: () => <div className="text-end">Цена (%)</div>,
      cell: info => {
        const val = info.getValue();
        return <div className="text-end">{val ? Number(val).toFixed(2) : '-'}</div>;
      },
    },
    {
      accessorKey: 'YIELD',
      header: () => <div className="text-end">Доходность (%)</div>,
      cell: info => {
        const val = info.getValue();
        return <div className="text-end" style={{ fontWeight: '500' }}>{val ? Number(val).toFixed(2) : '-'}</div>;
      },
    }
  ];

  const table = useReactTable({
    data: bonds,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!bonds || bonds.length === 0) return null;

  return (
    <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
      <table className="table table-hover table-borderless align-middle" style={{ color: 'var(--text-primary)' }}>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 1, borderBottom: '1px solid var(--border-color)' }}>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th 
                  key={header.id} 
                  className="py-3"
                  style={{ color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted()] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr 
              key={row.id} 
              style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
              // При клике на строку вызываем функцию выбора облигации
              onClick={() => onSelectBond(row.original.SECID)}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BondTable;