# Custom MCP Servers - Issue Analysis & Fix

**Date:** October 15, 2025  
**Status:** 5 of 6 custom servers need fixing

---

## 🔍 Root Cause Analysis

### Working Server ✅
**puppeteer-minimal** - Correctly configured:
- `tsconfig.json`: `"module": "ESNext"` → Compiles to ES modules
- `package.json`: `"type": "module"` → Expects ES modules
- **Result:** ✅ **MATCH** - Server starts successfully

### Broken Servers ❌
**shell-minimal, github-minimal, agent-autonomy, sequential-thinking-minimal, everything-minimal**

**Problem:** Configuration Mismatch
- `tsconfig.json`: `"module": "commonjs"` → Compiles to CommonJS
- `package.json`: `"type": "module"` → Expects ES modules
- **Result:** ❌ **MISMATCH** - Error: "exports is not defined in ES module scope"

**Error Output:**
```
ReferenceError: exports is not defined in ES module scope
```

**Why This Happens:**
1. TypeScript compiles to CommonJS (uses `require`, `exports`)
2. Node.js sees `"type": "module"` and treats .js as ES modules
3. Node.js tries to run CommonJS code as ES module → Error

---

## 🔧 Solution

### Option 1: Fix TypeScript Config (Recommended)

Change `tsconfig.json` in each broken package to match puppeteer-minimal:

**Files to update:**
1. `packages/shell-minimal/tsconfig.json`
2. `packages/github-minimal/tsconfig.json`
3. `packages/agent-autonomy/tsconfig.json`
4. `packages/sequential-thinking-minimal/tsconfig.json`
5. `packages/everything-minimal/tsconfig.json`

**Change:**
```json
// FROM:
{
  "compilerOptions": {
    "module": "commonjs",  // ❌ This causes the problem
    ...
  }
}

// TO:
{
  "compilerOptions": {
    "module": "ESNext",           // ✅ Match package.json
    "moduleResolution": "node",   // ✅ Add this
    "target": "ES2022",           // ✅ Update target
    ...
  }
}
```

**Then rebuild:**
```powershell
cd C:\Users\A00288946\Projects\my-mcp-servers\my-mcp-servers

# Rebuild each package
cd packages\shell-minimal && npm run build
cd ..\github-minimal && npm run build
cd ..\agent-autonomy && npm run build
cd ..\sequential-thinking-minimal && npm run build
cd ..\everything-minimal && npm run build
```

---

### Option 2: Remove ES Module Type (Alternative)

Remove `"type": "module"` from each package.json:

**Files to update:**
1. `packages/shell-minimal/package.json`
2. `packages/github-minimal/package.json`
3. `packages/agent-autonomy/package.json`
4. `packages/sequential-thinking-minimal/package.json`
5. `packages/everything-minimal/package.json`

**Change:**
```json
// FROM:
{
  "name": "@gjoeckel/mcp-shell-minimal",
  "version": "1.0.0",
  "type": "module",  // ❌ Remove this line
  ...
}

// TO:
{
  "name": "@gjoeckel/mcp-shell-minimal",
  "version": "1.0.0",
  // "type": "module" removed
  ...
}
```

**No rebuild needed** - existing CommonJS builds will work.

---

## ⚠️ Additional Issue: GitHub Token

**Server:** github-minimal

**Problem:**
```json
"env": {
  "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
}
```

The `GITHUB_TOKEN` environment variable is **not set**.

**Impact:**
- Server will start but fail when trying to access GitHub API
- Need to set environment variable

**Fix:**
```powershell
# Set for current session
$env:GITHUB_TOKEN = "your_github_personal_access_token"

# Set permanently (user-level)
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token", "User")

# Then restart Cursor to pick up the new environment variable
```

**Get GitHub Token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`, `read:org`
4. Copy the token

---

## 📊 Server Status Summary

| Server | Build Status | Config Issue | Token Issue | Overall |
|--------|--------------|--------------|-------------|---------|
| **filesystem** | ✅ Official | - | - | ✅ **WORKING** |
| **memory** | ✅ Official | - | - | ✅ **WORKING** |
| **puppeteer-minimal** | ✅ Built | ✅ Correct | - | ✅ **WORKING** |
| **shell-minimal** | ✅ Built | ❌ Mismatch | - | ❌ **BROKEN** |
| **github-minimal** | ✅ Built | ❌ Mismatch | ⚠️ No token | ❌ **BROKEN** |
| **agent-autonomy** | ✅ Built | ❌ Mismatch | - | ❌ **BROKEN** |
| **sequential-thinking** | ✅ Built | ❌ Mismatch | - | ❌ **BROKEN** |
| **everything-minimal** | ✅ Built | ❌ Mismatch | - | ❌ **BROKEN** |

**Summary:**
- ✅ **3 servers working** (filesystem, memory, puppeteer-minimal) = **23 tools**
- ❌ **5 servers broken** (shell, github, agent, sequential, everything) = **20 tools missing**
- **Current:** 23 / 39 tools (59%)
- **After fix:** 39 / 39 tools (100%)

---

## 🎯 Recommended Fix Steps

### Step 1: Fix TypeScript Configurations

```powershell
cd C:\Users\A00288946\Projects\my-mcp-servers\my-mcp-servers\packages

# Fix shell-minimal
$config = Get-Content shell-minimal\tsconfig.json | ConvertFrom-Json
$config.compilerOptions.module = "ESNext"
$config.compilerOptions.target = "ES2022"
$config.compilerOptions | Add-Member -NotePropertyName "moduleResolution" -NotePropertyValue "node" -Force
$config | ConvertTo-Json -Depth 10 | Set-Content shell-minimal\tsconfig.json

# Repeat for other packages...
```

### Step 2: Rebuild Affected Packages

```powershell
cd C:\Users\A00288946\Projects\my-mcp-servers\my-mcp-servers

cd packages\shell-minimal && npm run build && cd ..\..
cd packages\github-minimal && npm run build && cd ..\..
cd packages\agent-autonomy && npm run build && cd ..\..
cd packages\sequential-thinking-minimal && npm run build && cd ..\..
cd packages\everything-minimal && npm run build && cd ..\..
```

### Step 3: Set GitHub Token (Optional)

```powershell
# Get token from https://github.com/settings/tokens
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ghp_YOUR_TOKEN_HERE", "User")
```

### Step 4: Restart Cursor IDE

- Quit Cursor completely
- Relaunch
- All 8 servers should start
- All 39 tools should be available

---

## ✅ Validation After Fix

### Test Server Startup

```powershell
# Test each server manually
node "C:\Users\A00288946\Projects\my-mcp-servers\my-mcp-servers\packages\shell-minimal\build\index.js" --version
node "C:\Users\A00288946\Projects\my-mcp-servers\my-mcp-servers\packages\github-minimal\build\index.js" --version
node "C:\Users\A00288946\Projects\my-mcp-servers\my-mcp-servers\packages\agent-autonomy\build\index.js" --version
node "C:\Users\A00288946\Projects\my-mcp-servers\my-mcp-servers\packages\sequential-thinking-minimal\build\index.js" --version
node "C:\Users\A00288946\Projects\my-mcp-servers\my-mcp-servers\packages\everything-minimal\build\index.js" --version
```

### Check in Cursor

1. Open Cursor Settings → MCP
2. Should see 8 servers listed
3. All should show status "Running"
4. Total tools: 39

---

## 📝 Why This Happened

The custom MCP servers repository has inconsistent configuration across packages:

- **puppeteer-minimal** was created/updated with modern ES module config
- **Other packages** still use older CommonJS config
- Both have `"type": "module"` in package.json but different TypeScript targets

**Root Cause:** Package evolution - puppeteer was likely updated more recently while others kept legacy config.

---

## 🔄 Prevention for Future

When creating new MCP server packages:

1. **Decide on module format:**
   - ES modules: `"type": "module"` + `"module": "ESNext"`
   - CommonJS: No "type" field + `"module": "commonjs"`

2. **Keep it consistent:**
   - Use puppeteer-minimal as template for ES modules
   - Or remove `"type": "module"` and use CommonJS everywhere

3. **Test before committing:**
   ```powershell
   npm run build
   node build/index.js --version  # Should not throw errors
   ```

---

**Created:** October 15, 2025  
**Status:** Analysis Complete - Fix Ready to Apply

