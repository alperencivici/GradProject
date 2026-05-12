CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, address, location_lat, location_lng)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'consumer'),
    NEW.raw_user_meta_data ->> 'phone',
    NEW.raw_user_meta_data ->> 'address',
    (NEW.raw_user_meta_data ->> 'location_lat')::numeric,
    (NEW.raw_user_meta_data ->> 'location_lng')::numeric
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    address = COALESCE(EXCLUDED.address, profiles.address),
    location_lat = COALESCE(EXCLUDED.location_lat, profiles.location_lat),
    location_lng = COALESCE(EXCLUDED.location_lng, profiles.location_lng);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
