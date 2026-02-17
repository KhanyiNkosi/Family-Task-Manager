-- Fetch definitions of the soft-delete propagator functions
SELECT 
    proname AS function_name,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
    AND proname IN (
        'propagate_reward_soft_delete',
        'rewards_soft_delete_propagate'
    );
