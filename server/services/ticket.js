export const generateTicketId = (db) => {
  const row = db.prepare(`
    SELECT ticket_id 
    FROM complaints 
    ORDER BY CAST(SUBSTR(ticket_id, 5) AS INTEGER) DESC 
    LIMIT 1
  `).get();

  if (!row) {
    return 'CMP-1001';
  }

  const lastNum = parseInt(row.ticket_id.substring(4), 10);
  return `CMP-${lastNum + 1}`;
};
