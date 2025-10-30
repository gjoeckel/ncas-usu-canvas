# Windows 11 Terminal Setup for Git Bash

## 🎯 Goal
Configure Windows 11 to use Git Bash as the default terminal in both Windows Terminal and Cursor.

## 📋 Manual Setup Steps

### Step 1: Configure Windows Terminal

1. **Open Windows Terminal**
   - Press `Win + R`, type `wt`, press Enter
   - Or search "Windows Terminal" in Start menu

2. **Open Settings**
   - Click the dropdown arrow next to tabs
   - Select "Settings" (or press `Ctrl + ,`)

3. **Add Git Bash Profile**
   - In the left sidebar, click "Profiles"
   - Click "Add a new profile"
   - Fill in these details:
     ```
     Name: Git Bash
     Command line: "C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe" --login -i
     Starting directory: %USERPROFILE%
     Icon: C:\Users\A00288946\AppData\Local\Programs\Git\mingw64\share\git\git-for-windows.ico
     ```

4. **Set as Default**
   - In the left sidebar, click "Startup"
   - Under "Default profile", select "Git Bash"
   - Click "Save"

### Step 2: Configure Windows 11 Default Terminal

1. **Open Windows Settings**
   - Press `Win + I`
   - Go to "Privacy & security" → "For developers"

2. **Set Terminal**
   - Under "Terminal", select "Windows Terminal"
   - This makes Windows Terminal the default for all applications

### Step 3: Test Configuration

1. **Test Windows Terminal**
   - Open Windows Terminal (should default to Git Bash)
   - Run: `echo "Hello from Git Bash"`

2. **Test Cursor**
   - Open Cursor
   - Press `Ctrl + `` to open terminal
   - Should now open Git Bash instead of PowerShell

## 🔧 Alternative: Registry Method

If the above doesn't work, you can set it via registry:

1. **Open Registry Editor**
   - Press `Win + R`, type `regedit`, press Enter

2. **Navigate to Terminal Settings**
   - Go to: `HKEY_CURRENT_USER\Console`
   - Create new String Value: `DelegationConsole`
   - Set value to: `{61c54bbd-c2c6-5271-96e7-009a87ff44bf}`

3. **Set Windows Terminal as Default**
   - Go to: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Terminal\Settings`
   - Create new String Value: `DefaultProfile`
   - Set value to: `{61c54bbd-c2c6-5271-96e7-009a87ff44bf}`

## 🚨 Troubleshooting

### If Cursor still opens PowerShell:

1. **Check Cursor Settings**
   - Open Cursor Settings (`Ctrl + ,`)
   - Search for "terminal"
   - Verify "Terminal › Integrated › Default Profile: Windows" is set to "Git Bash"

2. **Restart Everything**
   - Close all Cursor windows
   - Close Windows Terminal
   - Restart Cursor
   - Open new terminal

### If Windows Terminal doesn't show Git Bash:

1. **Check Git Installation**
   - Verify Git is installed: `git --version`
   - Check path: `C:\Users\A00288946\AppData\Local\Programs\Git\bin\bash.exe`

2. **Recreate Profile**
   - Delete the Git Bash profile in Windows Terminal
   - Add it again with the exact path above

## ✅ Verification

After setup, you should see:
- Windows Terminal opens with Git Bash by default
- Cursor terminal opens with Git Bash by default
- Commands like `chmod`, `bash`, `ls` work properly
- Unix-style paths work (`/c/Users/...`)

## 🎉 Success!

Once configured, you'll have:
- Git Bash as default terminal everywhere
- Full Unix command compatibility
- Better development experience
- No more PowerShell issues
