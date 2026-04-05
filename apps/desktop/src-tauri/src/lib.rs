#[cfg(target_os = "macos")]
use tauri::image::Image;
#[cfg(not(mobile))]
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Manager, WindowEvent,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(not(mobile))]
            {
                let show_item = MenuItemBuilder::with_id("show", "打开主窗口").build(app)?;
                let quit_item = MenuItemBuilder::with_id("quit", "退出应用").build(app)?;
                let tray_menu = MenuBuilder::new(app)
                    .items(&[&show_item, &quit_item])
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
                        "show" => {
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => app_handle.exit(0),
                        _ => {}
                    });

                #[cfg(target_os = "macos")]
                let tray_builder = tray_builder.icon_as_template(true);

                tray_builder.build(app)?;

                if let Some(window) = app.get_webview_window("main") {
                    let app_handle = app.handle().clone();
                    window.on_window_event(move |event| {
                        if let WindowEvent::CloseRequested { api, .. } = event {
                            api.prevent_close();
                            if let Some(main_window) = app_handle.get_webview_window("main") {
                                let _ = main_window.hide();
                            }
                        }
                    });
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
