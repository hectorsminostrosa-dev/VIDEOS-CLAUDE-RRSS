# Instala el entorno de VIDEOS RRSS en un PC con Windows y descarga el proyecto desde GitHub.
#
# Uso (en PowerShell, en el PC nuevo):
#   powershell -ExecutionPolicy Bypass -File instalar.ps1 -Repo https://github.com/USUARIO/REPOSITORIO.git
#
# Se puede correr más de una vez: lo que ya está instalado se salta.
# Instala todo en carpetas portables (no pide permisos de administrador):
#   D:\herramientas   Node.js, FFmpeg, Git, Python 3.12 y yt-dlp
#   D:\whisper-env    Whisper (con la tarjeta NVIDIA si hay una)
#   D:\Videos PROYECTO CLAUDE   el proyecto (desde GitHub)
# Luego copia las skills y la memoria de Claude que vienen en _entorno\.

param(
    [string]$Repo = "",
    [string]$Proyecto = "D:\Videos PROYECTO CLAUDE",
    [string]$Herramientas = "D:\herramientas",
    [string]$WhisperEnv = "D:\whisper-env"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$NODE_VER = "v26.13.0"
$PY_VER = "3.12.10"
$TORCH_VER = "2.6.0"
$WHISPER_VER = "20250625"

function Paso($texto) { Write-Host ""; Write-Host "== $texto" -ForegroundColor Magenta }
function Bajar($url, $destino) {
    Write-Host "   Descargando $url"
    & curl.exe -L --fail --silent --show-error -o $destino $url
    if ($LASTEXITCODE -ne 0) { throw "No se pudo descargar $url" }
}
function UltimoAsset($repoGh, $patron) {
    $rel = Invoke-RestMethod "https://api.github.com/repos/$repoGh/releases/latest" -Headers @{ "User-Agent" = "instalar-entorno" }
    $a = $rel.assets | Where-Object { $_.name -match $patron } | Select-Object -First 1
    if (-not $a) { throw "No encontré un archivo '$patron' en $repoGh" }
    return $a.browser_download_url
}

$tmp = Join-Path $env:TEMP "instalar-entorno"
New-Item -ItemType Directory -Force $tmp | Out-Null
New-Item -ItemType Directory -Force $Herramientas | Out-Null
New-Item -ItemType Directory -Force "$Herramientas\bin" | Out-Null

# ---------- Git (MinGit, trae el inicio de sesión de GitHub por navegador) ----------
Paso "Git"
if (-not (Test-Path "$Herramientas\git\cmd\git.exe")) {
    $url = UltimoAsset "git-for-windows/git" '^MinGit-[\d\.]+-64-bit\.zip$'
    Bajar $url "$tmp\mingit.zip"
    New-Item -ItemType Directory -Force "$Herramientas\git" | Out-Null
    & tar.exe -xf "$tmp\mingit.zip" -C "$Herramientas\git"
} else { Write-Host "   Ya está." }

# ---------- Node.js ----------
Paso "Node.js $NODE_VER"
if (-not (Test-Path "$Herramientas\node\node.exe")) {
    Bajar "https://nodejs.org/dist/$NODE_VER/node-$NODE_VER-win-x64.zip" "$tmp\node.zip"
    & tar.exe -xf "$tmp\node.zip" -C $Herramientas
    Rename-Item "$Herramientas\node-$NODE_VER-win-x64" "node"
} else { Write-Host "   Ya está." }

# ---------- FFmpeg ----------
Paso "FFmpeg"
if (-not (Test-Path "$Herramientas\ffmpeg\bin\ffmpeg.exe")) {
    Bajar "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" "$tmp\ffmpeg.zip"
    & tar.exe -xf "$tmp\ffmpeg.zip" -C $Herramientas
    Rename-Item "$Herramientas\ffmpeg-master-latest-win64-gpl" "ffmpeg"
} else { Write-Host "   Ya está." }

# ---------- yt-dlp ----------
Paso "yt-dlp"
if (-not (Test-Path "$Herramientas\bin\yt-dlp.exe")) {
    Bajar "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" "$Herramientas\bin\yt-dlp.exe"
} else { Write-Host "   Ya está." }

# ---------- Python 3.12 ----------
Paso "Python $PY_VER"
$py = "$Herramientas\python312\python.exe"
if (-not (Test-Path $py)) {
    Bajar "https://www.python.org/ftp/python/$PY_VER/python-$PY_VER-amd64.exe" "$tmp\python.exe"
    Start-Process "$tmp\python.exe" -Wait -ArgumentList @("/quiet", "InstallAllUsers=0", "TargetDir=$Herramientas\python312", "Include_launcher=0", "PrependPath=0", "Shortcuts=0", "Include_test=0")
    if (-not (Test-Path $py)) { throw "Python no quedó instalado en $Herramientas\python312" }
} else { Write-Host "   Ya está." }

# ---------- Whisper ----------
Paso "Whisper (puede tardar: baja unos 3 GB)"
$wpy = "$WhisperEnv\Scripts\python.exe"
if (-not (Test-Path "$WhisperEnv\Scripts\whisper.exe")) {
    & $py -m venv $WhisperEnv
    & $wpy -m pip install --upgrade pip
    $nvidia = Get-CimInstance Win32_VideoController | Where-Object { $_.Name -match "NVIDIA" }
    if ($nvidia) {
        Write-Host "   Tarjeta NVIDIA encontrada: $($nvidia[0].Name). Instalo la versión con CUDA."
        & $wpy -m pip install "torch==$TORCH_VER" --index-url https://download.pytorch.org/whl/cu124
    } else {
        Write-Host "   Sin tarjeta NVIDIA: Whisper funcionará, pero más lento (en el comando usa --device cpu)." -ForegroundColor Yellow
        & $wpy -m pip install "torch==$TORCH_VER" --index-url https://download.pytorch.org/whl/cpu
    }
    & $wpy -m pip install "openai-whisper==$WHISPER_VER"
} else { Write-Host "   Ya está." }
# Con fp16 la GTX 1660 Super da NaN; el comando whisper lo desactiva siempre
Set-Content -Encoding ascii "$WhisperEnv\Scripts\whisper.cmd" '@"D:\whisper-env\Scripts\whisper.exe" --fp16 False %*'
if (-not (Test-Path "$env:USERPROFILE\.cache\whisper\medium.pt")) {
    Write-Host "   Bajando el modelo medium (1,5 GB)..."
    & $wpy -c "import whisper; whisper.load_model('medium', device='cpu')"
}

# ---------- PATH del usuario ----------
Paso "PATH"
$rutas = @("$Herramientas\node", "$Herramientas\ffmpeg\bin", "$Herramientas\bin", "$Herramientas\git\cmd", "$WhisperEnv\Scripts")
$actual = [Environment]::GetEnvironmentVariable("Path", "User")
if (-not $actual) { $actual = "" }
$partes = $actual.Split(";") | Where-Object { $_ -ne "" }
$faltan = $rutas | Where-Object { $partes -notcontains $_ }
if ($faltan) {
    [Environment]::SetEnvironmentVariable("Path", (($partes + $faltan) -join ";"), "User")
    Write-Host "   Agregadas: $($faltan -join ', ')"
} else { Write-Host "   Ya estaban." }
$env:Path = ($rutas -join ";") + ";" + $env:Path

# ---------- Proyecto desde GitHub ----------
Paso "Proyecto"
if (-not (Test-Path "$Proyecto\.git")) {
    if (-not $Repo) { throw "Falta -Repo con la dirección del repositorio en GitHub" }
    if ((Test-Path $Proyecto) -and (Get-ChildItem $Proyecto -Force | Select-Object -First 1)) {
        throw "La carpeta $Proyecto ya existe y no está vacía. Muévela o bórrala antes de seguir."
    }
    Write-Host "   Se abrirá el navegador para iniciar sesión en GitHub (solo la primera vez)."
    & git clone $Repo $Proyecto
    if ($LASTEXITCODE -ne 0) { throw "No se pudo descargar el repositorio" }
} else {
    Write-Host "   Ya existe. Traigo lo último..."
    & git -C $Proyecto pull --ff-only
}

# ---------- Skills y memoria de Claude ----------
Paso "Skills y memoria de Claude"
$skills = "$env:USERPROFILE\.claude\skills"
New-Item -ItemType Directory -Force $skills | Out-Null
Copy-Item "$Proyecto\_entorno\skills\*" $skills -Recurse -Force
# La memoria se guarda según la ruta del proyecto: D:\Videos PROYECTO CLAUDE -> D--Videos-PROYECTO-CLAUDE
$clave = ($Proyecto -replace '[^A-Za-z0-9]', '-')
$mem = "$env:USERPROFILE\.claude\projects\$clave\memory"
New-Item -ItemType Directory -Force $mem | Out-Null
Copy-Item "$Proyecto\_entorno\memoria\*" $mem -Force
Write-Host "   Skills en $skills"
Write-Host "   Memoria en $mem"

# ---------- HyperFrames ----------
Paso "HyperFrames 0.9.13"
Push-Location $Proyecto
& npx --yes hyperframes@0.9.13 --version
Pop-Location

# ---------- Revisión final ----------
Paso "Revisión"
foreach ($c in @("node --version", "git --version", "ffmpeg -version", "yt-dlp --version")) {
    $salida = Invoke-Expression "$c 2>&1" | Select-Object -First 1
    Write-Host "   $c -> $salida"
}
& $wpy -c "import torch, whisper; print('   whisper', whisper.__version__, '| CUDA:', torch.cuda.is_available())"

Write-Host ""
Write-Host "Listo. Cierra y vuelve a abrir la app de Claude para que tome el PATH nuevo." -ForegroundColor Green
Write-Host "No vienen en GitHub (copiarlos desde Google Drive si se necesitan):"
Write-Host "  - Los MP4 terminados de cada video"
Write-Host "  - data-centers\assets\video\hector.mp4"
Write-Host "  - D:\PACK SONIDOS 2025 (manuDT)"
