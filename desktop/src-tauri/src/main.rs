#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use std::{
    env,
    fs::{self, OpenOptions},
    io::{Read, Write},
    net::{SocketAddr, TcpStream},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{Arc, Mutex},
    thread,
    time::{Duration, Instant},
};

use tauri::{Manager, RunEvent};

struct ProcState(Arc<Mutex<Option<Child>>>);

impl Default for ProcState {
    fn default() -> Self {
        Self(Arc::new(Mutex::new(None)))
    }
}

fn has_scripts(base: &Path) -> bool {
    base.join("runlivuals.bat").exists()
        || base.join("runlivuals_macos.sh").exists()
        || base.join("resources").join("runlivuals.bat").exists()
        || base.join("resources").join("runlivuals_macos.sh").exists()
        || base.join("scripts").join("runlivuals.bat").exists()
        || base.join("scripts").join("runlivuals_macos.sh").exists()
}

fn has_livuals(base: &Path) -> bool {
    base.join("livuals").is_dir()
}

fn resolve_script(ia_root: &Path, basename: &str) -> Option<PathBuf> {
    let candidates = [
        ia_root.join(basename),
        ia_root.join("resources").join(basename),
        ia_root.join("scripts").join(basename),
    ];
    for p in candidates {
        if p.exists() {
            return Some(p);
        }
    }
    None
}

fn find_ia_root_with(resource_dir: Option<&Path>) -> PathBuf {
    // Build a list of candidates in priority order
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Some(res) = resource_dir { candidates.push(res.to_path_buf()); }
    if let Ok(exe) = env::current_exe() {
        // Add exe dir ancestors up to 16 levels (reach repo root during dev/build)
        let mut cur = exe.parent().map(|p| p.to_path_buf());
        for _ in 0..16 {
            if let Some(ref p) = cur { candidates.push(p.clone()); cur = p.parent().map(|pp| pp.to_path_buf()); } else { break; }
        }
        // macOS bundle Resources
        if let Some(mac_os_dir) = exe.parent() {
            if let Some(contents_dir) = mac_os_dir.parent() { // Contents
                candidates.push(contents_dir.join("Resources"));
            }
        }
    }
    if let Ok(cwd) = env::current_dir() {
        // Add cwd ancestors up to 16 levels
        let mut cur = Some(cwd.clone());
        for _ in 0..16 {
            if let Some(ref p) = cur { candidates.push(p.clone()); cur = p.parent().map(|pp| pp.to_path_buf()); } else { break; }
        }
    }

    // First, prefer a base that has both scripts and livuals
    for base in &candidates {
        if has_scripts(base) && has_livuals(base) {
            return base.clone();
        }
        let nested = base.join("iaarabes");
        if has_scripts(&nested) && has_livuals(&nested) { return nested; }
        let nested2 = base.join("resources");
        if has_scripts(&nested2) && has_livuals(&nested2) { return nested2; }
    }
    // Next, any base that has scripts (even if livuals is elsewhere)
    for base in &candidates {
        if has_scripts(base) {
            return base.clone();
        }
        let nested = base.join("iaarabes");
        if has_scripts(&nested) { return nested; }
        let nested2 = base.join("resources");
        if has_scripts(&nested2) { return nested2; }
    }
    // Fallbacks
    if let Some(res) = resource_dir { return res.to_path_buf(); }
    env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
}

#[cfg(target_os = "macos")]
fn venv_exists(ia_root: &Path) -> bool {
    ia_root.join("StreamDiffusion/venv/bin/python").exists()
}

#[cfg(target_os = "windows")]
fn venv_exists(ia_root: &Path) -> bool {
    ia_root.join("StreamDiffusion/venv/Scripts/python.exe").exists()
}

#[cfg(target_os = "macos")]
fn run_installer(ia_root: &Path) -> std::io::Result<()> {
    // Ensure executable bit
    let script = resolve_script(ia_root, "install_macos.sh")
        .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::NotFound, "install_macos.sh not found"))?;
    let _ = Command::new("/bin/chmod")
        .arg("+x")
        .arg(&script)
        .current_dir(ia_root)
        .stdout(log_stdio())
        .stderr(log_stdio())
        .status();
    let status = Command::new("/bin/bash")
        .arg(script)
        .current_dir(ia_root)
        .env("ALLOW_ANY_PYTHON", "1")
        .stdout(log_stdio())
        .stderr(log_stdio())
        .status()?;
    if status.success() { Ok(()) } else { Err(std::io::Error::new(std::io::ErrorKind::Other, "installer failed")) }
}

#[cfg(target_os = "windows")]
fn run_installer(ia_root: &Path) -> std::io::Result<()> {
    let script = resolve_script(ia_root, "install.bat")
        .unwrap_or(ia_root.join("install.bat"));
    let status = Command::new("cmd")
        .args(["/C", &script.to_string_lossy()])
        .current_dir(ia_root)
        .stdout(log_stdio())
        .stderr(log_stdio())
        .status()?;
    if status.success() { Ok(()) } else { Err(std::io::Error::new(std::io::ErrorKind::Other, "installer failed")) }
}

#[cfg(target_os = "windows")]
fn backend_command(ia_root: &PathBuf) -> (String, Vec<String>) {
    let script = resolve_script(ia_root, "runlivuals.bat").unwrap_or(ia_root.join("runlivuals.bat"));
    (String::from("cmd"), vec![String::from("/C"), script.to_string_lossy().to_string()])
}

#[cfg(target_os = "macos")]
fn backend_command(ia_root: &PathBuf) -> (String, Vec<String>) {
    let script = resolve_script(ia_root, "runlivuals_macos.sh").unwrap_or(ia_root.join("runlivuals_macos.sh"));
    append_log(&format!("[Livuals] Using backend script: {}", script.display()));
    (String::from("/bin/bash"), vec![script.to_string_lossy().to_string()])
}

fn spawn_backend(ia_root: &PathBuf) -> std::io::Result<Child> {
    let (program, args) = backend_command(ia_root);
    let mut cmd = Command::new(program);
    cmd.args(args)
        .current_dir(ia_root)
        .env("HOST", "127.0.0.1")
        .env("PORT", "7860")
        .stdout(log_stdio())
        .stderr(log_stdio());
    cmd.spawn()
}

fn logs_dir() -> PathBuf {
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = env::var("HOME") {
            return Path::new(&home).join("Library/Logs/Livuals");
        }
        PathBuf::from("/tmp/Livuals")
    }
    #[cfg(target_os = "windows")]
    {
        if let Ok(base) = env::var("LOCALAPPDATA") {
            return Path::new(&base).join("Livuals\\logs");
        }
        PathBuf::from(".\\logs")
    }
}

fn log_file_path() -> PathBuf {
    logs_dir().join("livuals-wrapper.log")
}

fn ensure_logs_dir() {
    let _ = fs::create_dir_all(logs_dir());
}

fn append_log(msg: &str) {
    ensure_logs_dir();
    if let Ok(mut f) = OpenOptions::new().create(true).append(true).open(log_file_path()) {
        let _ = writeln!(f, "{}", msg);
    }
}

fn log_stdio() -> Stdio {
    ensure_logs_dir();
    match OpenOptions::new().create(true).append(true).open(log_file_path()) {
        Ok(file) => Stdio::from(file),
        Err(_) => Stdio::null(),
    }
}

fn wait_until_ready(timeout_secs: u64) -> bool {
    let start = Instant::now();
    let addr = SocketAddr::from(([127, 0, 0, 1], 7860));
    while start.elapsed().as_secs() <= timeout_secs {
        if let Ok(mut stream) = TcpStream::connect_timeout(&addr, Duration::from_millis(800)) {
            let _ = stream.set_read_timeout(Some(Duration::from_millis(800)));
            let _ = stream.set_write_timeout(Some(Duration::from_millis(800)));
            let _ = stream.write_all(b"GET /api/status HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n");
            let mut buf = [0u8; 64];
            if let Ok(n) = stream.read(&mut buf) {
                if n > 0 {
                    if let Ok(text) = std::str::from_utf8(&buf[..n]) {
                        if text.contains(" 200 ") || text.starts_with("HTTP/1.1 200") || text.starts_with("HTTP/1.0 200") {
                            return true;
                        }
                    }
                }
            }
        }
        thread::sleep(Duration::from_millis(500));
    }
    false
}

fn kill_backend(state: &ProcState) {
    if let Ok(mut guard) = state.0.lock() {
        if let Some(child) = guard.as_mut() {
            let _ = child.kill();
        }
        *guard = None;
    }
}

fn main() {
    let context = tauri::generate_context!();

    let proc_state = ProcState::default();

    let builder = tauri::Builder::default()
        .manage(ProcState(proc_state.0.clone()))
        .setup(|app| {
            let app_handle = app.handle().clone();
            let proc_arc = app.state::<ProcState>().0.clone();
            let resource_dir = app_handle.path().resource_dir().ok();

            // Launch backend in a new thread
            thread::spawn(move || {
                let ia_root = find_ia_root_with(resource_dir.as_deref());
                append_log(&format!("[Livuals] Resolved ia_root: {}", ia_root.display()));
                // First-run automation: if venv missing, run installer
                if !venv_exists(&ia_root) {
                    append_log("[Livuals] First run: installing backend dependencies...");
                    match run_installer(&ia_root) {
                        Ok(_) => append_log("[Livuals] Installation completed."),
                        Err(e) => append_log(&format!("[Livuals] Installation failed: {e}")),
                    }
                }
                match spawn_backend(&ia_root) {
                    Ok(child) => {
                        if let Ok(mut guard) = proc_arc.lock() {
                            *guard = Some(child);
                        }
                        append_log("[Livuals] Backend started.");
                    }
                    Err(e) => {
                        append_log(&format!("[Livuals] Failed to start backend: {e}"));
                    }
                }

                // Wait for server and then load URL in the main window
                let ready = wait_until_ready(120);
                if ready {
                    append_log("[Livuals] Backend is ready. Showing window...");
                    if let Some(win) = app_handle.get_webview_window("main") {
                        // Navegar al backend y luego mostrar la ventana
                        let _ = win.eval("window.location.replace('http://127.0.0.1:7860')");
                        let _ = win.show();
                        let _ = win.set_title("Livuals");
                    }
                } else {
                    append_log("[Livuals] Backend did not become ready in time");
                }
            });
            Ok(())
        });

    let app = builder.build(context).expect("error while building tauri app");

    app.run(move |app_handle, event| match event {
        RunEvent::Exit { .. } => {
            let state = app_handle.state::<ProcState>();
            kill_backend(&state);
        }
        _ => {}
    });
}
