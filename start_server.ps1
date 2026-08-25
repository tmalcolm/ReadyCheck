$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server running at http://localhost:8080/"

$mimeMap = @{
    ".html" = "text/html";
    ".css"  = "text/css";
    ".js"   = "application/javascript";
    ".json" = "application/json";
    ".png"  = "image/png";
    ".svg"  = "image/svg+xml";
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        
        $filePath = Join-Path (Get-Location) ($urlPath.TrimStart("/").Replace("/", "\"))
        
        if ($urlPath -eq "/json" -or $urlPath -eq "/json/" -or $urlPath -eq "/json/index.json") {
            $jsonDir = Join-Path (Get-Location) "json"
            $files = Get-ChildItem -Path $jsonDir -Filter "*.json" | Where-Object { $_.Name -ne "index.json" } | Select-Object -ExpandProperty Name
            $jsonList = ConvertTo-Json @($files)
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonList)
            $response.ContentType = "application/json"
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } elseif (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            if ($mimeMap.ContainsKey($ext)) {
                $response.ContentType = $mimeMap[$ext]
            } else {
                $response.ContentType = "application/octet-stream"
            }
            
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $buf = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($buf, 0, $buf.Length)
        }
        $response.Close()
    } catch {
        # continue loop on client abort
    }
}
