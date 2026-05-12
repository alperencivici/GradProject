
CREATE OR REPLACE FUNCTION get_distinct_districts(p_il TEXT) RETURNS TABLE (ilce TEXT) LANGUAGE plpgsql AS 'BEGIN RETURN QUERY SELECT DISTINCT address_lookup.ilce FROM address_lookup WHERE address_lookup.il = p_il ORDER BY address_lookup.ilce; END;';
CREATE OR REPLACE FUNCTION get_distinct_semts(p_il TEXT, p_ilce TEXT) RETURNS TABLE (semt TEXT) LANGUAGE plpgsql AS 'BEGIN RETURN QUERY SELECT DISTINCT address_lookup.semt FROM address_lookup WHERE address_lookup.il = p_il AND address_lookup.ilce = p_ilce ORDER BY address_lookup.semt; END;';
GRANT EXECUTE ON FUNCTION get_distinct_districts(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_distinct_semts(TEXT, TEXT) TO anon, authenticated, service_role;
