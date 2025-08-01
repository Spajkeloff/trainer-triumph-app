-- Create the missing profile for the user manually
INSERT INTO profiles (user_id, first_name, last_name, role)
VALUES ('2e2d06c0-bb09-44d0-9662-f082555dcfea', 'Lazar', 'Imotion', 'client')
ON CONFLICT (user_id) DO NOTHING;