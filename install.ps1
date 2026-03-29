[CmdletBinding()]
param(
    [string]$HomeRoot = $(if ($env:USERPROFILE) { $env:USERPROFILE } else { [Environment]::GetFolderPath("UserProfile") })
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSCommandPath
$SourceMarketplace = Join-Path $RepoRoot ".agents/plugins/marketplace.json"
$PluginsRoot = Join-Path $HomeRoot "plugins"
$TargetMarketplace = Join-Path $HomeRoot ".agents/plugins/marketplace.json"

if (-not (Test-Path -LiteralPath $SourceMarketplace)) {
    throw "Marketplace source not found: $SourceMarketplace"
}

New-Item -ItemType Directory -Force -Path $PluginsRoot | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $TargetMarketplace) | Out-Null

$SourcePayload = Get-Content -LiteralPath $SourceMarketplace -Raw | ConvertFrom-Json

foreach ($Plugin in $SourcePayload.plugins) {
    $PluginName = [string]$Plugin.name
    $PluginTarget = Join-Path $RepoRoot $PluginName
    $PluginLink = Join-Path $PluginsRoot $PluginName

    if (-not (Test-Path -LiteralPath $PluginTarget -PathType Container)) {
        throw "Plugin directory not found: $PluginTarget"
    }

    if (Test-Path -LiteralPath $PluginLink) {
        $ExistingItem = Get-Item -LiteralPath $PluginLink -Force
        $IsReparsePoint = ($ExistingItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0

        if ($IsReparsePoint) {
            Remove-Item -LiteralPath $PluginLink -Force -Recurse
        }
        else {
            $ExistingResolved = (Resolve-Path -LiteralPath $PluginLink).Path
            $TargetResolved = (Resolve-Path -LiteralPath $PluginTarget).Path
            if ($ExistingResolved -eq $TargetResolved) {
                continue
            }

            throw "Path already exists and is not the expected link: $PluginLink"
        }
    }

    try {
        New-Item -ItemType SymbolicLink -Path $PluginLink -Target $PluginTarget | Out-Null
    }
    catch {
        New-Item -ItemType Junction -Path $PluginLink -Target $PluginTarget | Out-Null
    }
}

if (Test-Path -LiteralPath $TargetMarketplace) {
    $TargetPayload = Get-Content -LiteralPath $TargetMarketplace -Raw | ConvertFrom-Json
}
else {
    $TargetPayload = [pscustomobject]@{
        name = "local-home-marketplace"
        interface = [pscustomobject]@{
            displayName = "Local Codex Plugins"
        }
        plugins = @()
    }
}

if (-not $TargetPayload.PSObject.Properties["name"]) {
    $TargetPayload | Add-Member -NotePropertyName name -NotePropertyValue "local-home-marketplace"
}

if (-not $TargetPayload.PSObject.Properties["interface"] -or $null -eq $TargetPayload.interface) {
    $TargetPayload | Add-Member -NotePropertyName interface -NotePropertyValue ([pscustomobject]@{ displayName = "Local Codex Plugins" }) -Force
}
elseif (-not $TargetPayload.interface.PSObject.Properties["displayName"]) {
    $TargetPayload.interface | Add-Member -NotePropertyName displayName -NotePropertyValue "Local Codex Plugins"
}

$PluginsList = @()
if ($TargetPayload.PSObject.Properties["plugins"] -and $null -ne $TargetPayload.plugins) {
    $PluginsList = @($TargetPayload.plugins)
}
$TargetPayload | Add-Member -NotePropertyName plugins -NotePropertyValue $PluginsList -Force

foreach ($Plugin in $SourcePayload.plugins) {
    $PluginName = [string]$Plugin.name
    $PolicyInstallation = "AVAILABLE"
    $PolicyAuthentication = "ON_INSTALL"
    if ($Plugin.policy) {
        if ($Plugin.policy.installation) { $PolicyInstallation = [string]$Plugin.policy.installation }
        if ($Plugin.policy.authentication) { $PolicyAuthentication = [string]$Plugin.policy.authentication }
    }

    $Entry = [pscustomobject]@{
        name = $PluginName
        source = [pscustomobject]@{
            source = "local"
            path = "./plugins/$PluginName"
        }
        policy = [pscustomobject]@{
            installation = $PolicyInstallation
            authentication = $PolicyAuthentication
        }
        category = $(if ($Plugin.category) { [string]$Plugin.category } else { "Development" })
    }

    $Updated = $false
    for ($Index = 0; $Index -lt $PluginsList.Count; $Index++) {
        if ($PluginsList[$Index].name -eq $PluginName) {
            $PluginsList[$Index] = $Entry
            $Updated = $true
            break
        }
    }

    if (-not $Updated) {
        $PluginsList += $Entry
    }
}

$TargetPayload.plugins = $PluginsList
$TargetPayload | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $TargetMarketplace -Encoding UTF8

Write-Host "Installed $($SourcePayload.plugins.Count) geo-codex plugins into $TargetMarketplace"
Write-Host "Plugin links point to $RepoRoot"
Write-Host "Done. Restart Codex or open a new session to refresh plugins."
