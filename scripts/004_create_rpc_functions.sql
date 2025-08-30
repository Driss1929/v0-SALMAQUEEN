-- Create RPC function to set configuration for RLS
CREATE OR REPLACE FUNCTION set_config(parameter text, value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config(parameter, value, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_config(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_config(text, text) TO anon;
