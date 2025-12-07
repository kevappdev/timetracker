/**
 * Helper to find Supabase User ID by Slack ID
 */
CREATE OR REPLACE FUNCTION public.get_user_by_slack_id(slack_user_id text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT user_id
  FROM auth.identities
  WHERE provider = 'slack'
  AND (identity_data->>'sub')::text = slack_user_id
  LIMIT 1;
$$;

