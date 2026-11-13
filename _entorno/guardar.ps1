# Guarda el proyecto en GitHub: copia las skills y la memoria de Claude a _entorno\,
# registra los cambios y los sube.
#
# Uso:  powershell -ExecutionPolicy Bypass -File _entorno\guardar.ps1 "mensaje opcional"

param([string]$Mensaje = "")

$ErrorActionPreference = "Stop"
$env:Path = "D:\herramientas\git\cmd;" + $env:Path
$Proyecto = Split-Path -Parent $PSScriptRoot
Set-Location $Proyecto

# Skills y memoria de este PC -> _entorno\
$skills = "$env:USERPROFILE\.claude\skills"
$clave = ($Proyecto -replace '[^A-Za-z0-9]', '-')
$mem = "$env:USERPROFILE\.claude\projects\$clave\memory"
if (Test-Path $skills) {
    & robocopy $skills "$Proyecto\_entorno\skills" /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
}
if (Test-Path $mem) {
    & robocopy $mem "$Proyecto\_entorno\memoria" /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
}

# Firma de los registros (la configuración local no viaja con el repositorio)
if (-not (& git config user.email)) {
    & git config user.name "Videos RRSS"
    & git config user.email "videos-rrss@users.noreply.github.com"
}

& git add -A
& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) { Write-Host "No hay cambios que guardar."; exit 0 }
if (-not $Mensaje) { $Mensaje = "Guardado " + (Get-Date -Format "yyyy-MM-dd HH:mm") }
& git commit -q -m $Mensaje
& git push
if ($LASTEXITCODE -ne 0) { throw "No se pudo subir a GitHub" }
Write-Host "Guardado y subido a GitHub." -ForegroundColor Green
