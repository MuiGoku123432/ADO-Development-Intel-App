use std::env;
use tauri::State;
use serde::{Deserialize, Serialize};
use parking_lot::RwLock;

use azure_devops_rust_api::{Credential, wit};
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

/// Get all work items assigned to the current user in {org}/{project}
#[tauri::command]
async fn get_my_work_items(
    state: State<'_, AuthState>,
    organization: Option<String>,
    project: Option<String>,
) -> Result<Vec<WorkItemLite>, String> {
    println!("📞 [COMMAND] get_my_work_items invoked");
    let start_time = std::time::Instant::now();

    // Get credentials from state or fall back to environment
    let (cred, org, proj) = {
        let cred_guard = state.cred.read();
        let org_guard = state.org.read();
        let proj_guard = state.project.read();
        
        if let (Some(cred), Some(org)) = (cred_guard.clone(), org_guard.clone()) {
            println!("🔐 [ADO] Using stored credentials");
            let project = project.or_else(|| proj_guard.clone()).unwrap_or_else(|| "DefaultProject".to_string());
            (cred, org, project)
        } else {
            println!("🔐 [ADO] No stored credentials, trying environment variables");
            drop(cred_guard);
            drop(org_guard);
            drop(proj_guard);
            
            // Load from environment if not in state
            dotenv::dotenv().ok();
            let org = organization.or_else(|| env::var("ADO_ORGANIZATION").ok())
                .ok_or_else(|| "No organization provided and ADO_ORGANIZATION not found".to_string())?;
            let pat = env::var("ADO_PAT")
                .map_err(|_| "ADO_PAT environment variable not found".to_string())?;
            let proj = project.or_else(|| env::var("ADO_PROJECT").ok())
                .unwrap_or_else(|| "DefaultProject".to_string());
            
            let cred = Credential::from_pat(pat);
            (cred, org, proj)
        }
    };

    println!("🚀 [ADO] Building Work Item Tracking client");
    println!("  ├─ Organization: {}", org);
    println!("  └─ Project: {}", proj);

    // Build Work Item Tracking client
    let wit_client = wit::ClientBuilder::new(cred).build();

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

    println!("📡 [ADO] Executing WIQL query for work items assigned to @Me");
    
    // POST _apis/wit/wiql - Fix parameter order based on API signature
    let wiql_resp = wit_client
        .wiql_client()
        .query_by_wiql(&org, wiql, &proj, "")  // org, body, project, team
        .await
        .map_err(|e| {
            let elapsed = start_time.elapsed();
            println!("❌ [ADO] WIQL query failed ({:?}): {:?}", elapsed, e);
            format!("WIQL query failed: {}", e)
        })?;

    // Parse the query result → IDs - the response should already be the parsed result
    let wiql_result = wiql_resp;

    let ids: Vec<i32> = wiql_result
        .work_items
        .into_iter()
        .filter_map(|r| r.id)
        .collect();

    println!("📊 [ADO] Found {} work item IDs from WIQL query", ids.len());

    if ids.is_empty() {
        let elapsed = start_time.elapsed();
        println!("✅ [ADO] No work items found ({:?})", elapsed);
        return Ok(vec![]);
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

    println!("📡 [ADO] Batch fetching work item details for {} items", ids.len());

    let batch = WorkItemBatchGetRequest {
        fields: wanted_fields,
        ids,
        ..Default::default()
    };

    let items = wit_client
        .work_items_client()
        .get_work_items_batch(&org, batch, &proj)  // org, body, project
        .await
        .map_err(|e| {
            let elapsed = start_time.elapsed();
            println!("❌ [ADO] Batch request failed ({:?}): {:?}", elapsed, e);
            format!("Batch request failed: {}", e)
        })?;

    let result: Vec<WorkItemLite> = items
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
            }
        })
        .collect();

    let elapsed = start_time.elapsed();
    println!("✅ [ADO] Successfully retrieved {} work items ({:?})", result.len(), elapsed);

    Ok(result)
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
            get_ado_credentials, 
            validate_ado_config, 
            validate_ado_token_native
        ])
        .setup(|_app| {
            println!("⚡ Tauri application setup completed successfully");
            println!("🎯 Available commands: greet, set_pat, get_my_work_items, get_ado_credentials, validate_ado_config, validate_ado_token_native");
            Ok(())
        })
        .run(tauri::generate_context!());
    
    if let Err(e) = result {
        eprintln!("❌ Failed to run Tauri application: {}", e);
        std::process::exit(1);
    }
}