# Script de restauration de la base de données PostgreSQL
# Usage: .\scripts\restore-database.ps1 -BackupFile "backups\dyn_backup_20260130_152530.sql"

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile
)

# Charger les variables d'environnement depuis .env
$envFile = Join-Path $PSScriptRoot "..\\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Vérifier que le fichier de backup existe
if (-not (Test-Path $BackupFile)) {
    Write-Error "Fichier de sauvegarde non trouvé: $BackupFile"
    exit 1
}

# Décompresser si c'est un fichier zip
$sqlFile = $BackupFile
if ($BackupFile -match '\.zip$') {
    Write-Host "🗜️  Décompression du fichier..." -ForegroundColor Cyan
    $tempDir = Join-Path $env:TEMP "db_restore_$(Get-Random)"
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    Expand-Archive -Path $BackupFile -DestinationPath $tempDir
    $sqlFile = Get-ChildItem -Path $tempDir -Filter "*.sql" | Select-Object -First 1 -ExpandProperty FullName
}

# Parser l'URL de connexion PostgreSQL
$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
    Write-Error "DATABASE_URL non trouvée dans .env"
    exit 1
}

if ($databaseUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbNameFull = $matches[5]
    
    # Retirer les paramètres de requête (?schema=public, etc.)
    if ($dbNameFull -match '^([^?]+)') {
        $dbName = $matches[1]
    } else {
        $dbName = $dbNameFull
    }
} else {
    Write-Error "Format DATABASE_URL invalide"
    exit 1
}

Write-Host ""
Write-Host "⚠️  ATTENTION: Cette opération va ÉCRASER la base de données actuelle!" -ForegroundColor Yellow
Write-Host "   Base: $dbName" -ForegroundColor Gray
Write-Host "   Serveur: ${dbHost}:${dbPort}" -ForegroundColor Gray
Write-Host ""
$confirmation = Read-Host "Voulez-vous continuer? (oui/non)"

if ($confirmation -ne "oui") {
    Write-Host "❌ Restauration annulée" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Restauration de la base de données en cours..." -ForegroundColor Cyan

# Trouver psql (essayer plusieurs emplacements)
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe",
    "psql"  # Essayer le PATH
)

$psql = $null
foreach ($path in $psqlPaths) {
    if ($path -eq "psql") {
        # Vérifier si psql est dans le PATH
        if (Get-Command psql -ErrorAction SilentlyContinue) {
            $psql = "psql"
            break
        }
    } elseif (Test-Path $path) {
        $psql = $path
        break
    }
}

if (-not $psql) {
    Write-Error "❌ psql introuvable. Veuillez installer PostgreSQL ou ajouter psql au PATH."
    exit 1
}

Write-Host "   psql: $psql" -ForegroundColor Gray

# Définir le mot de passe pour psql
$env:PGPASSWORD = $dbPassword

try {
    # Exécuter psql pour restaurer
    $arguments = @(
        "-h", $dbHost,
        "-p", $dbPort,
        "-U", $dbUser,
        "-d", $dbName,
        "-f", $sqlFile
    )

    $process = Start-Process -FilePath $psql -ArgumentList $arguments -Wait -NoNewWindow -PassThru

    if ($process.ExitCode -eq 0) {
        Write-Host "✅ Restauration réussie!" -ForegroundColor Green
    } else {
        Write-Error "❌ Échec de la restauration (code: $($process.ExitCode))"
        exit 1
    }
} catch {
    Write-Error "❌ Erreur: $_"
    exit 1
} finally {
    # Nettoyer
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    if ($BackupFile -match '\.zip$' -and (Test-Path $tempDir)) {
        Remove-Item $tempDir -Recurse -Force
    }
}

Write-Host ""
Write-Host "✨ Terminé!" -ForegroundColor Green
