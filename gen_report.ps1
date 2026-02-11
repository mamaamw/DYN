$basePath = "C:\Users\Suira\Downloads\Duralux-admin-1.0.0"
$outputPath = "C:\Users\Suira\Downloads\DURALUX_RAPPORT_COMPLET.txt"

$mainPages = @(
    "index.html",
    "analytics.html",
    "clients.html",
    "customers.html",
    "projects.html",
    "leads.html",
    "proposal.html",
    "payment.html",
    "invoice-create.html",
    "customers-create.html",
    "projects-create.html",
    "leads-create.html",
    "reports-sales.html",
    "apps-email.html",
    "widgets-charts.html"
)

function Get-HtmlTitle {
    param([string]$content)
    if ($content -match '<title>([^<]+)</title>') {
        return $matches[1]
    }
    return "N/A"
}

$report = "=" * 80 + "`r`n"
$report += "RAPPORT COMPLET - DURALUX-ADMIN 1.0.0`r`n"
$report += "=" * 80 + "`r`n"
$report += "Date: $(Get-Date -Format 'dd/MM/yyyy HH:mm')`r`n`r`n"

$report += "1. LISTE COMPLETE DE TOUTES LES PAGES HTML`r`n"
$report += "-" * 80 + "`r`n"

$allHtmlFiles = Get-ChildItem -Path $basePath -File -Filter "*.html" | Where-Object { $_.Name -ne "customizer.html" } | Sort-Object Name

$counter = 1
foreach ($file in $allHtmlFiles) {
    $type = if ($file.Name -match "^(index|analytics|clients|customers|projects|leads|proposal|payment)") { "Page Principale" }
    elseif ($file.Name -match "-(create|edit|view)") { "Detail/Formulaire" }
    elseif ($file.Name -match "^auth-") { "Authentification" }
    elseif ($file.Name -match "^apps-") { "Application" }
    elseif ($file.Name -match "^reports-") { "Rapport" }
    elseif ($file.Name -match "^settings-") { "Parametres" }
    elseif ($file.Name -match "^widgets-") { "Widget" }
    else { "Autre" }
    
    $report += "$counter. $($file.Name) [$type]`r`n"
    $counter++
}

$report += "`r`n`r`n2. ANALYSE DETAILLEE DES 15 PAGES PRINCIPALES`r`n"
$report += "=" * 80 + "`r`n"
$report += "Contenu HTML brut (200 premieres lignes)`r`n`r`n"

$pageCounter = 1
foreach ($page in $mainPages) {
    $filePath = Join-Path $basePath $page
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        $title = Get-HtmlTitle $content
        $lines = Get-Content $filePath
        
        $report += "`r`n" + "=" * 80 + "`r`n"
        $report += "PAGE $pageCounter`: $page`r`n"
        $report += "TITRE: $title`r`n"
        $report += "=" * 80 + "`r`n`r`n"
        
        $firstLines = if ($lines.Count -gt 200) { $lines[0..199] } else { $lines }
        $report += ($firstLines -join "`r`n") + "`r`n"
        
        $pageCounter++
    }
}

$report += "`r`n`r`n3. PATTERNS ET COMPOSANTS REUTILISABLES`r`n"
$report += "=" * 80 + "`r`n"

$patterns = @{
    "Navigation principale" = "nxl-navigation, nxl-navbar, nxl-item"
    "Structure de page" = "page-header, nxl-content, nxl-container"
    "Formulaires" = "form-group, form-control, input-group"
    "Tableaux" = "table, table-responsive, table-hover"
    "Cartes/Cards" = "card, card-header, card-body, card-footer"
    "Boutons" = "btn, btn-primary, btn-secondary, btn-sm, btn-lg"
    "Modales" = "modal, modal-content, modal-body, modal-footer"
    "Badges" = "badge, badge-primary, badge-success"
    "Barres de progression" = "progress, progress-bar"
    "Alertes" = "alert, alert-success, alert-danger"
}

foreach ($pattern in $patterns.GetEnumerator()) {
    $report += "`r`n$($pattern.Key):`r`n  $($pattern.Value)`r`n"
}

$report += "`r`n`r`n4. STRUCTURE DE MISE EN PAGE COMMUNE`r`n"
$report += "=" * 80 + "`r`n"
$report += "- Navigation: Barre laterale gauche avec menu (nxl-navigation)`r`n"
$report += "- Header: En-tete avec titre de page et actions`r`n"
$report += "- Contenu principal: Wrapper nxl-content avec nxl-container`r`n"
$report += "- Composants: Cartes, tableaux, graphiques, formulaires`r`n"
$report += "- Footer: Pied de page optionnel`r`n"

$report += "`r`n`r`n5. TYPES DE DONNEES AFFICHEES`r`n"
$report += "=" * 80 + "`r`n"

$dataTypes = @{
    "Dashboard" = "Statistiques, graphiques, cartes KPI, taches recentes"
    "Clients" = "Table de clients, filtres, statuts, informations de contact"
    "Projets" = "Liste de projets, statuts, dates, assignes, budgets"
    "Propositions" = "Table de propositions, montants, statuts, dates"
    "Rapports" = "Graphiques, tableaux statistiques, exports"
    "Parametres" = "Formulaires de configuration, toggles, selecteurs"
    "Applications" = "Chat, Email, Taches, Calendrier, Stockage"
    "Widgets" = "Composants reutilisables (graphiques, listes, statistiques)"
}

foreach ($dataType in $dataTypes.GetEnumerator()) {
    $report += "`r`n$($dataType.Key):`r`n  $($dataType.Value)`r`n"
}

$report += "`r`n`r`n6. RESUME DES FINDINGS`r`n"
$report += "=" * 80 + "`r`n"
$report += "- Total de pages HTML: $(($allHtmlFiles).Count)`r`n"
$report += "- Pages principales analysees: 15`r`n"
$report += "- Framework CSS: Bootstrap + Custom CSS (theme.min.css)`r`n"
$report += "- Architecture: Template HTML statique avec assets`r`n"
$report += "- Composants de base: Navbars, Cartes, Tableaux, Formulaires, Modales`r`n"
$report += "- Patterns d'icones: Feather Icons (feather-* classes)`r`n"
$report += "- Bibliotheques tierces: DateRangePicker, Chart.js, Bootstrap`r`n"

$report | Out-File -FilePath $outputPath -Encoding UTF8
Write-Host "Rapport genere: $outputPath"
