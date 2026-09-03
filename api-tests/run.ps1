# $env:BASE_URL = "https://kilowatt-finch-cupbearer.ngrok-free.dev"
# $env:API_URL = "https://kilowatt-finch-cupbearer.ngrok-free.dev/api/v1"
$env:BASE_URL = "http://localhost:3000"
$env:API_URL = "http://localhost:3000/api/v1"

$base = $env:BASE_URL
$api = $env:API_URL

$cookieJar = "$PSScriptRoot\cookies.txt"

function authApi {
    curl.exe -s -b $cookieJar -c $cookieJar `
            -H "Content-Type: application/json" `
            -H "Origin: $base" `
            @Args
}

function api {
    curl.exe -s -b $cookieJar -c $cookieJar `
        -H "Content-Type: application/json" `
        @args | json
}
