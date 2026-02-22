use tauri::menu::{Menu, MenuItem, Submenu};
use tauri::{Manager, Emitter};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            // Create menu items
            let new_task = MenuItem::with_id(app, "new_task", "New Task", true, None::<&str>)?;
            let search = MenuItem::with_id(app, "search", "Search", true, None::<&str>)?;
            let about = MenuItem::with_id(app, "about", "About PuraToDo", true, None::<&str>)?;

            // Build file menu
            let file_menu = Submenu::with_items(app, "File", true, &[&new_task])?;

            // Build edit menu
            let edit_menu = Submenu::with_items(app, "Edit", true, &[&search])?;

            // Build help menu
            let help_menu = Submenu::with_items(app, "Help", true, &[&about])?;

            // Build the menu bar
            let menu = Menu::with_items(app, &[&file_menu, &edit_menu, &help_menu])?;

            // Set the menu on the main window
            if let Some(window) = app.get_webview_window("main") {
                window.set_menu(menu)?;
            }

            // Menu event handler
            let app_handle = app.handle().clone();
            app.on_menu_event(move |_app, event| {
                match event.id().as_ref() {
                    "new_task" => {
                        // Emit event to frontend to create new task
                        let _ = app_handle.emit("menu-new-task", ());
                    }
                    "search" => {
                        // Emit event to frontend to open search
                        let _ = app_handle.emit("menu-search", ());
                    }
                    "about" => {
                        // Emit event to frontend to show about dialog
                        let _ = app_handle.emit("menu-about", ());
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
