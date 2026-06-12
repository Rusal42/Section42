# Section42 Bot - Windows SSH Server Setup Script
# Run this as Administrator on your Windows PC

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Section42 Bot SSH Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "[1/6] Checking OpenSSH Server..." -ForegroundColor Yellow

# Check if OpenSSH Server is installed
$sshServer = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'

if ($sshServer.State -ne "Installed") {
    Write-Host "Installing OpenSSH Server..." -ForegroundColor Yellow
    Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
    Write-Host "OpenSSH Server installed!" -ForegroundColor Green
} else {
    Write-Host "OpenSSH Server already installed!" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/6] Starting SSH Service..." -ForegroundColor Yellow

# Start and enable SSH service
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

Write-Host "SSH Service started and set to automatic!" -ForegroundColor Green

Write-Host ""
Write-Host "[3/6] Configuring Firewall..." -ForegroundColor Yellow

# Configure firewall
$firewallRule = Get-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -ErrorAction SilentlyContinue

if ($null -eq $firewallRule) {
    New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH Server (sshd)' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22
    Write-Host "Firewall rule created!" -ForegroundColor Green
} else {
    Write-Host "Firewall rule already exists!" -ForegroundColor Green
}

Write-Host ""
Write-Host "[4/6] Setting up SSH directory..." -ForegroundColor Yellow

# Create .ssh directory if it doesn't exist
$sshDir = "$env:USERPROFILE\.ssh"
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir | Out-Null
    Write-Host "Created .ssh directory" -ForegroundColor Green
} else {
    Write-Host ".ssh directory exists" -ForegroundColor Green
}

# Create authorized_keys file if it doesn't exist
$authKeysPath = "$sshDir\authorized_keys"
if (-not (Test-Path $authKeysPath)) {
    New-Item -ItemType File -Path $authKeysPath | Out-Null
    Write-Host "Created authorized_keys file" -ForegroundColor Green
} else {
    Write-Host "authorized_keys file exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "[5/6] Setting permissions..." -ForegroundColor Yellow

# Set correct permissions
icacls $authKeysPath /inheritance:r
icacls $authKeysPath /grant:r "$($env:USERNAME):(R)"
icacls $authKeysPath /grant:r "SYSTEM:(F)"

Write-Host "Permissions set correctly!" -ForegroundColor Green

Write-Host ""
Write-Host "[6/6] Getting network information..." -ForegroundColor Yellow

# Get IP address
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*"}).IPAddress

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your PC's IP Address: $ipAddress" -ForegroundColor Cyan
Write-Host "Your Username: $env:USERNAME" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. On your Chromebook, run: ssh-keygen -t ed25519 -C 'your_email@example.com'" -ForegroundColor White
Write-Host "2. Copy the public key: cat ~/.ssh/id_ed25519.pub" -ForegroundColor White
Write-Host "3. Add it to: $authKeysPath" -ForegroundColor White
Write-Host "4. Test connection: ssh $env:USERNAME@$ipAddress" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
pause
