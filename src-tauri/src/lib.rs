use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

pub struct TrayMenuHandles {
    pub toggle_timer_item: MenuItem<tauri::Wry>,
    pub skip_break_item: MenuItem<tauri::Wry>,
}

#[derive(serde::Deserialize)]
pub struct TrayStatePayload {
    pub title: String,
    pub timer_label: String,
    pub break_label: String,
    pub break_enabled: bool,
}

#[tauri::command]
fn update_tray_state(
    app: tauri::AppHandle,
    state: tauri::State<TrayMenuHandles>,
    payload: TrayStatePayload,
) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_title(Some(&payload.title));
    }
    let _ = state.toggle_timer_item.set_text(&payload.timer_label);
    let _ = state.skip_break_item.set_text(&payload.break_label);
    let _ = state.skip_break_item.set_enabled(payload.break_enabled);
    Ok(())
}

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

fn handle_tray_action(app: &tauri::AppHandle, action: &str) {
    match action {
        "toggle_timer" => {
            let _ = app.emit("tray-action", "toggle_timer");
            if let Some(main) = app.get_webview_window("main") {
                let _ = main.eval(
                    "window.dispatchEvent(new CustomEvent('tray-action', { detail: 'toggle_timer' })); \
                     if (window.__DAYFRAME_STORE__) { window.__DAYFRAME_STORE__.getState().toggleTimer(); }"
                );
            }
            if let Some(popover) = app.get_webview_window("popover") {
                let _ = popover.eval(
                    "window.dispatchEvent(new CustomEvent('tray-action', { detail: 'toggle_timer' })); \
                     if (window.__DAYFRAME_STORE__) { window.__DAYFRAME_STORE__.getState().toggleTimer(); }"
                );
            }
        }
        "skip_break" => {
            let _ = app.emit("tray-action", "skip_break");
            if let Some(main) = app.get_webview_window("main") {
                let _ = main.eval(
                    "window.dispatchEvent(new CustomEvent('tray-action', { detail: 'skip_break' })); \
                     if (window.__DAYFRAME_STORE__) { window.__DAYFRAME_STORE__.getState().setMode('focus'); }"
                );
            }
            if let Some(popover) = app.get_webview_window("popover") {
                let _ = popover.eval(
                    "window.dispatchEvent(new CustomEvent('tray-action', { detail: 'skip_break' })); \
                     if (window.__DAYFRAME_STORE__) { window.__DAYFRAME_STORE__.getState().setMode('focus'); }"
                );
            }
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
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Context menu for right-click on tray icon
            let toggle_timer = MenuItem::with_id(app, "toggle_timer", "Start Focus", true, None::<&str>)?;
            let skip_break = MenuItem::with_id(app, "skip_break", "Skip Break", false, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let open_dashboard = MenuItem::with_id(app, "open_dashboard", "Open Dashboard", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit = MenuItem::with_id(app, "quit", "Quit Dayframe", true, None::<&str>)?;

            let tray_menu = Menu::with_items(
                app,
                &[&toggle_timer, &skip_break, &sep1, &open_dashboard, &sep2, &quit],
            )?;

            // Store references to the dynamic menu items in Tauri managed state
            app.manage(TrayMenuHandles {
                toggle_timer_item: toggle_timer,
                skip_break_item: skip_break,
            });

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
                    handle_tray_action(app, event.id.as_ref());
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
        .on_menu_event(|app, event| {
            handle_tray_action(app, event.id.as_ref());
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
            update_tray_state,
            update_tray_title,
            open_full_dashboard,
            hide_popover,
            toggle_popover
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
