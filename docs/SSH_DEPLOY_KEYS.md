# Guide: SSH Deploy Keys for GitHub + Render

This guide explains how to configure SSH deploy keys to connect your private GitHub repository with Render for automatic deployments.

---

## Why Deploy Keys Are More Secure Than Personal Access Tokens

### Scope Limitation
| Feature | Deploy Key | Personal Access Token (PAT) |
|---------|------------|----------------------------|
| Access Scope | Single repository | Can be scoped to multiple repos/orgs |
| Permission Level | Read-only (recommended) or read-write | Full user permissions |
| Revocation Impact | Affects only one service | Affects all services using that token |

### Reduced Security Risk
- **Compromise Impact**: If a deploy key is leaked, an attacker can only access that ONE repository. A leaked PAT could access ALL your repositories and potentially your entire GitHub account.

- **Audit Trail**: Deploy keys are clearly identified in the repository settings, making it easy to audit which services have access.

- **Least Privilege**: Deploy keys follow the principle of least privilege - they only have the minimum access needed for deployment.

---

## Step-by-Step Configuration

### Step 1: Generate SSH Key Pair

**Option A: Using Git Bash (Recommended)**

Open Git Bash and run:

```bash
# Generate ED25519 SSH key pair (recommended)
ssh-keygen -t ed25519 -C "render-deploy@vaultkey"

# When prompted, save to default location:
# ~/.ssh/id_ed25519
```

**Option B: Using Windows PowerShell**

If you have OpenSSH Client installed:

```powershell
ssh-keygen -t ed25519 -C "render-deploy@vaultkey"
```

**Option C: Using PuTTY (Windows)**

1. Download PuTTYgen from https://www.putty.org
2. Select "Ed25519" as key type
3. Click "Generate"
4. Save the private key (PPK format)
5. Copy the public key from the text box

---

### Step 2: View the Public Key

**Git Bash:**
```bash
cat ~/.ssh/id_ed25519.pub
```

**Windows PowerShell:**
```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

The output will look like:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleKeyStringForRenderDeployment render-deploy@vaultkey
```

### Step 3: Add Deploy Key to GitHub

1. Go to your GitHub repository: `https://github.com/webberterryedu-blip/secure-your-worlds`
2. Navigate to **Settings** → **Deploy keys**
3. Click **Add deploy key**
4. Fill in:
   - **Title**: `Render Deploy Key`
   - **Key**: Paste the public key content
   - ✅ **Allow write access**: **DO NOT CHECK** (keep it read-only for security)
5. Click **Add deploy key**

### Step 4: Configure Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Under "GitHub", click **Configure account**
4. Authorize Render to access your GitHub repositories
5. Select your repository: `webberterryedu-blip/secure-your-worlds`

### Step 5: Add Private Key to Render

In the Render web service configuration:

1. Under **Environment** → **Private Servics** (or **Environment Variables**)
2. Add a new **Private Service**:
   - **Name**: `SSH_PRIVATE_KEY`
   - **Value**: Paste the **PRIVATE KEY** content (not the public key!)
   
To get the private key:
```bash
cat ~/.ssh/id_ed25519
```

**Important**: The private key must be in PEM format. If you're using OpenSSH format, convert it:
```bash
# Convert to PEM format
ssh-keygen -p -m PEM -f ~/.ssh/id_ed25519
```

### Step 6: Configure Build Settings

In Render:
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Auto-deploy**: Enabled

### Step 7: Add Known Host

Render needs to verify GitHub's host. Add to your build command:

```bash
mkdir -p ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts
```

Or configure in Render's "Build Command" setting:
```bash
mkdir -p ~/.ssh && ssh-keyscan github.com >> ~/.ssh/known_hosts && npm install && npm run build
```

---

## Verification

After deployment, you can verify:

```bash
# Test SSH connection (locally)
ssh -T git@github.com

# Expected output:
# Hi webberterryedu-blip/secure-your-worlds! You've successfully authenticated...
```

---

## Security Checklist

- [ ] Deploy key has **read-only** access (write access disabled)
- [ ] Private key is stored as Render Private Service (not environment variable)
- [ ] Deploy key is named descriptively (e.g., "Render Deploy Key")
- [ ] Build logs don't expose sensitive information
- [ ] Repository settings show only necessary deploy keys

---

## Troubleshooting

### Error: "Permission denied (publickey)"

1. Verify the public key was added correctly to GitHub
2. Ensure you're using the PRIVATE key in Render (not public)
3. Check that known_hosts is configured in build command

### Error: "Host key verification failed"

Add `ssh-keyscan github.com >> ~/.ssh/known_hosts` to your build command.

### Error: "Key is already in use"

The key might be used elsewhere. Generate a new key pair for this deployment.

### Windows-Specific Issues

#### Problem: "ssh-keygen is not recognized"

Your Windows PowerShell doesn't have ssh-keygen available. Here are solutions:

---

**Solution 1: Use Git Bash (Recommended)**

If you have Git installed, use Git Bash instead of PowerShell:

1. Open **Git Bash** (search for it in Start Menu)
2. Run:
```bash
ssh-keygen -t ed25519 -C "render-deploy@vaultkey"
```
3. The keys will be saved to `C:\Users\webbe\.ssh\`
4. To view keys in PowerShell later:
```powershell
type C:\Users\webbe\.ssh\id_ed25519.pub
```

---

**Solution 2: Install OpenSSH Client (Windows 10/11)**

Run PowerShell as Administrator:

```powershell
# Check if OpenSSH is available
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# Install OpenSSH Client (if not installed)
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

After installation, **restart PowerShell** and run:
```powershell
ssh-keygen -t ed25519 -C "render-deploy@vaultkey"
```

---

**Solution 3: Use PuTTYgen**

1. Download and install PuTTY from https://www.putty.org
2. Open **PuTTYgen**
3. Select **Ed25519** as key type
4. Click **Generate** and move your mouse for randomness
5. Save the private key (click "Save private key")
6. Copy the public key from the text box at the top

---

**Solution 4: Install Windows Terminal**

Windows Terminal (from Microsoft Store) includes OpenSSH:

1. Install **Windows Terminal** from Microsoft Store
2. Open Windows Terminal
3. Run: `ssh-keygen -t ed25519 -C "render-deploy@vaultkey"`

---

#### Checking for existing keys (Windows PowerShell)

```powershell
dir $env:USERPROFILE\.ssh
```

If the folder doesn't exist:

```powershell
mkdir $env:USERPROFILE\.ssh
```

---

## Summary

| Component | Value |
|-----------|-------|
| Key Type | ED25519 |
| Key Location | `~/.ssh/id_ed25519` (private), `~/.ssh/id_ed25519.pub` (public) |
| GitHub Setting | Settings → Deploy Keys |
| Render Setting | Private Services |
| Permission | Read-only (recommended) |

### Key Commands by Platform

**macOS / Linux / Git Bash:**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "render-deploy@vaultkey"

# View public key
cat ~/.ssh/id_ed25519.pub

# View private key (for Render)
cat ~/.ssh/id_ed25519
```

**Windows (PowerShell):**
```powershell
# Generate SSH key
ssh-keygen -t ed25519 -C "render-deploy@vaultkey"

# View public key
type $env:USERPROFILE\.ssh\id_ed25519.pub

# View private key (for Render)
type $env:USERPROFILE\.ssh\id_ed25519
```

This setup provides secure, limited access for automated deployments while minimizing the impact if credentials are ever compromised.
