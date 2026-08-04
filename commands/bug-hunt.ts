// @ts-nocheck
export interface BugHuntOptions {
  target: string;
  category: 'web' | 'pwn' | 'crypto' | 're' | 'forensics' | 'misc';
  authorized: boolean;
}

function shellEscapeArg(arg: string): string {
  const trimmed = arg.trim();
  if (!trimmed) return '""';
  if (/^[\w./:\\-]+$/.test(trimmed)) return trimmed;
  return `"${trimmed.replace(/"/g, '\\"')}"`;
}

function psEscapePath(p: string): string {
  return p.replace(/'/g, "''");
}

async function runCommand(command: string, timeout = 30000): Promise<string> {
  const { terminalTool } = await import('../src/tools/terminal/exec.js');
  return terminalTool.execute(command, undefined, timeout);
}

async function checkTool(tool: string): Promise<boolean> {
  try {
    const result = await runCommand(`where ${tool}`);
    return result.includes(tool) || result.includes('.exe');
  } catch {
    return false;
  }
}

function classifyTarget(target: string): 'url' | 'file' | 'host' {
  if (/^https?:\/\//i.test(target.trim())) return 'url';
  if (/^[\d]+\.[\d]+\.[\d]+\.[\d]+$/.test(target.trim())) return 'host';
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(target.trim())) return 'host';
  return 'file';
}

function detectCategory(target: string): 'web' | 'pwn' | 'crypto' | 're' | 'forensics' | 'misc' {
  const lower = target.toLowerCase();
  const kind = classifyTarget(target);

  if (kind === 'url' || kind === 'host') return 'web';

  const binaryExts = ['.exe', '.dll', '.so', '.elf', '.bin', '.out', '.sys', '.drv', '.pyc', '.wasm', '.apk'];
  if (binaryExts.some(ext => lower.endsWith(ext))) return 'pwn';

  const cryptoExts = ['.pem', '.p12', '.pfx', '.key', '.enc', '.crypt'];
  if (cryptoExts.some(ext => lower.endsWith(ext))) return 'crypto';

  const forensicsExts = ['.pcap', '.pcapng', '.cap', '.img', '.dd', '.e01', '.raw', '.memdump'];
  if (forensicsExts.some(ext => lower.endsWith(ext))) return 'forensics';

  const reExts = ['.class', '.jar', '.zip', '.rar', '.7z', '.tar', '.gz', '.xz', '.zst'];
  if (reExts.some(ext => lower.endsWith(ext))) return 're';

  return 'misc';
}

async function pythonExists(): Promise<boolean> {
  return checkTool('python');
}

async function runPython(script: string): Promise<string> {
  const safe = script.replace(/"/g, '\\"');
  return runCommand(`python -c "${safe}"`, 30000);
}

async function readFirstLines(target: string, count = 50): Promise<string> {
  const escaped = psEscapePath(target);
  return runCommand(`powershell -Command "Get-Content '${escaped}' -TotalCount ${count}"`);
}

async function readFileHex(target: string, bytes = 256): Promise<string> {
  const escaped = psEscapePath(target);
  return runCommand(`powershell -Command "Get-Content '${escaped}' -Encoding Byte -TotalCount ${bytes} | ForEach-Object { $_.ToString('X2') }"`);
}

async function getFileSize(target: string): Promise<string> {
  const escaped = psEscapePath(target);
  return runCommand(`powershell -Command "(Get-Item '${escaped}').Length"`);
}

async function stringsSearch(target: string, keyword: string): Promise<string> {
  const escaped = psEscapePath(target);
  const safeKeyword = keyword.replace(/"/g, '\\"');
  const psScript = `
    $bytes = [System.IO.File]::ReadAllBytes('${escaped}');
    $text = [System.Text.Encoding]::ASCII.GetString($bytes);
    $lines = $text -split "\`n|\`r";
    foreach ($line in $lines) {
      if ($line -match '${safeKeyword}') { Write-Output $line }
    }
  `.trim().replace(/\s+/g, ' ');
  return runCommand(`powershell -Command "${psScript}"`);
}

async function checkFileExists(target: string): Promise<boolean> {
  return (await runCommand(`if exist ${shellEscapeArg(target)} (echo 1) else (echo 0)`)).trim() === '1';
}

export async function runBugHunt(options: BugHuntOptions): Promise<string> {
  if (!options.authorized) {
    return 'ERROR: Bug hunting requires explicit authorization. Use CTFs, lab boxes, or authorized bug bounty programs only.';
  }

  const results: string[] = [];
  results.push(`=== Bug Hunt: ${options.target} ===`);
  results.push(`Category: ${options.category}`);
  results.push(`Status: Authorized\n`);

  const targetKind = classifyTarget(options.target);
  const isFile = targetKind === 'file';
  const isUrl = targetKind === 'url';

  if (!isUrl && !isFile) {
    results.push(`Target: ${options.target} (treating as hostname/IP)`);
  } else if (isUrl) {
    results.push(`Target: ${options.target} (URL)`);
  } else {
    results.push(`Target: ${options.target} (file)`);
  }

  if (isFile) {
    const exists = await checkFileExists(options.target);
    if (!exists) {
      results.push(`ERROR: File not found: ${options.target}`);
      results.push('\n=== Scan Complete ===');
      return results.join('\n');
    }
  }

  const missingTools: string[] = [];

  switch (options.category) {
    case 'web': {
      results.push('\n--- Web Recon ---');

      if (isUrl) {
        const curlAvailable = await checkTool('curl');
        if (curlAvailable) {
          results.push('\n[+] curl reconnaissance:');
          try {
            const curlOut = await runCommand(`curl -s -o NUL -w "%{http_code}" ${shellEscapeArg(options.target)}`);
            results.push(`  HTTP Status: ${curlOut}`);
            const headers = await runCommand(`curl -s -I ${shellEscapeArg(options.target)}`);
            results.push(`  Headers:\n${headers.split('\n').slice(0, 20).join('\n')}`);
          } catch (e) {
            results.push(`  Error: ${e}`);
          }
        } else {
          missingTools.push('curl');
        }

        const whatwebAvailable = await checkTool('whatweb');
        if (whatwebAvailable) {
          results.push('\n[+] WhatWeb technology detection:');
          try {
            const whatwebOut = await runCommand(`whatweb -a 3 ${shellEscapeArg(options.target)}`, 15000);
            results.push(whatwebOut.split('\n').slice(0, 30).join('\n'));
          } catch (e) {
            results.push(`  Error: ${e}`);
          }
        } else {
          missingTools.push('whatweb');
        }

        const nmapAvailable = await checkTool('nmap');
        if (nmapAvailable) {
          const urlHost = new URL(options.target).hostname;
          results.push('\n[+] Nmap quick scan:');
          try {
            const nmapOut = await runCommand(`nmap -sV -p 80,443,8000,8080,8443 ${shellEscapeArg(urlHost)}`, 30000);
            results.push(nmapOut);
          } catch (e) {
            results.push(`  Error: ${e}`);
          }
        } else {
          missingTools.push('nmap');
        }
      } else if (isFile) {
        results.push('\n[+] File analysis:');
        try {
          const fileType = await runCommand(`file ${shellEscapeArg(options.target)}`);
          results.push(`  Type: ${fileType}`);
          const stringsOut = await stringsSearch(options.target, 'flag|password|admin|passwd|sql');
          if (stringsOut) results.push(`  Interesting strings:\n${stringsOut.split('\n').slice(0, 20).join('\n')}`);
          else results.push('  No interesting strings found.');
        } catch (e) {
          results.push(`  Error: ${e}`);
        }
      } else {
        results.push('\n[+] Basic connectivity:');
        try {
          const ping = await runCommand(`ping -n 2 ${shellEscapeArg(options.target)}`);
          results.push(ping.split('\n').slice(0, 10).join('\n'));
        } catch (e) {
          results.push(`  Error: ${e}`);
        }
      }
      break;
    }

    case 'pwn': {
      results.push('\n--- Pwn/Binary Analysis ---');
      if (isFile) {
        const checksecAvailable = await checkTool('checksec');
        if (checksecAvailable) {
          results.push('\n[+] Checksec:');
          try {
            const checksecOut = await runCommand(`checksec --file=${shellEscapeArg(options.target)}`);
            results.push(checksecOut);
          } catch (e) {
            results.push(`  Error: ${e}`);
          }
        } else {
          missingTools.push('checksec');
        }

        results.push('\n[+] Strings search:');
        try {
          const stringsOut = await stringsSearch(options.target, 'flag|win|lose|shell|code|bin');
          if (stringsOut) results.push(stringsOut.split('\n').slice(0, 20).join('\n'));
          else results.push('  No interesting strings found.');
        } catch (e) {
          results.push(`  Error: ${e}`);
        }

        results.push('\n[+] File info:');
        try {
          const fileOut = await runCommand(`file ${shellEscapeArg(options.target)}`);
          results.push(fileOut);
        } catch (e) {
          results.push(`  Error: ${e}`);
        }
      } else {
        results.push('Pwn category requires a binary file path as target.');
      }
      break;
    }

    case 'crypto': {
      results.push('\n--- Crypto Analysis ---');
      if (isFile) {
        results.push('\n[+] File analysis:');
        try {
          const fileOut = await runCommand(`file ${shellEscapeArg(options.target)}`);
          results.push(fileOut);
          const head = await readFirstLines(options.target, 50);
          results.push(`  First 50 lines:\n${head.split('\n').slice(0, 50).join('\n')}`);
        } catch (e) {
          results.push(`  Error: ${e}`);
        }

        if (await pythonExists()) {
          results.push('\n[+] Quick entropy check (Python):');
          try {
            const escaped = options.target.replace(/\\/g, '\\\\');
            const entropyScript = `import sys,math;data=open("${escaped}","rb").read();entropy=-sum((data.count(bytes([i]))/len(data))*math.log2(data.count(bytes([i]))/len(data))for i in range(256)if data.count(bytes([i]))>0);print(f"Entropy: {entropy:.4f}");print(f"Size: {len(data)} bytes")`;
            const entropyOut = await runPython(entropyScript);
            results.push(entropyOut);
          } catch (e) {
            results.push(`  Error: ${e}`);
          }
        } else {
          missingTools.push('python');
        }
      } else if (isUrl) {
        results.push('\n[+] SSL/TLS check:');
        try {
          const urlHost = new URL(options.target).hostname;
          const sslOut = await runCommand(`openssl s_client -connect ${shellEscapeArg(urlHost)}:443 -servername ${shellEscapeArg(urlHost)}`);
          results.push(sslOut.split('\n').slice(0, 30).join('\n'));
        } catch (e) {
          results.push(`  Error: ${e}`);
        }
      } else {
        results.push('Crypto category requires a file path or HTTPS URL.');
      }
      break;
    }

    case 're': {
      results.push('\n--- Reverse Engineering ---');
      if (isFile) {
        results.push('\n[+] File info:');
        try {
          const fileOut = await runCommand(`file ${shellEscapeArg(options.target)}`);
          results.push(fileOut);
        } catch (e) {
          results.push(`  Error: ${e}`);
        }

        results.push('\n[+] Hex dump (first 256 bytes):');
        try {
          const hexOut = await readFileHex(options.target, 256);
          results.push(hexOut.split('\n').slice(0, 20).join(' '));
        } catch (e) {
          results.push(`  Error: ${e}`);
        }

        if (await pythonExists()) {
          results.push('\n[+] Disassembly hint (Python capstone check):');
          try {
            const capstoneCheck = await runCommand(`python -c "import capstone; print('capstone available')" 2>&1`);
            if (capstoneCheck.includes('available')) {
              results.push('  Capstone installed - can disassemble');
            } else {
              missingTools.push('capstone (pip install capstone)');
            }
          } catch (e) {
            missingTools.push('capstone (pip install capstone)');
          }
        } else {
          missingTools.push('python');
        }
      } else {
        results.push('Reverse Engineering category requires a binary file path.');
      }
      break;
    }

    case 'forensics': {
      results.push('\n--- Forensics Analysis ---');
      if (isFile) {
        results.push('\n[+] File analysis:');
        try {
          const fileOut = await runCommand(`file ${shellEscapeArg(options.target)}`);
          results.push(fileOut);
          const size = await getFileSize(options.target);
          results.push(`  Size: ${size} bytes`);
        } catch (e) {
          results.push(`  Error: ${e}`);
        }

        results.push('\n[+] Binwalk scan:');
        const binwalkAvailable = await checkTool('binwalk');
        if (binwalkAvailable) {
          try {
            const binwalkOut = await runCommand(`binwalk ${shellEscapeArg(options.target)}`, 30000);
            results.push(binwalkOut.split('\n').slice(0, 30).join('\n'));
          } catch (e) {
            results.push(`  Error: ${e}`);
          }
        } else {
          missingTools.push('binwalk');
        }

        results.push('\n[+] Strings search:');
        try {
          const stringsOut = await stringsSearch(options.target, 'flag|password|secret|key|hidden');
          if (stringsOut) results.push(stringsOut.split('\n').slice(0, 20).join('\n'));
          else results.push('  No interesting strings found.');
        } catch (e) {
          results.push(`  Error: ${e}`);
        }

        if (await pythonExists()) {
          results.push('\n[+] Steganography check (LSB):');
          try {
            const escaped = options.target.replace(/\\/g, '\\\\');
            const stegoScript = `import sys;data=open("${escaped}","rb").read();print(f"File size: {len(data)} bytes");print(f"Header: {data[:12].hex()}")`;
            const stegoOut = await runPython(stegoScript);
            results.push(stegoOut);
          } catch (e) {
            results.push(`  Error: ${e}`);
          }
        } else {
          missingTools.push('python');
        }
      } else if (isUrl) {
        results.push('\n[+] HTTP headers:');
        try {
          const headers = await runCommand(`curl -s -I ${shellEscapeArg(options.target)}`);
          results.push(headers.split('\n').slice(0, 20).join('\n'));
        } catch (e) {
          results.push(`  Error: ${e}`);
        }
      } else {
        results.push('Forensics category requires a file path or URL.');
      }
      break;
    }

    case 'misc': {
      results.push('\n--- Misc Challenge Analysis ---');
      if (isFile) {
        results.push('\n[+] File analysis:');
        try {
          const fileOut = await runCommand(`file ${shellEscapeArg(options.target)}`);
          results.push(fileOut);
        } catch (e) {
          results.push(`  Error: ${e}`);
        }

        results.push('\n[+] Quick checks:');
        try {
          const head = await readFirstLines(options.target, 100);
          results.push(`  First 100 lines:\n${head.split('\n').slice(0, 100).join('\n')}`);
        } catch (e) {
          results.push(`  Error: ${e}`);
        }

        if (await pythonExists()) {
          results.push('\n[+] Base64/encoding detection:');
          try {
            const escaped = options.target.replace(/\\/g, '\\\\');
            const encScript = `import sys,re;data=open("${escaped}","r").read();b64=re.findall(r'[A-Za-z0-9+/]{40,}={0,2}',data);print(f"Base64 candidates: {len(b64)}");[print(f"  - {s[:60]}") for s in b64[:5]]`;
            const encOut = await runPython(encScript);
            results.push(encOut);
          } catch (e) {
            results.push(`  Error: ${e}`);
          }
        } else {
          missingTools.push('python');
        }
      } else {
        results.push('Misc category requires a file path.');
      }
      break;
    }
  }

  if (missingTools.length > 0) {
    results.push(`\n=== Missing Tools (install via install_ctf_tools.sh) ===`);
    missingTools.forEach(tool => results.push(`  - ${tool}`));
  }

  results.push('\n=== Scan Complete ===');
  return results.join('\n');
}

export async function installCTFTools(): Promise<string> {
  const results: string[] = [];
  results.push('=== CTF Tools Installer ===\n');

  const tools: Record<string, string> = {
    'nmap': 'nmap',
    'curl': 'curl',
    'python': 'python',
    'whatweb': 'whatweb',
    'binwalk': 'binwalk',
    'checksec': 'checksec',
    'openssl': 'openssl',
    'gdb': 'gdb',
    'radare2': 'radare2',
    'ghidra': 'ghidra',
    'john': 'john',
    'hashcat': 'hashcat',
    'hydra': 'hydra',
    'sqlmap': 'sqlmap',
    'gobuster': 'gobuster',
    'ffuf': 'ffuf',
    'nikto': 'nikto',
    'nuclei': 'nuclei',
    'dalfox': 'dalfox',
    'wireshark': 'wireshark',
    'tshark': 'tshark',
    'stegsolve': 'stegsolve',
    'zsteg': 'zsteg',
    'steghide': 'steghide',
    'exiftool': 'exiftool',
    'foremost': 'foremost',
    'volatility': 'volatility',
    'yara': 'yara',
    'peframe': 'peframe',
    'diec': 'diec',
    'pestr': 'pestr',
    'angr': 'angr',
    'pwntools': 'pwntools',
    'frida-tools': 'frida-tools',
    'one_gadget': 'one_gadget',
    'seccomp-tools': 'seccomp-tools',
    'ropper': 'ropper',
    'RsaCtfTool': 'RsaCtfTool',
    'sherlock': 'sherlock',
    'amass': 'amass',
    'sublist3r': 'sublist3r',
    'theHarvester': 'theHarvester',
    'findomain': 'findomain',
    'naabu': 'naabu',
    'httpx': 'httpx',
    'katana': 'katana',
    'subfinder': 'subfinder',
    'httprobe': 'httprobe',
    'gowitness': 'gowitness',
    'aquatone': 'aquatone',
    'dnsx': 'dnsx',
    'cdncheck': 'cdncheck',
    'uncover': 'uncover',
    'alterx': 'alterx',
    'chaos': 'chaos',
    'waybackurls': 'waybackurls',
    'gau': 'gau',
    'assetfinder': 'assetfinder',
    'crtsh': 'crtsh',
    'hakrawler': 'hakrawler',
    'xnLinkFinder': 'xnLinkFinder',
    'linkfinder': 'linkfinder',
    'secretfinder': 'SecretFinder',
    'wfuzz': 'wfuzz',
    'feroxbuster': 'feroxbuster',
    'dirsearch': 'dirsearch',
    'mantra': 'mantra',
    'jsluice': 'jsluice',
    'gitleaks': 'gitleaks',
    'trufflehog': 'trufflehog',
    'git-dumper': 'git-dumper',
    's3scanner': 's3scanner',
    's3enum': 's3enum',
    'cloudbrute': 'cloudbrute',
    'kr': 'kiterunner',
    'graphql-voyager': 'graphql-voyager',
    'inql': 'inql',
    'MobSF': 'mobsf',
    'apkleaks': 'apkleaks',
    'apktool': 'apktool',
    'jadx': 'jadx',
    'objection': 'objection',
    'upx': 'upx',
    'ltrace': 'ltrace',
    'strace': 'strace',
    'qemu': 'qemu-system-x86_64',
    'gef': 'gef',
    'pwndbg': 'pwndbg',
    'maigret': 'maigret',
    'holehe': 'holehe',
    'recon-ng': 'recon-ng',
    'shodan': 'shodan',
    'censys': 'censys',
    'burpsuite': 'burpsuite',
    'zaproxy': 'zaproxy',
    'mitmproxy': 'mitmproxy',
    'eyewitness': 'eyewitness',
    '7z': '7z',
    'zipinfo': 'zipinfo',
    'jq': 'jq',
    'yq': 'yq',
    'rg': 'ripgrep',
  };

  results.push('Checking installed tools...\n');
  const installed: string[] = [];
  const missing: string[] = [];

  for (const [tool, cmd] of Object.entries(tools)) {
    const available = await checkTool(cmd);
    if (available) {
      installed.push(tool);
    } else {
      missing.push(tool);
    }
  }

  results.push(`Installed (${installed.length}):`);
  installed.forEach(t => results.push(`  + ${t}`));

  results.push(`\nMissing (${missing.length}):`);
  missing.forEach(t => results.push(`  - ${t}`));

  results.push('\n=== Installation Notes ===');
  results.push('Most tools can be installed via:');
  results.push('  - Chocolatey: choco install <tool>');
  results.push('  - Scoop: scoop install <tool>');
  results.push('  - WSL: wsl apt install <tool>');
  results.push('  - Python: pip install <package>');
  results.push('  - Go: go install <tool>@latest');
  results.push('\nOr run install_ctf_tools.sh in WSL/Git Bash for automated install.');

  return results.join('\n');
}
