#[cfg(target_os = "macos")]
use tauri::image::Image;
#[cfg(not(mobile))]
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    AppHandle, Manager, Runtime, WebviewWindow, WebviewWindowBuilder, WindowEvent,
};
#[cfg(not(mobile))]
use tauri_plugin_clipboard_manager::ClipboardExt;

#[cfg(not(mobile))]
use std::sync::Mutex;

#[cfg(not(mobile))]
#[derive(Default)]
struct QuickSendSession {
    access_token: String,
    api_base_url: String,
}

#[cfg(not(mobile))]
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SyncQuickSendSessionPayload {
    access_token: String,
    api_base_url: String,
}

#[cfg(not(mobile))]
type QuickSendState = Mutex<QuickSendSession>;

#[cfg(not(mobile))]
#[tauri::command]
fn sync_quick_send_session(
    state: tauri::State<'_, QuickSendState>,
    payload: SyncQuickSendSessionPayload,
) -> Result<(), String> {
    let mut session = state.lock().map_err(|err| err.to_string())?;
    session.access_token = payload.access_token;
    session.api_base_url = payload.api_base_url.trim_end_matches('/').to_string();
    Ok(())
}

#[cfg(not(mobile))]
#[tauri::command]
fn clear_quick_send_session(state: tauri::State<'_, QuickSendState>) -> Result<(), String> {
    let mut session = state.lock().map_err(|err| err.to_string())?;
    session.access_token.clear();
    session.api_base_url.clear();
    Ok(())
}

#[cfg(not(mobile))]
fn bind_low_memory_close<R: Runtime>(app_handle: AppHandle<R>, window: &WebviewWindow<R>) {
    window.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            if let Some(main_window) = app_handle.get_webview_window("main") {
                let _ = main_window.destroy();
            }
        }
    });
}

#[cfg(not(mobile))]
fn create_main_window<R: Runtime>(app_handle: &AppHandle<R>) -> Result<(), String> {
    let config = app_handle
        .config()
        .app
        .windows
        .first()
        .ok_or_else(|| "missing main window config".to_string())?;
    let window = WebviewWindowBuilder::from_config(app_handle, config)
        .map_err(|err| err.to_string())?
        .build()
        .map_err(|err| err.to_string())?;
    bind_low_memory_close(app_handle.clone(), &window);
    let _ = window.set_focus();
    Ok(())
}

#[cfg(not(mobile))]
fn show_main_window<R: Runtime + 'static>(app_handle: &AppHandle<R>) {
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    let app_handle = app_handle.clone();
    std::thread::spawn(move || {
        if let Err(err) = create_main_window(&app_handle) {
            log::error!("failed to recreate main window: {err}");
        }
    });
}

#[cfg(not(mobile))]
fn quick_send_clipboard_text<R: Runtime + 'static>(app_handle: &AppHandle<R>) {
    let app_handle = app_handle.clone();
    std::thread::spawn(move || {
        if let Err(err) = do_quick_send_clipboard_text(&app_handle) {
            log::error!("quick send failed: {err}");
            show_main_window(&app_handle);
        }
    });
}

#[cfg(not(mobile))]
fn do_quick_send_clipboard_text<R: Runtime>(app_handle: &AppHandle<R>) -> Result<(), String> {
    let text = app_handle
        .clipboard()
        .read_text()
        .map_err(|err| err.to_string())?
        .trim()
        .to_string();
    if text.is_empty() {
        return Err("clipboard text is empty".to_string());
    }

    let state = app_handle.state::<QuickSendState>();
    let session = state.lock().map_err(|err| err.to_string())?;
    let access_token = session.access_token.clone();
    let api_base_url = session.api_base_url.clone();
    drop(session);

    if access_token.is_empty() || api_base_url.is_empty() {
        return Err("quick send session is missing".to_string());
    }

    let url = format!("{}/v1/items", api_base_url.trim_end_matches('/'));
    let response = reqwest::blocking::Client::new()
        .post(url)
        .bearer_auth(access_token)
        .json(&serde_json::json!({
            "type": "text",
            "title": quick_send_title(),
            "content": text,
            "client_event_id": format!("tray_evt_{}", current_timestamp_millis()),
        }))
        .send()
        .map_err(|err| err.to_string())?;

    if !response.status().is_success() {
        return Err(format!("backend returned {}", response.status()));
    }

    let payload: serde_json::Value = response.json().map_err(|err| err.to_string())?;
    if payload.get("ok").and_then(|value| value.as_bool()) != Some(true) {
        return Err("backend rejected quick send".to_string());
    }

    Ok(())
}

#[cfg(not(mobile))]
fn quick_send_title() -> String {
    format!("快速发送 {}", chrono::Local::now().format("%m-%d %H:%M:%S"))
}

#[cfg(not(mobile))]
fn current_timestamp_millis() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(Mutex::new(QuickSendSession::default()))
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            sync_quick_send_session,
            clear_quick_send_session,
        ])
        .setup(|app| {
            #[cfg(not(mobile))]
            {
                let quick_send_item =
                    MenuItemBuilder::with_id("quick-send", "快速发送").build(app)?;
                let show_item = MenuItemBuilder::with_id("show", "打开主窗口").build(app)?;
                let quit_item = MenuItemBuilder::with_id("quit", "退出应用").build(app)?;
                let tray_menu = MenuBuilder::new(app)
                    .items(&[&quick_send_item, &show_item, &quit_item])
                    .build()?;

                #[cfg(target_os = "macos")]
                let tray_icon = Image::from_bytes(include_bytes!("../icons/trayTemplate@2x.png"))?;
                #[cfg(not(target_os = "macos"))]
                let tray_icon = app
                    .default_window_icon()
                    .expect("failed to get default window icon")
                    .clone();

                let tray_builder = TrayIconBuilder::new()
                    .icon(tray_icon)
                    .menu(&tray_menu)
                    .show_menu_on_left_click(true)
                    .on_menu_event(|app_handle, event| match event.id().as_ref() {
                        "quick-send" => quick_send_clipboard_text(app_handle),
                        "show" => show_main_window(app_handle),
                        "quit" => app_handle.exit(0),
                        _ => {}
                    });

                #[cfg(target_os = "macos")]
                let tray_builder = tray_builder.icon_as_template(true);

                tray_builder.build(app)?;

                if let Some(window) = app.get_webview_window("main") {
                    bind_low_memory_close(app.handle().clone(), &window);
                }
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|_app_handle, _event| match _event {
        #[cfg(not(mobile))]
        tauri::RunEvent::ExitRequested { api, code, .. } => {
            if code.is_none() {
                api.prevent_exit();
            }
        }
        #[cfg(all(not(mobile), target_os = "macos"))]
        tauri::RunEvent::Reopen { .. } => {
            show_main_window(_app_handle);
        }
        _ => {}
    });
}
