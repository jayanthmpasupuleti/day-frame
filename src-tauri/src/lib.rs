use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

#[tauri::command]
fn update_tray_title(app: tauri::AppHandle, title: String) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        tray.set_title(Some(&title)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn open_full_dashboard(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.set_focus();
    }
    if let Some(popover) = app.get_webview_window("popover") {
        let _ = popover.hide();
    }
    Ok(())
}

#[tauri::command]
fn hide_popover(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(popover) = app.get_webview_window("popover") {
        let _ = popover.hide();
    }
    Ok(())
}

#[tauri::command]
fn toggle_popover(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(popover) = app.get_webview_window("popover") {
        let is_visible = popover.is_visible().unwrap_or(false);
        if is_visible {
            let _ = popover.hide();
        } else {
            let _ = popover.show();
            let _ = popover.set_focus();
        }
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Context menu for right-click on tray icon
            let toggle_timer = MenuItem::with_id(app, "toggle_timer", "Toggle Timer", true, None::<&str>)?;
            let skip_break = MenuItem::with_id(app, "skip_break", "Skip Break", true, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let open_dashboard = MenuItem::with_id(app, "open_dashboard", "Open Full Dashboard", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Dayframe", true, None::<&str>)?;

            let tray_menu = Menu::with_items(
                app,
                &[&toggle_timer, &skip_break, &sep1, &open_dashboard, &sep2, &quit],
            )?;

            let icon = app
                .default_window_icon()
                .expect("Failed to load window icon for tray")
                .clone();

            let _tray = TrayIconBuilder::with_id("main-tray")
                .icon(icon)
                .icon_as_template(true)
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .title("Dayframe")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "toggle_timer" => {
                            let _ = app.emit("tray-action", "toggle_timer");
                        }
                        "skip_break" => {
                            let _ = app.emit("tray-action", "skip_break");
                        }
                        "open_dashboard" => {
                            if let Some(main) = app.get_webview_window("main") {
                                let _ = main.show();
                                let _ = main.set_focus();
                            }
                            if let Some(popover) = app.get_webview_window("popover") {
                                let _ = popover.hide();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        position,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(popover) = app.get_webview_window("popover") {
                            let is_visible = popover.is_visible().unwrap_or(false);
                            if is_visible {
                                let _ = popover.hide();
                            } else {
                                let scale_factor = popover.scale_factor().unwrap_or(1.0);
                                let click_logical_x = position.x / scale_factor;
                                let click_logical_y = position.y / scale_factor;
                                let popover_width = 360.0;
                                let x = (click_logical_x - (popover_width / 2.0)).max(10.0);
                                let y = click_logical_y + 8.0;

                                let _ = popover.set_position(tauri::Position::Logical(
                                    tauri::LogicalPosition::new(x, y),
                                ));
                                let _ = popover.show();
                                let _ = popover.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            } else if window.label() == "popover" {
                if let tauri::WindowEvent::Focused(false) = event {
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            update_tray_title,
            open_full_dashboard,
            hide_popover,
            toggle_popover
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
