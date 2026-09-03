authApi -X POST "$base/api/auth/request-password-reset" -d "@$PSScriptRoot\request-reset-password.json" | json
