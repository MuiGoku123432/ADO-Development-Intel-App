use std::env;
use std::collections::HashMap;
use tauri::State;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;
use tokio::sync::Mutex;

use azure_devops_rust_api::{Credential, wit};

mod work_item_transitions;
use work_item_transitions::{PendingTransition, TransitionPreview};
use azure_devops_rust_api::wit::models::{Wiql, WorkItemBatchGetRequest};

// ADO Credentials structure - kept for compatibility with existing .env setup
#[derive(Debug, Serialize, Deserialize)]
pub struct AdoCredentials {
    pub organization: String,
    pub personal_access_token: String,
    pub project: Option<String>,
}

// Simple in-memory auth state
#[derive(Default)]
struct AuthState {
    cred: RwLock<Option<Credential>>,
    org: RwLock<Option<String>>,
    project: RwLock<Option<String>>,
    pending_transitions: Mutex<HashMap<String, PendingTransition>>,
}

// Lightweight work item structure for the frontend
#[derive(Serialize)]
struct WorkItemLite {
    id: i32,
    title: Option<String>,
    state: Option<String>,
    r#type: Option<String>,
    assigned_to: Option<String>,
    description: Option<String>,
    created_date: Option<String>,
    changed_date: Option<String>,
    priority: Option<i32>,
    story_points: Option<f64>,
    area_path: Option<String>,
    iteration_path: Option<String>,
    project_name: String,
}

// User profile response structure for frontend compatibility (keeping existing interface)
#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    pub display_name: Option<String>,
    pub email_address: Option<String>,
    pub id: Option<String>,
    pub public_alias: Option<String>,
}

#[tauri::command]
fn set_pat(state: State<AuthState>, pat: String, organization: String, project: Option<String>) -> Result<(), String> {
    println!("🔐 [COMMAND] set_pat invoked");
    println!("  ├─ Organization: {}", organization);
    println!("  ├─ PAT Length: {} characters", pat.len());
    println!("  └─ Project: {:?}", project);
    
    // Store credentials in memory (in production, consider secure storage)
    *state.cred.write() = Some(Credential::from_pat(pat));
    *state.org.write() = Some(organization);
    *state.project.write() = project;
    
    println!("✅ [COMMAND] PAT stored successfully");
    Ok(())
}

/// Get all work items assigned to the current user across multiple projects
#[tauri::command]
async fn get_my_work_items(
    state: State<'_, AuthState>,
    organization: Option<String>,
    _project: Option<String>,
) -> Result<Vec<WorkItemLite>, String> {
    println!("📞 [COMMAND] get_my_work_items invoked (multi-project support)");
    let start_time = std::time::Instant::now();

    // Get credentials from state or fall back to environment
    let (cred, org) = {
        let cred_guard = state.cred.read();
        let org_guard = state.org.read();
        
        if let (Some(cred), Some(org)) = (cred_guard.clone(), org_guard.clone()) {
            println!("🔐 [ADO] Using stored credentials");
            (cred, org)
        } else {
            println!("🔐 [ADO] No stored credentials, trying environment variables");
            drop(cred_guard);
            drop(org_guard);
            
            // Load from environment if not in state
            dotenv::dotenv().ok();
            let org = organization.or_else(|| env::var("ADO_ORGANIZATION").ok())
                .ok_or_else(|| "No organization provided and ADO_ORGANIZATION not found".to_string())?;
            let pat = env::var("ADO_PAT")
                .map_err(|_| "ADO_PAT environment variable not found".to_string())?;
            
            let cred = Credential::from_pat(pat);
            (cred, org)
        }
    };

    // Get projects list from environment (comma-separated)
    dotenv::dotenv().ok();
    let projects_str = env::var("ADO_PROJECTS")
        .or_else(|_| env::var("ADO_PROJECT").map(|p| p)) // Fallback to single project
        .unwrap_or_else(|_| "DefaultProject".to_string());
    
    let projects: Vec<String> = projects_str
        .split(',')
        .map(|p| p.trim().to_string())
        .filter(|p| !p.is_empty())
        .collect();

    println!("🚀 [ADO] Building Work Item Tracking client");
    println!("  ├─ Organization: {}", org);
    println!("  └─ Projects: {:?}", projects);

    // Build Work Item Tracking client
    let wit_client = wit::ClientBuilder::new(cred).build();

    let mut all_work_items = Vec::new();
    let projects_count = projects.len();

    // Process each project
    for project_name in projects {
        println!("📡 [ADO] Processing project: {}", project_name);
        
        // 1) Query IDs with WIQL — "Assigned To = @Me"
        let wiql = Wiql {
            query: Some(
                "SELECT [System.Id] \
                 FROM WorkItems \
                 WHERE [System.AssignedTo] = @Me \
                   AND [System.State] <> 'Removed' \
                 ORDER BY [System.ChangedDate] DESC"
                    .into(),
            ),
        };

        println!("📡 [ADO] Executing WIQL query for work items assigned to @Me in project: {}", project_name);
        
        // POST _apis/wit/wiql - Fix parameter order based on API signature
        let wiql_resp = match wit_client
            .wiql_client()
            .query_by_wiql(&org, wiql, &project_name, "")  // org, body, project, team
            .await
        {
            Ok(resp) => resp,
            Err(e) => {
                println!("⚠️ [ADO] WIQL query failed for project {}: {:?}", project_name, e);
                continue; // Skip this project and continue with others
            }
        };

        // Parse the query result → IDs
        let wiql_result = wiql_resp;

        let ids: Vec<i32> = wiql_result
            .work_items
            .into_iter()
            .filter_map(|r| r.id)
            .collect();

        println!("📊 [ADO] Found {} work item IDs from WIQL query in project: {}", ids.len(), project_name);

        if ids.is_empty() {
            println!("ℹ️ [ADO] No work items found in project: {}", project_name);
            continue;
        }

        // 2) Batch fetch the fields we want for those IDs (max 200 per request)
        let wanted_fields = vec![
            "System.Id".into(),
            "System.Title".into(),
            "System.State".into(),
            "System.WorkItemType".into(),
            "System.AssignedTo".into(),
            "System.Description".into(),
            "System.CreatedDate".into(),
            "System.ChangedDate".into(),
            "System.AreaPath".into(),
            "System.IterationPath".into(),
            "Microsoft.VSTS.Common.Priority".into(),
            "Microsoft.VSTS.Scheduling.StoryPoints".into(),
        ];

        println!("📡 [ADO] Batch fetching work item details for {} items in project: {}", ids.len(), project_name);

        let batch = WorkItemBatchGetRequest {
            fields: wanted_fields,
            ids,
            ..Default::default()
        };

        let items = match wit_client
            .work_items_client()
            .get_work_items_batch(&org, batch, &project_name)  // org, body, project
            .await
        {
            Ok(items) => items,
            Err(e) => {
                println!("⚠️ [ADO] Batch request failed for project {}: {:?}", project_name, e);
                continue; // Skip this project and continue with others
            }
        };

        let project_work_items: Vec<WorkItemLite> = items
            .value
            .into_iter()
            .map(|wi| {
                let f = wi.fields;
                
                // Helper function to extract string field
                let get_string_field = |field_name: &str| -> Option<String> {
                    f.get(field_name).and_then(|v| v.as_str()).map(|s| s.to_string())
                };
                
                // Helper function to extract i32 field
                let get_i32_field = |field_name: &str| -> Option<i32> {
                    f.get(field_name).and_then(|v| v.as_i64()).map(|i| i as i32)
                };
                
                // Helper function to extract f64 field
                let get_f64_field = |field_name: &str| -> Option<f64> {
                    f.get(field_name).and_then(|v| v.as_f64())
                };

                WorkItemLite {
                    id: wi.id,
                    title: get_string_field("System.Title"),
                    state: get_string_field("System.State"),
                    r#type: get_string_field("System.WorkItemType"),
                    assigned_to: get_string_field("System.AssignedTo"),
                    description: get_string_field("System.Description"),
                    created_date: get_string_field("System.CreatedDate"),
                    changed_date: get_string_field("System.ChangedDate"),
                    priority: get_i32_field("Microsoft.VSTS.Common.Priority"),
                    story_points: get_f64_field("Microsoft.VSTS.Scheduling.StoryPoints"),
                    area_path: get_string_field("System.AreaPath"),
                    iteration_path: get_string_field("System.IterationPath"),
                    project_name: project_name.clone(),
                }
            })
            .collect();

        println!("✅ [ADO] Retrieved {} work items from project: {}", project_work_items.len(), project_name);
        all_work_items.extend(project_work_items);
    }

    let elapsed = start_time.elapsed();
    println!("✅ [ADO] Successfully retrieved {} work items across {} projects ({:?})", 
             all_work_items.len(), projects_count, elapsed);

    Ok(all_work_items)
}

/// Begin a dynamic work item state transition
#[tauri::command]
async fn begin_transition(
    app: tauri::AppHandle,
    state: State<'_, AuthState>,
    work_item_id: i32,
) -> Result<work_item_transitions::TransitionResponse, String> {
    println!("📞 [COMMAND] begin_transition invoked for work item: {}", work_item_id);
    
    // Get credentials and organization info
    let (credential, org, project) = {
        let cred_guard = state.cred.read();
        let org_guard = state.org.read();
        let proj_guard = state.project.read();
        
        if let (Some(cred), Some(org)) = (cred_guard.clone(), org_guard.clone()) {
            let project = proj_guard.clone().unwrap_or_else(|| "DefaultProject".to_string());
            (cred, org, project)
        } else {
            // Fallback to environment
            dotenv::dotenv().ok();
            let org = env::var("ADO_ORGANIZATION")
                .map_err(|_| "ADO_ORGANIZATION not found".to_string())?;
            let pat = env::var("ADO_PAT")
                .map_err(|_| "ADO_PAT not found".to_string())?;
            let project = env::var("ADO_PROJECTS")
                .or_else(|_| env::var("ADO_PROJECT"))
                .unwrap_or_else(|_| "DefaultProject".to_string())
                .split(',')
                .next()
                .unwrap_or("DefaultProject")
                .trim()
                .to_string();
            
            (Credential::from_pat(pat), org, project)
        }
    };

    work_item_transitions::begin_transition(
        app,
        &state.pending_transitions,
        &credential,
        &org,
        &project,
        work_item_id,
    )
    .await
}

/// Complete a pending work item state transition with user-provided field values
#[tauri::command]
async fn finish_transition(
    state: State<'_, AuthState>,
    correlation_id: String,
    values: HashMap<String, serde_json::Value>,
) -> Result<serde_json::Value, String> {
    println!("📞 [COMMAND] finish_transition invoked for correlation_id: {}", correlation_id);
    
    // Get credentials and organization info
    let (credential, org) = {
        let cred_guard = state.cred.read();
        let org_guard = state.org.read();
        
        if let (Some(cred), Some(org)) = (cred_guard.clone(), org_guard.clone()) {
            (cred, org)
        } else {
            // Fallback to environment
            dotenv::dotenv().ok();
            let org = env::var("ADO_ORGANIZATION")
                .map_err(|_| "ADO_ORGANIZATION not found".to_string())?;
            let pat = env::var("ADO_PAT")
                .map_err(|_| "ADO_PAT not found".to_string())?;
            
            (Credential::from_pat(pat), org)
        }
    };

    work_item_transitions::finish_transition(
        &state.pending_transitions,
        &credential,
        &org,
        correlation_id,
        values,
    )
    .await
}

/// Preview the next state transition for a work item without executing it
#[tauri::command]
async fn preview_transition(
    state: State<'_, AuthState>,
    work_item_id: i32,
) -> Result<TransitionPreview, String> {
    println!("📞 [COMMAND] preview_transition invoked for work item: {}", work_item_id);
    
    // Get credentials and organization info
    let (credential, org, project) = {
        let cred_guard = state.cred.read();
        let org_guard = state.org.read();
        let proj_guard = state.project.read();
        
        if let (Some(cred), Some(org)) = (cred_guard.clone(), org_guard.clone()) {
            let project = proj_guard.clone().unwrap_or_else(|| "DefaultProject".to_string());
            (cred, org, project)
        } else {
            // Fallback to environment
            dotenv::dotenv().ok();
            let org = env::var("ADO_ORGANIZATION")
                .map_err(|_| "ADO_ORGANIZATION not found".to_string())?;
            let pat = env::var("ADO_PAT")
                .map_err(|_| "ADO_PAT not found".to_string())?;
            let project = env::var("ADO_PROJECTS")
                .or_else(|_| env::var("ADO_PROJECT"))
                .unwrap_or_else(|_| "DefaultProject".to_string())
                .split(',')
                .next()
                .unwrap_or("DefaultProject")
                .trim()
                .to_string();
            
            (Credential::from_pat(pat), org, project)
        }
    };

    work_item_transitions::preview_transition(
        &credential,
        &org,
        &project,
        work_item_id,
    )
    .await
}

/// Get available projects list from environment configuration
#[tauri::command]
fn get_available_projects() -> Result<Vec<String>, String> {
    println!("📞 [COMMAND] get_available_projects invoked");
    
    // Load .env file if it exists
    dotenv::dotenv().ok();
    
    // Get projects list from environment (comma-separated)
    let projects_str = env::var("ADO_PROJECTS")
        .or_else(|_| env::var("ADO_PROJECT").map(|p| p)) // Fallback to single project
        .unwrap_or_else(|_| "DefaultProject".to_string());
    
    let projects: Vec<String> = projects_str
        .split(',')
        .map(|p| p.trim().to_string())
        .filter(|p| !p.is_empty())
        .collect();

    println!("✅ [COMMAND] Found {} configured projects: {:?}", projects.len(), projects);
    
    Ok(projects)
}

// Keep existing commands for compatibility with the current frontend
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Get ADO credentials from environment variables (keeping for compatibility)
#[tauri::command]
fn get_ado_credentials() -> Result<AdoCredentials, String> {
    println!("📞 [COMMAND] get_ado_credentials invoked");
    
    // Load .env file if it exists
    dotenv::dotenv().ok();
    
    let organization = env::var("ADO_ORGANIZATION")
        .map_err(|_| "ADO_ORGANIZATION environment variable not found".to_string())?;

    let personal_access_token = env::var("ADO_PAT")
        .map_err(|_| "ADO_PAT environment variable not found".to_string())?;

    let project = env::var("ADO_PROJECT").ok().filter(|p| !p.trim().is_empty());

    if organization.trim().is_empty() {
        return Err("ADO_ORGANIZATION cannot be empty".to_string());
    }

    if personal_access_token.trim().is_empty() {
        return Err("ADO_PAT cannot be empty".to_string());
    }

    println!("✅ Successfully loaded ADO credentials for organization: {}", organization);

    Ok(AdoCredentials {
        organization: organization.trim().to_string(),
        personal_access_token: personal_access_token.trim().to_string(),
        project: project.map(|p| p.trim().to_string()),
    })
}

/// Validate if ADO configuration is available (keeping for compatibility)
#[tauri::command]
fn validate_ado_config() -> bool {
    println!("📞 [COMMAND] validate_ado_config invoked");
    
    dotenv::dotenv().ok();
    
    let has_org = env::var("ADO_ORGANIZATION").is_ok();
    let has_pat = env::var("ADO_PAT").is_ok();
    
    has_org && has_pat
}

/// Validate ADO Personal Access Token using native Azure DevOps API (keeping for compatibility)
#[tauri::command]
async fn validate_ado_token_native() -> Result<UserProfile, String> {
    println!("📞 [COMMAND] validate_ado_token_native invoked");

    // Get credentials from environment
    let credentials = get_ado_credentials()?;

    println!("🔐 [ADO-API] Validating Personal Access Token using native API...");

    // Create ADO accounts client
    let credential = Credential::from_pat(&credentials.personal_access_token);
    let client = azure_devops_rust_api::accounts::ClientBuilder::new(credential).build();
    
    // Get user accounts using the accounts API
    let profiles = client
        .accounts_client()
        .list()
        .await
        .map_err(|e| {
            println!("❌ [ADO-API] Profile API call failed: {:?}", e);
            
            if format!("{:?}", e).contains("401") || format!("{:?}", e).contains("Unauthorized") {
                "Invalid or expired Personal Access Token. Please check your PAT in Azure DevOps settings.".to_string()
            } else if format!("{:?}", e).contains("404") {
                format!("Organization '{}' not found. Please verify the organization name.", credentials.organization)
            } else {
                format!("Azure DevOps API error: {:?}", e)
            }
        })?;

    // Extract the first account from the response
    let account = profiles.value
        .into_iter()
        .next()
        .ok_or_else(|| "No user accounts found - PAT may not have proper permissions".to_string())?;
    
    println!("✅ [ADO-API] Token validation successful");

    Ok(UserProfile {
        display_name: account.account_name.clone(),
        email_address: None,
        id: account.account_id.clone(),
        public_alias: None,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("🚀 Starting ADO Development Intel App (Tauri Backend)");
    
    // Load environment on startup
    dotenv::dotenv().ok();
    
    let result = tauri::Builder::default()
        .manage(AuthState::default())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            set_pat,
            get_my_work_items,
            get_available_projects,
            begin_transition,
            finish_transition,
            preview_transition,
            get_ado_credentials, 
            validate_ado_config, 
            validate_ado_token_native
        ])
        .setup(|_app| {
            println!("⚡ Tauri application setup completed successfully");
            println!("🎯 Available commands: greet, set_pat, get_my_work_items, get_available_projects, begin_transition, finish_transition, get_ado_credentials, validate_ado_config, validate_ado_token_native");
            Ok(())
        })
        .run(tauri::generate_context!());
    
    if let Err(e) = result {
        eprintln!("❌ Failed to run Tauri application: {}", e);
        std::process::exit(1);
    }
}