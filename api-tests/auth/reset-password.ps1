authApi -X POST "$base/api/auth/reset-password" -d "@$PSScriptRoot\reset-password.json" | json
# http://localhost:3000/api/auth/reset-password/gG1Xf9Dax3DPAicfho7hMMry?callbackURL=http%3A%2F%2Flocalhost%3A3000%2Freset-password
