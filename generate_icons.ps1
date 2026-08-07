Add-Type -AssemblyName System.Drawing

function Make-Icon([int]$sz, [string]$outPath) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Dark Navy Background
    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $g.FillRectangle($bg, 0, 0, $sz, $sz)
    
    # Cyan/Blue Card
    $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
    $cardPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 6, 182, 212), [int]($sz * 0.03))
    $m = [int]($sz * 0.15)
    $g.FillRectangle($cardBrush, $m, $m, $sz - 2*$m, $sz - 2*$m)
    $g.DrawRectangle($cardPen, $m, $m, $sz - 2*$m, $sz - 2*$m)

    # Green Checkmark
    $checkPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 16, 185, 129), [int]($sz * 0.05))
    $g.DrawLine($checkPen, [int]($sz*0.25), [int]($sz*0.45), [int]($sz*0.35), [int]($sz*0.55))
    $g.DrawLine($checkPen, [int]($sz*0.35), [int]($sz*0.55), [int]($sz*0.55), [int]($sz*0.35))

    # White Lines
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 250, 252))
    $g.FillRectangle($textBrush, [int]($sz*0.6), [int]($sz*0.4), [int]($sz*0.2), [int]($sz*0.04))
    $g.FillRectangle($textBrush, [int]($sz*0.3), [int]($sz*0.65), [int]($sz*0.4), [int]($sz*0.04))

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Make-Icon -sz 192 -outPath "icons/icon-192.png"
Make-Icon -sz 512 -outPath "icons/icon-512.png"
Write-Host "PNG Icons Generated Successfully"
