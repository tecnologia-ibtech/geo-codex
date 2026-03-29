[CmdletBinding()]
param(
    [string]$HomeRoot = $(if ($env:USERPROFILE) { $env:USERPROFILE } else { [Environment]::GetFolderPath("UserProfile") }),
    [string]$CodexHome = $(if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HomeRoot ".codex" }),
    [string]$SkillInstallDir = $(if ($env:SKILL_INSTALL_DIR) { $env:SKILL_INSTALL_DIR } else { Join-Path $CodexHome "skills" }),
    [string]$PluginsRoot = $(if ($env:PLUGIN_INSTALL_DIR) { $env:PLUGIN_INSTALL_DIR } else { Join-Path $HomeRoot "plugins" }),
    [string]$TargetMarketplace = $(if ($env:MARKETPLACE_PATH) { $env:MARKETPLACE_PATH } else { Join-Path $HomeRoot ".agents/plugins/marketplace.json" })
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSCommandPath
$SourceMarketplace = Join-Path $RepoRoot ".agents/plugins/marketplace.json"

if (-not (Test-Path -LiteralPath $SourceMarketplace)) {
    throw "Marketplace source not found: $SourceMarketplace"
}

if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
    throw "codex CLI not found in PATH."
}

$env:CODEX_HOME = $CodexHome

New-Item -ItemType Directory -Force -Path $CodexHome | Out-Null
New-Item -ItemType Directory -Force -Path $SkillInstallDir | Out-Null
New-Item -ItemType Directory -Force -Path $PluginsRoot | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $TargetMarketplace) | Out-Null

$SourcePayload = Get-Content -LiteralPath $SourceMarketplace -Raw | ConvertFrom-Json

function Backup-Path {
    param([string]$Path)

    if (Test-Path -LiteralPath $Path) {
        $BackupPath = "$Path.bak.$([DateTime]::Now.ToString('yyyyMMddHHmmss'))"
        Move-Item -LiteralPath $Path -Destination $BackupPath
        Write-Host "  BACKUP $Path -> $BackupPath"
    }
}

function Install-Link {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Label
    )

    $SourceResolved = (Resolve-Path -LiteralPath $Source).Path
    $IsSkill = $Label.StartsWith("skill:")

    if (Test-Path -LiteralPath $Destination) {
        $ExistingItem = Get-Item -LiteralPath $Destination -Force
        $IsReparsePoint = ($ExistingItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0

        if ($IsReparsePoint) {
            $ExistingResolved = (Resolve-Path -LiteralPath $Destination).Path
            if ($ExistingResolved -eq $SourceResolved) {
                Write-Host "  SKIP $Label (link already OK)"
                return
            }

            if ($IsSkill) {
                Write-Host "  WARN $Label already exists at $Destination; skipping to avoid overwriting another installed skill"
                return
            }

            Remove-Item -LiteralPath $Destination -Force -Recurse
        }
        else {
            if ($IsSkill) {
                Write-Host "  WARN $Label already exists at $Destination; skipping to avoid overwriting another installed skill"
                return
            }
            Backup-Path -Path $Destination
        }
    }

    try {
        New-Item -ItemType SymbolicLink -Path $Destination -Target $Source | Out-Null
    }
    catch {
        New-Item -ItemType Junction -Path $Destination -Target $Source | Out-Null
    }

    Write-Host "  LINK $Label -> $Source"
}

Write-Host "=== geo-codex installer ==="
Write-Host "Repo: $RepoRoot"
Write-Host "Codex home: $CodexHome"
Write-Host "Skill dir: $SkillInstallDir"
Write-Host "Plugin dir: $PluginsRoot"
Write-Host "Marketplace: $TargetMarketplace"
Write-Host ""

$PluginRoots = @()

foreach ($Plugin in $SourcePayload.plugins) {
    $PluginName = [string]$Plugin.name
    $PluginSourcePath = [string]$Plugin.source.path
    $RelativePluginPath = if ($PluginSourcePath.StartsWith("./")) { $PluginSourcePath.Substring(2) } else { $PluginSourcePath }
    $PluginTarget = Join-Path $RepoRoot $RelativePluginPath
    $PluginLink = Join-Path $PluginsRoot $PluginName

    if (-not (Test-Path -LiteralPath $PluginTarget -PathType Container)) {
        throw "Plugin directory not found: $PluginTarget"
    }

    Install-Link -Source $PluginTarget -Destination $PluginLink -Label "plugin:$PluginName"
    $PluginRoots += [pscustomobject]@{
        Name = $PluginName
        Path = $PluginTarget
    }
}

Write-Host ""

$SkillSources = [ordered]@{}

function Register-SkillDir {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        return
    }

    $SkillManifest = Join-Path $Path "SKILL.md"
    if (-not (Test-Path -LiteralPath $SkillManifest -PathType Leaf)) {
        return
    }

    $SkillName = Split-Path -Leaf $Path
    $ResolvedPath = (Resolve-Path -LiteralPath $Path).Path

    if ($SkillSources.Contains($SkillName) -and $SkillSources[$SkillName] -ne $ResolvedPath) {
        throw "Duplicate skill '$SkillName' in $($SkillSources[$SkillName]) and $ResolvedPath"
    }

    $SkillSources[$SkillName] = $ResolvedPath
}

$RepoSkillsRoot = Join-Path $RepoRoot "skills"
if (Test-Path -LiteralPath $RepoSkillsRoot -PathType Container) {
    Get-ChildItem -LiteralPath $RepoSkillsRoot -Directory | ForEach-Object {
        Register-SkillDir -Path $_.FullName
    }
}

foreach ($PluginRoot in $PluginRoots) {
    $PluginSkillsRoot = Join-Path $PluginRoot.Path "skills"
    if (Test-Path -LiteralPath $PluginSkillsRoot -PathType Container) {
        Get-ChildItem -LiteralPath $PluginSkillsRoot -Directory | ForEach-Object {
            Register-SkillDir -Path $_.FullName
        }
    }
}

foreach ($Entry in $SkillSources.GetEnumerator()) {
    $SkillLink = Join-Path $SkillInstallDir $Entry.Key
    Install-Link -Source $Entry.Value -Destination $SkillLink -Label "skill:$($Entry.Key)"
}

if (Test-Path -LiteralPath $TargetMarketplace) {
    $TargetPayload = Get-Content -LiteralPath $TargetMarketplace -Raw | ConvertFrom-Json
}
else {
    $TargetPayload = [pscustomobject]@{
        name = if ($SourcePayload.name) { [string]$SourcePayload.name } else { "local-home-marketplace" }
        interface = [pscustomobject]@{
            displayName = if ($SourcePayload.interface.displayName) { [string]$SourcePayload.interface.displayName } else { "Local Codex Plugins" }
        }
        plugins = @()
    }
}

if (-not $TargetPayload.PSObject.Properties["name"] -or [string]::IsNullOrWhiteSpace([string]$TargetPayload.name)) {
    $TargetPayload | Add-Member -NotePropertyName name -NotePropertyValue $(if ($SourcePayload.name) { [string]$SourcePayload.name } else { "local-home-marketplace" }) -Force
}

if (-not $TargetPayload.PSObject.Properties["interface"] -or $null -eq $TargetPayload.interface) {
    $TargetPayload | Add-Member -NotePropertyName interface -NotePropertyValue ([pscustomobject]@{
        displayName = if ($SourcePayload.interface.displayName) { [string]$SourcePayload.interface.displayName } else { "Local Codex Plugins" }
    }) -Force
}
elseif (-not $TargetPayload.interface.PSObject.Properties["displayName"] -or [string]::IsNullOrWhiteSpace([string]$TargetPayload.interface.displayName)) {
    $TargetPayload.interface | Add-Member -NotePropertyName displayName -NotePropertyValue $(if ($SourcePayload.interface.displayName) { [string]$SourcePayload.interface.displayName } else { "Local Codex Plugins" }) -Force
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

$McpFiles = @()
$RootMcp = Join-Path $RepoRoot ".mcp.json"
if (Test-Path -LiteralPath $RootMcp -PathType Leaf) {
    $McpFiles += $RootMcp
}

foreach ($PluginRoot in $PluginRoots) {
    $PluginMcp = Join-Path $PluginRoot.Path ".mcp.json"
    if (Test-Path -LiteralPath $PluginMcp -PathType Leaf) {
        $McpFiles += $PluginMcp
    }
}

foreach ($McpFile in $McpFiles) {
    $McpPayload = Get-Content -LiteralPath $McpFile -Raw | ConvertFrom-Json
    if (-not $McpPayload.mcpServers) {
        continue
    }

    foreach ($ServerProp in $McpPayload.mcpServers.PSObject.Properties) {
        $ServerName = [string]$ServerProp.Name
        $ServerConfig = $ServerProp.Value

        & codex mcp get $ServerName *> $null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SKIP MCP $ServerName (already configured)"
            continue
        }

        if ($ServerConfig.url) {
            & codex mcp add $ServerName --url ([string]$ServerConfig.url) *> $null
            Write-Host "  ADD MCP $ServerName -> $($ServerConfig.url)"
            continue
        }

        $McpArgs = @("mcp", "add", $ServerName)

        if ($ServerConfig.env) {
            foreach ($EnvProp in $ServerConfig.env.PSObject.Properties) {
                $McpArgs += "--env"
                $McpArgs += "$($EnvProp.Name)=$($EnvProp.Value)"
            }
        }

        $McpArgs += "--"

        if ($ServerConfig.command -is [System.Array]) {
            $McpArgs += @($ServerConfig.command)
        }
        else {
            $McpArgs += [string]$ServerConfig.command
        }

        if ($ServerConfig.args) {
            if ($ServerConfig.args -is [System.Array]) {
                $McpArgs += @($ServerConfig.args)
            }
            else {
                $McpArgs += [string]$ServerConfig.args
            }
        }

        & codex @McpArgs *> $null
        Write-Host "  ADD MCP $ServerName -> stdio"
    }
}

Write-Host ""
Write-Host "Installation complete."
Write-Host "  Skills are available in new sessions via ~/.codex/skills."
Write-Host "  Plugins and slash commands require a full Codex app restart to refresh the UI."
