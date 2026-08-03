# Janex API Reference

## Tools

### web_search
Search the web for information.

**Parameters:**
- `query` (string, required) — search query
- `maxResults` (number, optional) — max results (default: 10)

**Returns:** Search results with title, url, snippet

---

### web_scrape
Scrape content from a URL.

**Parameters:**
- `url` (string, required) — target URL
- `maxLength` (number, optional) — max chars (default: 5000)
- `selector` (string, optional) — CSS selector

**Returns:** Extracted text content

---

### har_capture
Capture network traffic (HAR format).

**Parameters:**
- `url` (string, required) — target URL
- `output` (string, optional) — output file path
- `filter` (string, optional) — resource types: xhr,fetch,ws,all
- `headless` (boolean, optional) — headless mode
- `wait` (number, optional) — auto-close after N seconds
- `cdpUrl` (string, optional) — CDP endpoint for attach mode
- `existingTab` (boolean, optional) — attach to existing tab

**Returns:** HAR file path + API summary

---

### terminal_execute
Execute shell command.

**Parameters:**
- `command` (string, required) — command to run
- `cwd` (string, optional) — working directory
- `timeout` (number, optional) — timeout in ms (default: 30000)

**Returns:** stdout + stderr

---

### file_read
Read file contents.

**Parameters:**
- `path` (string, required) — file path
- `limit` (number, optional) — max lines (default: 2000)
- `offset` (number, optional) — starting line (default: 0)

**Returns:** File content with line numbers

---

### file_write
Write file contents.

**Parameters:**
- `path` (string, required) — file path
- `content` (string, required) — content to write

**Returns:** Success message

---

### git_status
Show git status.

**Parameters:**
- `cwd` (string, optional) — repository path

**Returns:** Git status output

---

### browser_navigate
Navigate browser to URL.

**Parameters:**
- `url` (string, required) — URL to navigate

**Returns:** Navigation status

---

### browser_screenshot
Take browser screenshot.

**Parameters:**
- `path` (string, optional) — output path

**Returns:** Screenshot file path

---

### captcha_detect
Detect CAPTCHA on current page.

**Parameters:** none

**Returns:** CAPTCHA type + selector

---

### dns_lookup
DNS lookup for domain.

**Parameters:**
- `domain` (string, required) — domain name

**Returns:** DNS records (A, MX, TXT, AAAA)

---

### whois_lookup
Whois lookup for domain/IP.

**Parameters:**
- `domain` (string, required) — domain or IP

**Returns:** Whois data

---

### trading_analyze
Analyze stock/crypto symbol.

**Parameters:**
- `symbol` (string, required) — ticker symbol
- `action` (string, optional) — analyze|compare|portfolio|risk

**Returns:** Price data, technicals, news, risk assessment

---

### email_send
Send email.

**Parameters:**
- `to` (string, required) — recipient
- `subject` (string, required) — subject
- `body` (string, required) — body content
- `html` (boolean, optional) — send as HTML

**Returns:** Send status

---

### deploy_docker
Deploy Docker container.

**Parameters:**
- `image` (string, required) — Docker image
- `containerName` (string, required) — container name
- `ports` (array, optional) — port mappings
- `env` (object, optional) — environment variables
- `volumes` (array, optional) — volume mounts

**Returns:** Container status

---

### ssh_execute
Execute command via SSH.

**Parameters:**
- `command` (string, required) — command to run
- `host` (string, required) — SSH host
- `user` (string, optional) — username (default: root)
- `keyPath` (string, optional) — SSH key path

**Returns:** Command output

## Slash Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/status` | Show model, tools, skills count |
| `/tools` | List available tools |
| `/skills` | List loaded skills |
| `/depth <mode>` | Set research depth (low→ultra) |
| `/deep-research <query>` | Run deep research |
| `/browserui <action>` | Browser control |
| `/gmail <action>` | Email integration |
| `/github <action>` | GitHub integration |
| `/todo <action>` | Todo management |
| `/sessions` | List sessions |
| `/clear` | Clear chat |
| `/reset` | Reset session |
| `/exit` | Quit |
