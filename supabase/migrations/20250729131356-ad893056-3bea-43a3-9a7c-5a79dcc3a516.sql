-- Create some sample packages for testing
INSERT INTO public.packages (name, description, price, sessions_included, duration_days) 
VALUES 
  ('Personal Training 12 Sessions', '12 one-on-one personal training sessions with a certified trainer', 3600.00, 12, 60),
  ('EMS Trial Session', 'Single trial session to experience EMS training', 200.00, 1, 30),
  ('Group Training Package', '8 group training sessions for small groups', 1200.00, 8, 45);