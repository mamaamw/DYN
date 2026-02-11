# Script de sauvegarde de la base de données PostgreSQL
# Usage: .\scripts\backup-database.ps1

param(
    [string]$BackupDir = "backups",
    [switch]$Compress
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

# Parser l'URL de connexion PostgreSQL
$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
    Write-Error "DATABASE_URL non trouvée dans .env"
    exit 1
}

# Extraire les informations de connexion
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

# Créer le dossier de backup s'il n'existe pas
$backupPath = Join-Path $PSScriptRoot "..\$BackupDir"
if (-not (Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath | Out-Null
}

# Générer le nom du fichier avec timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $backupPath "dyn_backup_$timestamp.sql"

Write-Host "🔄 Sauvegarde de la base de données en cours..." -ForegroundColor Cyan
Write-Host "   Base: $dbName" -ForegroundColor Gray
Write-Host "   Serveur: ${dbHost}:${dbPort}" -ForegroundColor Gray
Write-Host ""

# Définir le mot de passe pour pg_dump
$env:PGPASSWORD = $dbPassword

try {
    # Trouver pg_dump (essayer plusieurs emplacements)
    $pgDumpPaths = @(
        "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
        "C:\Program Files (x86)\PostgreSQL\18\bin\pg_dump.exe",
        "C:\Program Files (x86)\PostgreSQL\17\bin\pg_dump.exe",
        "C:\Program Files (x86)\PostgreSQL\16\bin\pg_dump.exe",
        "C:\Program Files (x86)\PostgreSQL\15\bin\pg_dump.exe",
        "pg_dump"  # Essayer le PATH
    )

    $pgDump = $null
    foreach ($path in $pgDumpPaths) {
        if ($path -eq "pg_dump") {
            # Vérifier si pg_dump est dans le PATH
            if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
                $pgDump = "pg_dump"
                break
            }
        } elseif (Test-Path $path) {
            $pgDump = $path
            break
        }
    }

    if (-not $pgDump) {
        Write-Error "❌ pg_dump introuvable. Veuillez installer PostgreSQL ou ajouter pg_dump au PATH."
        exit 1
    }

    Write-Host "   pg_dump: $pgDump" -ForegroundColor Gray

    # Exécuter pg_dump
    $arguments = @(
        "-h", $dbHost,
        "-p", $dbPort,
        "-U", $dbUser,
        "-d", $dbName,
        "-F", "p",  # Format plain SQL
        "-f", $backupFile,
        "--no-owner",
        "--no-acl",
        "--clean",
        "--if-exists"
    )

    $process = Start-Process -FilePath $pgDump -ArgumentList $arguments -Wait -NoNewWindow -PassThru

    if ($process.ExitCode -eq 0) {
        $fileSize = (Get-Item $backupFile).Length / 1MB
        Write-Host "✅ Sauvegarde réussie!" -ForegroundColor Green
        Write-Host "   Fichier: $backupFile" -ForegroundColor Gray
        Write-Host "   Taille: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Gray

        # Compresser si demandé
        if ($Compress) {
            Write-Host ""
            Write-Host "🗜️  Compression en cours..." -ForegroundColor Cyan
            $zipFile = "$backupFile.zip"
            Compress-Archive -Path $backupFile -DestinationPath $zipFile -Force
            Remove-Item $backupFile
            $zipSize = (Get-Item $zipFile).Length / 1MB
            Write-Host "✅ Compression réussie!" -ForegroundColor Green
            Write-Host "   Fichier: $zipFile" -ForegroundColor Gray
            Write-Host "   Taille: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Gray
        }

        # Nettoyer les anciennes sauvegardes (garder les 10 dernières)
        Write-Host ""
        Write-Host "🧹 Nettoyage des anciennes sauvegardes..." -ForegroundColor Cyan
        $backups = Get-ChildItem -Path $backupPath -Filter "dyn_backup_*.sql*" | Sort-Object LastWriteTime -Descending
        if ($backups.Count -gt 10) {
            $backups | Select-Object -Skip 10 | ForEach-Object {
                Remove-Item $_.FullName -Force
                Write-Host "   Supprimé: $($_.Name)" -ForegroundColor Gray
            }
        }
        Write-Host "   Conservées: $([math]::Min($backups.Count, 10)) sauvegardes" -ForegroundColor Gray

    } else {
        Write-Error "❌ Échec de la sauvegarde (code: $($process.ExitCode))"
        exit 1
    }
} catch {
    Write-Error "❌ Erreur: $_"
    exit 1
} finally {
    # Nettoyer la variable d'environnement
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✨ Terminé!" -ForegroundColor Green
