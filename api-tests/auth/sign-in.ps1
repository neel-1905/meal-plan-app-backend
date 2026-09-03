authApi -X POST "$base/api/auth/sign-in/email" -d "@$PSScriptRoot\sign-in.json" | json
