# 1Password Secret References — pavelrapoport.com
# Local: op run --env-file=.env.tpl -- pnpm dev
# CI uses op://CI/... via load-secrets-action (see deploy.yml)

# Supabase
SUPABASE_URL=op://Studio/supabase/url
SUPABASE_ANON_KEY=op://Studio/supabase/anon-key
SUPABASE_SERVICE_ROLE_KEY=op://Studio/supabase/service-role-key
SUPABASE_DB_PASSWORD=op://Studio/supabase/db-password

# Claude
CLAUDE_API_KEY=op://Studio/claude/api-key

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=op://Studio/cloudflare/account-id
CLOUDFLARE_API_TOKEN=op://Studio/cloudflare/api-token
CLOUDFLARE_ZONE_ID=op://Studio/cloudflare/zone-id

# Linear
LINEAR_API_KEY=op://Studio/linear/api-key
LINEAR_WEBHOOK_SECRET=op://Studio/linear/webhook-secret

# GitHub
GITHUB_TOKEN=op://Studio/github/token
GITHUB_WEBHOOK_SECRET=op://Studio/github/webhook-secret

# Google
GOOGLE_WORKSPACE_ADMIN=op://Studio/google/workspace-admin
GOOGLE_OAUTH_CLIENT_ID=op://Studio/google/oauth-client-id
GOOGLE_OAUTH_CLIENT_SECRET=op://Studio/google/oauth-client-secret
