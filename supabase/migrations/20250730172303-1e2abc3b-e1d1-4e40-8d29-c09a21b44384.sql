-- Update existing sessions with old session types to new standardized types
UPDATE sessions 
SET type = 'Personal Training' 
WHERE type = 'PT Session';

UPDATE sessions 
SET type = 'EMS Training' 
WHERE type = 'EMS Session';