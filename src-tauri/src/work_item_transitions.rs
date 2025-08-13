use std::collections::HashMap;
use std::error::Error;
use serde::{Deserialize, Serialize};
use azure_devops_rust_api::Credential;
use azure_devops_rust_api::wit::{Client as WitClient, ClientBuilder as WitClientBuilder};
use azure_devops_rust_api::wit::models::{
    JsonPatchOperation, WorkItem,
    WorkItemNextStateOnTransitionList,
    json_patch_operation::Op,
};
use uuid::Uuid;
use tauri::Emitter;
use regex::Regex;

/// UI field prompt for Angular form rendering
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UiFieldPrompt {
    pub ref_name: String,
    pub label: String,
    pub kind: String, // "number" | "string" | "picklist" | "identity" | "datetime"
    pub required: bool,
    pub allowed_values: Option<Vec<String>>,
    pub placeholder: Option<String>,
    pub default_value: Option<serde_json::Value>,
}

/// Pending state transition context stored in memory
#[derive(Clone, Debug)]
pub struct PendingTransition {
    pub work_item_id: i32,
    pub target_state: String,
    pub reason: Option<String>,
    pub current_rev: i32,
    pub required_fields: Vec<UiFieldPrompt>,
}

/// Event payload sent to Angular when fields are required
#[derive(Clone, Debug, Serialize)]
pub struct FieldsRequiredEvent {
    pub correlation_id: String,
    pub work_item_id: i32,
    pub current_state: String,
    pub target_state: String,
    pub prompts: Vec<UiFieldPrompt>,
}

/// Response from begin_transition command
#[derive(Clone, Debug, Serialize)]
pub struct TransitionResponse {
    pub status: String, // "completed" | "pending"
    pub work_item_id: i32,
    pub target_state: Option<String>,
    pub payload: Option<FieldsRequiredEvent>,
}

/// Response from preview_transition command
#[derive(Clone, Debug, Serialize)]
pub struct TransitionPreview {
    pub work_item_id: i32,
    pub current_state: String,
    pub target_state: Option<String>,
    pub available: bool,
}

/// Begin a work item state transition
pub async fn begin_transition(
    app_handle: tauri::AppHandle,
    pending_transitions: &tokio::sync::Mutex<HashMap<String, PendingTransition>>,
    credential: &Credential,
    organization: &str,
    project: &str,
    work_item_id: i32,
) -> Result<TransitionResponse, String> {
    println!("🔄 [TRANSITIONS] Beginning transition for work item {}", work_item_id);
    
    let wit_client = WitClientBuilder::new(credential.clone()).build();

    // 1) Fetch current work item (need rev, type, state)
    let wi: WorkItem = wit_client
        .work_items_client()
        .get_work_item(organization, work_item_id, project)
        .await
        .map_err(|e| format!("Failed to fetch work item: {}", e))?;

    let current_state = get_field_string(&wi, "System.State")
        .unwrap_or_else(|| "New".to_string());
    let work_item_type = get_field_string(&wi, "System.WorkItemType")
        .unwrap_or_else(|| "Task".to_string());
    let current_rev = wi.rev.unwrap_or(1);

    println!("📊 [TRANSITIONS] Current: {} ({}), Type: {}, Rev: {}", 
             current_state, work_item_id, work_item_type, current_rev);

    // 2) Query for available transitions using correct API
    let ids_string = work_item_id.to_string();
    let transitions: WorkItemNextStateOnTransitionList = wit_client
        .work_item_transitions_client()
        .list(organization, &ids_string)
        .await
        .map_err(|e| format!("Failed to get transitions: {}", e))?;

    let next_state = pick_next_state(&transitions, work_item_id, &current_state)
        .ok_or_else(|| "No next state available from current state".to_string())?;

    println!("➡️ [TRANSITIONS] Next state: {}", next_state);

    // 3) Use validate-only approach to discover required fields
    let required_fields = get_required_fields_for_transition(
        credential,
        organization,
        project,
        work_item_id,
        &next_state,
    ).await?;

    if required_fields.is_empty() {
        println!("✅ [TRANSITIONS] No additional fields required, performing transition");
        
        // No required fields → perform the real update now
        // Skip automatic reason for now to avoid validation issues
        println!("✅ [TRANSITIONS] Performing transition without additional fields");
        
        try_validate_state_change(
            &wit_client,
            organization,
            project,
            work_item_id,
            current_rev,
            &next_state,
            None, // No automatic reason - let ADO handle it
            false, // real update
        )
        .await
        .map_err(|e| format!("Failed to update work item: {}", e))?;

        // Emit completion event
        let _ = app_handle.emit(
            "workitem:transition_complete",
            serde_json::json!({
                "workItemId": work_item_id,
                "targetState": next_state
            }),
        );

        Ok(TransitionResponse {
            status: "completed".to_string(),
            work_item_id,
            target_state: Some(next_state),
            payload: None,
        })
    } else {
        println!("📝 [TRANSITIONS] Found {} required fields for transition", required_fields.len());
        
        // Fields are required → emit event for UI collection
        let correlation_id = Uuid::new_v4().to_string();
        let reason = default_reason_for(&work_item_type, &current_state, &next_state);
        
        let fields_event = FieldsRequiredEvent {
            correlation_id: correlation_id.clone(),
            work_item_id,
            current_state: current_state.clone(),
            target_state: next_state.clone(),
            prompts: required_fields.clone(),
        };

        {
            let mut pending = pending_transitions.lock().await;
            pending.insert(
                correlation_id.clone(),
                PendingTransition {
                    work_item_id,
                    target_state: next_state.clone(),
                    reason,
                    current_rev,
                    required_fields,
                },
            );
        }

        println!("📤 [TRANSITIONS] Emitting fields_required event with correlation_id: {}", correlation_id);
        let _ = app_handle.emit("workitem:fields_required", fields_event.clone());

        Ok(TransitionResponse {
            status: "pending".to_string(),
            work_item_id,
            target_state: Some(next_state),
            payload: Some(fields_event),
        })
    }
}

/// Complete a pending state transition with user-provided field values
pub async fn finish_transition(
    pending_transitions: &tokio::sync::Mutex<HashMap<String, PendingTransition>>,
    credential: &Credential,
    organization: &str,
    correlation_id: String,
    values: HashMap<String, serde_json::Value>,
) -> Result<serde_json::Value, String> {
    println!("🏁 [TRANSITIONS] Finishing transition with correlation_id: {}", correlation_id);
    
    let wit_client = WitClientBuilder::new(credential.clone()).build();

    // Retrieve and remove pending context
    let ctx = {
        let mut pending = pending_transitions.lock().await;
        pending
            .remove(&correlation_id)
            .ok_or_else(|| "Correlation ID not found or expired".to_string())?
    };

    println!("📝 [TRANSITIONS] Building patch operations for work item: {}", ctx.work_item_id);

    // Build field values map
    let mut field_values = HashMap::new();
    
    // Add state change
    field_values.insert("System.State".to_string(), serde_json::json!(ctx.target_state));
    
    if let Some(reason) = ctx.reason.as_ref() {
        field_values.insert("System.Reason".to_string(), serde_json::json!(reason));
    }

    for (ref_name, value) in values {
        println!("  ➕ Adding field: {} = {:?}", ref_name, value);
        field_values.insert(ref_name.clone(), value);
    }

    // Perform the real PATCH with optimistic concurrency
    patch_work_item(&wit_client, organization, ctx.work_item_id, ctx.current_rev, field_values)
        .await
        .map_err(|e| format!("Failed to update work item: {}", e))?;

    println!("✅ [TRANSITIONS] Successfully transitioned work item {} to {}", 
             ctx.work_item_id, ctx.target_state);

    Ok(serde_json::json!({
        "status": "completed",
        "workItemId": ctx.work_item_id,
        "targetState": ctx.target_state
    }))
}

/// Get required fields for a state transition using validate-only approach
async fn get_required_fields_for_transition(
    credential: &Credential,
    organization: &str,
    project: &str,
    work_item_id: i32,
    target_state: &str,
) -> Result<Vec<UiFieldPrompt>, String> {
    println!("🔍 [TRANSITIONS] Using validate-only to discover required fields for transition to: {}", target_state);
    
    let wit_client = WitClientBuilder::new(credential.clone()).build();
    
    // Create a simple patch with just the state change
    let patch_ops = vec![
        JsonPatchOperation {
            op: Some(Op::Replace),
            path: Some("/fields/System.State".to_string()),
            value: Some(serde_json::json!(target_state)),
            from: None,
        }
    ];
    
    // Attempt validate-only update to discover required fields
    let validation_result = wit_client
        .work_items_client()
        .update(organization, patch_ops, work_item_id, project)
        .validate_only(true)
        .await;
    
    match validation_result {
        Ok(_) => {
            // No additional fields required
            println!("✅ [TRANSITIONS] Validation passed - no additional fields required");
            Ok(Vec::new())
        }
        Err(e) => {
            // Parse validation error to extract required field names
            let error_message = e.to_string();
            println!("📝 [TRANSITIONS] Validation failed - full error details: {}", error_message);
            
            // Try to get more detailed error information
            if let Some(source) = e.source() {
                println!("🔍 [TRANSITIONS] Error source: {}", source);
            }
            
            let required_field_names = parse_required_fields_from_validation_error(&error_message);
            
            if required_field_names.is_empty() {
                // This might be a different kind of validation error (e.g., invalid state transition)
                println!("⚠️ [TRANSITIONS] No field requirements detected - this might be an invalid transition");
                return Err(format!("Validation failed but no required fields detected. Full error: {}", error_message));
            }
            
            // Convert field names to UI prompts
            let mut prompts = Vec::new();
            for field_ref_name in required_field_names {
                println!("🏷️ [TRANSITIONS] Creating prompt for required field: {}", field_ref_name);
                prompts.push(create_simple_field_prompt(&field_ref_name));
            }
            
            println!("✅ [TRANSITIONS] Found {} required fields from validation error", prompts.len());
            Ok(prompts)
        }
    }
}

/// Parse required field names from Azure DevOps validation error message
fn parse_required_fields_from_validation_error(error_message: &str) -> Vec<String> {
    let mut field_names = Vec::new();
    
    // Look for field reference names in parentheses (typical ADO error format)
    if let Ok(re) = Regex::new(r"\(([A-Za-z0-9_.]+)\)") {
        for cap in re.captures_iter(error_message) {
            if let Some(field_match) = cap.get(1) {
                let field_name = field_match.as_str().to_string();
                // Only include field names that contain dots (ADO field pattern)
                if field_name.contains('.') && !field_names.contains(&field_name) {
                    field_names.push(field_name);
                }
            }
        }
    }
    
    // Also look for common patterns like "Field 'X' is required"
    if let Ok(re) = Regex::new(r"[Ff]ield\s+'([^']+)'\s+is\s+required") {
        for cap in re.captures_iter(error_message) {
            if let Some(field_match) = cap.get(1) {
                let field_name = field_match.as_str().to_string();
                if !field_names.contains(&field_name) {
                    field_names.push(field_name);
                }
            }
        }
    }
    
    println!("🔍 [TRANSITIONS] Parsed {} required fields from validation error", field_names.len());
    field_names
}

/// Create a simple field prompt based on field reference name patterns
fn create_simple_field_prompt(field_ref_name: &str) -> UiFieldPrompt {
    let (label, kind, placeholder) = match field_ref_name {
        "Microsoft.VSTS.Scheduling.StoryPoints" => {
            ("Story Points", "number", Some("Enter story points"))
        }
        "System.AssignedTo" => {
            ("Assigned To", "identity", Some("Enter assignee or leave blank for current user"))
        }
        "Microsoft.VSTS.Common.Priority" => {
            ("Priority", "number", Some("Enter priority (1-4)"))
        }
        "Microsoft.VSTS.Scheduling.RemainingWork" => {
            ("Remaining Work", "number", Some("Enter remaining work hours"))
        }
        "Microsoft.VSTS.Common.AcceptanceCriteria" => {
            ("Acceptance Criteria", "string", Some("Enter acceptance criteria"))
        }
        "System.Description" => {
            ("Description", "string", Some("Enter description"))
        }
        _ => {
            // Default based on field name patterns
            if field_ref_name.contains("Points") || field_ref_name.contains("Priority") || field_ref_name.contains("Work") {
                (field_ref_name, "number", None)
            } else if field_ref_name.contains("AssignedTo") || field_ref_name.contains("CreatedBy") {
                (field_ref_name, "identity", None)
            } else if field_ref_name.contains("Date") || field_ref_name.contains("Time") {
                (field_ref_name, "datetime", None)
            } else if field_ref_name.contains("State") || field_ref_name.contains("Reason") {
                (field_ref_name, "picklist", None)
            } else {
                (field_ref_name, "string", None)
            }
        }
    };
    
    UiFieldPrompt {
        ref_name: field_ref_name.to_string(),
        label: label.to_string(),
        kind: kind.to_string(),
        required: true,
        allowed_values: None,
        placeholder: placeholder.map(|s| s.to_string()),
        default_value: None,
    }
}



/// Preview the next state for a work item without performing the transition
pub async fn preview_transition(
    credential: &Credential,
    organization: &str,
    project: &str,
    work_item_id: i32,
) -> Result<TransitionPreview, String> {
    println!("👁️ [TRANSITIONS] Previewing transition for work item {}", work_item_id);
    
    let wit_client = WitClientBuilder::new(credential.clone()).build();

    // 1) Fetch current work item (need state and type)
    let wi: WorkItem = wit_client
        .work_items_client()
        .get_work_item(organization, work_item_id, project)
        .await
        .map_err(|e| format!("Failed to fetch work item: {}", e))?;

    let current_state = get_field_string(&wi, "System.State")
        .unwrap_or_else(|| "New".to_string());

    println!("📊 [TRANSITIONS] Preview - Current state: {} for work item {}", current_state, work_item_id);

    // 2) Query for available transitions
    let ids_string = work_item_id.to_string();
    let transitions: WorkItemNextStateOnTransitionList = wit_client
        .work_item_transitions_client()
        .list(organization, &ids_string)
        .await
        .map_err(|e| format!("Failed to get transitions: {}", e))?;

    let target_state = pick_next_state(&transitions, work_item_id, &current_state);
    
    let available = target_state.is_some();
    
    if available {
        println!("✅ [TRANSITIONS] Preview - Target state: {:?}", target_state);
    } else {
        println!("❌ [TRANSITIONS] Preview - No transitions available from state: {}", current_state);
    }

    Ok(TransitionPreview {
        work_item_id,
        current_state,
        target_state,
        available,
    })
}

// Helper functions

fn get_field_string(wi: &WorkItem, field_name: &str) -> Option<String> {
    if let Some(fields_obj) = wi.fields.as_object() {
        if let Some(field_value) = fields_obj.get(field_name) {
            if let Some(string_val) = field_value.as_str() {
                return Some(string_val.to_string());
            }
        }
    }
    None
}

fn pick_next_state(
    transitions: &WorkItemNextStateOnTransitionList,
    work_item_id: i32,
    _current_state: &str,
) -> Option<String> {
    // Find the transition for this work item
    for transition in &transitions.value {
        if transition.id == Some(work_item_id) {
            return transition.state_on_transition.clone();
        }
    }
    
    // No fallback - if ADO API doesn't return transitions, return None
    println!("⚠️ [TRANSITIONS] No transition found for work item {} in API response", work_item_id);
    None
}


fn default_reason_for(_work_item_type: &str, _from_state: &str, to_state: &str) -> Option<String> {
    // Simple default reason - can be enhanced based on transition patterns
    Some(format!("Moved to {}", to_state))
}

async fn try_validate_state_change(
    wit_client: &WitClient,
    organization: &str,
    project: &str,
    work_item_id: i32,
    rev: i32,
    target_state: &str,
    reason: Option<&str>,
    validate_only: bool,
) -> Result<(), String> {
    println!("🔧 [TRANSITIONS] Building patch operations for work item {} (rev {})", work_item_id, rev);
    
    // Build JSON Patch operations with revision test for optimistic concurrency
    let mut patch_ops = vec![
        // Test current revision for optimistic concurrency control
        JsonPatchOperation {
            op: Some(Op::Test),
            path: Some("/rev".to_string()),
            value: Some(serde_json::json!(rev)),
            from: None,
        },
        // Change state
        JsonPatchOperation {
            op: Some(Op::Replace),
            path: Some("/fields/System.State".to_string()),
            value: Some(serde_json::json!(target_state)),
            from: None,
        },
    ];
    
    // Only add reason if not validating and explicitly provided
    if !validate_only && reason.is_some() {
        patch_ops.push(JsonPatchOperation {
            op: Some(Op::Replace),
            path: Some("/fields/System.Reason".to_string()),
            value: Some(serde_json::json!(reason.unwrap())),
            from: None,
        });
    }

    println!("📡 [TRANSITIONS] Sending {} patch operations: {:?}", patch_ops.len(), patch_ops);

    let mut request_builder = wit_client
        .work_items_client()
        .update(organization, patch_ops, work_item_id, project)
        .suppress_notifications(true);

    if validate_only {
        request_builder = request_builder.validate_only(true);
        println!("🧪 [TRANSITIONS] Using validate_only mode");
    } else {
        println!("✍️ [TRANSITIONS] Performing real update with revision {}", rev);
    }

    let result = request_builder.await;
    
    match result {
        Ok(work_item) => {
            println!("✅ [TRANSITIONS] Request succeeded (validate_only: {})", validate_only);
            if !validate_only {
                println!("✅ [TRANSITIONS] Work item updated successfully: ID {}", work_item_id);
            }
            Ok(())
        }
        Err(e) => {
            let error_msg = e.to_string();
            println!("❌ [TRANSITIONS] Request failed (validate_only: {}): {}", validate_only, error_msg);
            
            // Try to extract more details from the error
            if let Some(source) = e.source() {
                println!("🔍 [TRANSITIONS] Error source: {}", source);
            }
            
            // If this is a validation error (400), it might contain field requirements
            if error_msg.contains("400") && validate_only {
                println!("🔍 [TRANSITIONS] 400 validation error - this should contain required fields info");
            }
            
            Err(error_msg)
        }
    }
}




async fn patch_work_item(
    wit_client: &WitClient,
    organization: &str,
    work_item_id: i32,
    _rev: i32,
    field_values: HashMap<String, serde_json::Value>,
) -> Result<(), String> {
    // Build JSON Patch operations with proper structure
    let mut patch_ops = vec![];
    
    // Add field updates
    for (field_name, value) in field_values {
        patch_ops.push(JsonPatchOperation {
            op: Some(Op::Replace),
            path: Some(format!("/fields/{}", field_name)),
            value: Some(value),
            from: None,
        });
    }

    println!("📡 [TRANSITIONS] Sending PATCH for work item {} with {} operations", work_item_id, patch_ops.len());

    wit_client
        .work_items_client()
        .update(organization, patch_ops, work_item_id, "")
        .suppress_notifications(true)
        .await
        .map_err(|e| format!("Failed to update work item: {}", e))?;

    println!("✅ [TRANSITIONS] Successfully updated work item: {}", work_item_id);
    Ok(())
}