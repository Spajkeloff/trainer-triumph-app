-- Clean up the remaining duplicate charges
DELETE FROM transactions 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY client_id, transaction_type, amount, transaction_date 
      ORDER BY created_at DESC
    ) as rn
    FROM transactions 
    WHERE client_id = '8c848ed6-5d78-4823-b947-3faeac9220ec' 
    AND transaction_type = 'charge'
  ) t WHERE rn > 1
);