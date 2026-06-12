# Chromebook SSH Setup Guide for Section42 Bot

This guide will help you set up passwordless SSH authentication between your Chromebook and Windows PC, allowing you to git push/pull without password prompts.

## Problem
When using HTTPS git remotes, the Chromebook Linux terminal freezes when asking for passwords. SSH keys solve this by using cryptographic authentication instead.

---

## Part 1: Generate SSH Key on Chromebook

1. **Open Chromebook Terminal** (Linux container)

2. **Generate SSH Key**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
   - Press Enter for all prompts (no passphrase for automatic auth)
   - This creates two files:
     - `~/.ssh/id_ed25519` (private key - keep secret!)
     - `~/.ssh/id_ed25519.pub` (public key - share this)

3. **Display Your Public Key**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   - Copy the entire output (starts with `ssh-ed25519`)

---

## Part 2: Add Key to Windows PC

### Option A: If Pushing to GitHub/GitLab
1. Go to GitHub Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste your public key
4. Save

### Option B: If Pushing to Your PC Directly
1. **On Windows PC**, install OpenSSH Server:
   - Settings → Apps → Optional Features → Add a feature
   - Search for "OpenSSH Server" and install

2. **Start SSH Service**
   ```powershell
   # Run PowerShell as Administrator
   Start-Service sshd
   Set-Service -Name sshd -StartupType 'Automatic'
   ```

3. **Add Chromebook's Public Key**
   - Open: `C:\Users\adens\.ssh\authorized_keys` (create if doesn't exist)
   - Paste the public key from Chromebook on a new line
   - Save the file

4. **Set Correct Permissions** (PowerShell as Admin)
   ```powershell
   icacls "C:\Users\adens\.ssh\authorized_keys" /inheritance:r
   icacls "C:\Users\adens\.ssh\authorized_keys" /grant:r "adens:R"
   icacls "C:\Users\adens\.ssh\authorized_keys" /grant:r "SYSTEM:(F)"
   ```

---

## Part 3: Configure Git Remote on Chromebook

1. **Find Your PC's IP Address**
   - On Windows: Open CMD and run `ipconfig`
   - Look for "IPv4 Address" (usually 192.168.x.x)

2. **Update Git Remote to Use SSH**
   ```bash
   cd ~/Section42  # or wherever your bot is
   
   # For GitHub (recommended)
   git remote set-url origin git@github.com:yourusername/Section42.git
   
   # For direct PC connection
   git remote set-url origin adens@192.168.x.x:/c/Users/adens/Downloads/Bots/Section42
   ```

3. **Test SSH Connection**
   ```bash
   # For GitHub
   ssh -T git@github.com
   
   # For PC
   ssh adens@192.168.x.x
   ```
   - First time will ask "Are you sure?" - type `yes`
   - Should connect without password

---

## Part 4: Set Up Auto-Deploy (Optional)

If you want the bot to automatically restart when you push code:

### On Windows PC:

1. **Install Node.js Process Manager**
   ```powershell
   npm install -g pm2
   npm install -g pm2-windows-startup
   pm2-startup install
   ```

2. **Start Bot with PM2**
   ```powershell
   cd C:\Users\adens\Downloads\Bots\Section42
   pm2 start index.js --name section42-bot
   pm2 save
   ```

3. **Create Git Hook** (in your repo)
   - Create: `.git/hooks/post-receive` (no extension)
   - Add this content:
   ```bash
   #!/bin/bash
   echo "Deployment received! Restarting bot..."
   cd /c/Users/adens/Downloads/Bots/Section42
   npm install
   pm2 restart section42-bot
   echo "Bot restarted successfully!"
   ```
   - Make executable: `chmod +x .git/hooks/post-receive`

---

## Part 5: Daily Workflow

### From Chromebook:
```bash
# Make changes to your code
git add .
git commit -m "Added new features"
git push origin main  # No password needed!
```

### From Windows PC:
```powershell
# Pull latest changes
git pull origin main

# Or if bot is running with PM2
pm2 logs section42-bot  # View logs
pm2 restart section42-bot  # Restart manually
```

---

## Troubleshooting

### "Permission denied (publickey)"
- Make sure public key is in `authorized_keys` on PC
- Check file permissions on Windows
- Verify SSH service is running: `Get-Service sshd`

### "Connection refused"
- Check Windows Firewall allows SSH (port 22)
- Verify PC's IP address hasn't changed
- Try: `ssh -v adens@192.168.x.x` for verbose output

### Terminal Still Freezes
- Make sure you're using `git@` format, not `https://`
- Check remote URL: `git remote -v`
- Should show `git@github.com` or `git@192.168.x.x`

### Bot Doesn't Auto-Restart
- Check PM2 status: `pm2 status`
- View PM2 logs: `pm2 logs`
- Manually restart: `pm2 restart section42-bot`

---

## Quick Reference Commands

```bash
# Chromebook
ssh-keygen -t ed25519 -C "email@example.com"  # Generate key
cat ~/.ssh/id_ed25519.pub                      # Show public key
git remote -v                                  # Check remote URL
git push origin main                           # Push without password

# Windows PC
ipconfig                                       # Get IP address
Get-Service sshd                               # Check SSH service
pm2 status                                     # Check bot status
pm2 logs section42-bot                         # View bot logs
pm2 restart section42-bot                      # Restart bot
```

---

## Security Notes

- **Never share your private key** (`id_ed25519`)
- Only share the public key (`id_ed25519.pub`)
- Consider setting a static IP for your PC in router settings
- Keep your Chromebook and PC on the same network for direct connection
- For remote access outside home network, use GitHub as intermediary

---

## Recommended Setup

For most users, I recommend:
1. Push from Chromebook → GitHub (using SSH)
2. Pull from PC ← GitHub (using SSH)
3. Use PM2 on PC to keep bot running

This way you don't need direct PC-to-Chromebook connection and can access your code from anywhere.
